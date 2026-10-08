from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class ReferralProfitService:
    """
    Asterra Store - Referral Profit Waterfall & Commission Allocation Engine.
    Implements 100% exact business logic from Asterra Store Constitution:
    - Direct Sales Commission: 10% (or partner rate) of Net Transaction Profit
    - Sponsor Recruitment Bonus: 2% of Net Transaction Profit (1-level network)
    - Holding Window: 3 Days (Warranty holding guarantee before payout release)
    """

    DIRECT_RATE_DEFAULT = 10.0  # 10% of profit
    SPONSOR_RATE_DEFAULT = 2.0  # 2% of profit
    HOLDING_DAYS = 3            # 3 days guarantee

    @staticmethod
    def calculate_transaction_profit(order_total: float, cost_of_goods: float, discount: float = 0.0) -> float:
        net_revenue = max(0.0, order_total - discount)
        profit = max(0.0, net_revenue - cost_of_goods)
        return profit

    @classmethod
    def allocate_waterfall(
        cls,
        order_id: str,
        transaction_profit: float,
        direct_partner_code: Optional[str] = None,
        direct_partner_rate: Optional[float] = None,
        sponsor_partner_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        direct_rate = direct_partner_rate if direct_partner_rate is not None else cls.DIRECT_RATE_DEFAULT
        sponsor_rate = cls.SPONSOR_RATE_DEFAULT

        direct_commission = 0.0
        sponsor_bonus = 0.0

        if direct_partner_code and transaction_profit > 0:
            direct_commission = round((transaction_profit * direct_rate) / 100.0)

        if sponsor_partner_code and transaction_profit > 0:
            sponsor_bonus = round((transaction_profit * sponsor_rate) / 100.0)

        company_retained_profit = max(0.0, transaction_profit - direct_commission - sponsor_bonus)
        holding_until = datetime.utcnow() + timedelta(days=cls.HOLDING_DAYS)

        return {
            "order_id": order_id,
            "transaction_profit": transaction_profit,
            "direct_partner_code": direct_partner_code,
            "direct_commission": direct_commission,
            "direct_rate_applied": direct_rate,
            "sponsor_partner_code": sponsor_partner_code,
            "sponsor_bonus": sponsor_bonus,
            "sponsor_rate_applied": sponsor_rate,
            "company_retained_profit": company_retained_profit,
            "holding_until": holding_until.isoformat(),
            "status": "pending",
        }
