# Asterra Store Admin Console — Modular Architecture & 24 Menu Directives

- **Project**: Asterra Store
- **Domain**: Enterprise Admin Portal & Operational Architecture
- **Date**: 2026-10-03
- **Status**: Production Deployed

---

## 🏛️ 1. Executive Summary & Design Constitution

Asterra Store Admin Console dirancang sebagai **SaaS Operational Command Hub**, mematahkan anti-pattern "CRUD Generator Table" yang monoton. Setiap modul memiliki karakteristik visual dan interaktivitas unik yang disesuaikan dengan peran domainnya:

1. **Dashboard** = Command Center (Alerts, KPIs, radar performa affiliate/supplier).
2. **Katalog Produk** = Retail Merchandise Manager (Bulk actions, in-memory filtering, duplicate product, profit margin calculations).
3. **Kategori** = Taxonomy Hierarchy Manager (Reordering, safe delete checks).
4. **Import VIP Reseller** = In-memory Cache Explorer (12,500+ services, instant filtering, markup rules).
5. **Provider / Supplier** = API Operations Hub (Real-time latency ping, success rate health meter, credential vaults).
6. **Pesanan Pelanggan** = Real-time Order Stream (SSE listeners, audio chimes, fulfillment retries).
7. **Pelanggan** = Customer 360 CRM (Lifetime value, member tiers, WhatsApp deep links, purchase history).
8. **Refund & Komplain** = Issue Resolution Center (Lifecycle stages, internal staff notes, replacement dispatch).
9. **Affiliate / Sales** = Partner Growth & Commission Engine (Referral codes, custom tiers, payout queue).
10. **Voucher & Promo** = Campaign Discount Engine (Quota limits, discount types, validity ranges).
11. **Campaign** = Promotional Studio (Flash sale scheduling, category targeting, conversion telemetry).
12. **Banner & Konten** = Storefront CMS (Hero carousels, responsive device preview desktop/mobile, deduplicated Blob uploads).
13. **Saldo & Wallet** = Multi-Wallet Treasury (Tripay settlement, VIP upstream balance, escrow warranty reserve).
14. **Pendapatan** = Revenue Intelligence (Gross sales breakdown, payment method distribution).
15. **Pengeluaran** = Cost Center (COGS and operational expense tracking).
16. **Profit** = Waterfall Financial Analysis (Gross Revenue - COGS - PG Fees - Commissions - OpEx = Net Profit).
17. **Riwayat Transaksi** = Double-Entry General Ledger (Chronological audit trails, running balances).
18. **Ringkasan Penjualan** = Sales Analytics BI (Interactive time-series charts, AOV, acquisition channels).
19. **Performa Produk** = Merchandise Matrix (Gross profit per item, refund rate tolerance, unit rankings).
20. **Performa Affiliate** = Sales Attribution Telemetry (Clicks-to-orders, conversion rate, payout ROI).
21. **Laporan Keuangan** = Formal Income Statement (Audited P&L statements, Excel & Printable PDF).
22. **Metode Pembayaran** = Payment Infrastructure (Tripay credentials, QRIS dynamic, manual bank accounts).
23. **Log & Audit Gateway** = Technical Debugging (HTTP status, latency profiling, payload inspection).
24. **Notifikasi** = Messaging Dispatcher (WhatsApp Fonnte/OpenWA bot, dynamic message templating).
25. **Kelola Staff & Admin** = Access Control & RBAC (Superadmin/Admin roles, session revocations).
26. **Pengaturan Toko** = Master Preferences (Sectioned tabs for identity, CS WhatsApp, checkout rules, warranty, SEO).

---

## 📐 2. Component Structure

```
src/components/admin/
├── admin-sidebar.tsx                # Clean accordion sidebar (no decorative symbols)
├── admin-dashboard-tab.tsx          # Executive command center
├── admin-orders-tab.tsx             # Real-time SSE order queue
├── admin-categories-tab.tsx         # Taxonomy & display order
├── admin-providers-tab.tsx          # API operations & supplier health
├── admin-customers-tab.tsx          # Customer 360 CRM
├── admin-refunds-tab.tsx            # Resolution center
├── admin-affiliate-tab.tsx          # Affiliate & sales partner hub
├── admin-promos-tab.tsx             # Voucher & promo codes
├── admin-marketing-suite.tsx        # Campaigns studio & Storefront CMS banners
├── admin-finance-suite.tsx          # Multi-wallet, Revenue, Expenses, Waterfall Profit, Ledger
├── admin-analytics-suite.tsx        # Sales BI, Product matrix, Affiliate telemetry, Formal P&L
├── admin-system-settings-suite.tsx  # WhatsApp notification rules & Master store settings
├── admin-payment-settings-tab.tsx   # Gateway & payment modes
├── admin-logs-tab.tsx               # Technical audit logs
└── admin-users-tab.tsx              # Staff RBAC management
```

---

## 🌟 4. Sales Partner Registration System (`/daftar-sales`)

Halaman publik pendaftaran mitra sales Asterra Store dengan formulir lengkap dan feedback instan:
- **Route**: `/daftar-sales`
- **Fields**:
  - `nama`: Nama lengkap pendaftar
  - `email`: Alamat email aktif
  - `whatsapp`: Nomor WhatsApp aktif
  - `referralCode`: Kode referral pengajak (opsional, auto-fill via query param `?ref=...` dengan validasi real-time)
  - `customCode`: Kustomisasi kode unik sendiri (opsional)
- **Interactive Features**:
  - Validasi real-time status kode referral pengajak (`GET /api/v1/affiliate/validate-referral`)
  - Slider kalkulator proyeksi komisi bulanan
  - Tampilan sukses dengan tombol salin link referral instan
  - Tombol WhatsApp Customer Service untuk orientasi & materi promosi
  - Integrasi navigasi di Header & Footer
- **Backend Service**:
  - `src/lib/services/affiliate.service.ts`: Pengelolaan data mitra sales, auto-generate kode referral unik, deteksi duplikasi.
  - `POST /api/v1/affiliate/register`: Endpoint pendaftaran publik.
  - `GET /api/v1/admin/affiliates`: Sinkronisasi otomatis ke dashboard admin `Affiliate / Sales`.

