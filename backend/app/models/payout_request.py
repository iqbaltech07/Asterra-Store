from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from app.core.database import Base

class PayoutRequest(Base):
    __tablename__ = "payout_requests"

    id = Column(String, primary_key=True)
    partner_id = Column(String, ForeignKey("sales_partners.id"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    bank_name = Column(String, nullable=False)
    bank_account = Column(String, nullable=False)
    bank_account_name = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False, index=True)  # pending, completed, approved, rejected
    notes = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "partnerId": self.partner_id,
            "amount": self.amount,
            "bankName": self.bank_name,
            "bankAccount": self.bank_account,
            "bankAccountName": self.bank_account_name,
            "status": self.status,
            "notes": self.notes or "",
            "processedAt": (self.processed_at.isoformat() + "Z") if self.processed_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "requestedAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }
