import json
import pathlib
from typing import Dict, Any

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
PAYMENT_SETTINGS_FILE = DATA_DIR / "supabase-payment-settings.json"
LEGACY_CONFIG_FILE = DATA_DIR / "payment-config.json"

DEFAULT_CONFIG: Dict[str, Any] = {
    "mode": "manual",
    "bankName": "Bank Central Asia (BCA)",
    "bankAccountNumber": "8965123456",
    "bankAccountName": "Asterra Store Official",
    "qrisImageUrl": "https://panduan.bersama.co.id/QRIS/images/Qris.png",
    "qrisMerchantName": "ASTERRA STORE QRIS",
    "danaNumber": "081234567890",
    "danaAccountName": "Asterra Store",
    "confirmationWhatsapp": "6281234567890",
    "instructions": "Transfer sesuai nominal tepat hingga 3 digit kode unik terakhir untuk verifikasi instan mutasi.",
    "csEmail": "support@asterra.store",
    "csWhatsappNumbers": ["081234567890"],
    "enableUniqueCode": True,
    "orderExpiryHours": 24,
    "bank": {
        "name": "Bank Central Asia (BCA)",
        "account_number": "8965123456",
        "account_name": "Asterra Store Official",
    },
    "qris": {
        "image_url": "https://panduan.bersama.co.id/QRIS/images/Qris.png",
        "merchant_name": "ASTERRA STORE QRIS",
    },
    "dana": {
        "number": "081234567890",
        "account_name": "Asterra Store",
    },
    "manualAccounts": [
        {
            "id": "acc-bca",
            "bankName": "Bank Central Asia (BCA)",
            "accountNumber": "8965123456",
            "accountHolder": "Asterra Store Official",
            "isActive": True,
        },
        {
            "id": "acc-dana",
            "bankName": "E-Wallet DANA",
            "accountNumber": "081234567890",
            "accountHolder": "Asterra Store",
            "isActive": True,
        }
    ],
}

class PaymentConfigService:
    _config: Dict[str, Any] = DEFAULT_CONFIG

    @classmethod
    def get_config(cls) -> Dict[str, Any]:
        if PAYMENT_SETTINGS_FILE.exists():
            try:
                data = json.loads(PAYMENT_SETTINGS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list) and len(data) > 0:
                    cls._config = {**DEFAULT_CONFIG, **data[0]}
                elif isinstance(data, dict):
                    cls._config = {**DEFAULT_CONFIG, **data}
                return cls._config
            except Exception as e:
                print(f"[PaymentConfigService] Error reading supabase-payment-settings: {e}")

        if LEGACY_CONFIG_FILE.exists():
            try:
                data = json.loads(LEGACY_CONFIG_FILE.read_text(encoding="utf-8"))
                if isinstance(data, dict):
                    cls._config = {**DEFAULT_CONFIG, **data}
            except Exception:
                pass

        return cls._config

    @classmethod
    def update_config(cls, new_config: Dict[str, Any]) -> Dict[str, Any]:
        current = cls.get_config()
        updated = {**current, **new_config}
        cls._config = updated

        try:
            PAYMENT_SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
            PAYMENT_SETTINGS_FILE.write_text(json.dumps([updated], indent=2, ensure_ascii=False), encoding="utf-8")
            LEGACY_CONFIG_FILE.write_text(json.dumps(updated, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[PaymentConfigService] Failed to save config: {e}")

        return updated
