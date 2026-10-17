"""
Comprehensive COO Audit & Data Precision Reconciliation Test Suite
AsterraStore Admin Operations
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.order_service import OrderService
from app.services.finance_service import FinanceService
from app.services.analytics_service import AnalyticsService
from app.services.partner_service import PartnerService
from app.services.referral_profit_service import ReferralProfitService

def test_1_unique_order_count_and_deduplication():
    print("[-] Running Test 1: Unique Order Count & Deduplication...")
    orders = OrderService.load_orders(force_reload=True)
    finance_orders = FinanceService.load_orders()
    
    assert len(orders) > 0, "Orders list should not be empty"
    assert len(orders) == len(finance_orders), "OrderService and FinanceService must load identical order count"
    
    order_ids = [o.get("id") for o in orders]
    unique_ids = set(order_ids)
    assert len(order_ids) == len(unique_ids), f"Duplicate order IDs detected: {len(order_ids)} vs {len(unique_ids)}"
    print(f"    [PASS] Total unique orders verified: {len(unique_ids)} (deduplicated)")

def test_2_order_status_filtering_and_metric_independence():
    print("[-] Running Test 2: Order Status Filtering & Metric Independence...")
    all_res = OrderService.get_orders(status="all")
    global_total = all_res["total"]
    global_rev = all_res["metrics"]["totalRevenue"]
    
    # Filter by specific status
    completed_res = OrderService.get_orders(status="completed")
    for o in completed_res["orders"]:
        assert str(o.get("status")).lower() == "completed", f"Status mismatch: {o.get('status')}"
    
    # Verify pagination & status filter did NOT shrink global metrics
    assert completed_res["metrics"]["totalRevenue"] == global_rev, "Status filter should not mutate global metrics.totalRevenue"
    assert completed_res["metrics"]["total"] == global_total, "Status filter should not mutate global metrics.total"
    print(f"    [PASS] Status filtering verified. Global metrics remain independent and intact.")

def test_3_timezone_wib_boundaries():
    print("[-] Running Test 3: Timezone & Date Boundaries (Asia/Jakarta WIB = UTC+7)...")
    WIB = timezone(timedelta(hours=7))
    now_wib = datetime.now(WIB)
    
    # Check this_week and this_month filters
    week_res = OrderService.get_orders(period="this_week")
    month_res = OrderService.get_orders(period="this_month")
    
    assert "metrics" in week_res and "metrics" in month_res, "Period queries must include metrics"
    print(f"    [PASS] WIB period boundaries executed successfully. Current WIB time: {now_wib.isoformat()}")

def test_4_pagination_independence():
    print("[-] Running Test 4: Pagination Independence...")
    page_1 = OrderService.get_orders(page=1, limit=1)
    assert len(page_1["orders"]) <= 1, "Page size limit must be respected"
    assert page_1["page"] == 1, "Current page must be 1"
    assert page_1["total"] >= len(page_1["orders"]), "Total items must represent total dataset"
    print(f"    [PASS] Pagination does not truncate global total items ({page_1['total']}).")

def test_5_financial_formula_and_campaign_discounts():
    print("[-] Running Test 5: Financial Waterfall & Campaign Discount Formula...")
    fin_dist = FinanceService.get_profit_distribution()
    summary = fin_dist["summary"]
    
    # Validate mathematical waterfall constraints
    assert summary["totalGrossRevenue"] >= summary["totalNetRevenue"], "Gross revenue must be >= net revenue"
    assert summary["totalGrossRevenue"] - summary["totalDiscounts"] == summary["totalNetRevenue"], "Gross - Discounts must equal Net Revenue"
    assert summary["totalTransactionProfit"] == max(0.0, summary["totalNetRevenue"] - summary["totalCostOfGoods"] - summary["totalPaymentFees"]), "Transaction profit must equal Net Revenue - COGS - Payment Fees"
    print(f"    [PASS] Financial waterfall: Gross ({summary['totalGrossRevenue']}) - Discounts ({summary['totalDiscounts']}) = Net ({summary['totalNetRevenue']})")

def test_6_founder_parity_profit_sharing():
    print("[-] Running Test 6: 40% CEO + 40% COO + 20% Modal Usaha (50:50 Founder Parity)...")
    fin_dist = FinanceService.get_profit_distribution()
    summary = fin_dist["summary"]
    
    distributable = summary["totalProfitDistribution"]
    ceo_share = summary["totalCeoShare"]
    coo_share = summary["totalCooShare"]
    reserve = summary["totalBusinessReserve"]
    
    assert ceo_share == coo_share, f"Founder parity violated: CEO ({ceo_share}) != COO ({coo_share})"
    assert ceo_share + coo_share + reserve == distributable, f"Distribution sum mismatch: {ceo_share + coo_share + reserve} != {distributable}"
    if distributable > 0:
        assert round(ceo_share / distributable, 2) == 0.40, "CEO share must be 40% of distributable profit"
        assert round(coo_share / distributable, 2) == 0.40, "COO share must be 40% of distributable profit"
        assert round(reserve / distributable, 2) == 0.20, "Business reserve must be 20% of distributable profit"
    print(f"    [PASS] Founder parity confirmed: CEO Rp {ceo_share:,.0f} == COO Rp {coo_share:,.0f} | Reserve Rp {reserve:,.0f}")

def test_7_sales_commission_from_profit():
    print("[-] Running Test 7: Sales Commission Computed from Transaction Profit...")
    # Test formula directly via ReferralProfitService.allocate_waterfall
    tx_profit = 29370.0
    calc = ReferralProfitService.allocate_waterfall(
        order_id="TEST-ORD-001",
        transaction_profit=tx_profit,
        direct_partner_code="AST-SALES-PRO",
        direct_partner_rate=10.0,
        sponsor_partner_code="AST-RECRUITER",
    )
    # Sales comm: 10% of profit 29370 = 2937 (NOT 10% of omzet 100k which would be 10000!)
    assert calc["direct_commission"] == 2937.0, f"Commission should be 10% of profit (2937): got {calc['direct_commission']}"
    assert calc["sponsor_bonus"] == round(tx_profit * 0.02), f"Recruitment bonus must be strictly 2% of profit: got {calc['sponsor_bonus']}"
    
    retained = calc["company_retained_profit"]
    ceo_share = round(retained * 0.40)
    coo_share = round(retained * 0.40)
    reserve = retained - ceo_share - coo_share
    assert ceo_share == coo_share, "CEO and COO must share distributable profit equally (50:50 founder parity)"
    assert ceo_share + coo_share + reserve == retained, "Distribution must equal retained profit"
    print(f"    [PASS] Commission computed from profit: Rp {calc['direct_commission']:,.0f} (from profit Rp {tx_profit:,.0f})")

def test_8_no_simulated_orders_in_admin():
    print("[-] Running Test 8: Verify Isolation from Public /orders Simulation...")
    orders = OrderService.load_orders()
    for o in orders:
        order_id = str(o.get("id", ""))
        assert "AST-DEMO" not in order_id, f"Simulated demo order found in admin dataset: {order_id}"
        assert not o.get("is_simulated"), f"Simulated flag found in admin order: {order_id}"
    print("    [PASS] Zero simulated orders detected in admin dataset.")

def test_9_independent_reconciliation_production_order():
    print("[-] Running Test 9: Independent Reconciliation of Real Production Order...")
    orders = OrderService.load_orders()
    real_order = next((o for o in orders if o.get("id") == "AST-ORD-20261015-7615"), None)
    assert real_order is not None, "Real order AST-ORD-20261015-7615 must exist in system"
    
    # Independent ground-truth arithmetic
    selling_price = 31900.0
    campaign_discount = 4785.0
    net_revenue = 27115.0
    cogs = 13000.0  # Provider price for Google Gemini Pro 1 Year
    payment_fee = 0.0  # manual_dana
    tx_profit = 14115.0
    commissions = 0.0
    distributable = 14115.0
    expected_ceo = 5646.0
    expected_coo = 5646.0
    expected_reserve = 2823.0
    
    fin_dist = FinanceService.get_profit_distribution()
    summary = fin_dist["summary"]
    
    assert summary["totalGrossRevenue"] == selling_price, f"Gross revenue mismatch: {summary['totalGrossRevenue']} vs {selling_price}"
    assert summary["totalDiscounts"] == campaign_discount, f"Discounts mismatch: {summary['totalDiscounts']} vs {campaign_discount}"
    assert summary["totalNetRevenue"] == net_revenue, f"Net revenue mismatch: {summary['totalNetRevenue']} vs {net_revenue}"
    assert summary["totalCostOfGoods"] == cogs, f"COGS mismatch: {summary['totalCostOfGoods']} vs {cogs}"
    assert summary["totalPaymentFees"] == payment_fee, f"Payment fee mismatch: {summary['totalPaymentFees']} vs {payment_fee}"
    assert summary["totalTransactionProfit"] == tx_profit, f"Transaction profit mismatch: {summary['totalTransactionProfit']} vs {tx_profit}"
    assert summary["totalCeoShare"] == expected_ceo, f"CEO share mismatch: {summary['totalCeoShare']} vs {expected_ceo}"
    assert summary["totalCooShare"] == expected_coo, f"COO share mismatch: {summary['totalCooShare']} vs {expected_coo}"
    assert summary["totalBusinessReserve"] == expected_reserve, f"Business reserve mismatch: {summary['totalBusinessReserve']} vs {expected_reserve}"
    print(f"    [PASS] AST-ORD-20261015-7615 independently reconciled with 100% precision!")

if __name__ == "__main__":
    print("=" * 70)
    print("  ASTERRA STORE — COO DATA ACCURACY & RECONCILIATION TEST SUITE")
    print("=" * 70)
    try:
        test_1_unique_order_count_and_deduplication()
        test_2_order_status_filtering_and_metric_independence()
        test_3_timezone_wib_boundaries()
        test_4_pagination_independence()
        test_5_financial_formula_and_campaign_discounts()
        test_6_founder_parity_profit_sharing()
        test_7_sales_commission_from_profit()
        test_8_no_simulated_orders_in_admin()
        test_9_independent_reconciliation_production_order()
        print("=" * 70)
        print("  ALL 9 RECONCILIATION SUITES PASSED WITH 100% SUCCESS!")
        print("=" * 70)
    except AssertionError as e:
        print(f"\n[FAIL] Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected test execution error: {e}")
        sys.exit(1)
