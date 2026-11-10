import time
from typing import Dict, Any, Optional
from app.services.resellers.base_adapter import BaseResellerAdapter
from app.services.xaviera_service import XavieraService

class XavieraAdapter(BaseResellerAdapter):
    """
    Adapter for Xaviera Store Upstream Supplier.
    Official Documentation: https://xavierastore.com/api-docs.html
    """
    provider_id = "xaviera"
    name = "Xaviera Store API Gateway"

    def test_connection(self) -> Dict[str, Any]:
        start = time.perf_counter()
        profile = XavieraService.get_profile(force_refresh=True)
        latency = int((time.perf_counter() - start) * 1000)

        connected = bool(profile.get("connected"))
        return {
            "success": connected,
            "connected": connected,
            "latency_ms": latency if connected else None,
            "balance": profile.get("balance"),
            "username": profile.get("username"),
            "message": profile.get("message") or ("Koneksi aktif." if connected else "Gagal terhubung ke Xaviera Store."),
            "environment": profile.get("environment", "production"),
        }

    def get_profile(self, force_refresh: bool = False) -> Dict[str, Any]:
        return XavieraService.get_profile(force_refresh=force_refresh)

    def place_order(
        self,
        service_code: str,
        target_id: str,
        zone_id: str = "",
        additional_data: str = ""
    ) -> Dict[str, Any]:
        return XavieraService.place_order(
            service_code=service_code,
            target_id=target_id,
            zone_id=zone_id,
            additional_data=additional_data,
        )

    def check_status(self, trxid: str) -> Dict[str, Any]:
        return XavieraService.check_order_status(trxid=trxid)

    def verify_webhook(self, signature: str, raw_body: bytes = b"", headers: Optional[Dict[str, str]] = None) -> bool:
        return XavieraService.verify_webhook_signature(signature=signature)

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "supports_balance": True,
            "supports_status_check": True,
            "supports_webhook": False, # Xaviera uses pull status check
            "supports_stock_sync": True,
            "is_production_ready": True,
            "documentation": "https://xavierastore.com/api-docs.html",
            "notes": "Integrasi resmi Xaviera Store API Gateway (Akun Premium, Game, & SMM) aktif dan teruji.",
        }

# Alias for backwards compatibility
VipResellerAdapter = XavieraAdapter
