from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from app.core.database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="admin")  # 'superadmin' | 'admin' | 'sales'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_hash: bool = False):
        res = {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "name": self.name,
            "isActive": self.is_active,
            "role": self.role,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_hash:
            res["passwordHash"] = self.password_hash
        return res
