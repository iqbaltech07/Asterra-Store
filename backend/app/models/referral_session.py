import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from app.core.database import Base


class ReferralSession(Base):
    __tablename__ = "referral_sessions"

    id = Column(String, primary_key=True, default=lambda: f"ref_sess_{uuid.uuid4().hex[:16]}")
    visitor_hash = Column(String, nullable=True, index=True)
    user_email = Column(String, nullable=True, index=True)
    ref_code = Column(String, nullable=False, index=True)
    campaign_id = Column(String, nullable=True, index=True)
    utm_source = Column(String, nullable=True)
    utm_medium = Column(String, nullable=True)
    status = Column(String, default="active", index=True)  # active | claimed | expired
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True, index=True)
    claimed_at = Column(DateTime, nullable=True)
    claimed_order_id = Column(String, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "visitorHash": self.visitor_hash,
            "userEmail": self.user_email,
            "refCode": self.ref_code,
            "campaignId": self.campaign_id,
            "utmSource": self.utm_source,
            "utmMedium": self.utm_medium,
            "status": self.status,
            "createdAt": self.created_at.isoformat() + "Z" if self.created_at else None,
            "expiresAt": self.expires_at.isoformat() + "Z" if self.expires_at else None,
            "claimedAt": self.claimed_at.isoformat() + "Z" if self.claimed_at else None,
            "claimedOrderId": self.claimed_order_id,
        }
