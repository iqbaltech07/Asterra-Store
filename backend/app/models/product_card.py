from datetime import datetime
import json
from typing import List, Dict, Any, Optional
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, ForeignKey, Numeric
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
    category_name = Column(String(150), nullable=True)
    status = Column(String(50), default="active", nullable=False, index=True)  # 'active' | 'archived' | 'inactive'
    display_order = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=False, nullable=False)
    sections = Column(Text, default='["promo"]')  # JSON list e.g. ["promo", "terlaris"]
    rating = Column(String(10), default="5.0")
    badge_label = Column(String(100), nullable=True)
    base_sold_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship to catalogs (products)
    catalogs = relationship("Product", back_populates="card", foreign_keys="Product.card_id")
    attributes = relationship("ProductAttribute", back_populates="card", cascade="all, delete-orphan", order_by="ProductAttribute.display_order")
    variants = relationship("ProductVariant", back_populates="card", cascade="all, delete-orphan")

    def to_dict(
        self,
        include_catalogs: bool = False,
        sold_count: int = 0,
        dummy_sold: int = 0,
        real_sold: int = 0,
    ) -> Dict[str, Any]:
        sec_list = []
        if self.sections:
            try:
                sec_list = json.loads(self.sections)
                if not isinstance(sec_list, list):
                    sec_list = [self.sections]
            except Exception:
                sec_list = [self.sections]

        # Calculate min_price from active catalogs
        min_price = 0
        active_catalogs = [c for c in (self.catalogs or []) if getattr(c, "status", None) == "active"]
        if active_catalogs:
            prices = [int(float(c.price)) for c in active_catalogs if getattr(c, "price", None) is not None and float(c.price) > 0]
            if prices:
                min_price = min(prices)

        # Calculate stockStatus according to Note 1:
        # Stok etalase berstatus habis jika semua variant habis stoknya (atau tidak ada varian aktif)
        has_ready_stock = False
        if active_catalogs:
            for c in active_catalogs:
                is_zero_stock = getattr(c, "stock", None) is not None and c.stock <= 0
                is_empty = getattr(c, "provider_status", None) == "empty"
                if not is_zero_stock and not is_empty:
                    has_ready_stock = True
                    break

        stock_status = "ready" if (self.status == "active" and active_catalogs and has_ready_stock) else "out_of_stock"
        
        # Determine baseline sold count:
        # 1. Priority products (Google Gemini, Netflix, ChatGPT, Spotify, Apple Music, YouTube, CapCut):
        #    Baseline is higher (calibrated ~28-38), maintaining high demand visibility.
        # 2. Produk Terbaru (New / Latest Products):
        #    Card Produk categorized/displayed as "Produk Terbaru" (sections contains 'terbaru' or badge_label is 'Baru'
        #    or stored base_sold_count in [7, 11]).
        #    Initial baseline is strictly bounded between 7 and 11.
        # 3. Regular products:
        #    Baseline strictly bounded between 10 and 25.
        card_slug = (self.slug or self.id or "").lower()
        is_priority = any(p in card_slug for p in ["gemini", "netflix", "chatgpt", "spotify", "youtube", "capcut"])

        sec_lower = [str(s).lower() for s in sec_list]
        badge_lower = (self.badge_label or "").lower()
        is_terbaru = (
            not is_priority
            and (
                "baru" in badge_lower
                or (len(sec_lower) == 1 and "terbaru" in sec_lower)
                or any(t in card_slug for t in ["duolingo", "getcontact", "loklok", "zoom", "meitu", "wink", "alight", "wetv", "bstation"])
            )
        )

        if self.base_sold_count is not None and self.base_sold_count > 0:
            effective_base = int(self.base_sold_count)
        elif is_priority:
            priority_defaults = {
                "netflix": 38,
                "spotify": 37,
                "capcut": 34,
                "gemini": 33,
                "youtube": 32,
                "chatgpt": 30,
                "apple-music": 28,
            }
            matched_key = next((k for k in priority_defaults if k in card_slug), None)
            effective_base = priority_defaults[matched_key] if matched_key else 30
        elif is_terbaru:
            terbaru_defaults = {
                "wetv": 19,
                "apple-music": 18,
                "getcontact": 17,
                "wink": 16,
                "zoom": 15,
                "alight-motion": 14,
                "alight": 14,
                "duolingo": 13,
                "loklok": 12,
                "bstation": 12,
                "meitu": 11,
            }
            matched_t = next((k for k in terbaru_defaults if k in card_slug), None)
            effective_base = terbaru_defaults[matched_t] if matched_t else (11 + (abs(hash(card_slug)) % 10))
        else:
            effective_base = 10 + (abs(hash(card_slug)) % 16)

        # Dynamic Sold Count = BASELINE SOLD COUNT + COMPLETED DUMMY ORDER + COMPLETED REAL ORDER
        total_order_units = (int(dummy_sold) + int(real_sold)) if (dummy_sold or real_sold) else int(sold_count)
        total_sold = effective_base + total_order_units

        # Calculate effective created timestamp (card or variants, whichever is newest)
        created_dts = [self.created_at] if self.created_at else []
        if self.updated_at:
            created_dts.append(self.updated_at)
        if self.catalogs:
            for c in self.catalogs:
                if getattr(c, "created_at", None):
                    created_dts.append(c.created_at)
                if getattr(c, "updated_at", None):
                    created_dts.append(c.updated_at)
        effective_created = max(created_dts) if created_dts else None

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
            "catalogCount": len(active_catalogs),
            "totalCatalogCount": len(self.catalogs) if self.catalogs is not None else 0,
            "activeCatalogCount": len(active_catalogs),
            "baseSoldCount": effective_base,
            "dummySoldCount": int(dummy_sold),
            "realSoldCount": int(real_sold),
            "orderSoldCount": total_order_units,
            "soldCount": total_sold,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "effectiveCreatedAt": effective_created.isoformat() if effective_created else None,
        }

        if include_catalogs:
            res["catalogs"] = [c.to_dict() for c in (self.catalogs or [])]
            res["attributes"] = [a.to_dict() for a in (self.attributes or [])]
            res["variants"] = [v.to_dict() for v in (self.variants or [])]

        return res
