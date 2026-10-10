from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.core.database import Base

class SalesPartner(Base):
    __tablename__ = "sales_partners"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    whatsapp = Column(String, nullable=True)
    code = Column(String, unique=True, nullable=False)
    tier = Column(String, default="Bronze")
    rate = Column(Integer, default=10)
    total_clicks = Column(Integer, default=0)
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    status = Column(String, default="Aktif")
    referred_by_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "whatsapp": self.whatsapp,
            "code": self.code,
            "tier": self.tier,
            "rate": self.rate,
            "totalClicks": self.total_clicks,
            "bankName": self.bank_name,
            "bankAccount": self.bank_account,
            "status": self.status,
            "referredById": self.referred_by_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
