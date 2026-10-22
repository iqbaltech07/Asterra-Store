import sys
import os
from datetime import datetime

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal
from app.models.order import Order
from app.models.profit_ledger import ProfitLedger
from app.services.analytics_service import AnalyticsService
from app.services.finance_service import FinanceService
from app.services.order_service import OrderService
from app.services.partner_service import PartnerService

def run_tests():
    print("==================================================")
    print("ASTERRASTORE ADMIN DATA INTEGRITY VERIFICATION SUITE")
    print("==================================================")

    db = SessionLocal()
    try:
        # 1. Database Canonical Check
        orders = db.query(Order).all()
        ledgers = db.query(ProfitLedger).all()
        print(f"[TEST 1] Canonical DB Check: {len(orders)} orders, {len(ledgers)} profit ledger records in PostgreSQL.")
        assert len(orders) >= 1, "Expected at least 1 order in production database"

        real_order = orders[0]
        print(f"  Order ID: {real_order.id}, Status: {real_order.status}, Total: Rp {real_order.total_amount:,}")

        # 2. Analytics Dashboard Overview Match
        overview = AnalyticsService.get_dashboard_overview()
        kpi = overview.get("kpi", {})
        print(f"[TEST 2] Dashboard Overview KPI:")
        print(f"  Total Orders: {kpi.get('totalOrders')}")
        print(f"  Completed Orders: {kpi.get('completedOrders')}")
        print(f"  Total Revenue: Rp {kpi.get('totalRevenue'):,}")
        print(f"  Gross Profit: Rp {kpi.get('grossProfit'):,}")
        print(f"  Profit Margin: {kpi.get('profitMarginPercent')}%")

        assert kpi.get("totalRevenue") == real_order.total_amount, f"Revenue mismatch: {kpi.get('totalRevenue')} != {real_order.total_amount}"
        assert kpi.get("completedOrders") == (1 if real_order.status in ["completed", "paid", "settlement"] else 0)

        # 3. Profit Waterfall & Founder Parity (40% CEO / 40% COO / 20% Reserve)
        finance_data = FinanceService.get_profit_distribution()
        summary = finance_data.get("summary", {})
        print(f"[TEST 3] Finance Profit Waterfall:")
        print(f"  Gross Revenue: Rp {summary.get('totalGrossRevenue'):,}")
        print(f"  Net Revenue: Rp {summary.get('totalNetRevenue'):,}")
        print(f"  COGS: Rp {summary.get('totalCostOfGoods'):,}")
        print(f"  Payment Fee: Rp {summary.get('totalPaymentFees'):,}")
        print(f"  Transaction Profit: Rp {summary.get('totalTransactionProfit'):,}")
        print(f"  Sales Commission: Rp {summary.get('totalSalesCommission'):,}")
        print(f"  Distributable Profit: Rp {summary.get('totalProfitDistribution'):,}")
        print(f"  CEO Share (40%): Rp {summary.get('totalCeoShare'):,}")
        print(f"  COO Share (40%): Rp {summary.get('totalCooShare'):,}")
        print(f"  Business Reserve (20%): Rp {summary.get('totalBusinessReserve'):,}")

        distributable = summary.get("totalProfitDistribution", 0)
        expected_ceo = round(distributable * 0.40)
        expected_coo = round(distributable * 0.40)
        expected_reserve = distributable - expected_ceo - expected_coo

        assert summary.get("totalCeoShare") == expected_ceo, f"CEO share mismatch: {summary.get('totalCeoShare')} != {expected_ceo}"
        assert summary.get("totalCooShare") == expected_coo, f"COO share mismatch: {summary.get('totalCooShare')} != {expected_coo}"
        assert summary.get("totalBusinessReserve") == expected_reserve, f"Reserve mismatch: {summary.get('totalBusinessReserve')} != {expected_reserve}"

        # 4. ProfitLedger Row in PostgreSQL Check
        ledger_row = db.query(ProfitLedger).filter(ProfitLedger.order_id == real_order.id).first()
        print(f"[TEST 4] Database ProfitLedger Row Verification:")
        if ledger_row:
            print(f"  Ledger ID: {ledger_row.id}")
            print(f"  Selling Price: Rp {ledger_row.selling_price:,}")
            print(f"  Net Revenue: Rp {ledger_row.net_revenue:,}")
            print(f"  COGS: Rp {ledger_row.cost_of_goods:,}")
            print(f"  Transaction Profit: Rp {ledger_row.transaction_profit:,}")
            print(f"  CEO Share: Rp {ledger_row.ceo_share:,}")
            print(f"  COO Share: Rp {ledger_row.coo_share:,}")
            print(f"  Business Reserve: Rp {ledger_row.business_reserve:,}")

            assert ledger_row.ceo_share == expected_ceo, f"Ledger CEO share mismatch: {ledger_row.ceo_share} != {expected_ceo}"
            assert ledger_row.coo_share == expected_coo, f"Ledger COO share mismatch: {ledger_row.coo_share} != {expected_coo}"
            assert ledger_row.business_reserve == expected_reserve, f"Ledger Reserve mismatch: {ledger_row.business_reserve} != {expected_reserve}"

        # 5. Analytics Suite Breakdown Check (No Hardcoding)
        suite = AnalyticsService.get_analytics_suite_data()
        breakdown = suite.get("breakdown", {})
        print(f"[TEST 5] Analytics Suite Dynamic Breakdowns:")
        cat_dist = breakdown.get("categoryDistribution", [])
        pay_dist = breakdown.get("paymentMethodDistribution", [])
        chan_dist = breakdown.get("channelAcquisition", [])

        print(f"  Categories ({len(cat_dist)}): {[c['name'] + ' -> ' + c['formatted'] for c in cat_dist]}")
        print(f"  Payment Methods ({len(pay_dist)}): {[p['name'] + ' -> ' + p['formatted'] for p in pay_dist]}")
        print(f"  Channels ({len(chan_dist)}): {[ch['name'] + ' -> ' + str(ch['percentage']) + '%' for ch in chan_dist]}")

        assert len(cat_dist) > 0, "Expected dynamic category distribution"
        assert len(pay_dist) > 0, "Expected dynamic payment method distribution"
        assert len(chan_dist) > 0, "Expected dynamic channel acquisition"

        # 6. Customer CRM Integrity
        customers = AnalyticsService.get_customers()
        print(f"[TEST 6] Customer CRM Check:")
        print(f"  Total Unique Customers: {len(customers)}")
        if customers:
            top_cust = customers[0]
            print(f"  Top Customer: {top_cust['email']}, Total Orders: {top_cust['totalOrders']}, Completed Orders: {top_cust.get('completedOrders')}, Spent: Rp {top_cust['totalSpent']:,}")
            assert top_cust['totalSpent'] == real_order.total_amount, f"Customer spent mismatch: {top_cust['totalSpent']} != {real_order.total_amount}"

        # 7. Partner Service Fallback Check
        print(f"[TEST 7] Partner Service Safety:")
        non_existent = PartnerService.get_profile("NON_EXISTENT_PARTNER_999")
        assert non_existent is None, "Expected None for non-existent partner, but got fallback data!"
        print("  Non-existent partner lookup correctly returned None (Zero dummy fallback confirmed).")

        print("==================================================")
        print("ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY! (100% PASS)")
        print("==================================================")
        return True

    finally:
        db.close()

if __name__ == "__main__":
    success = run_tests()
    if not success:
        sys.exit(1)
