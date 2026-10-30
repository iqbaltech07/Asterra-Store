from datetime import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(String(100), primary_key=True)
    card_id = Column(String(100), ForeignKey("product_cards.id", ondelete="CASCADE"), nullable=True, index=True)
    catalog_id = Column(String(100), ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    display_order = Column(Integer, default=0, nullable=False)
    is_required = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    options = Column(Text, default="[]", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    card = relationship("ProductCard", back_populates="attributes", foreign_keys=[card_id])
    catalog = relationship("Product", back_populates="attributes", foreign_keys=[catalog_id])

    def to_dict(self) -> Dict[str, Any]:
        try:
            opts = json.loads(self.options) if self.options else []
        except Exception:
            opts = [o.strip() for o in (self.options or "").split(",") if o.strip()]

        return {
            "id": self.id,
            "cardId": self.card_id,
            "catalogId": self.catalog_id,
            "name": self.name,
            "displayOrder": self.display_order,
            "isRequired": self.is_required,
            "isActive": self.is_active,
            "options": opts,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(String(100), primary_key=True)
    card_id = Column(String(100), ForeignKey("product_cards.id", ondelete="CASCADE"), nullable=True, index=True)
    catalog_id = Column(String(100), ForeignKey("products.id", ondelete="CASCADE"), nullable=True, index=True)
    sku = Column(String(100), nullable=True)
    combination = Column(Text, default="{}", nullable=False)
    price = Column(Integer, nullable=False)
    price_formatted = Column(String(100), nullable=True)
    stock = Column(Integer, default=100, nullable=False)
    status = Column(String(50), default="active", nullable=False)  # 'active' | 'inactive' | 'archived'

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    card = relationship("ProductCard", back_populates="variants", foreign_keys=[card_id])
    catalog = relationship("Product", back_populates="variants", foreign_keys=[catalog_id])

    def to_dict(self) -> Dict[str, Any]:
        try:
            combo = json.loads(self.combination) if self.combination else {}
        except Exception:
            combo = {}

        return {
            "id": self.id,
            "cardId": self.card_id,
            "catalogId": self.catalog_id,
            "sku": self.sku,
            "combination": combo,
            "price": self.price,
            "priceFormatted": self.price_formatted or f"Rp {self.price:,.0f}".replace(",", "."),
            "stock": self.stock,
            "status": self.status,
            "isOutOfStock": self.stock <= 0 or self.status != "active",
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
