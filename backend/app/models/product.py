from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True)
    card_id = Column(String, ForeignKey("product_cards.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)
    category_id = Column(String, nullable=False)
    category_name = Column(String, nullable=False)
    brand = Column(String, nullable=False, default="Digital")
    price = Column(Numeric(15, 2), nullable=False)
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
    provider_price = Column(Numeric(15, 2), nullable=True)
    provider_status = Column(String, nullable=True)
    last_provider_check = Column(DateTime, nullable=True)
    profit_margin = Column(Numeric(15, 2), nullable=True)
    profit_percentage = Column(Numeric(10, 2), nullable=True)

    guarantee_title = Column(String, nullable=True, default="Garansi Penuh")
    guarantee_desc = Column(String, nullable=True, default="Jaminan ganti akun 100%")
    process_title = Column(String, nullable=True, default="Proses Instan")
    process_desc = Column(String, nullable=True, default="1 - 15 menit selesai")
    privacy_title = Column(String, nullable=True, default="Akun Private")
    privacy_desc = Column(String, nullable=True, default="Ruang kerja aman & personal")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    card = relationship("ProductCard", back_populates="catalogs", foreign_keys=[card_id])
    attributes = relationship("ProductAttribute", back_populates="catalog", cascade="all, delete-orphan", foreign_keys="ProductAttribute.catalog_id")
    variants = relationship("ProductVariant", back_populates="catalog", cascade="all, delete-orphan", foreign_keys="ProductVariant.catalog_id")

    def to_dict(self):
        def _num(val):
            if val is None:
                return None
            try:
                f = float(val)
                return int(f) if f.is_integer() else f
            except (ValueError, TypeError):
                return val

        return {
            "id": self.id,
            "cardId": self.card_id,
            "cardName": self.card.name if self.card else None,
            "cardSlug": self.card.slug if self.card else None,
            "name": self.name,
            "category": {
                "id": self.category_id,
                "name": self.category_name,
            },
            "categoryId": self.category_id,
            "categoryName": self.category_name,
            "brand": self.brand,
            "price": _num(self.price),
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
            "providerPrice": _num(self.provider_price),
            "providerStatus": self.provider_status,
            "lastProviderCheck": self.last_provider_check.isoformat() if self.last_provider_check else None,
            "profitMargin": _num(self.profit_margin),
            "profitPercentage": _num(self.profit_percentage),
            "guaranteeTitle": self.guarantee_title,
            "guaranteeDesc": self.guarantee_desc,
            "processTitle": self.process_title,
            "processDesc": self.process_desc,
            "privacyTitle": self.privacy_title,
            "privacyDesc": self.privacy_desc,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
