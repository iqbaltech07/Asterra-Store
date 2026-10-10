from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from app.core.database import Base

class PromoBanner(Base):
    __tablename__ = "promo_banners"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    blob_url = Column(String, nullable=True)
    pathname = Column(String, nullable=True)
    content_hash = Column(String, nullable=True)
    link_url = Column(String, nullable=True)
    target_page = Column(String, default="home")  # 'home' | 'products' | 'checkout' | 'all'
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "imageUrl": self.image_url,
            "blobUrl": self.blob_url,
            "pathname": self.pathname,
            "contentHash": self.content_hash,
            "linkUrl": self.link_url,
            "targetPage": self.target_page,
            "displayOrder": self.display_order,
            "isActive": self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
