from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Commission(Base):
    __tablename__ = "commissions"

    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"), unique=True, nullable=False)
    partner_id = Column(String, ForeignKey("sales_partners.id"), nullable=False)
    recruiter_id = Column(String, ForeignKey("sales_partners.id"), nullable=True)

    order_total = Column(Integer, nullable=False)
    net_revenue = Column(Integer, nullable=False)
    cost_of_goods = Column(Integer, nullable=False)
    transaction_profit = Column(Integer, nullable=False)

    commission_rate = Column(Integer, nullable=False)
    commission_amount = Column(Integer, nullable=False)

    bonus_rate = Column(Integer, default=0, nullable=False)
    bonus_amount = Column(Integer, default=0, nullable=False)

    status = Column(String, default="pending", nullable=False)
    reversal_reason = Column(Text, nullable=True)

    holding_until = Column(DateTime, nullable=False)
    released_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "orderId": self.order_id,
            "partnerId": self.partner_id,
            "recruiterId": self.recruiter_id,
            "orderTotal": self.order_total,
            "netRevenue": self.net_revenue,
            "costOfGoods": self.cost_of_goods,
            "transactionProfit": self.transaction_profit,
            "commissionRate": self.commission_rate,
            "commissionAmount": self.commission_amount,
            "bonusRate": self.bonus_rate,
            "bonusAmount": self.bonus_amount,
            "status": self.status,
            "reversalReason": self.reversal_reason,
            "holdingUntil": (self.holding_until.isoformat() + "Z") if self.holding_until else None,
            "releasedAt": (self.released_at.isoformat() + "Z") if self.released_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }
