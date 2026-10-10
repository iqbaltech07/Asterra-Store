from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.core.database import Base

class PromoCode(Base):
    __tablename__ = "promo_codes"

    id = Column(String, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    discount_type = Column(String, default="fixed")  # 'fixed' | 'percentage'
    discount_value = Column(Integer, default=0)
    max_discount = Column(Integer, nullable=True)
    min_order_amount = Column(Integer, default=0)
    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)
    per_user_limit = Column(Integer, default=1)
    start_date = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "code": self.code,
            "description": self.description,
            "discountType": self.discount_type,
            "discountValue": self.discount_value,
            "maxDiscount": self.max_discount,
            "minOrderAmount": self.min_order_amount,
            "usageLimit": self.usage_limit,
            "usedCount": self.used_count,
            "perUserLimit": self.per_user_limit,
            "startDate": self.start_date.isoformat() if self.start_date else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
