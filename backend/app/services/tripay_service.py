import hmac
import hashlib
from typing import Dict, Any, Optional
from app.config import settings

class TripayService:
    @staticmethod
    def generate_signature(merchant_ref: str, amount: int) -> str:
        private_key = settings.TRIPAY_PRIVATE_KEY
        merchant_code = settings.TRIPAY_MERCHANT_CODE
        payload = f"{merchant_code}{merchant_ref}{amount}"
        signature = hmac.new(
            private_key.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return signature

    @staticmethod
    def verify_callback_signature(callback_json: Dict[str, Any], received_signature: str) -> bool:
        private_key = settings.TRIPAY_PRIVATE_KEY
        # Recreate HMAC from raw callback body
        merchant_ref = callback_json.get("merchant_ref", "")
        amount = callback_json.get("total_amount", 0)
        expected_sig = TripayService.generate_signature(merchant_ref, amount)
        return hmac.compare_digest(expected_sig, received_signature)
