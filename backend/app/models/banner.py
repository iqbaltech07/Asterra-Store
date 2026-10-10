from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.core.database import Base

class PromoBanner(Base):
    __tablename__ = "promo_banners"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cta_text = Column(String, nullable=True, default="Beli Sekarang")
    banner_type = Column(String, default="hero")  # 'hero' | 'promo-bar' | 'announcement'
    image_url = Column(String, nullable=False)
    blob_url = Column(String, nullable=True)
    pathname = Column(String, nullable=True)
    content_hash = Column(String, nullable=True)
    link_url = Column(String, nullable=True)
    target_page = Column(String, default="home")  # 'home' | 'products' | 'checkout' | 'all'
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description or "",
            "ctaText": self.cta_text or "Beli Sekarang",
            "bannerType": self.banner_type or "hero",
            "type": self.banner_type or "hero",
            "imageUrl": self.image_url,
            "blobUrl": self.blob_url,
            "pathname": self.pathname,
            "contentHash": self.content_hash,
            "linkUrl": self.link_url or "/#katalog",
            "destinationUrl": self.link_url or "/#katalog",
            "targetPage": self.target_page or "home",
            "displayOrder": self.display_order,
            "isActive": self.is_active,
            "status": "active" if self.is_active else "inactive",
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "scheduledUntil": self.expires_at.strftime("%Y-%m-%d") if self.expires_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
