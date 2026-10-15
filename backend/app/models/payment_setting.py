from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import ARRAY
from app.core.database import Base

class PaymentSetting(Base):
    __tablename__ = "payment_settings"

    id = Column(String, primary_key=True)
    mode = Column(String, default="MANUAL")
    bank_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_account_name = Column(String, nullable=True)
    qris_image_url = Column(Text, nullable=True)
    qris_merchant_name = Column(String, nullable=True)
    dana_number = Column(String, nullable=True)
    dana_account_name = Column(String, nullable=True)
    confirmation_whatsapp = Column(String, nullable=True)
    instructions = Column(Text, nullable=True)
    enable_unique_code = Column(Boolean, default=True)
    order_expiry_hours = Column(Integer, default=24)
    is_bank_active = Column(Boolean, default=True)
    is_qris_active = Column(Boolean, default=True)
    is_dana_active = Column(Boolean, default=True)
    cs_email = Column(String, nullable=True)
    cs_whatsapp_numbers = Column(ARRAY(String), default=[])
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "mode": self.mode,
            "bankName": self.bank_name,
            "bankAccountNumber": self.bank_account_number,
            "bankAccountName": self.bank_account_name,
            "isBankActive": True if self.is_bank_active is None else self.is_bank_active,
            "isQrisActive": True if self.is_qris_active is None else self.is_qris_active,
            "isDanaActive": True if self.is_dana_active is None else self.is_dana_active,
            "is_bank_active": True if self.is_bank_active is None else self.is_bank_active,
            "is_qris_active": True if self.is_qris_active is None else self.is_qris_active,
            "is_dana_active": True if self.is_dana_active is None else self.is_dana_active,
            "qrisImageUrl": self.qris_image_url,
            "qrisMerchantName": self.qris_merchant_name,
            "danaNumber": self.dana_number,
            "danaAccountName": self.dana_account_name,
            "confirmationWhatsapp": self.confirmation_whatsapp,
            "instructions": self.instructions,
            "enableUniqueCode": self.enable_unique_code,
            "orderExpiryHours": self.order_expiry_hours,
            "csEmail": self.cs_email,
            "csWhatsappNumbers": list(self.cs_whatsapp_numbers) if self.cs_whatsapp_numbers else [],
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
