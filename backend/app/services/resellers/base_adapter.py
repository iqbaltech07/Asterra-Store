from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List

class BaseResellerAdapter(ABC):
    """
    Abstract interface for Reseller / Upstream Supplier integration.
    Guarantees consistent operational abstraction for account checks, order placement,
    status checking, and webhooks across different providers.
    """
    provider_id: str
    name: str

    @abstractmethod
    def test_connection(self) -> Dict[str, Any]:
        """
        Tests live API connectivity and credentials.
        Returns:
            {
                "success": bool,
                "connected": bool,
                "latency_ms": Optional[int],
                "balance": Optional[int],
                "username": Optional[str],
                "message": str
            }
        """
        pass

    @abstractmethod
    def get_profile(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Retrieves provider profile, credentials state, and wallet balance."""
        pass

    @abstractmethod
    def place_order(
        self,
        service_code: str,
        target_id: str,
        zone_id: str = "",
        additional_data: str = ""
    ) -> Dict[str, Any]:
        """
        Places a new order to upstream supplier.
        Returns normalized status:
            {
                "success": bool,
                "trxid": Optional[str],
                "status": "processing" | "waiting" | "success" | "error",
                "note": str,
                "message": str,
                "raw": Any
            }
        """
        pass

    @abstractmethod
    def check_status(self, trxid: str) -> Dict[str, Any]:
        """
        Checks real-time status of an existing external order.
        Returns:
            {
                "success": bool,
                "trxid": str,
                "status": "processing" | "waiting" | "success" | "error",
                "note": str,
                "message": str
            }
        """
        pass

    @abstractmethod
    def verify_webhook(self, signature: str, raw_body: bytes = b"", headers: Optional[Dict[str, str]] = None) -> bool:
        """Verifies signature or authentication of incoming webhook callbacks."""
        pass

    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        """
        Reports operational capabilities supported by this provider:
        - supports_balance: bool
        - supports_status_check: bool
        - supports_webhook: bool
        - supports_stock_sync: bool
        - is_production_ready: bool
        """
        pass

