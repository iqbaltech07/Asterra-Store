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
