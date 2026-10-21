import time
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.config import settings
from app.core.database import SessionLocal
from app.models.product import Product

class VipService:
    _profile_cache: Optional[Dict[str, Any]] = None
    _profile_cache_time: float = 0.0
    _CACHE_TTL_SECONDS: float = 60.0

    @classmethod
    def get_profile(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves VIP Reseller profile and wallet balance.
        Caches result in memory for 60 seconds to prevent unnecessary API hammering.
        """
        now = time.time()
        if not force_refresh and cls._profile_cache is not None:
            if now - cls._profile_cache_time < cls._CACHE_TTL_SECONDS:
                return cls._profile_cache

        api_key = (settings.VIP_RESELLER_API_KEY or "").strip()
        sign = (settings.VIP_RESELLER_SIGN or "").strip()
        base_url = (settings.VIP_RESELLER_BASE_URL or "https://vip-reseller.co.id/api").rstrip("/")

        if not api_key or not sign:
            result = {
                "connected": False,
                "balance": None,
                "username": "",
                "message": "Kredensial VIP Reseller (API Key / Sign) belum dikonfigurasi di .env backend.",
            }
            cls._profile_cache = result
            cls._profile_cache_time = now
            return result

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    f"{base_url}/profile",
                    data={"key": api_key, "sign": sign},
                )
                if resp.status_code != 200:
                    result = {
                        "connected": False,
                        "balance": None,
                        "username": "",
                        "message": f"Gateway VIP Reseller merespon HTTP {resp.status_code}.",
                    }
                    cls._profile_cache = result
                    cls._profile_cache_time = now
                    return result

                body = resp.json()
                if not body.get("result"):
                    result = {
                        "connected": False,
                        "balance": None,
                        "username": "",
                        "message": body.get("message", "Gagal verifikasi kredensial VIP Reseller."),
                    }
                    cls._profile_cache = result
                    cls._profile_cache_time = now
                    return result

                data = body.get("data", {})
                balance = int(data.get("balance", 0))
                result = {
                    "connected": True,
                    "balance": balance,
                    "username": data.get("username", ""),
                    "full_name": data.get("full_name", ""),
                    "level": data.get("level", ""),
                    "message": "Koneksi ke VIP Reseller API aktif.",
                }
                cls._profile_cache = result
                cls._profile_cache_time = now
                return result

        except Exception as e:
            result = {
                "connected": False,
                "balance": None,
                "username": "",
                "message": f"Gagal menghubungi gateway VIP Reseller: {str(e)}",
            }
            cls._profile_cache = result
            cls._profile_cache_time = now
            return result

    @classmethod
    def fetch_live_services(cls) -> Dict[str, Any]:
        """
        Fetches full live services list directly from VIP Reseller API.
        """
        api_key = (settings.VIP_RESELLER_API_KEY or "").strip()
        sign = (settings.VIP_RESELLER_SIGN or "").strip()
        base_url = (settings.VIP_RESELLER_BASE_URL or "https://vip-reseller.co.id/api").rstrip("/")

        if not api_key or not sign:
            return {"success": False, "message": "API Key / Sign belum dikonfigurasi.", "services": []}

        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(
                    f"{base_url}/game-feature",
                    data={"key": api_key, "sign": sign, "type": "services"},
                )
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "message": f"VIP Reseller HTTP {resp.status_code}",
                        "services": [],
                    }

                body = resp.json()
                if not body.get("result"):
                    return {
                        "success": False,
                        "message": body.get("message", "Gagal memuat layanan."),
                        "services": [],
                    }

                services = body.get("data", [])
                return {"success": True, "services": services, "count": len(services)}
        except Exception as e:
            return {"success": False, "message": str(e), "services": []}

    @classmethod
    def check_stock(cls) -> Dict[str, Any]:
        """
        Pings VIP Reseller, compares catalog product codes, and updates live providerStatus in DB.
        """
        profile = cls.get_profile(force_refresh=True)
        if not profile.get("connected"):
            return {
                "success": False,
                "message": f"Koneksi VIP Reseller gagal: {profile.get('message')}",
                "checked": 0,
            }

        live_result = cls.fetch_live_services()
        if not live_result.get("success"):
            return {
                "success": False,
                "message": f"Gagal mengambil data live: {live_result.get('message')}",
                "checked": 0,
            }

        services = live_result.get("services", [])
        status_map = {}
        for s in services:
            code = str(s.get("code") or "").strip().upper()
            if code:
                status_map[code] = str(s.get("status") or "available").lower()

        updated_count = 0
        try:
            db = SessionLocal()
            try:
                products = db.query(Product).filter(Product.provider == "vip-reseller").all()
                for p in products:
                    code = str(p.provider_code or "").strip().upper()
                    if code and code in status_map:
                        upstream_status = status_map[code]
                        p.provider_status = upstream_status
                        if upstream_status == "empty":
                            p.stock = 0
                        elif p.stock == 0 and upstream_status == "available":
                            p.stock = 100
                        p.last_provider_check = datetime.utcnow()
                        updated_count += 1
                db.commit()
            finally:
                db.close()
        except Exception as e:
            return {
                "success": False,
                "message": f"Gagal memperbarui stok di database: {str(e)}",
                "checked": 0,
            }

        from app.services.catalog_service import CatalogService
        CatalogService.load_products(force_reload=True)

        return {
            "success": True,
            "message": f"Pengecekan stok live selesai. {updated_count} produk diperiksa dan disinkronkan dengan gateway VIP Reseller.",
            "checked": updated_count,
        }

    @classmethod
    def sync_vip_services(cls) -> Dict[str, Any]:
        """
        Performs full synchronization with VIP Reseller.
        """
        profile = cls.get_profile(force_refresh=True)
        if not profile.get("connected"):
            return {
                "success": False,
                "message": f"Sinkronisasi ditolak: VIP Reseller belum terhubung ({profile.get('message')}).",
                "totalSynced": 0,
            }

        live_result = cls.fetch_live_services()
        if not live_result.get("success"):
            return {
                "success": False,
                "message": f"Gagal menghubungi gateway: {live_result.get('message')}",
                "totalSynced": 0,
            }

        # Run stock check to sync statuses
        cls.check_stock()

        # Update live managed catalog file and memory cache
        raw_services = live_result.get("services", [])
        normalized = []
        for item in raw_services:
            code = str(item.get("code") or "").strip()
            if not code:
                continue
            game_or_cat = item.get("game") or item.get("category") or item.get("brand") or "Digital"
            normalized.append({
                "code": code,
                "name": item.get("name") or code,
                "brand": item.get("brand") or game_or_cat,
                "category": item.get("category") or game_or_cat,
                "type": item.get("type") or (item.get("game") and "Game") or "Layanan Digital",
                "game": item.get("game") or "",
                "server": str(item.get("server") or ""),
                "price": item.get("price") or 0,
                "status": item.get("status") or "available",
                "description": item.get("description") or item.get("note") or "",
            })

        import json, pathlib
        data_dir = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
        managed_path = data_dir / "managed-catalog.json"
        try:
            managed_path.write_text(json.dumps(normalized, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"[VipService] Error saving managed catalog: {e}")

        from app.services.catalog_service import CatalogService
        CatalogService._cached_vip_services = normalized

        total = len(normalized)
        return {
            "success": True,
            "message": f"Berhasil menyinkronkan {total} layanan langsung dari gerbang VIP Reseller (Saldo: Rp {profile.get('balance', 0):,}).".replace(",", "."),
            "totalSynced": total,
            "balance": profile.get("balance"),
        }

    @classmethod
    def verify_webhook_signature(cls, signature: Optional[str]) -> bool:
        """
        Verifies X-Client-Signature from VIP Reseller webhook header.
        Formula: md5(API ID + API KEY)
        """
        if not signature:
            return False
        clean_sig = signature.strip().lower()
        expected = (settings.VIP_RESELLER_SIGN or "").strip().lower()
        if expected and clean_sig == expected:
            return True
        api_id = (settings.VIP_RESELLER_API_ID or "").strip()
        api_key = (settings.VIP_RESELLER_API_KEY or "").strip()
        if api_id and api_key:
            import hashlib
            calc = hashlib.md5(f"{api_id}{api_key}".encode("utf-8")).hexdigest().lower()
            return clean_sig == calc
        return False

    @classmethod
    def place_order(
        cls,
        service_code: str,
        target_id: str,
        zone_id: str = "",
        additional_data: str = ""
    ) -> Dict[str, Any]:
        """
        Places a live digital order through VIP Reseller API (Melakukan Pemesanan).
        Endpoint: POST https://vip-reseller.co.id/api/game-feature
        """
        api_key = (settings.VIP_RESELLER_API_KEY or "").strip()
        sign = (settings.VIP_RESELLER_SIGN or "").strip()
        base_url = (settings.VIP_RESELLER_BASE_URL or "https://vip-reseller.co.id/api").rstrip("/")

        if not api_key or not sign:
            return {
                "success": False,
                "message": "Kredensial VIP Reseller (API Key / Sign) belum dikonfigurasi.",
            }

        clean_service = str(service_code or "").strip()
        clean_target = str(target_id or "").strip()
        if not clean_service or not clean_target:
            return {
                "success": False,
                "message": "Parameter 'service' dan 'data_no' (target ID/email) wajib diisi.",
            }

        post_data = {
            "key": api_key,
            "sign": sign,
            "type": "order",
            "service": clean_service,
            "data_no": clean_target,
            "data_zone": str(zone_id or "").strip(),
            "post_additional_data": str(additional_data or "").strip(),
        }

        try:
            with httpx.Client(timeout=25.0) as client:
                resp = client.post(
                    f"{base_url}/game-feature",
                    data=post_data,
                )
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "message": f"Gateway VIP Reseller merespon HTTP {resp.status_code}.",
                    }

                body = resp.json()
                if not body.get("result"):
                    return {
                        "success": False,
                        "message": body.get("message", "VIP Reseller menolak pemesanan."),
                        "raw": body,
                    }

                data = body.get("data", {})
                trxid = data.get("trxid")
                return {
                    "success": True,
                    "trxid": trxid,
                    "data": data.get("data"),
                    "zone": data.get("zone"),
                    "service": data.get("service"),
                    "status": data.get("status") or "waiting",
                    "note": data.get("note") or "",
                    "balance": data.get("balance"),
                    "price": data.get("price"),
                    "message": body.get("message", "Pesanan berhasil diproses."),
                    "raw": data,
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Koneksi VIP Reseller order gagal: {str(e)}",
            }

    @classmethod
    def check_order_status(cls, trxid: str) -> Dict[str, Any]:
        """
        Checks live status of an order on VIP Reseller (Melakukan Cek Status Pesanan).
        Endpoint: POST https://vip-reseller.co.id/api/game-feature
        """
        api_key = (settings.VIP_RESELLER_API_KEY or "").strip()
        sign = (settings.VIP_RESELLER_SIGN or "").strip()
        base_url = (settings.VIP_RESELLER_BASE_URL or "https://vip-reseller.co.id/api").rstrip("/")

        clean_trxid = str(trxid or "").strip()
        if not clean_trxid:
            return {
                "success": False,
                "message": "Parameter trxid transaksi wajib diisi.",
            }

        if not api_key or not sign:
            return {
                "success": False,
                "message": "Kredensial VIP Reseller belum dikonfigurasi.",
            }

        post_data = {
            "key": api_key,
            "sign": sign,
            "type": "status",
            "trxid": clean_trxid,
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(
                    f"{base_url}/game-feature",
                    data=post_data,
                )
                if resp.status_code != 200:
                    return {
                        "success": False,
                        "message": f"VIP Reseller HTTP {resp.status_code}",
                    }

                body = resp.json()
                if not body.get("result"):
                    return {
                        "success": False,
                        "message": body.get("message", "Detail transaksi tidak ditemukan."),
                    }

                data_list = body.get("data", [])
                if not data_list or not isinstance(data_list, list):
                    return {
                        "success": False,
                        "message": "Format respon transaksi VIP kosong.",
                    }

                item = data_list[0]
                return {
                    "success": True,
                    "trxid": item.get("trxid"),
                    "data": item.get("data"),
                    "zone": item.get("zone"),
                    "service": item.get("service"),
                    "status": str(item.get("status") or "waiting").lower(),
                    "note": item.get("note") or "",
                    "price": item.get("price"),
                    "message": item.get("message") or body.get("message", "Status ditemukan."),
                    "raw": item,
                }
        except Exception as e:
            return {
                "success": False,
                "message": f"Gagal memeriksa status VIP Reseller: {str(e)}",
            }

    @classmethod
    def fulfill_order_if_vip(cls, order_id: str) -> Dict[str, Any]:
        """
        Inspects order items in database.
        ONLY fulfills products imported from VIP Reseller with provider == 'vip-reseller' and active status.
        Products outside VIP Reseller are untouched.
        """
        clean_id = str(order_id or "").strip().upper()
        if not clean_id:
            return {"success": False, "is_vip": False, "message": "ID pesanan kosong."}

        from app.models.order import Order
        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
            if not order:
                return {"success": False, "is_vip": False, "message": f"Pesanan {clean_id} tidak ditemukan."}

            # If already has provider_trxid, avoid duplicate order submission
            if order.provider_trxid:
                return {
                    "success": True,
                    "is_vip": True,
                    "already_placed": True,
                    "trxid": order.provider_trxid,
                    "vip_status": order.provider_status,
                    "message": f"Pesanan sudah pernah diproses ke VIP Reseller ({order.provider_trxid}).",
                    "order": order.to_dict(),
                }

            # Identify VIP items
            vip_items = []
            for item in order.items:
                prod = db.query(Product).filter(
                    Product.id == item.product_id,
                    Product.provider == "vip-reseller",
                    Product.status == "active"
                ).first()
                if prod and prod.provider_code:
                    vip_items.append((item, prod))

            # Strictly filter: products outside VIP Reseller are untouched!
            if not vip_items:
                return {
                    "success": False,
                    "is_vip": False,
                    "message": "Pesanan tidak mengandung produk aktif VIP Reseller. Transaksi ditangani secara manual/in-house.",
                }

            # Fulfill the primary VIP service item
            item, prod = vip_items[0]
            target_id = (item.target_email or order.customer_email or item.target_phone or order.customer_whatsapp or "").strip()

            # Optional zone resolution from customer notes if specified
            target_zone = ""
            if order.customer_notes and "zone:" in order.customer_notes.lower():
                import re
                zm = re.search(r"zone[:\s]+([0-9a-zA-Z_-]+)", order.customer_notes, re.IGNORECASE)
                if zm:
                    target_zone = zm.group(1).strip()

            res = cls.place_order(
                service_code=prod.provider_code,
                target_id=target_id,
                zone_id=target_zone,
            )

            from app.services.audit_log_service import AuditLogService
            from app.core.cache import cache

            if res.get("success"):
                trxid = res.get("trxid")
                vip_status = str(res.get("status") or "waiting").lower()
                vip_note = str(res.get("note") or "")

                order.provider = "vip-reseller"
                order.provider_trxid = trxid
                order.provider_status = vip_status
                order.provider_note = vip_note
                order.updated_at = datetime.utcnow()

                if vip_status == "success":
                    order.status = "completed"
                    order.paid_at = order.paid_at or datetime.utcnow()
                    order.payment_status = "settlement"
                elif vip_status in ["waiting", "processing"]:
                    order.status = "processing"

                db.commit()
                db.refresh(order)

                AuditLogService.record_log(
                    order_id=order.id,
                    actor="vip_reseller",
                    action="vip_order_placed",
                    previous_status="pending",
                    new_status=order.status,
                    notes=f"Order diproses ke VIP Reseller. TRX: {trxid}, Status VIP: {vip_status}. {vip_note}".strip(),
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                )

                cache.invalidate("orders")
                from app.services.order_service import OrderService
                OrderService.load_orders(force_reload=True)

                return {
                    "success": True,
                    "is_vip": True,
                    "trxid": trxid,
                    "vip_status": vip_status,
                    "message": "Pesanan berhasil diproses otomatis oleh VIP Reseller.",
                    "order": order.to_dict(),
                }
            else:
                err_msg = res.get("message", "Gagal melakukan pemesanan ke VIP Reseller.")
                order.provider = "vip-reseller"
                order.provider_status = "error"
                order.provider_note = f"Gagal otomatisasi VIP: {err_msg}"
                order.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(order)

                AuditLogService.record_log(
                    order_id=order.id,
                    actor="vip_reseller",
                    action="vip_order_failed",
                    previous_status=order.status,
                    new_status=order.status,
                    notes=f"VIP Reseller order error: {err_msg}",
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                )

                cache.invalidate("orders")
                from app.services.order_service import OrderService
                OrderService.load_orders(force_reload=True)

                return {
                    "success": False,
                    "is_vip": True,
                    "message": err_msg,
                    "order": order.to_dict(),
                }

        finally:
            db.close()

    @classmethod
    def sync_order_live_status(cls, order_id: str) -> Dict[str, Any]:
        """
        Synchronizes live status of an order directly from VIP Reseller gateway.
        """
        clean_id = str(order_id or "").strip().upper()
        if not clean_id:
            return {"success": False, "is_vip": False, "message": "ID pesanan kosong."}

        from app.models.order import Order
        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
            if not order:
                return {"success": False, "is_vip": False, "message": f"Pesanan {clean_id} tidak ditemukan."}

            if order.provider != "vip-reseller" or not order.provider_trxid:
                return {
                    "success": False,
                    "is_vip": False,
                    "message": "Pesanan ini bukan produk VIP Reseller atau belum diteruskan ke VIP Reseller.",
                    "order": order.to_dict(),
                }

            status_res = cls.check_order_status(order.provider_trxid)
            if not status_res.get("success"):
                return {
                    "success": False,
                    "is_vip": True,
                    "message": status_res.get("message", "Gagal cek status live."),
                    "order": order.to_dict(),
                }

            vip_status = str(status_res.get("status") or "waiting").lower()
            vip_note = str(status_res.get("note") or "")

            changed = False
            prev_status = order.status
            if order.provider_status != vip_status:
                order.provider_status = vip_status
                changed = True

            if vip_note and order.provider_note != vip_note:
                order.provider_note = vip_note
                changed = True

            if vip_status == "success" and order.status != "completed":
                order.status = "completed"
                order.paid_at = order.paid_at or datetime.utcnow()
                order.payment_status = "settlement"
                changed = True

            elif vip_status in ["error", "canceled", "failed"]:
                if order.provider_status != "error":
                    order.provider_status = "error"
                    changed = True

            if changed:
                order.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(order)

                from app.services.audit_log_service import AuditLogService
                from app.core.cache import cache

                action_name = "vip_order_completed" if order.status == "completed" else "vip_status_synced"
                AuditLogService.record_log(
                    order_id=order.id,
                    actor="vip_reseller",
                    action=action_name,
                    previous_status=prev_status,
                    new_status=order.status,
                    notes=f"Status live disinkronkan dari VIP Reseller: {vip_status}. Note: {vip_note}".strip(),
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                )

                cache.invalidate("orders")
                from app.services.order_service import OrderService
                OrderService.load_orders(force_reload=True)

            return {
                "success": True,
                "is_vip": True,
                "trxid": order.provider_trxid,
                "vip_status": vip_status,
                "status": order.status,
                "note": order.provider_note,
                "order": order.to_dict(),
            }

        finally:
            db.close()

    @classmethod
    def handle_webhook(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processes incoming automated status callback from VIP Reseller.
        """
        data = payload.get("data")
        if not data or not isinstance(data, dict):
            data = payload

        trxid = str(data.get("trxid") or "").strip()
        vip_status = str(data.get("status") or "").lower().strip()
        vip_note = str(data.get("note") or "").strip()

        if not trxid:
            return {"result": False, "message": "trxid tidak ditemukan dalam payload callback."}

        from app.models.order import Order
        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.provider_trxid == trxid).first()
            if not order:
                return {
                    "result": False,
                    "message": f"Pesanan dengan provider_trxid '{trxid}' tidak ditemukan di Asterra Store.",
                }

            prev_status = order.status
            order.provider_status = vip_status
            if vip_note:
                order.provider_note = vip_note

            if vip_status == "success":
                order.status = "completed"
                order.paid_at = order.paid_at or datetime.utcnow()
                order.payment_status = "settlement"
            elif vip_status in ["error", "canceled", "failed"]:
                order.provider_status = "error"

            order.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(order)

            from app.services.audit_log_service import AuditLogService
            from app.core.cache import cache

            AuditLogService.record_log(
                order_id=order.id,
                actor="vip_webhook",
                action="vip_webhook_received",
                previous_status=prev_status,
                new_status=order.status,
                notes=f"Callback Webhook VIP Reseller diterima. Status: {vip_status}, Note: {vip_note}".strip(),
                customer_name=order.customer_name,
                customer_email=order.customer_email,
            )

            cache.invalidate("orders")
            from app.services.order_service import OrderService
            OrderService.load_orders(force_reload=True)

            return {
                "result": True,
                "message": f"Status pesanan {order.id} berhasil diperbarui dari webhook VIP Reseller.",
                "order_id": order.id,
                "status": order.status,
                "vip_status": vip_status,
            }

        finally:
            db.close()

