import json
import pathlib
from typing import Dict, Any
from app.core.database import SessionLocal
from app.models.payment_setting import PaymentSetting

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
        """
        Loads payment settings directly from Supabase payment_settings table.
        Falls back to local file if offline.
        """
        try:
            db = SessionLocal()
            try:
                setting = db.query(PaymentSetting).first()
                if setting:
                    data = setting.to_dict()
                    cls._config = {
                        **DEFAULT_CONFIG,
                        **data,
                        "bank": {
                            "name": data.get("bankName") or "Bank Central Asia (BCA)",
                            "account_number": data.get("bankAccountNumber") or "8965123456",
                            "account_name": data.get("bankAccountName") or "Asterra Store Official",
                        },
                        "qris": {
                            "image_url": data.get("qrisImageUrl") or DEFAULT_CONFIG["qris"]["image_url"],
                            "merchant_name": data.get("qrisMerchantName") or DEFAULT_CONFIG["qris"]["merchant_name"],
                        },
                        "dana": {
                            "number": data.get("danaNumber") or "081234567890",
                            "account_name": data.get("danaAccountName") or "Asterra Store",
                        },
                    }
                    return cls._config
            finally:
                db.close()
        except Exception as e:
            print(f"[PaymentConfigService] Warning: Supabase query failed: {e}")

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

        return cls._config

    @classmethod
    def update_config(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        try:
            db = SessionLocal()
            try:
                setting = db.query(PaymentSetting).first()
                if not setting:
                    setting = PaymentSetting(id="pay-cfg-default")
                    db.add(setting)

                if "mode" in payload: setting.mode = payload["mode"]
                if "bankName" in payload: setting.bank_name = payload["bankName"]
                if "bankAccountNumber" in payload: setting.bank_account_number = payload["bankAccountNumber"]
                if "bankAccountName" in payload: setting.bank_account_name = payload["bankAccountName"]
                if "qrisImageUrl" in payload: setting.qris_image_url = payload["qrisImageUrl"]
                if "qrisMerchantName" in payload: setting.qris_merchant_name = payload["qrisMerchantName"]
                if "danaNumber" in payload: setting.dana_number = payload["danaNumber"]
                if "danaAccountName" in payload: setting.dana_account_name = payload["danaAccountName"]
                if "confirmationWhatsapp" in payload: setting.confirmation_whatsapp = payload["confirmationWhatsapp"]
                if "instructions" in payload: setting.instructions = payload["instructions"]
                if "enableUniqueCode" in payload: setting.enable_unique_code = bool(payload["enableUniqueCode"])
                if "orderExpiryHours" in payload: setting.order_expiry_hours = int(payload["orderExpiryHours"])
                if "csEmail" in payload: setting.cs_email = payload["csEmail"]
                if "csWhatsappNumbers" in payload: setting.cs_whatsapp_numbers = payload["csWhatsappNumbers"]

                db.commit()
                db.refresh(setting)
            finally:
                db.close()
        except Exception as e:
            print(f"[PaymentConfigService] Error updating in Supabase: {e}")

        # Update local cache
        cls.get_config()
        try:
            PAYMENT_SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
            PAYMENT_SETTINGS_FILE.write_text(json.dumps([cls._config], indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception:
            pass

        return cls._config
