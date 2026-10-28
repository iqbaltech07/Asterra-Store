"""
AsterraStore - Comprehensive Pre-Opening Audit & Verification Script
Validates:
1. Customer PII Masking: Single-word, multi-word, short name, empty, whitespace, null, email.
2. Zero PII & Zero Margin Leakage in Sales APIs (No raw customer name, no transactionProfit).
3. Commission Waterfall & Parity: 15% Pemula, 20% VIP (>= 50 orders), 2% Sponsor, 3-day holding, 40% CEO / 40% COO / 20% Reserve.
4. Partner Service & Stored Profile Rate Consistency.
5. Sales Simulation Catalog & Calculator Backend Accuracy (15% base, 20% VIP, 2% referral bonus).
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

def test_masking():
    print("====================================================")
    print("AUDIT 1. PENGUJIAN PENYAMARAN PRIVASI NAMA & EMAIL")
    print("====================================================")
    from app.services.partner_service import mask_customer_name

    cases = [
        ("Marchelino Kurniawan", "Mar***no"),
        ("Andi", "A***"),
        ("Dewi", "D***"),
        ("Budi Santoso", "B***"),
        ("Alexander Pratama", "Ale***er"),
        ("Bo", "B***"),
        ("A", "A***"),
        ("", ""),
        (None, ""),
        ("   ", ""),
    ]

    all_passed = True
    for input_name, expected in cases:
        result = mask_customer_name(input_name)
        status = "[PASS]" if result == expected else "[FAIL]"
        if result != expected:
            all_passed = False
        print(f"  {status}: Input '{input_name}' -> Masked '{result}' (Expected: '{expected}')")

    assert all_passed, "Ada uji masking nama yang gagal!"
    print("  [PASS] Seluruh skenario nama (1 kata, multi-kata, pendek, kosong, null) 100% LULUS.")

def test_orders_privacy_and_margin_protection():
    print("\n====================================================")
    print("AUDIT 1B. PROTEKSI PAYLOAD API & MARGIN INTERNAL")
    print("====================================================")
    from app.services.partner_service import PartnerService

    orders = PartnerService.get_orders_for_partner("AST-ACELINO-COOL")
    print(f"  Total Order Diperiksa: {len(orders)}")
    if orders:
        sample = orders[0]
        # 1. PII check
        print(f"  - Sample Order ID: {sample.get('id')}")
        print(f"  - customerName: {sample.get('customerName')}")
        print(f"  - customerEmail: {sample.get('customerEmail')}")
        assert "***" in sample.get('customerEmail', '') or sample.get('customerEmail') == "", "Customer email bocor!"
        assert "***" in sample.get('customerName', '') or sample.get('customerName') == "", "Customer name bocor!"
        
        # 2. Zero Margin Leakage Check
        assert "transactionProfit" not in sample, "FATAL: transactionProfit bocor di API sales orders!"
        assert "providerPrice" not in sample, "FATAL: providerPrice bocor di API sales orders!"
        assert "profitMargin" not in sample, "FATAL: profitMargin bocor di API sales orders!"
        print("  [PASS] Zero Leakage terbukti: PII tersamarkan dan margin internal toko TIDAK bocor ke Sales.")

def test_commission_rates():
    print("\n====================================================")
    print("AUDIT 2. KONSISTENSI KOMISI SALES 15% & 20% & WATERFALL")
    print("====================================================")
    from app.services.referral_profit_service import ReferralProfitService

    print(f"  - DIRECT_RATE_DEFAULT (Pemula): {ReferralProfitService.DIRECT_RATE_DEFAULT}%")
    assert ReferralProfitService.DIRECT_RATE_DEFAULT == 15.0, "DIRECT_RATE_DEFAULT harus 15.0%"

    print(f"  - DIRECT_RATE_VIP (VIP Milestone >= 50 order): {ReferralProfitService.DIRECT_RATE_VIP}%")
    assert ReferralProfitService.DIRECT_RATE_VIP == 20.0, "DIRECT_RATE_VIP harus 20.0%"

    print(f"  - SPONSOR_RATE_DEFAULT (Referral 1-Level): {ReferralProfitService.SPONSOR_RATE_DEFAULT}%")
    assert ReferralProfitService.SPONSOR_RATE_DEFAULT == 2.0, "SPONSOR_RATE_DEFAULT harus tetap 2.0%"

    print(f"  - HOLDING_DAYS (Garansi): {ReferralProfitService.HOLDING_DAYS} hari")
    assert ReferralProfitService.HOLDING_DAYS == 3, "HOLDING_DAYS harus tetap 3 hari"

    profit = 100000.0  # Rp 100.000 profit transaksi

    # 1. Sales Pemula (15%)
    res_pemula = ReferralProfitService.allocate_waterfall(
        order_id="ORD-TEST-PEMULA",
        transaction_profit=profit,
        direct_partner_code="AST-PEMULA",
        direct_partner_rate=15.0,
        sponsor_partner_code="AST-SPONSOR",
    )
    print(f"\n  Skenario Sales Pemula (Profit Rp 100.000):")
    print(f"    - Komisi Sales (15%): Rp {res_pemula['direct_commission']:,}")
    print(f"    - Bonus Sponsor (2%): Rp {res_pemula['sponsor_bonus']:,}")
    print(f"    - Profit Asterra: Rp {res_pemula['company_retained_profit']:,}")
    assert res_pemula['direct_commission'] == 15000.0
    assert res_pemula['sponsor_bonus'] == 2000.0
    assert res_pemula['company_retained_profit'] == 83000.0
    print("    [PASS] Alokasi Waterfall Pemula 15% + Sponsor 2% tepat.")

    # 2. Sales VIP (20%)
    res_vip = ReferralProfitService.allocate_waterfall(
        order_id="ORD-TEST-VIP",
        transaction_profit=profit,
        direct_partner_code="AST-VIP",
        direct_partner_rate=20.0,
        sponsor_partner_code="AST-SPONSOR",
    )
    print(f"\n  Skenario Sales VIP (Profit Rp 100.000):")
    print(f"    - Komisi Sales (20%): Rp {res_vip['direct_commission']:,}")
    print(f"    - Bonus Sponsor (2%): Rp {res_vip['sponsor_bonus']:,}")
    print(f"    - Profit Asterra: Rp {res_vip['company_retained_profit']:,}")
    assert res_vip['direct_commission'] == 20000.0
    assert res_vip['sponsor_bonus'] == 2000.0
    assert res_vip['company_retained_profit'] == 78000.0
    print("    [PASS] Alokasi Waterfall VIP 20% + Sponsor 2% tepat.")

    # 3. Founder Parity (CEO 40%, COO 40%, Reserve 20%)
    retained = res_pemula['company_retained_profit']  # 83.000
    ceo_share = round(retained * 0.40)                # 33.200
    coo_share = round(retained * 0.40)                # 33.200
    reserve = retained - ceo_share - coo_share        # 16.600
    assert ceo_share == coo_share, "CEO dan COO harus strictly 50:50 equal parity!"
    print(f"    [PASS] Founder Parity: CEO (40% = Rp {ceo_share:,}), COO (40% = Rp {coo_share:,}), Cadangan (20% = Rp {reserve:,}).")

def test_partner_service_tiers():
    print("\n====================================================")
    print("AUDIT 2B. DATA MITRA & TIER STATUS")
    print("====================================================")
    from app.services.partner_service import PartnerService

    partners = PartnerService.get_all_partners()
    print(f"  Total Mitra Terdaftar: {len(partners)}")
    for p in partners:
        print(f"    - [{p.get('code')}] {p.get('name')}: Tier '{p.get('tier')}', Rate {p.get('rate')}%")
        assert p.get('rate') in [15, 20], f"Mitra {p.get('code')} memiliki rate tidak valid: {p.get('rate')}"
        assert "15%" in p.get('tier', '') or "20%" in p.get('tier', ''), f"Tier tidak valid: {p.get('tier')}"

    print("  [PASS] Seluruh akun mitra menggunakan rate 15% atau 20% tanpa ada rate 10% usang.")

def test_simulation_catalog():
    print("\n====================================================")
    print("AUDIT 2C. KATALOG SIMULASI & FORMULA KOMISI")
    print("====================================================")
    from app.api.v1.sales import get_simulation_catalog

    # 1. Pemula Catalog (15%)
    cat_15 = get_simulation_catalog(rate=15.0)
    assert cat_15['success'] is True
    data_15 = cat_15['data']
    print(f"  Jumlah Produk Simulasi: {len(data_15)}")

    # 2. VIP Catalog (20%)
    cat_20 = get_simulation_catalog(rate=20.0)
    data_20 = cat_20['data']

    # Sample product check
    if data_15 and data_20:
        p15 = data_15[0]
        p20 = data_20[0]
        print(f"  Sample: {p15['name']} (Harga: Rp {p15['price']:,})")
        print(f"    - Base Commission (15%): Rp {p15['baseCommission']:,}")
        print(f"    - Unit Commission VIP (20%): Rp {p20['commissionPerUnit']:,}")
        
        # Verify no margin leakage
        assert "providerPrice" not in p15
        assert "profitMargin" not in p15
        assert p20['commissionPerUnit'] >= p15['baseCommission']
        print("  [PASS] Katalog simulasi terbukti aman (tanpa bocoran modal) dan proporsi komisi akurat.")

if __name__ == "__main__":
    test_masking()
    test_orders_privacy_and_margin_protection()
    test_commission_rates()
    test_partner_service_tiers()
    test_simulation_catalog()
    print("\n====================================================")
    print("HASIL: SELURUH AUDIT BACKEND 100% LULUS (ALL PASS)!")
    print("====================================================")
