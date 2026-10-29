from datetime import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class ProductCard(Base):
    __tablename__ = "product_cards"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    logo_url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    category_id = Column(String(100), nullable=True)
    category_name = Column(String(100), nullable=True)
    status = Column(String(50), default="active", nullable=False)  # 'active' | 'archived' | 'inactive'
    display_order = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    sections = Column(Text, default='["promo"]')  # JSON list of section keys e.g. ["promo", "terlaris", "terbaru"]
    rating = Column(String(10), default="5.0", nullable=False)
    badge_label = Column(String(100), nullable=True)
    base_sold_count = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    catalogs = relationship("Product", back_populates="card", foreign_keys="Product.card_id")
    attributes = relationship("ProductAttribute", back_populates="card", cascade="all, delete-orphan", foreign_keys="ProductAttribute.card_id")
    variants = relationship("ProductVariant", back_populates="card", cascade="all, delete-orphan", foreign_keys="ProductVariant.card_id")

    def to_dict(self, include_catalogs: bool = False, sold_count: int = 0) -> Dict[str, Any]:
        try:
            sec_list = json.loads(self.sections) if self.sections else ["promo"]
        except Exception:
            sec_list = [s.strip() for s in (self.sections or "promo").split(",") if s.strip()]

        # Filter active catalogs
        active_catalogs = [c for c in (self.catalogs or []) if getattr(c, "status", "active") == "active"]
        prices = [int(c.price) for c in active_catalogs if getattr(c, "price", 0) and int(c.price) > 0]
        min_price = min(prices) if prices else 0

        # Stock status rule:
        # If card is not active/archived -> not available for new purchase
        # If >= 1 active catalog has stock > 0 and provider_status != 'empty' -> 'ready', else 'out_of_stock'
        has_ready_stock = False
        if self.status == "active":
            for c in active_catalogs:
                is_zero_stock = getattr(c, "stock", None) is not None and c.stock <= 0
                is_empty = getattr(c, "provider_status", None) == "empty"
                is_unavail = getattr(c, "status", "active") != "active"
                if not is_zero_stock and not is_empty and not is_unavail:
                    has_ready_stock = True
                    break

        stock_status = "ready" if (self.status == "active" and active_catalogs and has_ready_stock) else "out_of_stock"
        total_sold = int((self.base_sold_count or 0) + sold_count)

        res = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "logoUrl": self.logo_url,
            "imageUrl": self.logo_url,
            "description": self.description,
            "categoryId": self.category_id or "cat-digital",
            "categoryName": self.category_name or "Layanan Digital",
            "category": {
                "id": self.category_id or "cat-digital",
                "name": self.category_name or "Layanan Digital",
            },
            "status": self.status,
            "displayOrder": self.display_order,
            "isFeatured": self.is_featured,
            "sections": sec_list,
            "rating": self.rating or "5.0",
            "badgeLabel": self.badge_label,
            "minPrice": min_price,
            "minPriceFormatted": f"Rp {min_price:,.0f}".replace(",", "."),
            "stockStatus": stock_status,
            "isOutOfStock": stock_status == "out_of_stock",
            "catalogCount": len(self.catalogs) if self.catalogs is not None else 0,
            "activeCatalogCount": len(active_catalogs),
            "baseSoldCount": self.base_sold_count or 0,
            "orderSoldCount": sold_count,
            "soldCount": total_sold,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

        if include_catalogs:
            res["catalogs"] = [c.to_dict() for c in (self.catalogs or [])]
            res["attributes"] = [a.to_dict() for a in (self.attributes or [])]
            res["variants"] = [v.to_dict() for v in (self.variants or [])]

        return res
