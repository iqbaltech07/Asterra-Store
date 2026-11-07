"""
Asterra Store - Business Model v2.0 & 70:30 Profit Sharing Test Suite
Validates all formulas, allocations, founder parity, and SKU unit economics.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.referral_profit_service import ReferralProfitService

def test_sku_commission_matrix_from_business_model():
    """Validates exact figures from Section 4.6 of model-bisnis.md."""
    test_cases = [
        # (name, selling_price, cogs, expected_profit, expected_affiliate_30, expected_asterra_70)
        ("Google AI Pro 18 Bulan", 57000, 13400, 43600, 13080, 30520),
        ("CapCut Private 30 Hari", 63900, 34000, 29900, 8970, 20930),
        ("Gemini Pro 1 Tahun", 42900, 18000, 24900, 7470, 17430),
        ("Bstation 1 Tahun", 42900, 20000, 22900, 6870, 16030),
        ("Canva Education 1 Tahun", 26900, 11500, 15400, 4620, 10780),
        ("Zoom 30 Hari", 20000, 6500, 13500, 4050, 9450),
    ]

    for name, price, cogs, exp_profit, exp_aff, exp_ast in test_cases:
        profit = price - cogs
        assert profit == exp_profit, f"{name}: Profit mismatch"
        
        alloc = ReferralProfitService.calculate_profit_allocation(
            transaction_profit=profit,
            has_sales_partner=True,
        )
        assert alloc["sales_commission"] == exp_aff, f"{name}: Affiliate commission expected {exp_aff}, got {alloc['sales_commission']}"
        assert alloc["profit_distribution"] == exp_ast, f"{name}: Asterra retained expected {exp_ast}, got {alloc['profit_distribution']}"
        assert alloc["ceo_share"] == alloc["coo_share"], f"{name}: Founder parity violated"
        assert alloc["sales_commission"] + alloc["ceo_share"] + alloc["coo_share"] + alloc["business_reserve"] == profit, f"{name}: Zero leakage violated"

def test_direct_sales_allocation():
    """Direct sales (non-affiliate) retain 100% of profit for Asterra."""
    profit = 50000
    alloc = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=profit,
        has_sales_partner=False,
    )
    assert alloc["sales_commission"] == 0
    assert alloc["profit_distribution"] == profit
    assert alloc["ceo_share"] == alloc["coo_share"]
    assert alloc["ceo_share"] + alloc["coo_share"] + alloc["business_reserve"] == profit
    assert alloc["business_reserve"] == round(profit * 0.15)

def test_affiliate_daily_target_calculation():
    """Verify daily target Rp 25.000 requires Rp 83.333 transaction profit."""
    target_commission = 25000
    required_profit = target_commission / 0.30
    assert round(required_profit) == 83333

    alloc = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=required_profit,
        has_sales_partner=True,
    )
    assert alloc["sales_commission"] == target_commission
    assert alloc["profit_distribution"] == round(required_profit * 0.70)

def test_odd_numbers_founder_parity_and_zero_leakage():
    """Verify that odd profits maintain strict parity and 0 leakage."""
    test_amounts = [1, 3, 7, 101, 333, 999, 12345, 99999, 1000000]
    for amt in test_amounts:
        # 1. Affiliate
        alloc_aff = ReferralProfitService.calculate_profit_allocation(amt, has_sales_partner=True)
        assert alloc_aff["ceo_share"] == alloc_aff["coo_share"], f"Odd amount {amt} affiliate founder parity violated"
        assert alloc_aff["total_allocated"] == amt, f"Odd amount {amt} affiliate leakage: {alloc_aff['total_allocated']} != {amt}"

        # 2. Direct
        alloc_dir = ReferralProfitService.calculate_profit_allocation(amt, has_sales_partner=False)
        assert alloc_dir["ceo_share"] == alloc_dir["coo_share"], f"Odd amount {amt} direct founder parity violated"
        assert alloc_dir["total_allocated"] == amt, f"Odd amount {amt} direct leakage: {alloc_dir['total_allocated']} != {amt}"

def test_affiliate_campaign_bonus_commission():
    """Verify that campaign bonus adds to partner base commission (e.g. 30% base + 3% bonus = 33%)."""
    tx_profit = 38060
    base_rate = 30.0
    bonus_rate = 3.0

    alloc = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=tx_profit,
        has_sales_partner=True,
        partner_base_rate=base_rate,
        campaign_bonus_rate=bonus_rate,
    )

    expected_base = round(tx_profit * 0.30)        # 11418
    expected_bonus = round(tx_profit * 0.03)       # 1142
    expected_total_comm = expected_base + expected_bonus  # 12560

    assert alloc["base_commission"] == expected_base, f"Base comm expected {expected_base}, got {alloc['base_commission']}"
    assert alloc["bonus_commission"] == expected_bonus, f"Bonus comm expected {expected_bonus}, got {alloc['bonus_commission']}"
    assert alloc["sales_commission"] == expected_total_comm, f"Total comm expected {expected_total_comm}, got {alloc['sales_commission']}"
    assert alloc["sales_commission_rate"] == 33.0, f"Rate expected 33.0, got {alloc['sales_commission_rate']}"
    assert alloc["ceo_share"] == alloc["coo_share"], f"Founder parity violated: {alloc['ceo_share']} != {alloc['coo_share']}"
    assert alloc["total_allocated"] == tx_profit, f"Zero leakage violated: {alloc['total_allocated']} != {tx_profit}"

if __name__ == "__main__":
    test_sku_commission_matrix_from_business_model()
    test_direct_sales_allocation()
    test_affiliate_daily_target_calculation()
    test_odd_numbers_founder_parity_and_zero_leakage()
    test_affiliate_campaign_bonus_commission()
    print("ALL BUSINESS MODEL v2.0 TESTS PASSED SUCCESSFULLY!")

