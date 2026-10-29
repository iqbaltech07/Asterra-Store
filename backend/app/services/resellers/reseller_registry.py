from typing import Dict, Any, List, Optional
from app.services.resellers.base_adapter import BaseResellerAdapter
from app.services.resellers.vip_adapter import VipResellerAdapter

class ResellerRegistry:
    """
    Central registry for upstream reseller/supplier adapters.
    Distinguishes strictly between production-ready adapters and unsupported providers.
    """
    _adapters: Dict[str, BaseResellerAdapter] = {
        "vip-reseller": VipResellerAdapter(),
    }

    # Prospective or unintegrated providers (explicitly prevented from production fulfillment)
    _unsupported_providers: Dict[str, Dict[str, Any]] = {
        "internal-manual": {
            "id": "internal-manual",
            "name": "Asterra Internal Vault (Private Accounts)",
            "is_production_ready": True,
            "readiness": "ready",
            "type": "Direct Fulfillment / Manual Dispatch",
            "notes": "Pemenuhan in-house / akun inventaris Asterra Store tanpa API pihak ketiga.",
        }
    }

    @classmethod
    def get_adapter(cls, provider_id: str) -> Optional[BaseResellerAdapter]:
        clean_id = (provider_id or "").strip().lower()
        return cls._adapters.get(clean_id)

    @classmethod
    def is_supported(cls, provider_id: str) -> bool:
        clean_id = (provider_id or "").strip().lower()
        adapter = cls.get_adapter(clean_id)
        if adapter is not None:
            return bool(adapter.get_capabilities().get("is_production_ready", False))
        return False

    @classmethod
    def list_all_providers(cls) -> List[Dict[str, Any]]:
        providers = []
        for pid, adapter in cls._adapters.items():
            caps = adapter.get_capabilities()
            profile = adapter.get_profile(force_refresh=False)
            providers.append({
                "id": pid,
                "name": adapter.name,
                "isSupported": True,
                "is_supported": True,
                "isProductionReady": caps.get("is_production_ready", False),
                "is_production_ready": caps.get("is_production_ready", False),
                "readiness": "ready" if caps.get("is_production_ready") else "unsupported",
                "capabilities": caps,
                "isConnected": bool(profile.get("connected")),
                "is_connected": bool(profile.get("connected")),
                "balance": profile.get("balance"),
                "username": profile.get("username"),
                "notes": caps.get("notes", ""),
            })

        for pid, info in cls._unsupported_providers.items():
            providers.append({
                "id": pid,
                "name": info["name"],
                "isSupported": info.get("is_production_ready", False),
                "is_supported": info.get("is_production_ready", False),
                "isProductionReady": info.get("is_production_ready", False),
                "is_production_ready": info.get("is_production_ready", False),
                "readiness": info.get("readiness", "unsupported"),
                "capabilities": {
                    "supports_balance": False,
                    "supports_status_check": False,
                    "supports_webhook": False,
                    "supports_stock_sync": False,
                    "is_production_ready": info.get("is_production_ready", False),
                },
                "isConnected": True,
                "is_connected": True,
                "balance": None,
                "username": None,
                "notes": info.get("notes", ""),
            })

        return providers

