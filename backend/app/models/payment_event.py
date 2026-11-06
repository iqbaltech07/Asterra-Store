from datetime import datetime
from sqlalchemy import Column, String, Numeric, DateTime, Text, ForeignKey
from app.core.database import Base

def _num(val):
    if val is None:
        return None
    try:
        f = float(val)
        return int(f) if f.is_integer() else f
    except (ValueError, TypeError):
        return val

class PaymentEvent(Base):
    __tablename__ = "dana_payment_events"

    id = Column(String(100), primary_key=True)
    event_id = Column(String(100), unique=True, index=True, nullable=False)
    device_id = Column(String(100), index=True, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    currency = Column(String(10), default="IDR", nullable=False)
    transaction_time = Column(DateTime(timezone=True), nullable=False)
    source = Column(String(50), default="dana_business", nullable=False)
    raw_reference = Column(String(255), nullable=True)
    status = Column(String(50), default="DETECTED", nullable=False, index=True)
    matched_order_id = Column(String(100), nullable=True, index=True)
    verified_by_admin_id = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "eventId": self.event_id,
            "event_id": self.event_id,
            "deviceId": self.device_id,
            "device_id": self.device_id,
            "amount": _num(self.amount),
            "currency": self.currency,
            "transactionTime": self.transaction_time.isoformat() if self.transaction_time else None,
            "transaction_time": self.transaction_time.isoformat() if self.transaction_time else None,
            "source": self.source,
            "rawReference": self.raw_reference,
            "raw_reference": self.raw_reference,
            "status": self.status,
            "matchedOrderId": self.matched_order_id,
            "matched_order_id": self.matched_order_id,
            "verifiedByAdminId": self.verified_by_admin_id,
            "verified_by_admin_id": self.verified_by_admin_id,
            "verifiedAt": self.verified_at.isoformat() if self.verified_at else None,
            "verified_at": self.verified_at.isoformat() if self.verified_at else None,
            "notes": self.notes,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

