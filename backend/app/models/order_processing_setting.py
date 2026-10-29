from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.core.database import Base

class OrderProcessingSetting(Base):
    __tablename__ = "order_processing_settings"

    id = Column(String(50), primary_key=True, default="main")
    # 'manual' | 'automatic'
    order_mode = Column(String(20), default="manual", nullable=False)
    # Designated active reseller, e.g. 'vip-reseller'
    active_reseller = Column(String(50), default="vip-reseller", nullable=False)
    auto_fulfill_on_payment = Column(Boolean, default=True, nullable=False)
    notify_admin_on_manual_order = Column(Boolean, default=True, nullable=False)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "orderMode": self.order_mode,
            "order_mode": self.order_mode,
            "activeReseller": self.active_reseller,
            "active_reseller": self.active_reseller,
            "autoFulfillOnPayment": bool(self.auto_fulfill_on_payment),
            "auto_fulfill_on_payment": bool(self.auto_fulfill_on_payment),
            "notifyAdminOnManualOrder": bool(self.notify_admin_on_manual_order),
            "notify_admin_on_manual_order": bool(self.notify_admin_on_manual_order),
            "updatedBy": self.updated_by,
            "updated_by": self.updated_by,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class ResellerApiSetting(Base):
    __tablename__ = "reseller_api_settings"

    id = Column(String(50), primary_key=True)  # e.g. "vip-reseller"
    name = Column(String(100), nullable=False)
    base_url = Column(String(255), nullable=False)
    # Stored server-side only; never returned in cleartext to frontend
    api_key = Column(String(255), nullable=True)
    api_sign = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    # 'production' | 'sandbox'
    environment = Column(String(20), default="production", nullable=False)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_secrets: bool = False):
        data = {
            "id": self.id,
            "name": self.name,
            "baseUrl": self.base_url,
            "base_url": self.base_url,
            "isActive": bool(self.is_active),
            "is_active": bool(self.is_active),
            "environment": self.environment,
            "hasApiKey": bool(self.api_key),
            "has_api_key": bool(self.api_key),
            "hasApiSign": bool(self.api_sign),
            "has_api_sign": bool(self.api_sign),
            "updatedBy": self.updated_by,
            "updated_by": self.updated_by,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_secrets:
            data["apiKey"] = self.api_key
            data["api_key"] = self.api_key
            data["apiSign"] = self.api_sign
            data["api_sign"] = self.api_sign
        else:
            # Masked preview for security
            if self.api_key:
                clean_k = self.api_key.strip()
                masked_k = f"{clean_k[:4]}****{clean_k[-4:]}" if len(clean_k) > 8 else "****"
                data["maskedApiKey"] = masked_k
                data["masked_api_key"] = masked_k
            else:
                data["maskedApiKey"] = None
                data["masked_api_key"] = None

            if self.api_sign:
                clean_s = self.api_sign.strip()
                masked_s = f"{clean_s[:3]}****{clean_s[-3:]}" if len(clean_s) > 6 else "****"
                data["maskedApiSign"] = masked_s
                data["masked_api_sign"] = masked_s
            else:
                data["maskedApiSign"] = None
                data["masked_api_sign"] = None

        return data

