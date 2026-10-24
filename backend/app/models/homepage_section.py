from datetime import datetime
import json
from sqlalchemy import Column, String, DateTime, Text
from app.core.database import Base

class HomepageProductSection(Base):
    __tablename__ = "homepage_product_sections"

    section_key = Column(String, primary_key=True)  # 'promo' | 'terlaris' | 'terbaru'
    mode = Column(String, default="auto", nullable=False)  # 'auto' | 'manual'
    manual_product_ids = Column(Text, default="[]", nullable=False)  # JSON array of product IDs or names
    updated_by = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        ids = []
        try:
            ids = json.loads(self.manual_product_ids) if self.manual_product_ids else []
        except Exception:
            ids = [i.strip() for i in (self.manual_product_ids or "").split(",") if i.strip()]

        return {
            "sectionKey": self.section_key,
            "mode": self.mode,
            "manualProductIds": ids,
            "updatedBy": self.updated_by,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
