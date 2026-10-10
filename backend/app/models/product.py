from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import ARRAY
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category_id = Column(String, nullable=False)
    category_name = Column(String, nullable=False)
    brand = Column(String, nullable=False, default="Digital")
    price = Column(Integer, nullable=False)
    price_formatted = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    features = Column(ARRAY(String), default=[])
    status = Column(String, default="active")  # 'active' | 'archived'
    stock = Column(Integer, default=100)
    image_url = Column(Text, nullable=True)
    popular = Column(Boolean, default=False)
    provider = Column(String, default="vip-reseller")
    provider_code = Column(String, nullable=True)
    provider_name = Column(String, nullable=True)
    provider_price = Column(Integer, nullable=True)
    provider_status = Column(String, nullable=True)
    last_provider_check = Column(DateTime, nullable=True)
    profit_margin = Column(Integer, nullable=True)
    profit_percentage = Column(Integer, nullable=True)

    guarantee_title = Column(String, nullable=True, default="Garansi Penuh")
    guarantee_desc = Column(String, nullable=True, default="Jaminan ganti akun 100%")
    process_title = Column(String, nullable=True, default="Proses Instan")
    process_desc = Column(String, nullable=True, default="1 - 15 menit selesai")
    privacy_title = Column(String, nullable=True, default="Akun Private")
    privacy_desc = Column(String, nullable=True, default="Ruang kerja aman & personal")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": {
                "id": self.category_id,
                "name": self.category_name,
            },
            "categoryId": self.category_id,
            "categoryName": self.category_name,
            "brand": self.brand,
            "price": self.price,
            "priceFormatted": self.price_formatted,
            "description": self.description,
            "features": list(self.features) if self.features else [],
            "status": self.status,
            "stock": self.stock,
            "imageUrl": self.image_url,
            "popular": self.popular,
            "provider": self.provider,
            "providerCode": self.provider_code,
            "providerName": self.provider_name,
            "providerPrice": self.provider_price,
            "providerStatus": self.provider_status,
            "lastProviderCheck": self.last_provider_check.isoformat() if self.last_provider_check else None,
            "profitMargin": self.profit_margin,
            "profitPercentage": self.profit_percentage,
            "guaranteeTitle": self.guarantee_title,
            "guaranteeDesc": self.guarantee_desc,
            "processTitle": self.process_title,
            "processDesc": self.process_desc,
            "privacyTitle": self.privacy_title,
            "privacyDesc": self.privacy_desc,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
