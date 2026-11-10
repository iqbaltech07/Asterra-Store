import time
import httpx
from datetime import datetime
from typing import Dict, Any, Optional, List

from app.config import settings
from app.core.database import SessionLocal
from app.models.product import Product

class XavieraService:
    """
    Xaviera Store Upstream API Integration Service — Khusus Akun Premium.
    Official Documentation: https://xavierastore.com/api-docs.html#ep-products-list

    Fokus Khusus:
    - Autentikasi Bearer Token (GET /v1/me)
    - Katalog Akun Premium & Varian Real-time (GET /v1/products)
    - Pemesanan Akun Premium Otomatis (POST /v1/products/order)
    - Instant Credential Parsing & Delivery (Zero-Touch Fulfillment)
    - Cek Status Pesanan Akun Premium (GET /v1/orders/{id})
    """
    _profile_cache: Optional[Dict[str, Any]] = None
    _profile_cache_time: float = 0.0
    _CACHE_TTL_SECONDS: float = 60.0

    _services_cache: Optional[List[Dict[str, Any]]] = None
    _services_cache_time: float = 0.0
    _SERVICES_CACHE_TTL_SECONDS: float = 300.0

    @classmethod
    def _get_api_credentials(cls) -> Dict[str, Any]:
        """Resolves API Key and Base URL from database settings or environment fallback."""
        base_url = (getattr(settings, "XAVIERA_BASE_URL", None) or "https://xavierastore.com/api/v1").rstrip("/")
        api_key = (getattr(settings, "XAVIERA_API_KEY", None) or "").strip()

        try:
            from app.models.order_processing_setting import ResellerApiSetting
            db = SessionLocal()
            try:
                setting = db.query(ResellerApiSetting).filter(
                    ResellerApiSetting.id.in_(["xaviera", "xaviera-store", "vip-reseller"])
                ).order_by(ResellerApiSetting.id.desc()).first()
                if setting and setting.is_active:
                    if setting.base_url:
                        base_url = setting.base_url.rstrip("/")
                    if setting.api_key:
                        api_key = setting.api_key.strip()
            finally:
                db.close()
        except Exception:
            pass

        return {
            "base_url": base_url,
            "api_key": api_key,
        }

    @classmethod
    def get_profile(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves Xaviera Store user profile and wallet balance (GET /v1/me).
        Caches result in memory for 60 seconds.
        """
        now = time.time()
        if not force_refresh and cls._profile_cache is not None:
            if now - cls._profile_cache_time < cls._CACHE_TTL_SECONDS:
                return cls._profile_cache

        creds = cls._get_api_credentials()
        api_key = creds["api_key"]
        base_url = creds["base_url"]

        if not api_key:
            result = {
                "connected": False,
                "balance": None,
                "username": "",
                "message": "Kredensial Xaviera Store (API Key Bearer) belum dikonfigurasi di pengaturan admin atau .env backend.",
            }
            cls._profile_cache = result
            cls._profile_cache_time = now
            return result

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(f"{base_url}/me", headers=headers)
                if resp.status_code == 401:
                    result = {
                        "connected": False,
                        "balance": None,
                        "username": "",
                        "message": "Autentikasi gagal: API key Xaviera Store tidak valid atau sudah kadaluarsa.",
                    }
                    cls._profile_cache = result
                    cls._profile_cache_time = now
                    return result

                if resp.status_code != 200:
                    result = {
                        "connected": False,
                        "balance": None,
                        "username": "",
                        "message": f"Gateway Xaviera Store merespon HTTP {resp.status_code}.",
                    }
                    cls._profile_cache = result
                    cls._profile_cache_time = now
                    return result

                body = resp.json()
                balance = int(body.get("saldo", 0))
                result = {
                    "connected": True,
                    "balance": balance,
                    "username": body.get("name") or body.get("email", ""),
                    "email": body.get("email", ""),
                    "id": body.get("id", ""),
                    "message": "Koneksi ke Xaviera Store API aktif.",
                    "environment": "production",
                }
                cls._profile_cache = result
                cls._profile_cache_time = now
                return result

        except Exception as e:
            result = {
                "connected": False,
                "balance": None,
                "username": "",
                "message": f"Gagal menghubungi gateway Xaviera Store: {str(e)}",
            }
            cls._profile_cache = result
            cls._profile_cache_time = now
            return result

    @classmethod
    def get_premium_products(cls, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches premium accounts catalog (GET /v1/products).
        """
        creds = cls._get_api_credentials()
        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return []

        try:
            params = {}
            if category:
                params["category"] = category
            headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{base_url}/products", headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("products", [])
        except Exception as e:
            print(f"[XavieraService] Error fetching premium products: {e}")
        return []

    @classmethod
    def fetch_live_services(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetches all premium account services and variants exclusively from Xaviera Store (GET /v1/products).
        Caches aggregated services in memory for 5 minutes.
        """
        now = time.time()
        if not force_refresh and cls._services_cache is not None:
            if now - cls._services_cache_time < cls._SERVICES_CACHE_TTL_SECONDS:
                return {
                    "success": True,
                    "total": len(cls._services_cache),
                    "cached": True,
                    "cacheAgeSeconds": int(now - cls._services_cache_time),
                    "data": cls._services_cache,
                }

        normalized_services: List[Dict[str, Any]] = []

        premium_prods = cls.get_premium_products()
        for p in premium_prods:
            p_id = p.get("id", "")
            p_name = p.get("name", "")
            p_cat = p.get("category", "Akun Premium")
            has_variants = bool(p.get("hasVariants"))
            variants = p.get("variants") or []

            if has_variants and variants:
                for v in variants:
                    v_id = v.get("id", "")
                    v_name = v.get("name", "")
                    full_name = f"{p_name} - {v_name}"
                    code = f"xvs-prod:{p_id}:{v_id}"
                    price_val = int(v.get("price", 0))
                    stock = int(v.get("stock", 0))
                    status = "available" if stock > 0 else "empty"
                    normalized_services.append({
                        "id": code,
                        "code": code,
                        "name": full_name,
                        "brand": p_name,
                        "category": p_cat,
                        "type": "Akun Premium",
                        "price": {"basic": price_val, "premium": price_val, "special": price_val},
                        "status": status,
                        "stock": stock,
                        "hasVariants": True,
                        "productId": p_id,
                        "variantId": v_id,
                        "note": f"Varian: {v_name} | Stok live: {stock}",
                        "raw": v,
                    })
            else:
                code = f"xvs-prod:{p_id}"
                price_val = int(p.get("price", 0))
                stock = int(p.get("stock", 0))
                status = "available" if stock > 0 else "empty"
                normalized_services.append({
                    "id": code,
                    "code": code,
                    "name": p_name,
                    "brand": p_name,
                    "category": p_cat,
                    "type": "Akun Premium",
                    "price": {"basic": price_val, "premium": price_val, "special": price_val},
                    "status": status,
                    "stock": stock,
                    "hasVariants": False,
                    "productId": p_id,
                    "variantId": None,
                    "note": f"Stok live: {stock}",
                    "raw": p,
                })

        cls._services_cache = normalized_services
        cls._services_cache_time = now

        return {
            "success": True,
            "total": len(normalized_services),
            "cached": False,
            "cacheAgeSeconds": 0,
            "data": normalized_services,
        }

    @classmethod
    def check_stock(cls) -> Dict[str, Any]:
        """
        Autonomous stock sync worker for Akun Premium.
        Fetches live products from Xaviera Store and synchronizes status with products in database.
        """
        services_res = cls.fetch_live_services(force_refresh=True)
        services = services_res.get("data", [])
        if not services:
            return {"success": False, "message": "Tidak ada data katalog dari Xaviera Store", "checked": 0}

        service_map = {str(s.get("code") or "").strip().lower(): s for s in services}

        db = SessionLocal()
        checked_count = 0
        updated_count = 0
        try:
            products = db.query(Product).filter(
                Product.provider.in_(["xaviera", "vip-reseller"]),
                Product.provider_code.isnot(None)
            ).all()

            for prod in products:
                code_key = str(prod.provider_code or "").strip().lower()
                matched = service_map.get(code_key)

                if not matched:
                    for k, v in service_map.items():
                        if code_key in k:
                            matched = v
                            break

                if matched:
                    checked_count += 1
                    live_status = matched.get("status")
                    if live_status and prod.provider_status != live_status:
                        prod.provider_status = live_status
                        prod.last_provider_check = datetime.utcnow()
                        updated_count += 1

            if updated_count > 0:
                db.commit()
                from app.core.cache import cache
                cache.invalidate("catalog")

            return {
                "success": True,
                "message": f"Pengecekan stok Akun Premium Xaviera Store selesai. {checked_count} produk diperiksa, {updated_count} diperbarui.",
                "checked": checked_count,
                "updated": updated_count,
            }
        except Exception as e:
            db.rollback()
            return {"success": False, "message": f"Gagal sinkronisasi stok: {str(e)}", "checked": 0}
        finally:
            db.close()

    @classmethod
    def get_product_target_requirement(
        cls,
        product_name: str = "",
        brand: str = "",
        category: str = "",
        provider_code: str = "",
        target_type_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Determines the target input requirement for Akun Premium delivery.
        Akun Premium delivers credentials via Email or WhatsApp.
        """
        if target_type_override:
            t = target_type_override.strip().lower()
            if t in ["phone", "tel", "whatsapp", "nomor"]:
                return {
                    "type": "phone",
                    "label": "Nomor WhatsApp / HP Anda",
                    "placeholder": "Masukan Nomor (contoh: 081234567890)",
                    "helper": "Kredensial akun premium akan dikirimkan ke nomor ini.",
                    "requires_zone": False,
                    "zone_label": "",
                    "zone_placeholder": "",
                    "zone_helper": "",
                }

        # Default Akun Premium requirement: Target Email
        return {
            "type": "email",
            "label": "Email Penerima Akun Premium",
            "placeholder": "contoh: akun_anda@gmail.com",
            "helper": "Kredensial atau lisensi akun premium akan dikirimkan langsung ke email ini.",
            "requires_zone": False,
            "zone_label": "",
            "zone_placeholder": "",
            "zone_helper": "",
        }

    @classmethod
    def place_order(
        cls,
        service_code: str,
        target_id: str,
        zone_id: str = "",
        additional_data: str = "",
        qty: int = 1,
        comments: str = "",
        variant_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes Akun Premium order placement (POST /v1/products/order).
        Official documentation: https://xavierastore.com/api-docs.html#ep-products-order
        Returns instant account credentials upon completion.
        """
        creds = cls._get_api_credentials()
        base_url = creds["base_url"]
        api_key = creds["api_key"]

        clean_code = str(service_code or "").strip()
        clean_qty = max(1, int(qty or 1))

        if not clean_code:
            return {"success": False, "message": "Kode produk (productId) wajib diisi."}

        if not api_key:
            return {
                "success": False,
                "message": "Kredensial Xaviera Store API Key belum dikonfigurasi.",
            }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        # Parse productId and variantId from service_code (e.g. "xvs-prod:p_netflix1:v_net_1m")
        prod_id = clean_code.replace("xvs-prod:", "")
        var_id = variant_id
        if ":" in prod_id:
            parts = prod_id.split(":")
            prod_id = parts[0]
            var_id = parts[1]

        payload: Dict[str, Any] = {
            "productId": prod_id,
            "qty": clean_qty,
        }
        if var_id:
            payload["variantId"] = var_id

        try:
            with httpx.Client(timeout=30.0) as client:
                resp = client.post(f"{base_url}/products/order", json=payload, headers=headers)
                body = resp.json() if resp.status_code < 500 else {}

                if resp.status_code not in [200, 201]:
                    err_msg = body.get("error", {}).get("message") or body.get("message") or f"HTTP {resp.status_code}"
                    return {"success": False, "message": f"Gagal order akun premium: {err_msg}", "raw": body}

                order_data = body.get("order") if isinstance(body.get("order"), dict) else body
                trxid = order_data.get("id") or order_data.get("orderId") or body.get("id") or body.get("orderId")
                st = str(order_data.get("status", "COMPLETED")).upper()
                creds_list = order_data.get("credentials") or []

                formatted_note = ""
                if creds_list:
                    pairs = [f"Akun: {c.get('email', '')} | Pass: {c.get('password', '')}" for c in creds_list]
                    formatted_note = " ; ".join(pairs)

                normalized_status = "success" if (st == "COMPLETED" or creds_list) else "processing"

                return {
                    "success": True,
                    "trxid": trxid,
                    "status": normalized_status,
                    "note": formatted_note or f"Order #{trxid} Status: {st}",
                    "message": "Pesanan akun premium berhasil diproses.",
                    "credentials": creds_list,
                    "raw": order_data,
                }

        except Exception as e:
            return {"success": False, "message": f"Koneksi Xaviera Store order gagal: {str(e)}"}

    @classmethod
    def check_order_status(cls, trxid: str, category: Optional[str] = None) -> Dict[str, Any]:
        """
        Checks real-time status of an Akun Premium order (GET /v1/orders/{id}).
        """
        clean_trxid = str(trxid or "").strip()
        if not clean_trxid:
            return {"success": False, "status": "error", "message": "ID transaksi (trxid) kosong."}

        creds = cls._get_api_credentials()
        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return {"success": False, "status": "error", "message": "API key Xaviera Store belum disetel."}

        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{base_url}/orders/{clean_trxid}", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    st_raw = str(data.get("status", "")).upper()
                    normalized = "processing"
                    if st_raw in ["SUCCESS", "COMPLETED"]:
                        normalized = "success"
                    elif st_raw in ["FAILED", "CANCELLED"]:
                        normalized = "error"
                    elif st_raw in ["WAITING", "PENDING"]:
                        normalized = "waiting"

                    creds = data.get("credentials")
                    note = data.get("note") or ""
                    if creds and isinstance(creds, list):
                        note = " ; ".join([f"Akun: {c.get('email', '')} | Pass: {c.get('password', '')}" for c in creds])

                    return {
                        "success": True,
                        "trxid": clean_trxid,
                        "status": normalized,
                        "note": note,
                        "credentials": creds,
                        "raw": data,
                        "message": f"Status order Xaviera: {st_raw}",
                    }

                return {
                    "success": False,
                    "trxid": clean_trxid,
                    "status": "error",
                    "message": f"Transaksi {clean_trxid} tidak ditemukan di gateway Xaviera Store.",
                }
        except Exception as e:
            return {
                "success": False,
                "trxid": clean_trxid,
                "status": "error",
                "message": f"Gagal cek status Xaviera: {str(e)}",
            }

    @classmethod
    def fulfill_order_if_xaviera(cls, order_id: str) -> Dict[str, Any]:
        """
        Executes automatic upstream fulfillment to Xaviera Store Akun Premium API.
        When Xaviera returns instant credentials, saves them to order.fulfillment_credentials,
        sets status to 'completed', and triggers automated customer delivery email!
        """
        clean_id = str(order_id or "").strip().upper()
        if not clean_id:
            return {"success": False, "is_xaviera": False, "message": "ID pesanan kosong."}

        from app.models.order import Order
        from app.services.audit_log_service import AuditLogService
        from app.services.email_service import EmailService
        from app.services.realtime_broadcaster import RealtimeBroadcaster
        from app.core.cache import cache

        db = SessionLocal()
        try:
            from sqlalchemy.orm import joinedload
            order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
            if not order:
                return {"success": False, "is_xaviera": False, "message": f"Pesanan {clean_id} tidak ditemukan."}

            if order.provider_trxid:
                return {
                    "success": True,
                    "is_xaviera": True,
                    "already_placed": True,
                    "trxid": order.provider_trxid,
                    "provider_status": order.provider_status,
                    "message": f"Pesanan sudah pernah diproses ke Xaviera Store ({order.provider_trxid}).",
                    "order": order.to_dict(),
                }

            xaviera_items = []
            for item in order.items:
                prod = db.query(Product).filter(
                    Product.id == item.product_id,
                    Product.provider.in_(["xaviera", "vip-reseller"]),
                    Product.status == "active"
                ).first()
                if prod and prod.provider_code:
                    xaviera_items.append((item, prod))

            if not xaviera_items:
                return {
                    "success": False,
                    "is_xaviera": False,
                    "message": "Pesanan tidak mengandung produk aktif Xaviera Store. Transaksi ditangani secara manual/in-house.",
                }

            if not getattr(settings, "XAVIERA_AUTO_FULFILLMENT", True):
                return {
                    "success": False,
                    "is_xaviera": True,
                    "message": "Otomatisasi Xaviera Store dinonaktifkan (XAVIERA_AUTO_FULFILLMENT=false). Mode manual aktif.",
                    "order": order.to_dict(),
                }

            all_results = []
            successful_units = 0
            total_units = 0
            all_trxids = []
            notes_list = []
            collected_credentials = []

            for item, prod in xaviera_items:
                item_qty = max(1, int(getattr(item, "quantity", 1) or 1))
                total_units += item_qty

                target_id = (
                    getattr(item, "target_email", None) or
                    getattr(item, "target_id", None) or
                    order.customer_email or
                    order.customer_whatsapp or ""
                ).strip()

                for unit_idx in range(item_qty):
                    res = cls.place_order(
                        service_code=prod.provider_code,
                        target_id=target_id,
                        qty=1,
                    )
                    all_results.append({
                        "product_name": prod.name,
                        "unit": unit_idx + 1,
                        "result": res,
                    })

                    if res.get("success"):
                        successful_units += 1
                        t_id = str(res.get("trxid") or "")
                        if t_id:
                            all_trxids.append(t_id)
                        if res.get("note"):
                            notes_list.append(f"[{prod.name} #{unit_idx+1}] {res.get('note')}")
                        if res.get("credentials"):
                            creds = res.get("credentials")
                            if isinstance(creds, list):
                                for c in creds:
                                    collected_credentials.append(f"Email/User: {c.get('email', '')} | Password: {c.get('password', '')}")
                            elif isinstance(creds, str):
                                collected_credentials.append(creds)
                    else:
                        notes_list.append(f"[{prod.name} #{unit_idx+1} Error] {res.get('message', 'Gagal kirim')}")

            order.provider = "xaviera"
            order.provider_trxid = ", ".join(all_trxids) if all_trxids else None
            order.provider_note = " | ".join(notes_list)[:1000] if notes_list else None
            order.updated_at = datetime.utcnow()

            all_success = successful_units == total_units and total_units > 0
            partial_success = successful_units > 0 and successful_units < total_units

            if collected_credentials:
                order.fulfillment_credentials = "\n".join(collected_credentials)
                order.fulfillment_mode = "automatic"
                order.fulfilled_at = datetime.utcnow()

            if all_success:
                order.provider_status = "success"
                order.status = "completed"
                order.paid_at = order.paid_at or datetime.utcnow()
                order.payment_status = "settlement"
            elif partial_success:
                order.provider_status = "partial_error"
                order.status = "processing"
            else:
                order.provider_status = "error" if total_units > 0 else "waiting"
                order.status = "processing"

            db.commit()
            db.refresh(order)

            action_name = "xaviera_order_placed" if all_success else ("xaviera_order_partial" if partial_success else "xaviera_order_failed")
            AuditLogService.record_log(
                order_id=order.id,
                actor="xaviera_store",
                action=action_name,
                previous_status="pending",
                new_status=order.status,
                notes=f"Xaviera Akun Premium: {successful_units}/{total_units} unit diproses. TRX: {order.provider_trxid or '-'}. {order.provider_note or ''}".strip(),
                customer_name=order.customer_name,
                customer_email=order.customer_email,
            )

            # Send automated customer completion email if credentials are present
            if all_success and order.status == "completed":
                try:
                    EmailService.send_order_completed_email(order.to_dict())
                except Exception as email_err:
                    print(f"[XavieraService] Error sending completed email: {email_err}")

            cache.invalidate("orders")
            if order.status in ["completed", "paid", "settlement"]:
                cache.invalidate("homepage_sections", "catalog")
                try:
                    RealtimeBroadcaster.broadcast("cards:updated", {"reason": "xaviera_order_completed", "order_id": order.id}, target_role="all")
                    RealtimeBroadcaster.broadcast("homepage:sections_updated", {"reason": "xaviera_order_completed", "order_id": order.id}, target_role="all")
                    RealtimeBroadcaster.broadcast("catalog:updated", {"reason": "xaviera_order_completed", "order_id": order.id}, target_role="all")
                except Exception:
                    pass

            from app.services.order_service import OrderService
            OrderService.load_orders(force_reload=True)

            return {
                "success": all_success,
                "is_xaviera": True,
                "successful_units": successful_units,
                "total_units": total_units,
                "trxids": all_trxids,
                "message": (
                    f"Seluruh {total_units} akun premium Xaviera Store berhasil diproses otomatis."
                    if all_success
                    else f"Pemrosesan Xaviera Store: {successful_units} dari {total_units} akun berhasil diproses."
                ),
                "order": order.to_dict(),
            }

        finally:
            db.close()

    @classmethod
    def sync_order_live_status(cls, order_id: str) -> Dict[str, Any]:
        """
        Polls live status from Xaviera Store for an ongoing processing Akun Premium order.
        """
        clean_id = str(order_id or "").strip().upper()
        if not clean_id:
            return {"success": False, "message": "ID pesanan kosong."}

        from app.models.order import Order
        from app.services.audit_log_service import AuditLogService
        from app.services.email_service import EmailService
        from app.core.cache import cache

        db = SessionLocal()
        try:
            order = db.query(Order).filter(Order.id == clean_id).first()
            if not order:
                return {"success": False, "message": f"Pesanan {clean_id} tidak ditemukan."}

            if not order.provider_trxid:
                return {"success": False, "message": "Pesanan belum memiliki TRXID Xaviera Store."}

            primary_trxid = order.provider_trxid.split(",")[0].strip()
            status_res = cls.check_order_status(primary_trxid)

            if not status_res.get("success"):
                return {"success": False, "message": status_res.get("message", "Gagal cek status.")}

            live_st = status_res.get("status", "processing")
            live_note = status_res.get("note", "")
            creds = status_res.get("credentials")

            status_changed = False
            prev_status = order.status

            if creds and not order.fulfillment_credentials:
                if isinstance(creds, list):
                    order.fulfillment_credentials = "\n".join(
                        [f"Email/User: {c.get('email', '')} | Password: {c.get('password', '')}" for c in creds]
                    )
                else:
                    order.fulfillment_credentials = str(creds)
                order.fulfillment_mode = "automatic"
                order.fulfilled_at = datetime.utcnow()

            if live_st == "success":
                order.provider_status = "success"
                order.status = "completed"
                order.paid_at = order.paid_at or datetime.utcnow()
                status_changed = (prev_status != "completed")
            elif live_st == "error":
                order.provider_status = "error"
                status_changed = (prev_status != "failed")
            else:
                order.provider_status = "processing"

            if live_note:
                order.provider_note = f"{live_note} (Synced at {datetime.utcnow().strftime('%H:%M:%S')})"[:1000]

            order.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(order)

            if status_changed:
                AuditLogService.record_log(
                    order_id=order.id,
                    actor="xaviera_sync",
                    action="status_synced",
                    previous_status=prev_status,
                    new_status=order.status,
                    notes=f"Status live Xaviera Store disinkronkan: {order.provider_status}. Note: {order.provider_note or '-'}",
                    customer_name=order.customer_name,
                    customer_email=order.customer_email,
                )
                if order.status == "completed":
                    try:
                        EmailService.send_order_completed_email(order.to_dict())
                    except Exception as e:
                        print(f"[XavieraService] Sync completed email note: {e}")

            cache.invalidate("orders")
            from app.services.order_service import OrderService
            OrderService.load_orders(force_reload=True)

            return {
                "success": True,
                "xaviera_status": order.provider_status,
                "order_status": order.status,
                "order": order.to_dict(),
                "message": f"Status pesanan berhasil disinkronkan dengan Xaviera Store: {order.provider_status}",
            }
        finally:
            db.close()

    @classmethod
    def verify_webhook_signature(cls, signature: Optional[str]) -> bool:
        return True

    @classmethod
    def handle_webhook(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        return {"result": True, "message": "Webhook diterima.", "data": payload}
