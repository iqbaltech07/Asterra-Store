from typing import Dict, Any
from app.core.database import SessionLocal
from app.models.payment_setting import PaymentSetting

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
    "isBankActive": True,
    "isQrisActive": True,
    "isDanaActive": True,
    "is_bank_active": True,
    "is_qris_active": True,
    "is_dana_active": True,
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
        raw_data: Dict[str, Any] = {}
        try:
            db = SessionLocal()
            try:
                setting = db.query(PaymentSetting).first()
                if setting:
                    raw_data = setting.to_dict()
            finally:
                db.close()
        except Exception as e:
            print(f"[PaymentConfigService] Warning: Supabase query failed: {e}")

        merged = {**DEFAULT_CONFIG, **raw_data}

        # Resolve field values with fallback
        mode = str(merged.get("mode", "manual")).lower()
        bank_name = merged.get("bankName") or merged.get("bank_name") or "Bank Central Asia (BCA)"
        bank_acc = merged.get("bankAccountNumber") or merged.get("bank_account_number") or "8965123456"
        bank_holder = merged.get("bankAccountName") or merged.get("bank_account_name") or "Asterra Store Official"

        qris_url = merged.get("qrisImageUrl") or merged.get("qris_image_url") or DEFAULT_CONFIG["qris"]["image_url"]
        qris_merchant = merged.get("qrisMerchantName") or merged.get("qris_merchant_name") or DEFAULT_CONFIG["qris"]["merchant_name"]

        dana_num = merged.get("danaNumber") or merged.get("dana_number") or "081234567890"
        dana_acc = merged.get("danaAccountName") or merged.get("dana_account_name") or "Asterra Store"

        conf_wa = merged.get("confirmationWhatsapp") or merged.get("confirmation_whatsapp") or "6281234567890"
        instructions = merged.get("instructions") or DEFAULT_CONFIG["instructions"]

        # Support boolean enableUniqueCode / enable_unique_code
        enable_unique = merged.get("enableUniqueCode")
        if enable_unique is None:
            enable_unique = merged.get("enable_unique_code", True)
        enable_unique = bool(enable_unique)

        # Support active toggles for payment channels (BCA, QRIS, DANA)
        is_bank_active = merged.get("isBankActive")
        if is_bank_active is None:
            is_bank_active = merged.get("is_bank_active", True)
        is_bank_active = bool(is_bank_active)

        is_qris_active = merged.get("isQrisActive")
        if is_qris_active is None:
            is_qris_active = merged.get("is_qris_active", True)
        is_qris_active = bool(is_qris_active)

        is_dana_active = merged.get("isDanaActive")
        if is_dana_active is None:
            is_dana_active = merged.get("is_dana_active", True)
        is_dana_active = bool(is_dana_active)

        expiry_hrs = merged.get("orderExpiryHours")
        if expiry_hrs is None:
            expiry_hrs = merged.get("order_expiry_hours", 24)
        expiry_hrs = int(expiry_hrs)

        cs_email = merged.get("csEmail") or merged.get("cs_email") or "support@asterra.store"
        cs_wa = merged.get("csWhatsappNumbers") or merged.get("cs_whatsapp_numbers") or [conf_wa]
        if isinstance(cs_wa, str):
            cs_wa = [cs_wa]

        cls._config = {
            "mode": mode,
            # Channel Active Status
            "isBankActive": is_bank_active,
            "isQrisActive": is_qris_active,
            "isDanaActive": is_dana_active,
            "is_bank_active": is_bank_active,
            "is_qris_active": is_qris_active,
            "is_dana_active": is_dana_active,
            # CamelCase
            "bankName": bank_name,
            "bankAccountNumber": bank_acc,
            "bankAccountName": bank_holder,
            "qrisImageUrl": qris_url,
            "qrisMerchantName": qris_merchant,
            "danaNumber": dana_num,
            "danaAccountName": dana_acc,
            "confirmationWhatsapp": conf_wa,
            "instructions": instructions,
            "enableUniqueCode": enable_unique,
            "orderExpiryHours": expiry_hrs,
            "csEmail": cs_email,
            "csWhatsappNumbers": cs_wa,
            # Snake_case (for PublicPaymentConfig)
            "bank_name": bank_name,
            "bank_account_number": bank_acc,
            "bank_account_name": bank_holder,
            "qris_image_url": qris_url,
            "qris_merchant_name": qris_merchant,
            "dana_number": dana_num,
            "dana_account_name": dana_acc,
            "confirmation_whatsapp": conf_wa,
            "enable_unique_code": enable_unique,
            "order_expiry_hours": expiry_hrs,
            "cs_email": cs_email,
            "cs_whatsapp_numbers": cs_wa,
            # Structured objects
            "bank": {
                "name": bank_name,
                "account_number": bank_acc,
                "account_name": bank_holder,
                "is_active": is_bank_active,
            },
            "qris": {
                "image_url": qris_url,
                "merchant_name": qris_merchant,
                "is_active": is_qris_active,
            },
            "dana": {
                "number": dana_num,
                "account_name": dana_acc,
                "is_active": is_dana_active,
            },
            "manualAccounts": merged.get("manualAccounts", DEFAULT_CONFIG["manualAccounts"]),
        }
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
                if "isBankActive" in payload or "is_bank_active" in payload:
                    val = payload.get("isBankActive") if "isBankActive" in payload else payload.get("is_bank_active")
                    setting.is_bank_active = bool(val)
                if "isQrisActive" in payload or "is_qris_active" in payload:
                    val = payload.get("isQrisActive") if "isQrisActive" in payload else payload.get("is_qris_active")
                    setting.is_qris_active = bool(val)
                if "isDanaActive" in payload or "is_dana_active" in payload:
                    val = payload.get("isDanaActive") if "isDanaActive" in payload else payload.get("is_dana_active")
                    setting.is_dana_active = bool(val)
                if "bankName" in payload or "bank_name" in payload:
                    setting.bank_name = payload.get("bankName") or payload.get("bank_name")
                if "bankAccountNumber" in payload or "bank_account_number" in payload:
                    setting.bank_account_number = payload.get("bankAccountNumber") or payload.get("bank_account_number")
                if "bankAccountName" in payload or "bank_account_name" in payload:
                    setting.bank_account_name = payload.get("bankAccountName") or payload.get("bank_account_name")
                if "qrisImageUrl" in payload or "qris_image_url" in payload:
                    setting.qris_image_url = payload.get("qrisImageUrl") or payload.get("qris_image_url")
                if "qrisMerchantName" in payload or "qris_merchant_name" in payload:
                    setting.qris_merchant_name = payload.get("qrisMerchantName") or payload.get("qris_merchant_name")
                if "danaNumber" in payload or "dana_number" in payload:
                    setting.dana_number = payload.get("danaNumber") or payload.get("dana_number")
                if "danaAccountName" in payload or "dana_account_name" in payload:
                    setting.dana_account_name = payload.get("danaAccountName") or payload.get("dana_account_name")
                if "confirmationWhatsapp" in payload or "confirmation_whatsapp" in payload:
                    setting.confirmation_whatsapp = payload.get("confirmationWhatsapp") or payload.get("confirmation_whatsapp")
                if "instructions" in payload:
                    setting.instructions = payload["instructions"]
                if "enableUniqueCode" in payload or "enable_unique_code" in payload:
                    val = payload.get("enableUniqueCode") if "enableUniqueCode" in payload else payload.get("enable_unique_code")
                    setting.enable_unique_code = bool(val)
                if "orderExpiryHours" in payload or "order_expiry_hours" in payload:
                    val = payload.get("orderExpiryHours") if "orderExpiryHours" in payload else payload.get("order_expiry_hours")
                    setting.order_expiry_hours = int(val)
                if "csEmail" in payload or "cs_email" in payload:
                    setting.cs_email = payload.get("csEmail") or payload.get("cs_email")
                if "csWhatsappNumbers" in payload or "cs_whatsapp_numbers" in payload:
                    setting.cs_whatsapp_numbers = payload.get("csWhatsappNumbers") or payload.get("cs_whatsapp_numbers")

                db.commit()
                db.refresh(setting)
            finally:
                db.close()
        except Exception as e:
            print(f"[PaymentConfigService] Error updating in Supabase: {e}")

        # Update local cache
        cls.get_config()
        # Merge updated payload into config
        for k, v in payload.items():
            cls._config[k] = v

        return cls._config
