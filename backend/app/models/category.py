from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, unique=True)
    slug = Column(String, nullable=False, unique=True)
    display_order = Column(Integer, default=1, nullable=False)
    status = Column(String, default="active", nullable=False)  # 'active' | 'inactive'
    icon = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "displayOrder": self.display_order,
            "display_order": self.display_order,
            "status": self.status,
            "icon": self.icon,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
