# Asterra Store — Referral & Profit Distribution Architecture

> **Dokumen Implementasi Teknis & Arsitektur Sistem**  
> **Status:** Production-Ready  
> **Single Source of Truth (SSOT):** [asterra-referral-profit-model.md](../asterra-referral-profit-model.md)  
> **Tanggal Implementasi:** 04 Oktober 2026  

---

## 1. Latar Belakang & Prinsip Utama

Asterra Store mengimplementasikan sistem pembagian laba dan referral yang secara ketat berakar pada **Profit Bersih Transaksi** (*Transaction Profit*), **BUKAN dari Omzet Kotor** (*Gross Revenue*).

### Hukum Mutlak (Strict Zero-Tolerance Protocol)
1. **Dilarang Menghitung Komisi dari Omzet**:
   Setiap komisi mitra sales wajib dihitung 10% dari Profit Transaksi, bukan dari harga jual atau omzet kotor.
2. **Kemitraan Setara CEO & COO**:
   Sisa profit setelah komisi dibagi dengan formula mutlak:
   - **CEO**: 40%
   - **COO**: 40% (CEO === COO strictly equal)
   - **Modal Usaha**: 20%
3. **Skema Tier Komisi Otomatis (Progressive Milestone)**:
   - **Standard Sales (1 - 49 Order)**: Komisi **10% dari Profit Transaksi**.
   - **VIP Sales (≥ 50 Order)**: Otomatis naik ke **15% dari Profit Transaksi**.
   - Seluruh komisi tetap dihitung murni dari Profit Transaksi, menjamin Asterra selalu memegang 83% - 90% profit bersih.
4. **Bonus Rekrutmen 1-Level (Direct Recruiter Only)**:
   Rekruter langsung mitra sales menerima **2% dari Profit Transaksi**, maksimal 1 tingkat vertikal. Tingkat di atasnya menerima Rp 0 (bukan skema piramida/multi-level).
4. **Diskon Customer Referral 1-Kali**:
   Pelanggan baru yang berbelanja menggunakan link/kode referral berhak atas diskon (default Rp 1.000) tepat 1 kali seumur hidup per identitas unik (email & nomor telepon terikat). Diskon dipotong sebelum kalkulasi profit.
5. **Holding Maturity 3 Hari**:
   Seluruh komisi dan bonus ditahan dengan status `pending` selama 3 hari sebelum matang menjadi `available` guna memitigasi risiko refund dan penipuan.
6. **Clawback & Reversal**:
   Pembatalan pesanan atau refund otomatis membalikkan jurnal pembukuan dan memotong saldo dompet komisi terkait.

---

## 2. Alur & Rumus Waterfall P&L

```text
Harga Jual Produk (Selling Price)
       │
       ▼
(-) Diskon Customer Referral (1x seumur hidup)
       │
       ▼
(=) Net Revenue (Pendapatan Bersih Sebelum Biaya Langsung)
       │
       ▼
(-) Biaya Langsung Transaksi (COGS Supplier VIP + Payment Gateway Fee)
       │
       ▼
(=) PROFIT TRANSAKSI BERSIH (Transaction Profit = Math.max(0, Net Revenue - Biaya Langsung))
       │
       ├────────────────────────────────────────┐
       ▼                                        ▼
(-) Komisi Direct Sales                 (-) Recruitment Bonus (Upline)
(10% × Profit Transaksi)                (2% × Profit Transaksi, Max 1 Level)
       │                                        │
       └───────────────────┬────────────────────┘
                           ▼
(=) TOTAL PROFIT DISTRIBUSI (Sisa Laba Bersih)
                           │
       ┌───────────────────┼────────────────────┐
       ▼                   ▼                    ▼
   Bagian CEO          Bagian COO          Modal Usaha
 (40% Distribusi)    (40% Distribusi)   (20% Distribusi)
```

### Jaminan Integer Rounding & Presisi
Setiap pembagian nilai menggunakan pembulatan integer (`Math.floor` / `Math.round`) dengan penyesuaian selisih ke modal usaha, memastikan jumlah akumulasi `ceoShare + cooShare + businessReserve === profitDistribution` dan `ceoShare === cooShare` selalu terverifikasi secara matematis.

---

## 3. Komponen Teknis & Layanan

| Modul / File | Fungsi & Tanggung Jawab |
|---|---|
| `src/lib/services/referral-profit.service.ts` | Kalkulator matematis murni sesuai rumus SSOT dengan pembulatan integer dan penanganan kasus A, B, C. |
| `src/lib/services/referral-discount.service.ts` | Validasi diskon 1x per pelanggan, pencegahan self-referral, pencatatan persisten di `data/referral-discounts.json`. |
| `src/lib/services/profit-ledger.service.ts` | Buku besar audit Section 8 (`data/profit-ledger.json`), manajemen holding 3 hari, pembalikan refund, dan agregasi finansial. |
| `src/lib/services/affiliate.service.ts` | Manajemen mitra sales, komisi profit 10%, bonus rekrutmen 2%, penyesuaian clawback saldo negatif jika terjadi refund. |
| `src/app/api/v1/orders/route.ts` | Integrasi pemotongan diskon 1x saat checkout dan pencatatan penggunaan kode referral customer. |
| `src/lib/services/order-admin.service.ts` | Pemicu eksekusi profit sharing saat pesanan berstatus `completed` atau `refunded` menggunakan harga modal riil provider. |
| `src/app/api/v1/admin/profit-distribution/route.ts` | API superadmin untuk ringkasan pembagian laba dan jurnal audit Section 8. |
| `src/components/admin/admin-finance-suite.tsx` | Dashboard tab Keuangan > Profit dengan kartu 40% CEO / 40% COO / 20% Modal, Waterfall P&L, dan Section 8 Audit Ledger. |
| `src/components/sales/sales-console-suite.tsx` | Console Sales dengan metrik riil profit transaksi, komisi 10% profit, bonus tim 2% profit, dan materi edukasi akademi. |
| `src/app/daftar-sales/page.tsx` | Pendaftaran publik sales dengan simulasi proyeksi komisi berbasis profit transaksi. |

---

## 4. Section 8 Audit Trail

Setiap transaksi yang selesai secara otomatis dicatat ke dalam buku besar dengan atribut lengkap:
- `orderId`, `customerEmail`, `productId`, `productNames`
- `salesId`, `referralCode`, `recruiterSalesId`
- `sellingPrice`, `customerReferralDiscount`, `netRevenue`
- `costOfGoods`, `paymentFee`, `directTransactionCost`
- `transactionProfit`
- `salesCommission`, `recruitmentBonus`, `profitDistribution`
- `ceoShare`, `cooShare`, `businessReserve`
- `status` (`pending`, `available`, `withdrawn`, `reversed`), `holdingUntil`
