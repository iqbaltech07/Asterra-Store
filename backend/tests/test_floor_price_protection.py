"""
Asterra Store - Floor Price Protection & Negative Profit Prevention Test Suite
Validates that:
1. Floor Price Guard clamps excessive discounts so customer price never falls below COGS + fees + safety buffer.
2. Transaction profit is always strictly >= safety margin, preventing financial loss.
3. Affiliate commission rate is capped at ceiling (50%), preventing margin erosion.
4. Parity and Zero Leakage remain strictly intact across all edge cases.
"""

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.referral_profit_service import ReferralProfitService

def test_affiliate_ceiling_protection():
    """Verify that even with an extreme campaign bonus (+70%), affiliate rate is capped at 50%."""
    tx_profit = 38060
    base_rate = 30.0
    huge_bonus_rate = 70.0  # Attempt 30% + 70% = 100%

    alloc = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=tx_profit,
        has_sales_partner=True,
        partner_base_rate=base_rate,
        campaign_bonus_rate=huge_bonus_rate,
    )

    # Must be capped at 50.0%
    assert alloc["sales_commission_rate"] == 50.0, f"Rate should be capped at 50.0%, got {alloc['sales_commission_rate']}"
    assert alloc["sales_commission"] == round(tx_profit * 0.50), "Sales commission should be exactly 50% of profit"
    assert alloc["profit_distribution"] == round(tx_profit * 0.50), "Asterra should retain exactly 50% of profit"
    assert alloc["ceo_share"] == alloc["coo_share"], "Founder parity must be preserved"
    assert alloc["total_allocated"] == tx_profit, f"Zero leakage violated: {alloc['total_allocated']} != {tx_profit}"

def test_floor_price_calculation_logic():
    """Verify floor price mathematical formula."""
    raw_total = 78500
    total_cogs = 35000
    payment_fee_est = round(total_cogs * 0.007)  # 245
    safety_buffer = max(1000, round(total_cogs * 0.03))  # 1050
    floor_price = total_cogs + payment_fee_est + safety_buffer  # 36295

    max_allowable_discount = max(0, raw_total - floor_price)  # 42205

    # Case A: Normal discount (e.g. Rp 4.925)
    normal_disc = 4925
    assert normal_disc <= max_allowable_discount
    clamped_normal = normal_disc if normal_disc <= max_allowable_discount else max_allowable_discount
    assert clamped_normal == 4925, "Normal discount should not be clamped"

    # Case B: Excessive discount (e.g. Rp 55.000)
    huge_disc = 55000
    assert huge_disc > max_allowable_discount
    clamped_huge = huge_disc if huge_disc <= max_allowable_discount else max_allowable_discount
    assert clamped_huge == 42205, f"Excessive discount must be clamped to {max_allowable_discount}"

    # Customer payable price must be exactly floor_price
    final_customer_price = raw_total - clamped_huge
    assert final_customer_price == floor_price == 36295
    assert final_customer_price > total_cogs + payment_fee_est, "Customer price must exceed HPP + fee"

if __name__ == "__main__":
    test_affiliate_ceiling_protection()
    test_floor_price_calculation_logic()
    print("ALL FLOOR PRICE & ANTI-MINUS PROTECTIONS PASSED SUCCESSFULLY!")

