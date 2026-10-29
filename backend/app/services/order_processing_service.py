import json
import re
import urllib.parse
from datetime import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.order import Order
from app.models.order_processing_setting import OrderProcessingSetting, ResellerApiSetting
from app.services.resellers.reseller_registry import ResellerRegistry
from app.services.audit_log_service import AuditLogService
from app.services.email_service import EmailService
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.config import settings

class OrderProcessingService:
    _tables_ensured: bool = False
    _mode_cache: Optional[Dict[str, Any]] = None
    _mode_cache_time: float = 0.0

    @classmethod
    def ensure_tables(cls, force: bool = False):
        """
        Ensures order processing tables and columns exist in database.
        Runs safely via ALTER TABLE ... ADD COLUMN IF NOT EXISTS without breaking existing data.
        """
        if cls._tables_ensured and not force:
            return
        cls._tables_ensured = True

        try:
            if engine is not None:
                # 1. Create order_processing_settings and reseller_api_settings tables
                Base.metadata.create_all(
                    bind=engine,
                    tables=[
                        OrderProcessingSetting.__table__,
                        ResellerApiSetting.__table__,
                    ],
                )

                # 2. Add columns safely to orders table
                with engine.begin() as conn:
                    alter_queries = [
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_mode VARCHAR(20) DEFAULT 'manual';",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_credentials TEXT;",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_admin_id VARCHAR(100);",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMP;",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_delivery_status VARCHAR(20) DEFAULT 'pending';",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_delivery_error TEXT;",
                        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS email_last_sent_at TIMESTAMP;",
                    ]
                    for q in alter_queries:
                        conn.execute(text(q))
        except Exception as e:
            print(f"[OrderProcessingService] Table migration note: {e}")

        # 3. Seed default order processing settings if absent
        try:
            db = SessionLocal()
            try:
                main_setting = db.query(OrderProcessingSetting).filter_by(id="main").first()
                if not main_setting:
                    default_setting = OrderProcessingSetting(
                        id="main",
                        order_mode="manual",
                        active_reseller="vip-reseller",
                        auto_fulfill_on_payment=True,
                        notify_admin_on_manual_order=True,
                        updated_by="system_init",
                    )
                    db.add(default_setting)
                    db.commit()

                # 4. Seed VIP Reseller in reseller_api_settings if absent
                vip_row = db.query(ResellerApiSetting).filter_by(id="vip-reseller").first()
                if not vip_row:
                    default_vip = ResellerApiSetting(
                        id="vip-reseller",
                        name="VIP Reseller API Gateway",
                        base_url=(settings.VIP_RESELLER_BASE_URL or "https://vip-reseller.co.id/api").strip(),
                        api_key=(settings.VIP_RESELLER_API_KEY or "").strip(),
                        api_sign=(settings.VIP_RESELLER_SIGN or "").strip(),
                        is_active=True,
                        environment="production",
                        updated_by="system_init",
                    )
                    db.add(default_vip)
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderProcessingService] Seeding note: {e}")

    @classmethod
    def get_order_mode_config(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """Loads active order processing mode configuration from database."""
        cls.ensure_tables()
        try:
            db = SessionLocal()
            try:
                row = db.query(OrderProcessingSetting).filter_by(id="main").first()
                if row:
                    return row.to_dict()
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderProcessingService] Query config error: {e}")

        return {
            "id": "main",
            "orderMode": "manual",
            "order_mode": "manual",
            "activeReseller": "vip-reseller",
            "active_reseller": "vip-reseller",
            "autoFulfillOnPayment": True,
            "auto_fulfill_on_payment": True,
            "notifyAdminOnManualOrder": True,
            "notify_admin_on_manual_order": True,
            "updatedBy": "fallback",
            "updated_by": "fallback",
            "updatedAt": None,
            "updated_at": None,
        }

    @classmethod
    def update_order_mode_config(cls, payload: Dict[str, Any], admin_user: Dict[str, Any]) -> Dict[str, Any]:
        """Updates order processing mode configuration with permission check and audit log."""
        cls.ensure_tables()

        new_mode = str(payload.get("orderMode") or payload.get("order_mode") or "manual").strip().lower()
        if new_mode not in ["manual", "automatic"]:
            raise ValueError("Mode order harus 'manual' atau 'automatic'.")

        active_reseller = str(payload.get("activeReseller") or payload.get("active_reseller") or "vip-reseller").strip()
        if new_mode == "automatic":
            if not ResellerRegistry.is_supported(active_reseller):
                raise ValueError(
                    f"Reseller '{active_reseller}' belum didukung atau konfigurasi belum lengkap untuk pemenuhan produksi."
                )

        auto_fulfill = payload.get("autoFulfillOnPayment")
        if auto_fulfill is None:
            auto_fulfill = payload.get("auto_fulfill_on_payment", True)

        notify_admin = payload.get("notifyAdminOnManualOrder")
        if notify_admin is None:
            notify_admin = payload.get("notify_admin_on_manual_order", True)

        admin_identifier = admin_user.get("email") or admin_user.get("name") or admin_user.get("id") or "admin"

        db = SessionLocal()
        try:
            row = db.query(OrderProcessingSetting).filter_by(id="main").first()
            if not row:
                row = OrderProcessingSetting(id="main")
                db.add(row)

            prev_mode = row.order_mode
            row.order_mode = new_mode
            row.active_reseller = active_reseller
            row.auto_fulfill_on_payment = bool(auto_fulfill)
            row.notify_admin_on_manual_order = bool(notify_admin)
            row.updated_by = admin_identifier
            row.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(row)
            res = row.to_dict()

            # Record persistent audit log
            AuditLogService.record_log(
                order_id=None,
                actor="admin",
                action="order_mode_updated",
                previous_status=prev_mode,
                new_status=new_mode,
                notes=f"Admin {admin_identifier} mengubah mode pemrosesan pesanan dari '{prev_mode}' ke '{new_mode}' (Reseller: {active_reseller}).",
                customer_name=None,
                customer_email=None,
            )

            # Broadcast SSE notification
            RealtimeBroadcaster.broadcast(
                event="order_processing:updated",
                data=res,
                target_role="admin",
            )

            return res
        finally:
            db.close()

    @classmethod
    def get_reseller_configs(cls) -> List[Dict[str, Any]]:
        """Returns list of supported resellers with masked secret preview."""
        cls.ensure_tables()
        db = SessionLocal()
        try:
            db_rows = {r.id: r for r in db.query(ResellerApiSetting).all()}
            providers = ResellerRegistry.list_all_providers()

            results = []
            for p in providers:
                pid = p["id"]
                db_record = db_rows.get(pid)
                if db_record:
                    entry = db_record.to_dict(include_secrets=False)
                    entry["isSupported"] = p["isSupported"]
                    entry["is_supported"] = p["is_supported"]
                    entry["isProductionReady"] = p["isProductionReady"]
                    entry["is_production_ready"] = p["is_production_ready"]
                    entry["readiness"] = p["readiness"]
                    entry["capabilities"] = p["capabilities"]
                    entry["balance"] = p["balance"]
                    entry["username"] = p["username"]
                    results.append(entry)
                else:
                    results.append(p)

            return results
        finally:
            db.close()

    @classmethod
    def validate_provider_url(cls, url: str):
        """Enforces SSRF protection: HTTPS only, no localhost/internal IP ranges."""
        if not url:
            raise ValueError("URL API provider tidak boleh kosong.")

        parsed = urllib.parse.urlparse(url)
        if parsed.scheme.lower() not in ["https", "http"]:
            raise ValueError("Protokol URL provider harus HTTP atau HTTPS.")

        hostname = (parsed.hostname or "").lower()
        if not hostname:
            raise ValueError("Hostname URL provider tidak valid.")

        # Disallow loopback, private networks, link-local, and cloud metadata IPs
        forbidden_patterns = [
            r"^localhost$",
            r"^127\.",
            r"^10\.",
            r"^192\.168\.",
            r"^172\.(1[6-9]|2[0-9]|3[0-1])\.",
            r"^169\.254\.",  # AWS / Cloud metadata service
            r"^0\.0\.0\.0$",
            r"^::1$",
            r"^metadata\.google\.internal$",
        ]
        for pat in forbidden_patterns:
            if re.match(pat, hostname):
                raise ValueError("Akses ke jaringan lokal atau privat (SSRF) dilarang.")

    @classmethod
    def update_reseller_config(cls, provider_id: str, payload: Dict[str, Any], admin_user: Dict[str, Any]) -> Dict[str, Any]:
        """Updates reseller settings with SSRF validation and masked response."""
        cls.ensure_tables()
        clean_pid = str(provider_id or "").strip().lower()

        if not ResellerRegistry.is_supported(clean_pid):
            raise ValueError(f"Provider '{clean_pid}' belum memiliki adapter atau belum didukung sistem.")

        base_url = str(payload.get("baseUrl") or payload.get("base_url") or "").strip()
        if base_url:
            cls.validate_provider_url(base_url)

        admin_identifier = admin_user.get("email") or admin_user.get("name") or "admin"

        db = SessionLocal()
        try:
            row = db.query(ResellerApiSetting).filter_by(id=clean_pid).first()
            if not row:
                row = ResellerApiSetting(id=clean_pid, name="VIP Reseller API Gateway", base_url=base_url)
                db.add(row)

            if base_url:
                row.base_url = base_url

            # Only update secret keys if passed and not a masked placeholder
            new_api_key = payload.get("apiKey") or payload.get("api_key")
            if new_api_key and not str(new_api_key).startswith("****") and "****" not in str(new_api_key):
                row.api_key = str(new_api_key).strip()

            new_api_sign = payload.get("apiSign") or payload.get("api_sign")
            if new_api_sign and not str(new_api_sign).startswith("****") and "****" not in str(new_api_sign):
                row.api_sign = str(new_api_sign).strip()

            if "isActive" in payload or "is_active" in payload:
                row.is_active = bool(payload.get("isActive") if "isActive" in payload else payload.get("is_active"))

            if "environment" in payload:
                row.environment = str(payload["environment"]).strip().lower()

            row.updated_by = admin_identifier
            row.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(row)

            # Record audit log without leaking the key/secret
            AuditLogService.record_log(
                order_id=None,
                actor="admin",
                action="reseller_config_updated",
                previous_status=None,
                new_status="updated",
                notes=f"Admin {admin_identifier} memperbarui konfigurasi reseller API '{clean_pid}'.",
                customer_name=None,
                customer_email=None,
            )

            return row.to_dict(include_secrets=False)
        finally:
            db.close()

    @classmethod
    def test_reseller_connection(cls, provider_id: str) -> Dict[str, Any]:
        """Performs a real server-side connection and balance test via provider adapter."""
        clean_pid = str(provider_id or "").strip().lower()
        adapter = ResellerRegistry.get_adapter(clean_pid)
        if not adapter:
            return {
                "success": False,
                "connected": False,
                "message": f"Adapter untuk provider '{clean_pid}' belum diimplementasikan.",
            }

        return adapter.test_connection()

    @classmethod
    def complete_manual_order(
        cls,
        order_id: str,
        payload: Dict[str, Any],
        admin_user: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Completes a manual order by validating required customer credentials,
        persisting credentials atomically in DB, marking order completed,
        and dispatching an idempotent completion email.
        """
        cls.ensure_tables()
        clean_id = str(order_id or "").strip().upper()
        if not clean_id:
            raise ValueError("ID Pesanan tidak boleh kosong.")

        # 1. Parse and validate credentials list
        raw_creds = payload.get("credentials")
        if not raw_creds:
            raise ValueError("Kredensial akun pelanggan wajib diisi sebelum pesanan dapat diselesaikan.")

        normalized_creds: List[Dict[str, str]] = []
        if isinstance(raw_creds, list):
            for item in raw_creds:
                if isinstance(item, dict):
                    lbl = str(item.get("label") or "").strip()
                    val = str(item.get("value") or "").strip()
                    if lbl and val:
                        normalized_creds.append({"label": lbl, "value": val})
        elif isinstance(raw_creds, dict):
            for k, v in raw_creds.items():
                if str(v).strip():
                    normalized_creds.append({"label": str(k).strip(), "value": str(v).strip()})

        if not normalized_creds:
            raise ValueError("Kredensial wajib memuat setidaknya satu informasi akun / kata sandi yang valid.")

        admin_identifier = admin_user.get("email") or admin_user.get("name") or admin_user.get("id") or "admin"
        notes = str(payload.get("notes") or "").strip()
        now = datetime.utcnow()

        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
            if not order:
                raise ValueError(f"Pesanan {clean_id} tidak ditemukan.")

            # Idempotency check: if already completed with identical credentials
            if order.status == "completed" and order.fulfillment_credentials:
                existing_creds = order.fulfillment_credentials
                try:
                    if json.loads(existing_creds) == normalized_creds:
                        return {
                            "success": True,
                            "already_completed": True,
                            "message": f"Pesanan {clean_id} sudah selesai dengan kredensial tersebut.",
                            "order": order.to_dict(),
                            "email_status": order.email_delivery_status or "sent",
                        }
                except Exception:
                    pass

            # Payment validation check: cannot complete a cancelled or expired order
            if order.status in ["cancelled", "expired"]:
                raise ValueError(f"Pesanan dengan status '{order.status}' tidak dapat diselesaikan.")

            # 2. Build human-readable provider_note string for backward-compatible displays & email parsing
            creds_text_parts = []
            for c in normalized_creds:
                creds_text_parts.append(f"{c['label']}: {c['value']}")
            creds_formatted_string = " | ".join(creds_text_parts)

            # 3. Update Order Model Atomically
            prev_status = order.status or "pending"
            order.fulfillment_mode = "manual"
            order.fulfillment_credentials = json.dumps(normalized_creds)
            order.fulfillment_admin_id = admin_identifier
            order.fulfilled_at = now
            order.provider = order.provider or "internal-manual"
            order.provider_note = creds_formatted_string
            order.status = "completed"
            order.paid_at = order.paid_at or now
            order.payment_status = "settlement"
            order.updated_at = now

            if notes:
                curr_notes = order.customer_notes or ""
                order.customer_notes = f"{curr_notes} | Admin: {notes}".strip(" | ")

            db.commit()
            db.refresh(order)
            order_dict = order.to_dict()

            # 4. Audit Log Recording
            AuditLogService.record_log(
                order_id=clean_id,
                actor="admin",
                action="manual_order_completed",
                previous_status=prev_status,
                new_status="completed",
                notes=f"Pesanan diselesaikan secara manual oleh {admin_identifier}. Kredensial telah disimpan dan dikirim.",
                customer_name=order.customer_name,
                customer_email=order.customer_email,
            )

            # 5. Synchronize Referral Profit & Partner Commissions
            try:
                from app.services.referral_profit_service import ReferralProfitService
                ReferralProfitService.sync_order_commissions_and_ledger(clean_id, "completed")
            except Exception as comm_err:
                print(f"[OrderProcessingService] Referral sync note: {comm_err}")

            # Synchronize Campaign Metrics from Completed Orders
            try:
                from app.services.campaign_service import CampaignService
                CampaignService.sync_campaign_metrics_from_orders()
            except Exception as camp_err:
                print(f"[OrderProcessingService] Campaign sync note: {camp_err}")

            # 6. Decoupled Email Dispatch: Failure does not revert order completion
            email_sent = False
            email_error_msg = None
            try:
                email_sent = EmailService.send_order_completed_email(order_dict)
            except Exception as e:
                email_sent = False
                email_error_msg = str(e)

            # Update email delivery tracking column separately
            order.email_delivery_status = "sent" if email_sent else "failed"
            order.email_delivery_error = None if email_sent else (email_error_msg or "Gagal mengirimkan email melalui Resend/SMTP gateway.")
            order.email_last_sent_at = now
            db.commit()
            db.refresh(order)
            final_order_dict = order.to_dict()

            # Invalidate order cache
            from app.core.cache import cache
            cache.invalidate("orders")
            from app.services.order_service import OrderService
            OrderService.load_orders(force_reload=True)

            # Realtime broadcast
            RealtimeBroadcaster.broadcast(
                event="order:payment_verified",
                data={
                    "order_id": clean_id,
                    "id": clean_id,
                    "status": "completed",
                    "previous_status": prev_status,
                    "customer_name": order.customer_name,
                    "updated_at": now.isoformat() + "Z",
                },
                target_role="admin",
            )

            return {
                "success": True,
                "message": f"Pesanan {clean_id} berhasil diselesaikan dengan kredensial.",
                "email_sent": email_sent,
                "email_status": order.email_delivery_status,
                "order": final_order_dict,
            }
        finally:
            db.close()

    @classmethod
    def resend_completion_email(cls, order_id: str, admin_user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Idempotently re-dispatches the completion email containing credentials to customer.
        Does NOT alter order status or duplicate fulfillment.
        """
        clean_id = str(order_id or "").strip().upper()
        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
            if not order:
                raise ValueError(f"Pesanan {clean_id} tidak ditemukan.")

            if order.status != "completed":
                raise ValueError("Hanya pesanan berstatus 'completed' (selesai) yang dapat dikirimi email penyelesaian.")

            now = datetime.utcnow()
            order_dict = order.to_dict()

            email_sent = False
            email_error_msg = None
            try:
                email_sent = EmailService.send_order_completed_email(order_dict)
            except Exception as e:
                email_sent = False
                email_error_msg = str(e)

            order.email_delivery_status = "sent" if email_sent else "failed"
            order.email_delivery_error = None if email_sent else (email_error_msg or "Gagal mengirimkan email.")
            order.email_last_sent_at = now
            order.updated_at = now
            db.commit()
            db.refresh(order)

            admin_identifier = admin_user.get("email") or admin_user.get("name") or "admin"
            AuditLogService.record_log(
                order_id=clean_id,
                actor="admin",
                action="completion_email_resent",
                previous_status="completed",
                new_status="completed",
                notes=f"Admin {admin_identifier} mengirim ulang email kredensial ke {order.customer_email}. Status: {'Sukses' if email_sent else 'Gagal'}.",
                customer_name=order.customer_name,
                customer_email=order.customer_email,
            )

            return {
                "success": email_sent,
                "message": "Email kredensial berhasil dikirim ulang ke pelanggan." if email_sent else "Gagal mengirim ulang email.",
                "email_status": order.email_delivery_status,
                "email_error": order.email_delivery_error,
                "order": order.to_dict(),
            }
        finally:
            db.close()

