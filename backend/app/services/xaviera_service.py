import time
import httpx
import re
from datetime import datetime
from typing import Dict, Any, Optional, List, Union
from app.config import settings
from app.core.database import SessionLocal
from app.models.product import Product

class XavieraService:
    """
    Xaviera Store Upstream API Integration Service.
    Official Documentation: https://xavierastore.com/api-docs.html

    Covers all 3 categories:
    1. Akun Premium (Instant credentials return upon order)
    2. SMM (Social Media Marketing)
    3. Top Up Game
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
        sandbox = getattr(settings, "XAVIERA_SANDBOX_MODE", False)

        try:
            from app.models.order_processing_setting import ResellerApiSetting
            db = SessionLocal()
            try:
                setting = db.query(ResellerApiSetting).filter(
                    ResellerApiSetting.id.in_(["xaviera", "xaviera-store", "vip-reseller"])
                ).order_by(
                    # Prioritize 'xaviera' over legacy 'vip-reseller'
                    ResellerApiSetting.id.desc()
                ).first()
                if setting and setting.is_active:
                    if setting.base_url:
                        base_url = setting.base_url.rstrip("/")
                    if setting.api_key:
                        api_key = setting.api_key.strip()
                    if setting.environment == "sandbox":
                        sandbox = True
            finally:
                db.close()
        except Exception as e:
            # Table might not exist yet during initial boot
            pass

        return {
            "base_url": base_url,
            "api_key": api_key,
            "sandbox": sandbox,
        }

    @classmethod
    def get_profile(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retrieves Xaviera Store user profile and wallet balance (GET /v1/me).
        Caches result in memory for 60 seconds to prevent unnecessary API hammering.
        """
        now = time.time()
        if not force_refresh and cls._profile_cache is not None:
            if now - cls._profile_cache_time < cls._CACHE_TTL_SECONDS:
                return cls._profile_cache

        creds = cls._get_api_credentials()
        api_key = creds["api_key"]
        base_url = creds["base_url"]
        sandbox = creds["sandbox"]

        if sandbox:
            result = {
                "connected": True,
                "balance": 2500000,
                "username": "Sandbox Developer",
                "email": "dev@asterra.store",
                "id": "usr_sandbox",
                "message": "Koneksi ke Xaviera Store API aktif (Sandbox Simulation Mode).",
                "environment": "sandbox",
            }
            cls._profile_cache = result
            cls._profile_cache_time = now
            return result

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
                # Expected format: { "id": "usr_xxxx", "name": "Budi", "email": "budi@example.com", "saldo": 1500000 }
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
        if creds["sandbox"]:
            return cls._get_mock_premium_products()

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
    def get_smm_services(cls) -> List[Dict[str, Any]]:
        """
        Fetches SMM (Social Media Marketing) services (GET /v1/smm/services).
        """
        creds = cls._get_api_credentials()
        if creds["sandbox"]:
            return cls._get_mock_smm_services()

        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return []

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{base_url}/smm/services", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("services", [])
        except Exception as e:
            print(f"[XavieraService] Error fetching SMM services: {e}")
        return []

    @classmethod
    def get_games(cls) -> List[Dict[str, Any]]:
        """
        Fetches available games list (GET /v1/games).
        """
        creds = cls._get_api_credentials()
        if creds["sandbox"]:
            return cls._get_mock_games()

        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return []

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{base_url}/games", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("games", [])
        except Exception as e:
            print(f"[XavieraService] Error fetching games: {e}")
        return []

    @classmethod
    def get_game_items(cls, brand: str) -> List[Dict[str, Any]]:
        """
        Fetches top-up items/denominations for a specific game (GET /v1/games/{brand}/items).
        """
        clean_brand = str(brand or "").strip()
        if not clean_brand:
            return []

        creds = cls._get_api_credentials()
        if creds["sandbox"]:
            return cls._get_mock_game_items(clean_brand)

        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return []

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
            with httpx.Client(timeout=15.0) as client:
                resp = client.get(f"{base_url}/games/{clean_brand}/items", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("items", [])
        except Exception as e:
            print(f"[XavieraService] Error fetching game items for {clean_brand}: {e}")
        return []

    @classmethod
    def fetch_live_services(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Fetches and aggregates all services across categories (Akun Premium, SMM, Games)
        into a unified structure for Asterra Store Admin Explorer and Catalog.
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

        # 1. Fetch Akun Premium
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

        # 2. Fetch Games & Items
        games = cls.get_games()
        for g in games:
            g_brand = g.get("brand", "")
            g_title = g.get("title", g_brand)
            items = cls.get_game_items(g_brand)
            for it in items:
                sku = it.get("sku", "")
                it_name = it.get("name", "")
                full_name = f"{g_title} - {it_name}"
                code = f"xvs-game:{g_brand}:{sku}"
                price_val = int(it.get("price", 0))
                raw_st = str(it.get("status", "available")).lower()
                status = "available" if raw_st in ["available", "active", "ready"] else "empty"
                normalized_services.append({
                    "id": code,
                    "code": code,
                    "name": full_name,
                    "brand": g_title,
                    "category": "Games",
                    "type": "Top Up Game",
                    "price": {"basic": price_val, "premium": price_val, "special": price_val},
                    "status": status,
                    "stock": 9999 if status == "available" else 0,
                    "gameBrand": g_brand,
                    "sku": sku,
                    "note": f"Game: {g_title} | SKU: {sku}",
                    "raw": it,
                })

        # 3. Fetch SMM Services
        smm_services = cls.get_smm_services()
        for smm in smm_services:
            srv_id = smm.get("service") or smm.get("id")
            s_name = smm.get("name", "")
            s_cat = smm.get("category", "SMM")
            code = f"xvs-smm:{srv_id}"
            rate = int(smm.get("rate", 0))
            min_q = smm.get("min", 1)
            max_q = smm.get("max", 10000)
            normalized_services.append({
                "id": code,
                "code": code,
                "name": s_name,
                "brand": s_cat,
                "category": s_cat,
                "type": "SMM",
                "price": {"basic": rate, "premium": rate, "special": rate},
                "status": "available",
                "stock": 99999,
                "serviceId": srv_id,
                "note": f"Min: {min_q} | Max: {max_q} | Rate/1k: Rp {rate:,}",
                "raw": smm,
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
        Autonomous stock sync worker.
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
            # Query all products configured with xaviera or legacy vip-reseller
            products = db.query(Product).filter(
                Product.provider.in_(["xaviera", "vip-reseller"]),
                Product.provider_code.isnot(None)
            ).all()

            for prod in products:
                code_key = str(prod.provider_code or "").strip().lower()
                matched = service_map.get(code_key)

                # If code is raw variant/product id without prefix, check partial match
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
                "message": f"Pengecekan stok Xaviera Store selesai. {checked_count} produk diperiksa, {updated_count} diperbarui.",
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
        Determines the required input target field and parameters for a digital product.
        Distinguishes between:
        - Akun Premium (Instant credentials return or Email destination)
        - Top Up Game (User ID + Server/Zone ID)
        - SMM (Link Target / Username)
        - Customer ID (PLN / Meter)
        """
        if target_type_override:
            t = target_type_override.strip().lower()
            if t in ["phone", "tel", "whatsapp", "nomor"]:
                return {
                    "type": "phone",
                    "label": "Nomor WhatsApp / HP Anda",
                    "placeholder": "Masukan Nomor (contoh: 081234567890)",
                    "helper": "Kredensial atau lisensi akan dikirimkan ke nomor ini.",
                    "requires_zone": False,
                    "zone_label": "",
                    "zone_placeholder": "",
                    "zone_helper": "",
                }
            elif t in ["game", "games", "game_id"]:
                return {
                    "type": "game",
                    "label": "User ID Game",
                    "placeholder": "contoh: 136216325",
                    "helper": "Masukan User ID game tujuan.",
                    "requires_zone": True,
                    "zone_label": "Server / Zone ID",
                    "zone_placeholder": "contoh: 2685",
                    "zone_helper": "Server atau Zone ID akun game Anda.",
                }
            elif t in ["target_url", "url", "link", "smm"]:
                return {
                    "type": "target_url",
                    "label": "Link Target / Username Akun",
                    "placeholder": "contoh: https://instagram.com/p/xxx atau @username",
                    "helper": "Masukkan URL postingan atau username target.",
                    "requires_zone": False,
                    "zone_label": "",
                    "zone_placeholder": "",
                    "zone_helper": "",
                }
            elif t in ["customer_id", "pelanggan", "id_pelanggan"]:
                return {
                    "type": "customer_id",
                    "label": "Nomor Pelanggan / No. Meter / SMC ID",
                    "placeholder": "contoh: 14205819230",
                    "helper": "Masukan nomor meter atau ID pelanggan tujuan.",
                    "requires_zone": False,
                    "zone_label": "",
                    "zone_placeholder": "",
                    "zone_helper": "",
                }

        combined = f"{product_name} {brand} {category} {provider_code}".lower().strip()

        # 1. SMM (Social Media Marketing) Targets
        smm_keywords = [
            "followers", "likes", "views", "subscribers", "smm", "instagram",
            "tiktok", "twitter", "retweet", "youtube views", "telegram member"
        ]
        if any(k in combined for k in smm_keywords) or "xvs-smm" in provider_code:
            return {
                "type": "target_url",
                "label": "Link Target / Username Akun",
                "placeholder": "contoh: https://instagram.com/username atau @username",
                "helper": "Masukkan link postingan, video, atau akun profil target sesuai pesanan.",
                "requires_zone": False,
                "zone_label": "",
                "zone_placeholder": "",
                "zone_helper": "",
            }

        # 2. Games with Server / Zone ID
        zone_game_keywords = [
            "mobile legends", "mlbb", "lifeafter", "ragnarok", "genshin", "honkai", "zenless", "point blank"
        ]
        if any(k in combined for k in zone_game_keywords):
            return {
                "type": "game",
                "label": "User ID Game",
                "placeholder": "contoh: 136216325",
                "helper": "Masukan User ID game tujuan.",
                "requires_zone": True,
                "zone_label": "Server / Zone ID",
                "zone_placeholder": "contoh: 2685",
                "zone_helper": "Server atau Zone ID akun game Anda.",
            }

        # 3. Games without Server / Zone ID
        no_zone_game_keywords = [
            "free fire", "ff", "valorant", "pubg", "codm", "call of duty",
            "honor of kings", "hok", "arena of valor", "aov", "roblox"
        ]
        if any(k in combined for k in no_zone_game_keywords) or "xvs-game" in provider_code:
            return {
                "type": "game",
                "label": "User ID Game",
                "placeholder": "contoh: 849201948",
                "helper": "Masukan User ID akun game Anda.",
                "requires_zone": False,
                "zone_label": "",
                "zone_placeholder": "",
                "zone_helper": "",
            }

        # 4. Phone number targets (Pulsa, Data/Kuota, E-Wallets)
        phone_keywords = [
            "pulsa", "telkomsel", "tsel", "indosat", "isat", "tri", "three",
            "xl", "axis", "smartfren", "dana", "gopay", "ovo", "shopeepay", "linkaja", "kuota"
        ]
        if any(k in combined for k in phone_keywords):
            return {
                "type": "phone",
                "label": "Nomor WhatsApp / HP Anda",
                "placeholder": "Masukan Nomor (contoh: 081234567890)",
                "helper": "Kredensial atau lisensi akan dikirimkan ke nomor ini.",
                "requires_zone": False,
                "zone_label": "",
                "zone_placeholder": "",
                "zone_helper": "",
            }

        # 5. Customer ID (PLN, PDAM)
        customer_id_keywords = ["pln", "token pln", "pdam", "bpjs"]
        if any(k in combined for k in customer_id_keywords):
            return {
                "type": "customer_id",
                "label": "Nomor Pelanggan / No. Meter",
                "placeholder": "contoh: 14205819230",
                "helper": "Masukan nomor meter atau ID pelanggan tujuan.",
                "requires_zone": False,
                "zone_label": "",
                "zone_placeholder": "",
                "zone_helper": "",
            }

        # 6. Default: Akun Premium (Email)
        return {
            "type": "email",
            "label": "Email Akun Tujuan Aktivasi",
            "placeholder": "contoh: akun_anda@gmail.com",
            "helper": "Kredensial atau akses akun premium akan dikirimkan langsung ke email ini.",
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
        Dispatches order dynamically to appropriate Xaviera Store endpoint:
        - POST /v1/products/order (Akun Premium)
        - POST /v1/games/order (Top Up Game)
        - POST /v1/smm/order (SMM)
        """
        creds = cls._get_api_credentials()
        base_url = creds["base_url"]
        api_key = creds["api_key"]
        sandbox = creds["sandbox"]

        clean_code = str(service_code or "").strip()
        clean_target = str(target_id or "").strip()
        clean_qty = max(1, int(qty or 1))

        if not clean_code:
            return {"success": False, "message": "Kode layanan (service_code) wajib diisi."}

        # 1. Sandbox Simulation Mode
        if sandbox:
            import random
            mock_time = int(time.time())
            if "xvs-game" in clean_code or "gm_" in clean_code:
                mock_trxid = f"gm_test_{mock_time}_{random.randint(100, 999)}"
                return {
                    "success": True,
                    "trxid": mock_trxid,
                    "status": "success",
                    "note": f"SN: MLBB-{random.randint(100000, 999999)} (Sandbox Game Order)",
                    "message": "Top up game simulasi berhasil.",
                    "credentials": None,
                    "raw": {"id": mock_trxid, "status": "SUCCESS"},
                }
            elif "xvs-smm" in clean_code or "smm_" in clean_code:
                mock_trxid = f"smm_test_{mock_time}_{random.randint(100, 999)}"
                return {
                    "success": True,
                    "trxid": mock_trxid,
                    "status": "processing",
                    "note": f"SMM Order #{mock_trxid} queued (Target: {clean_target})",
                    "message": "Pesanan SMM simulasi berhasil dibuat.",
                    "credentials": None,
                    "raw": {"id": mock_trxid, "status": "PENDING"},
                }
            else:
                mock_trxid = f"ord_test_{mock_time}_{random.randint(100, 999)}"
                mock_email = f"user_{mock_time}@account.test"
                mock_pass = f"Pass{random.randint(1000, 9999)}!"
                return {
                    "success": True,
                    "trxid": mock_trxid,
                    "status": "success",
                    "note": f"Email: {mock_email} | Password: {mock_pass}",
                    "message": "Pesanan akun premium simulasi berhasil dibuat dengan instan kredensial.",
                    "credentials": [{"email": mock_email, "password": mock_pass}],
                    "raw": {
                        "id": mock_trxid,
                        "status": "COMPLETED",
                        "credentials": [{"email": mock_email, "password": mock_pass}],
                    },
                }

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

        try:
            with httpx.Client(timeout=30.0) as client:
                # -------------------------------------------------------------
                # Case A: Top Up Game (xvs-game:brand:sku or brand|sku)
                # -------------------------------------------------------------
                if clean_code.startswith("xvs-game:") or ":sku:" in clean_code:
                    parts = clean_code.split(":")
                    brand = parts[1] if len(parts) > 1 else ""
                    sku = parts[2] if len(parts) > 2 else ""

                    payload = {
                        "brand": brand,
                        "sku": sku,
                        "customerNo": clean_target,
                    }
                    if zone_id:
                        payload["serverId"] = str(zone_id).strip()

                    resp = client.post(f"{base_url}/games/order", json=payload, headers=headers)
                    body = resp.json() if resp.status_code < 500 else {}

                    if resp.status_code not in [200, 201]:
                        err_msg = body.get("error", {}).get("message") or body.get("message") or f"HTTP {resp.status_code}"
                        return {"success": False, "message": f"Gagal order game: {err_msg}", "raw": body}

                    order_data = body.get("order", {})
                    trxid = order_data.get("id")
                    st = str(order_data.get("status", "PENDING")).upper()
                    sn = order_data.get("sn", "")
                    normalized_status = "success" if st in ["SUCCESS", "COMPLETED"] else "processing"

                    return {
                        "success": True,
                        "trxid": trxid,
                        "status": normalized_status,
                        "note": f"SN: {sn}" if sn else f"Status: {st}",
                        "message": "Pesanan game berhasil dikirim ke gateway Xaviera Store.",
                        "credentials": None,
                        "raw": order_data,
                    }

                # -------------------------------------------------------------
                # Case B: SMM (xvs-smm:serviceId)
                # -------------------------------------------------------------
                elif clean_code.startswith("xvs-smm:") or clean_code.isdigit():
                    service_id_raw = clean_code.replace("xvs-smm:", "").strip()
                    try:
                        service_id = int(service_id_raw)
                    except ValueError:
                        service_id = service_id_raw

                    payload = {
                        "serviceId": service_id,
                        "target": clean_target,
                        "qty": clean_qty,
                    }
                    if comments:
                        payload["comments"] = comments

                    resp = client.post(f"{base_url}/smm/order", json=payload, headers=headers)
                    body = resp.json() if resp.status_code < 500 else {}

                    if resp.status_code not in [200, 201]:
                        err_msg = body.get("error", {}).get("message") or body.get("message") or f"HTTP {resp.status_code}"
                        return {"success": False, "message": f"Gagal order SMM: {err_msg}", "raw": body}

                    order_data = body.get("order", {})
                    trxid = order_data.get("id")
                    st = str(order_data.get("status", "PENDING")).upper()
                    return {
                        "success": True,
                        "trxid": trxid,
                        "status": "processing",
                        "note": f"SMM Order #{trxid} (Status: {st})",
                        "message": "Pesanan SMM berhasil dibuat di Xaviera Store.",
                        "credentials": None,
                        "raw": order_data,
                    }

                # -------------------------------------------------------------
                # Case C: Akun Premium (xvs-prod:productId[:variantId] or raw)
                # -------------------------------------------------------------
                else:
                    prod_id = clean_code.replace("xvs-prod:", "")
                    var_id = variant_id
                    if ":" in prod_id:
                        parts = prod_id.split(":")
                        prod_id = parts[0]
                        var_id = parts[1]

                    payload = {
                        "productId": prod_id,
                        "qty": clean_qty,
                    }
                    if var_id:
                        payload["variantId"] = var_id

                    resp = client.post(f"{base_url}/products/order", json=payload, headers=headers)
                    body = resp.json() if resp.status_code < 500 else {}

                    if resp.status_code not in [200, 201]:
                        err_msg = body.get("error", {}).get("message") or body.get("message") or f"HTTP {resp.status_code}"
                        return {"success": False, "message": f"Gagal order akun premium: {err_msg}", "raw": body}

                    order_data = body.get("order", {})
                    trxid = order_data.get("id")
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
        Checks real-time status of an order from Xaviera Store:
        - GET /v1/orders/{id} (Premium)
        - GET /v1/games/order/{id} (Game)
        - GET /v1/smm/order/{id} (SMM)
        """
        clean_trxid = str(trxid or "").strip()
        if not clean_trxid:
            return {"success": False, "status": "error", "message": "ID transaksi (trxid) kosong."}

        creds = cls._get_api_credentials()
        if creds["sandbox"]:
            return {
                "success": True,
                "trxid": clean_trxid,
                "status": "success",
                "note": "Sandbox order status: SUCCESS",
                "message": "Status pesanan aktif (Sandbox).",
            }

        api_key = creds["api_key"]
        base_url = creds["base_url"]
        if not api_key:
            return {"success": False, "status": "error", "message": "API key Xaviera Store belum disetel."}

        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}

        # Determine target endpoint based on prefix or explicit category
        endpoint_candidates = []
        if clean_trxid.startswith("gm_") or category == "game":
            endpoint_candidates = [f"{base_url}/games/order/{clean_trxid}"]
        elif clean_trxid.startswith("smm_") or category == "smm":
            endpoint_candidates = [f"{base_url}/smm/order/{clean_trxid}"]
        elif clean_trxid.startswith("ord_") or category == "premium":
            endpoint_candidates = [f"{base_url}/orders/{clean_trxid}"]
        else:
            # Fallback probe order: Premium -> Games -> SMM
            endpoint_candidates = [
                f"{base_url}/orders/{clean_trxid}",
                f"{base_url}/games/order/{clean_trxid}",
                f"{base_url}/smm/order/{clean_trxid}",
            ]

        try:
            with httpx.Client(timeout=15.0) as client:
                for ep in endpoint_candidates:
                    resp = client.get(ep, headers=headers)
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

                        note = data.get("sn") or data.get("note") or ""
                        creds = data.get("credentials")
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
        Inspects order in database and executes automatic upstream fulfillment to Xaviera Store.
        If Xaviera returns instant credentials (e.g. for Akun Premium), this method immediately
        saves them to fulfillment_credentials and marks order as completed!
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

            # Identify items backed by Xaviera Store (accepts 'xaviera' or legacy 'vip-reseller')
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

                target_req = cls.get_product_target_requirement(
                    product_name=prod.name or getattr(item, "product_name", ""),
                    brand=prod.brand or "",
                    category=prod.category_name or "",
                    provider_code=prod.provider_code or "",
                )
                req_type = target_req.get("type", "email")

                item_target_id = getattr(item, "target_id", None) or ""
                item_target_zone = getattr(item, "target_zone", None) or ""
                item_target_phone = getattr(item, "target_phone", None) or ""
                item_target_email = getattr(item, "target_email", None) or ""

                target_id = ""
                target_zone = str(item_target_zone or "").strip()

                if req_type == "target_url":
                    target_id = (item_target_id or item_target_email or order.customer_email or "").strip()
                elif req_type == "phone":
                    target_id = (item_target_phone or item_target_id or order.customer_whatsapp or "").strip()
                elif req_type == "game":
                    target_id = (item_target_id or item_target_phone or item_target_email or "").strip()
                elif req_type == "customer_id":
                    target_id = (item_target_id or item_target_phone or "").strip()
                else:
                    target_id = (item_target_email or item_target_id or order.customer_email or "").strip()

                if not target_id:
                    target_id = (
                        item_target_id or item_target_email or item_target_phone or
                        order.customer_email or order.customer_whatsapp or ""
                    ).strip()

                if not target_zone and order.customer_notes and "zone:" in order.customer_notes.lower():
                    zm = re.search(r"zone[:\s]+([0-9a-zA-Z_-]+)", order.customer_notes, re.IGNORECASE)
                    if zm:
                        target_zone = zm.group(1).strip()

                # Process units for this item
                for unit_idx in range(item_qty):
                    res = cls.place_order(
                        service_code=prod.provider_code,
                        target_id=target_id,
                        zone_id=target_zone,
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

            # Summarize results into order record
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
                # If instant credentials returned or top up succeeded, complete the order
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

            # Record audit log
            action_name = "xaviera_order_placed" if all_success else ("xaviera_order_partial" if partial_success else "xaviera_order_failed")
            AuditLogService.record_log(
                order_id=order.id,
                actor="xaviera_store",
                action=action_name,
                previous_status="pending",
                new_status=order.status,
                notes=f"Xaviera batch: {successful_units}/{total_units} unit diproses. TRX: {order.provider_trxid or '-'}. {order.provider_note or ''}".strip(),
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
                    f"Seluruh {total_units} item Xaviera Store berhasil diproses otomatis."
                    if all_success
                    else f"Pemrosesan Xaviera Store: {successful_units} dari {total_units} unit berhasil diproses."
                ),
                "order": order.to_dict(),
            }

        finally:
            db.close()

    @classmethod
    def sync_order_live_status(cls, order_id: str) -> Dict[str, Any]:
        """
        Polls live status from Xaviera Store for an ongoing processing order.
        Updates order status, credentials, and note in database.
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
        """Xaviera Store uses pull-based status checking. Returns True for basic validity."""
        return True

    @classmethod
    def handle_webhook(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Webhook callback processor if Xaviera introduces webhook dispatch in future."""
        return {"result": True, "message": "Webhook diterima.", "data": payload}

    # -------------------------------------------------------------------------
    # Mock Data Generators for Sandbox Mode
    # -------------------------------------------------------------------------
    @classmethod
    def _get_mock_premium_products(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "p_netflix1",
                "name": "Netflix Premium UHD 4K",
                "category": "Streaming",
                "hasVariants": True,
                "price": 25000,
                "stock": 42,
                "variants": [
                    {"id": "v_net_1m", "name": "1 Bulan (1 Profil Private)", "price": 25000, "stock": 25},
                    {"id": "v_net_3m", "name": "3 Bulan (1 Profil Private)", "price": 72000, "stock": 17},
                ],
            },
            {
                "id": "p_spotify1",
                "name": "Spotify Premium Individual",
                "category": "Music",
                "hasVariants": False,
                "price": 18000,
                "stock": 50,
            },
            {
                "id": "p_canvapro",
                "name": "Canva Pro Anggota Tim",
                "category": "Design & Productivity",
                "hasVariants": False,
                "price": 9500,
                "stock": 100,
            },
            {
                "id": "p_geminipro",
                "name": "Google Gemini Advanced 2.0",
                "category": "Artificial Intelligence",
                "hasVariants": False,
                "price": 45000,
                "stock": 30,
            },
        ]

    @classmethod
    def _get_mock_smm_services(cls) -> List[Dict[str, Any]]:
        return [
            {
                "service": 101,
                "name": "Instagram Followers Indonesia [Real Aktif / Non-Drop]",
                "category": "Instagram Followers",
                "rate": 25000,
                "min": 100,
                "max": 10000,
                "refill": True,
            },
            {
                "service": 102,
                "name": "TikTok Video Likes [Instant / High Speed]",
                "category": "TikTok Likes",
                "rate": 8000,
                "min": 100,
                "max": 50000,
                "refill": False,
            },
        ]

    @classmethod
    def _get_mock_games(cls) -> List[Dict[str, Any]]:
        return [
            {"brand": "mobile-legends", "title": "Mobile Legends: Bang Bang", "category": "Games", "itemCount": 12},
            {"brand": "free-fire", "title": "Free Fire", "category": "Games", "itemCount": 8},
            {"brand": "valorant", "title": "Valorant Points", "category": "Games", "itemCount": 6},
        ]

    @classmethod
    def _get_mock_game_items(cls, brand: str) -> List[Dict[str, Any]]:
        if "mobile" in brand:
            return [
                {"sku": "ml_86_dm", "name": "86 Diamonds", "price": 19000, "status": "available"},
                {"sku": "ml_172_dm", "name": "172 Diamonds", "price": 38000, "status": "available"},
                {"sku": "ml_weekly_pass", "name": "Weekly Diamond Pass", "price": 27000, "status": "available"},
            ]
        return [
            {"sku": "generic_item_1", "name": "Standard Denomination 100 Units", "price": 15000, "status": "available"}
        ]
