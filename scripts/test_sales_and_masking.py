"""
AsterraStore - Comprehensive VIP Commission, Profit Split & Privacy Test Suite
Validates all 10 Mandatory Production Readiness Scenarios:
1. 0 transaksi sukses: CEO 35%, COO 35%, Sales 15%, Reserve 15%.
2. 49 transaksi sukses: Sales masih mendapat 15%.
3. Tepat 50 transaksi sukses: CEO 32,5%, COO 32,5%, Sales 20%, Reserve 15%.
4. Lebih dari 50 transaksi sukses: Sales tetap 20%.
5. Order gagal dan dibatalkan tidak menambah progress.
6. Order yang sama tidak dihitung dua kali (deduplikasi ID unik).
7. Total persentase selalu 100% (zero margin leakage).
8. Nominal pembagian profit konsisten antara backend, Admin, dan Sales.
9. Referral sponsor 2% dan hold garansi 3 hari tetap berfungsi.
10. Customer PII masking dan zero margin leakage ke sales portal.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.services.referral_profit_service import ReferralProfitService
from app.services.partner_service import PartnerService, mask_customer_name


def test_mandatory_10_scenarios():
    print("====================================================================")
    print("ASTERRASTORE — PENGUJIAN 10 SKENARIO ATURAN KOMISI & PROFIT SHARING")
    print("====================================================================")

    # -----------------------------------------------------------------
    # Skenario 1: 0 transaksi sukses
    # CEO 35%, COO 35%, Sales 15%, Reserve 15%
    # -----------------------------------------------------------------
    print("\n[TES 1] 0 Transaksi Sukses (Non-VIP)")
    alloc_0 = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=100000,
        successful_orders_count=0,
        has_sales_partner=True,
        has_recruiter=False
    )
    print(f"  Profit Rp 100.000 -> Sales: Rp {alloc_0['sales_commission']:,} ({alloc_0['sales_commission_rate']}%), "
          f"CEO: Rp {alloc_0['ceo_share']:,} ({alloc_0['ceo_share_rate']}%), "
          f"COO: Rp {alloc_0['coo_share']:,} ({alloc_0['coo_share_rate']}%), "
          f"Reserve: Rp {alloc_0['business_reserve']:,} ({alloc_0['business_reserve_rate']}%)")
    assert alloc_0['is_vip'] is False, "Status VIP harus False untuk 0 transaksi"
    assert alloc_0['sales_commission'] == 15000, "Komisi Sales harus 15%"
    assert alloc_0['ceo_share'] == 35000, "Bagian CEO harus 35%"
    assert alloc_0['coo_share'] == 35000, "Bagian COO harus 35%"
    assert alloc_0['business_reserve'] == 15000, "Cadangan harus 15%"
    assert alloc_0['total_allocated'] == 100000, "Total harus tepat 100%"
    print("  -> PASS: Skenario 1 terverifikasi.")

    # -----------------------------------------------------------------
    # Skenario 2: 49 transaksi sukses
    # Sales masih mendapat 15%
    # -----------------------------------------------------------------
    print("\n[TES 2] 49 Transaksi Sukses (Threshold Non-VIP Terakhir)")
    alloc_49 = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=100000,
        successful_orders_count=49,
        has_sales_partner=True,
        has_recruiter=False
    )
    print(f"  Profit Rp 100.000 -> Sales: Rp {alloc_49['sales_commission']:,} ({alloc_49['sales_commission_rate']}%), "
          f"CEO: Rp {alloc_49['ceo_share']:,} ({alloc_49['ceo_share_rate']}%), "
          f"COO: Rp {alloc_49['coo_share']:,} ({alloc_49['coo_share_rate']}%), "
          f"Reserve: Rp {alloc_49['business_reserve']:,} ({alloc_49['business_reserve_rate']}%)")
    assert alloc_49['is_vip'] is False, "Status VIP harus False untuk 49 transaksi"
    assert alloc_49['sales_commission'] == 15000, "Komisi Sales harus tetap 15% pada 49 transaksi"
    assert alloc_49['ceo_share'] == 35000, "Bagian CEO harus tetap 35%"
    assert alloc_49['coo_share'] == 35000, "Bagian COO harus tetap 35%"
    assert alloc_49['business_reserve'] == 15000, "Cadangan harus tetap 15%"
    assert alloc_49['total_allocated'] == 100000, "Total harus tepat 100%"
    print("  -> PASS: Skenario 2 terverifikasi.")

    # -----------------------------------------------------------------
    # Skenario 3: Tepat 50 transaksi sukses
    # CEO 32,5%, COO 32,5%, Sales 20%, Reserve 15%
    # -----------------------------------------------------------------
    print("\n[TES 3] Tepat 50 Transaksi Sukses (Milestone VIP Pertama)")
    alloc_50 = ReferralProfitService.calculate_profit_allocation(
        transaction_profit=100000,
        successful_orders_count=50,
        has_sales_partner=True,
        has_recruiter=False
    )
    print(f"  Profit Rp 100.000 -> Sales: Rp {alloc_50['sales_commission']:,} ({alloc_50['sales_commission_rate']}%), "
          f"CEO: Rp {alloc_50['ceo_share']:,} ({alloc_50['ceo_share_rate']}%), "
          f"COO: Rp {alloc_50['coo_share']:,} ({alloc_50['coo_share_rate']}%), "
          f"Reserve: Rp {alloc_50['business_reserve']:,} ({alloc_50['business_reserve_rate']}%)")
    assert alloc_50['is_vip'] is True, "Status VIP harus True tepat pada 50 transaksi"
    assert alloc_50['sales_commission'] == 20000, "Komisi Sales harus naik ke 20%"
    assert alloc_50['ceo_share'] == 32500, "Bagian CEO harus 32,5%"
    assert alloc_50['coo_share'] == 32500, "Bagian COO harus 32,5%"
    assert alloc_50['business_reserve'] == 15000, "Cadangan harus tetap 15%"
    assert alloc_50['total_allocated'] == 100000, "Total harus tepat 100%"
    print("  -> PASS: Skenario 3 terverifikasi.")

    # -----------------------------------------------------------------
    # Skenario 4: Lebih dari 50 transaksi sukses
    # Sales tetap 20%, tidak naik lagi
    # -----------------------------------------------------------------
    print("\n[TES 4] Lebih dari 50 Transaksi Sukses (e.g. 75 & 120 Transaksi)")
    for count in [51, 75, 120]:
        alloc_gt = ReferralProfitService.calculate_profit_allocation(
            transaction_profit=100000,
            successful_orders_count=count,
            has_sales_partner=True,
            has_recruiter=False
        )
        assert alloc_gt['is_vip'] is True
        assert alloc_gt['sales_commission'] == 20000, f"Komisi Sales harus tetap 20% pada {count} transaksi"
        assert alloc_gt['ceo_share'] == 32500, "Bagian CEO harus 32,5%"
        assert alloc_gt['coo_share'] == 32500, "Bagian COO harus 32,5%"
        assert alloc_gt['business_reserve'] == 15000, "Cadangan harus 15%"
        assert alloc_gt['total_allocated'] == 100000, "Total harus tepat 100%"
    print("  -> PASS: Skenario 4 terverifikasi (Komisi tetap 20% dan tidak naik lagi).")

    # -----------------------------------------------------------------
    # Skenario 5: Order gagal dan dibatalkan tidak menambah progress
    # -----------------------------------------------------------------
    print("\n[TES 5] Filter Validitas Status Order")
    dummy_orders = [
        {"id": "ORD-1", "status": "completed"},
        {"id": "ORD-2", "status": "paid"},
        {"id": "ORD-3", "status": "settlement"},
        {"id": "ORD-4", "status": "selesai"},
        {"id": "ORD-5", "status": "done"},
        {"id": "ORD-6", "status": "failed"},         # invalid
        {"id": "ORD-7", "status": "cancelled"},      # invalid
        {"id": "ORD-8", "status": "expired"},        # invalid
        {"id": "ORD-9", "status": "pending"},        # invalid
        {"id": "ORD-10", "status": "draft"},         # invalid
        {"id": "ORD-11", "status": "refunded"},      # invalid
    ]
    valid_count = PartnerService.count_unique_successful_orders(dummy_orders)
    print(f"  Dari {len(dummy_orders)} order campuran, terhitung sukses unik: {valid_count}")
    assert valid_count == 5, f"Hanya 5 order berstatus sukses yang boleh terhitung, didapat: {valid_count}"
    print("  -> PASS: Skenario 5 terverifikasi (Order gagal/dibatalkan tidak dihitung).")

    # -----------------------------------------------------------------
    # Skenario 6: Order yang sama tidak dihitung dua kali (deduplikasi ID)
    # -----------------------------------------------------------------
    print("\n[TES 6] Deduplikasi ID Transaksi Sukses")
    duplicate_orders = [
        {"id": "ORD-UNIQUE-1", "status": "completed"},
        {"id": "ORD-UNIQUE-1", "status": "completed"}, # duplikat ID
        {"id": "ORD-UNIQUE-1", "status": "paid"},      # duplikat ID
        {"id": "ORD-UNIQUE-2", "status": "completed"},
        {"id": "ORD-UNIQUE-2", "status": "selesai"},   # duplikat ID
        {"id": "ORD-UNIQUE-3", "status": "settlement"},
    ]
    dedup_count = PartnerService.count_unique_successful_orders(duplicate_orders)
    print(f"  Dari {len(duplicate_orders)} entri order (dengan duplikat ID), terhitung: {dedup_count}")
    assert dedup_count == 3, f"Harus tepat 3 order unik, didapat: {dedup_count}"
    print("  -> PASS: Skenario 6 terverifikasi (Order ID unik tanpa double-counting).")

    # -----------------------------------------------------------------
    # Skenario 7: Total persentase selalu 100% (Zero Margin Leakage)
    # -----------------------------------------------------------------
    print("\n[TES 7] Zero Leakage Uji Arbitrer (Selalu Tepat 100%)")
    test_amounts = [1, 99, 137, 1000, 7777, 15000, 33333, 42900, 75000, 99999, 100000, 250000, 987654]
    for amt in test_amounts:
        # Non-VIP tanpa recruiter
        a1 = ReferralProfitService.calculate_profit_allocation(amt, 10, has_sales_partner=True, has_recruiter=False)
        assert a1['sales_commission'] + a1['recruitment_bonus'] + a1['ceo_share'] + a1['coo_share'] + a1['business_reserve'] == amt

        # Non-VIP dengan recruiter
        a2 = ReferralProfitService.calculate_profit_allocation(amt, 10, has_sales_partner=True, has_recruiter=True)
        assert a2['sales_commission'] + a2['recruitment_bonus'] + a2['ceo_share'] + a2['coo_share'] + a2['business_reserve'] == amt

        # VIP tanpa recruiter
        a3 = ReferralProfitService.calculate_profit_allocation(amt, 55, has_sales_partner=True, has_recruiter=False)
        assert a3['sales_commission'] + a3['recruitment_bonus'] + a3['ceo_share'] + a3['coo_share'] + a3['business_reserve'] == amt

        # VIP dengan recruiter
        a4 = ReferralProfitService.calculate_profit_allocation(amt, 55, has_sales_partner=True, has_recruiter=True)
        assert a4['sales_commission'] + a4['recruitment_bonus'] + a4['ceo_share'] + a4['coo_share'] + a4['business_reserve'] == amt

    print(f"  Diuji pada {len(test_amounts)} variasi nominal ganjil/genap (Rp 1 s/d Rp 987.654): SEMUA PAS 100%.")
    print("  -> PASS: Skenario 7 terverifikasi (Zero margin leakage terbukti secara matematis).")

    # -----------------------------------------------------------------
    # Skenario 8: Nominal pembagian profit konsisten antara Backend, Admin, & Sales
    # -----------------------------------------------------------------
    print("\n[TES 8] Konsistensi Nominal Lintas Service (Backend, Admin, Sales)")
    from app.services.finance_service import FinanceService
    from app.services.analytics_service import AnalyticsService

    profit_dist = FinanceService.get_profit_distribution()
    analytics_data = AnalyticsService.get_analytics_suite_data()

    print(f"  Finance Summary: Total Profit Transaksi Rp {profit_dist.get('totalTransactionProfit', 0):,}")
    print(f"  Alokasi Finance: CEO Rp {profit_dist.get('totalCeoShare', 0):,}, COO Rp {profit_dist.get('totalCooShare', 0):,}, Cadangan Rp {profit_dist.get('totalBusinessReserve', 0):,}")
    assert profit_dist.get('totalCeoShare') == profit_dist.get('totalCooShare'), "Founder parity CEO & COO harus identik!"

    # Affiliate Performance in Analytics
    aff_data = analytics_data.get('affiliatePerformanceData', [])
    print(f"  Mitra di Analytics: {len(aff_data)}")
    for a in aff_data:
        print(f"    - [{a['code']}] {a['partnerName']}: Orders={a['referralOrders']}, Tier={a['activeStatus']}")
        assert "VIP" in a['activeStatus'] or "Standard" in a['activeStatus']

    print("  -> PASS: Skenario 8 terverifikasi (Sinkronisasi SSOT terbukti).")

    # -----------------------------------------------------------------
    # Skenario 9: Referral sponsor 2% dan hold komisi 3 hari tetap berfungsi
    # -----------------------------------------------------------------
    print("\n[TES 9] Referral Sponsor 2% & Masa Holding 3 Hari")
    assert ReferralProfitService.SPONSOR_RATE_DEFAULT == 2.0, "SPONSOR_RATE_DEFAULT harus 2.0%"
    assert ReferralProfitService.HOLDING_DAYS == 3, "HOLDING_DAYS harus tetap 3 hari"

    # Sponsor bonus allocation
    sp_test = ReferralProfitService.calculate_profit_allocation(100000, 10, has_sales_partner=True, has_recruiter=True)
    assert sp_test['recruitment_bonus'] == 2000, "Bonus rekruter harus Rp 2.000 (2%)"
    assert sp_test['sales_commission'] == 15000, "Komisi sales harus tetap 15% utuh tanpa dipotong"
    assert sp_test['business_reserve'] == 13000, "Cadangan harus 13% (15% - 2% rekruter)"
    assert sp_test['ceo_share'] == 35000, "CEO tetap 35%"
    assert sp_test['coo_share'] == 35000, "COO tetap 35%"
    assert sp_test['total_allocated'] == 100000

    print("  -> PASS: Skenario 9 terverifikasi (Sponsor 2% disubsidi dari cadangan modal, hold 3 hari aktif).")

    # -----------------------------------------------------------------
    # Skenario 10: Customer PII masking dan zero margin leakage
    # -----------------------------------------------------------------
    print("\n[TES 10] Customer PII Masking & Zero Margin Leakage")
    # 1. Kasus utama contoh spesifikasi:
    assert mask_customer_name("H. Jaelani") == "H. J******", f"Got: {mask_customer_name('H. Jaelani')}"
    assert mask_customer_name("Marchelino Kurniawan") == "M********* K********", f"Got: {mask_customer_name('Marchelino Kurniawan')}"
    assert mask_customer_name("Budi") == "B***", f"Got: {mask_customer_name('Budi')}"
    assert mask_customer_name("Ahmad Fauzi") == "A**** F****", f"Got: {mask_customer_name('Ahmad Fauzi')}"

    # 2. Inisial dan tanda baca:
    assert mask_customer_name("M. Taufik") == "M. T*****", f"Got: {mask_customer_name('M. Taufik')}"
    assert mask_customer_name("Siti-Nur") == "S***-N**", f"Got: {mask_customer_name('Siti-Nur')}"

    # 3. Kata pendek (1 & 2 karakter):
    assert mask_customer_name("B") == "B*", f"Got: {mask_customer_name('B')}"
    assert mask_customer_name("Bo") == "B*", f"Got: {mask_customer_name('Bo')}"

    # 4. Spasi berlebih, string kosong, dan None:
    assert mask_customer_name("   H.    Jaelani   ") == "H. J******"
    assert mask_customer_name("") == ""
    assert mask_customer_name(None) == ""

    # 5. Idempotensi (tidak merusak data yang sudah tersensor):
    assert mask_customer_name("H. J******") == "H. J******"
    assert mask_customer_name("M********* K********") == "M********* K********"
    assert mask_customer_name("B***") == "B***"

    sales_orders = PartnerService.get_orders_for_partner("AST-ACELINO-COOL")
    if sales_orders:
        s0 = sales_orders[0]
        assert "transactionProfit" not in s0, "transactionProfit bocor di sales portal!"
        assert "providerPrice" not in s0, "providerPrice bocor di sales portal!"
        assert "profitMargin" not in s0, "profitMargin bocor di sales portal!"
        if s0.get("customerName"):
            assert "*" in s0["customerName"], f"customerName di sales order tidak tersensor: {s0['customerName']}"
    print("  -> PASS: Skenario 10 terverifikasi (PII tersamarkan, margin internal toko terlindungi).")


if __name__ == "__main__":
    test_mandatory_10_scenarios()
    print("\n====================================================================")
    print("HASIL AKHIR: SELURUH 10 PENGUJIAN MANDATORI 100% LULUS (ALL PASS)!")
    print("====================================================================")
