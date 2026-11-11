"""
Deprecated VIP Reseller Service module.
All operations have been migrated to Xaviera Store API Gateway (XavieraService).
Documentation: https://xavierastore.com/api-docs.html
"""
from typing import Dict, Any, Optional, List
from app.services.xaviera_service import XavieraService

class VipService:
    """
    Compatibility proxy forwarding legacy VIP Reseller calls to XavieraService.
    """
    @classmethod
    def get_profile(cls, force_refresh: bool = False) -> Dict[str, Any]:
        return XavieraService.get_profile(force_refresh=force_refresh)

    @classmethod
    def fetch_live_services(cls, force_refresh: bool = False) -> Dict[str, Any]:
        return XavieraService.fetch_live_services(force_refresh=force_refresh)

    @classmethod
    def check_stock(cls) -> Dict[str, Any]:
        return XavieraService.check_stock()

    @classmethod
    def sync_vip_services(cls) -> Dict[str, Any]:
        res = XavieraService.fetch_live_services(force_refresh=True)
        return {
            "success": res.get("success", True),
            "message": f"Sinkronisasi Xaviera Store selesai. Total {res.get('total', 0)} layanan termuat.",
            "total": res.get("total", 0),
        }

    @classmethod
    def verify_webhook_signature(cls, signature: Optional[str]) -> bool:
        return XavieraService.verify_webhook_signature(signature)

    @classmethod
    def get_product_target_requirement(
        cls,
        product_name: str = "",
        brand: str = "",
        category: str = "",
        provider_code: str = "",
        target_type_override: Optional[str] = None
    ) -> Dict[str, Any]:
        return XavieraService.get_product_target_requirement(
            product_name=product_name,
            brand=brand,
            category=category,
            provider_code=provider_code,
            target_type_override=target_type_override,
        )

    @classmethod
    def place_order(
        cls,
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

    @classmethod
    def check_order_status(cls, trxid: str) -> Dict[str, Any]:
        return XavieraService.check_order_status(trxid=trxid)

    @classmethod
    def fulfill_order_if_vip(cls, order_id: str) -> Dict[str, Any]:
        return XavieraService.fulfill_order_if_xaviera(order_id=order_id)

    @classmethod
    def sync_order_live_status(cls, order_id: str) -> Dict[str, Any]:
        return XavieraService.sync_order_live_status(order_id=order_id)

    @classmethod
    def handle_webhook(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        return XavieraService.handle_webhook(payload=payload)
