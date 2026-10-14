from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey
from app.core.database import Base

class ProfitLedger(Base):
    __tablename__ = "profit_ledgers"

    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"), unique=True, nullable=False)

    customer_email = Column(String, nullable=False)
    customer_name = Column(String, nullable=True)

    product_id = Column(String, nullable=False)
    product_names = Column(String, nullable=False)

    sales_id = Column(String, nullable=True)
    sales_name = Column(String, nullable=True)
    referral_code = Column(String, nullable=True)

    recruiter_sales_id = Column(String, nullable=True)
    recruiter_sales_name = Column(String, nullable=True)

    sale_commission_rate = Column(Float, nullable=False)
    recruitment_bonus_rate = Column(Float, nullable=False)

    selling_price = Column(Integer, nullable=False)
    customer_referral_discount = Column(Integer, default=0, nullable=False)
    net_revenue = Column(Integer, nullable=False)
    cost_of_goods = Column(Integer, nullable=False)
    payment_fee = Column(Integer, default=0, nullable=False)
    other_direct_cost = Column(Integer, default=0, nullable=False)
    direct_transaction_cost = Column(Integer, nullable=False)
    transaction_profit = Column(Integer, nullable=False)

    sales_commission = Column(Integer, nullable=False)
    recruitment_bonus = Column(Integer, nullable=False)

    profit_distribution = Column(Integer, nullable=False)
    ceo_share = Column(Integer, nullable=False)
    coo_share = Column(Integer, nullable=False)
    business_reserve = Column(Integer, nullable=False)

    status = Column(String, default="pending", nullable=False)
    holding_until = Column(DateTime, nullable=False)
    released_at = Column(DateTime, nullable=True)
    reversal_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "orderId": self.order_id,
            "customerEmail": self.customer_email,
            "customerName": self.customer_name,
            "productId": self.product_id,
            "productNames": self.product_names,
            "salesId": self.sales_id,
            "salesName": self.sales_name,
            "referralCode": self.referral_code,
            "recruiterSalesId": self.recruiter_sales_id,
            "recruiterSalesName": self.recruiter_sales_name,
            "saleCommissionRate": self.sale_commission_rate,
            "recruitmentBonusRate": self.recruitment_bonus_rate,
            "sellingPrice": self.selling_price,
            "customerReferralDiscount": self.customer_referral_discount,
            "netRevenue": self.net_revenue,
            "costOfGoods": self.cost_of_goods,
            "paymentFee": self.payment_fee,
            "otherDirectCost": self.other_direct_cost,
            "directTransactionCost": self.direct_transaction_cost,
            "transactionProfit": self.transaction_profit,
            "salesCommission": self.sales_commission,
            "recruitmentBonus": self.recruitment_bonus,
            "profitDistribution": self.profit_distribution,
            "ceoShare": self.ceo_share,
            "cooShare": self.coo_share,
            "businessReserve": self.business_reserve,
            "status": self.status,
            "holdingUntil": (self.holding_until.isoformat() + "Z") if self.holding_until else None,
            "releasedAt": (self.released_at.isoformat() + "Z") if self.released_at else None,
            "reversalReason": self.reversal_reason,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }
