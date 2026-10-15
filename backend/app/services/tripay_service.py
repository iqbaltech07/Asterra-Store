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
    def verify_callback_signature(raw_body: bytes, received_signature: str) -> bool:
        private_key = settings.TRIPAY_PRIVATE_KEY
        if not private_key or not received_signature:
            return False
        expected_sig = hmac.new(
            private_key.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected_sig, received_signature)
