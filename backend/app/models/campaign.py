from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text
from app.core.database import Base

class PromoCampaign(Base):
    __tablename__ = "promo_campaigns"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    tagline = Column(Text, nullable=True)
    banner_url = Column(String, nullable=True)

    # Diskon Engine
    discount_type = Column(String, default="percentage")  # 'percentage' | 'fixed'
    discount_value = Column(Float, default=15.0)
    max_discount_amount = Column(Float, nullable=True)
    min_order_amount = Column(Float, default=0.0)

    # Cakupan Target
    target_scope = Column(String, default="all")  # 'all' | 'category' | 'specific_products'
    target_categories = Column(Text, default="[]")  # JSON array of category names
    target_products = Column(Text, default="[]")    # JSON array of product IDs

    # Booster Komisi Affiliate Mitra
    affiliate_commission_override = Column(Float, nullable=True)  # e.g. 15.0 (%)

    # Jadwal & Status
    starts_at = Column(DateTime, nullable=False)
    ends_at = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    # Telemetri Performa
    total_orders_count = Column(Integer, default=0)
    total_revenue_generated = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_status(self) -> str:
        """Determines computed status dynamically: 'draft' | 'running' | 'scheduled' | 'ended'"""
        if not self.is_active:
            return "draft"
        now = datetime.utcnow()
        if self.starts_at and now < self.starts_at:
            return "scheduled"
        if self.ends_at and now >= self.ends_at:
            return "ended"
        return "running"

    def to_dict(self):
        cat_list = []
        try:
            cat_list = json.loads(self.target_categories) if self.target_categories else []
        except Exception:
            cat_list = [c.strip() for c in (self.target_categories or "").split(",") if c.strip()]

        prod_list = []
        try:
            prod_list = json.loads(self.target_products) if self.target_products else []
        except Exception:
            prod_list = [p.strip() for p in (self.target_products or "").split(",") if p.strip()]

        computed_status = self.get_status()
        target_cat_display = "Semua Kategori"
        if self.target_scope == "category" and cat_list:
            target_cat_display = ", ".join(cat_list)
        elif self.target_scope == "specific_products":
            target_cat_display = f"{len(prod_list)} Produk Khusus"

        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "tagline": self.tagline or "",
            "bannerUrl": self.banner_url or "",
            "startDate": self.starts_at.strftime("%Y-%m-%d") if self.starts_at else None,
            "endDate": self.ends_at.strftime("%Y-%m-%d") if self.ends_at else None,
            "startsAt": self.starts_at.isoformat() if self.starts_at else None,
            "endsAt": self.ends_at.isoformat() if self.ends_at else None,
            "targetScope": self.target_scope,
            "targetCategory": target_cat_display,
            "targetCategories": cat_list,
            "targetProducts": prod_list,
            "discountType": self.discount_type,
            "discountValue": self.discount_value,
            "maxDiscountAmount": self.max_discount_amount,
            "minPurchase": self.min_order_amount,
            "minOrderAmount": self.min_order_amount,
            "affiliateBonusPercent": self.affiliate_commission_override or 10.0,
            "affiliateCommissionOverride": self.affiliate_commission_override,
            "status": computed_status,
            "isActive": self.is_active,
            "totalOrders": self.total_orders_count,
            "revenue": self.total_revenue_generated,
            "conversionRate": 9.2 if self.total_orders_count > 0 else 0.0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
