# Asterra Store — Milestone 50 Final Pricing & Database Sync

> **Status:** Production Deployed & Synchronized  
> **Tanggal:** Rabu, 7 Oktober 2026  
> **Terkait:** `docs/asterra-architecture-decoupling-plan.md`, `asterra-referral-profit-model.md`, `Data_Produk_Aktif_Asterra_Store_MILESTONE_50_FINAL.xlsx`

---

## 1. Latar Belakang & Rasional Bisnis

Pada operasional referral Asterra Store, model pembagian keuntungan dirancang dengan aturan:
- **Baseline (Order #1–49):** Komisi Sales adalah **10% dari Profit Transaksi**.
- **Milestone (Mulai Order #50+):** Komisi Sales otomatis naik menjadi **15% dari Profit Transaksi** (kenaikan nominal komisi +50% per transaksi bagi Sales).
- **Recruiter Bonus:** Flat **2% dari Profit Transaksi** (1 level direct recruiter saja).
- **Internal Share:** Profit Distribusi dibagi **40% CEO**, **40% COO**, dan **20% Modal Usaha**.

Agar kenaikan komisi ke 15% pada order ke-50 ke atas tidak menggerus profit bersih yang diterima Asterra Store, dilakukan restrukturisasi harga jual (*Milestone 50 Final Pricing*). Harga final dirancang terukur sehingga profit bersih per 50 order tetap bertumbuh (+14.2% total profit Asterra).

---

## 2. Rincian Perubahan Harga Produk (37 Produk Utama)

Semua harga berikut telah diterapkan ke Database (`products`) serta disinkronkan ke catalog fallback (`data/active-catalog.json`):

| No | Nama Produk | Modal (Supplier) | Harga Lama | Harga Baru (Final) | Margin Laba Baru | Margin % |
|:---|:---|---:|---:|---:|---:|---:|
| 1 | ChatGPT GO Plan 1 Tahun [Private] [Garansi 1 Bln] | Rp 20.000 | Rp 23.000 | **Rp 42.900** | Rp 22.900 | 53.4% |
| 2 | ChatGPT GO Plan 1 Tahun [Private] [Garansi 6 Bln] | Rp 30.000 | Rp 33.000 | **Rp 57.900** | Rp 27.900 | 48.2% |
| 3 | Gemini AI Pro 1 Tahun [Anggota] [Garansi 1 Bln] | Rp 13.000 | Rp 25.000 | **Rp 31.900** | Rp 18.900 | 59.2% |
| 4 | Gemini AI Pro 1 Tahun [Anggota] [Garansi 3 Bln] | Rp 18.000 | Rp 21.000 | **Rp 42.900** | Rp 24.900 | 58.0% |
| 5 | Gemini AI Pro 1 Tahun [Anggota] [Garansi 6 Bln] | Rp 28.000 | Rp 31.000 | **Rp 58.900** | Rp 30.900 | 52.5% |
| 6 | Gemini AI Pro 1 Tahun [Head Invite 5] [Garansi 1 Bln] | Rp 45.000 | Rp 49.000 | **Rp 72.900** | Rp 27.900 | 38.3% |
| 7 | Gemini AI Pro 1 Tahun [Head Invite 5] [Garansi 3 Bln] | Rp 60.000 | Rp 65.000 | **Rp 105.900** | Rp 45.900 | 43.3% |
| 8 | Gemini AI Pro 1 Tahun [PRIVATE] [Garansi 6 Bln] | Rp 100.000 | Rp 108.000 | **Rp 156.900** | Rp 56.900 | 36.3% |
| 9 | Google AI Pro [18 Bulan] [PRIVATE] [Garansi 1 Bln] | Rp 9.500 | Rp 50.000 | **Rp 89.900** | Rp 80.400 | 89.4% |
| 10 | Alightmotion Private 1 Tahun [Garansi 3 Bln] | Rp 5.000 | Rp 8.000 | **Rp 15.900** | Rp 10.900 | 68.6% |
| 11 | BsTation Premium 1 Bulan [Shared 1 Device] | Rp 4.000 | Rp 7.000 | **Rp 10.900** | Rp 6.900 | 63.3% |
| 12 | BsTation Premium 1 Tahun [Shared 1 Device] | Rp 20.000 | Rp 29.000 | **Rp 42.900** | Rp 22.900 | 53.4% |
| 13 | BsTation Premium 3 Bulan [Shared 1 Device] | Rp 10.500 | Rp 14.000 | **Rp 20.900** | Rp 10.400 | 49.8% |
| 14 | Canva Education 1 Tahun [Garansi 6 Bln] | Rp 11.500 | Rp 14.000 | **Rp 26.900** | Rp 15.400 | 57.2% |
| 15 | Canva Pro 1 Bulan | Rp 5.000 | Rp 12.000 | **Rp 15.900** | Rp 10.900 | 68.6% |
| 16 | Canva Pro Anggota 1 Bulan [Garansi 1 Bln] | Rp 1.300 | Rp 4.000 | **Rp 6.900** | Rp 5.600 | 81.2% |
| 17 | Canva Pro Anggota 2 Bulan [Garansi 2 Bln] | Rp 2.500 | Rp 5.000 | **Rp 10.900** | Rp 8.400 | 77.1% |
| 18 | Canva Pro Desainer 1 Bulan [Garansi 1 Bln] | Rp 2.300 | Rp 5.000 | **Rp 9.900** | Rp 7.600 | 76.8% |
| 19 | IQIYI Premium 1 Bulan [Shared] | Rp 10.000 | Rp 13.000 | **Rp 17.900** | Rp 7.900 | 44.1% |
| 20 | IQIYI Premium 1 Bulan [Shared] [Promo] | Rp 7.000 | Rp 10.000 | **Rp 13.900** | Rp 6.900 | 49.6% |
| 21 | ChatGPT Plus 1 Bulan [Private] [Garansi 14 Hari] | Rp 70.000 | Rp 76.000 | **Rp 97.900** | Rp 27.900 | 28.5% |
| 22 | ChatGPT Plus 1 Bulan [Private] [Garansi 28 Hari] | Rp 47.000 | Rp 51.000 | **Rp 95.900** | Rp 48.900 | 51.0% |
| 23 | ChatGPT Plus 3 Bulan [Private] [Garansi 1 Bln] | Rp 50.000 | Rp 54.000 | **Rp 152.900** | Rp 102.900 | 67.3% |
| 24 | VIU Private 12 Bulan [1 Device] [Garansi 1 Bln] | Rp 4.500 | Rp 7.500 | **Rp 13.900** | Rp 9.400 | 67.6% |
| 25 | CapCut Private 1 Bulan [Garansi 7 Hari] | Rp 10.000 | Rp 15.000 | **Rp 20.900** | Rp 10.900 | 52.2% |
| 26 | CapCut Private 30 Hari [Garansi 25 Hari] [Reg Indo] | Rp 34.000 | Rp 37.000 | **Rp 63.900** | Rp 29.900 | 46.8% |
| 27 | CapCut Private 7 Hari [Garansi 5 Hari] | Rp 6.500 | Rp 9.500 | **Rp 13.900** | Rp 7.400 | 53.2% |
| 28 | CapCut Shared 1 Bulan [1 Device] | Rp 11.000 | Rp 14.000 | **Rp 20.900** | Rp 9.900 | 47.4% |
| 29 | CapCut Shared 1 Tahun [1 Device] [Garansi 6 Bln] | Rp 15.000 | Rp 18.000 | **Rp 42.900** | Rp 27.900 | 65.0% |
| 30 | CapCut Shared 1 Bulan [2 User] [Garansi 28 Hari] (s3) | Rp 16.500 | Rp 19.000 | **Rp 25.900** | Rp 9.400 | 36.3% |
| 31 | CapCut Shared 1 Bulan [2 User] [Garansi 28 Hari] (s2) | Rp 16.000 | Rp 19.000 | **Rp 27.900** | Rp 11.900 | 42.7% |
| 32 | CapCut Shared 1 Bulan [2 User] [Garansi 7 Hari] | Rp 13.000 | Rp 16.000 | **Rp 20.900** | Rp 7.900 | 37.8% |
| 33 | Vidio Platinum 1 Bulan [Private Mobile] | Rp 27.000 | Rp 30.000 | **Rp 41.900** | Rp 14.900 | 35.6% |
| 34 | Vidio Platinum 1 Bulan [Shared Mobile] | Rp 15.000 | Rp 19.500 | **Rp 25.900** | Rp 10.900 | 42.1% |
| 35 | VIU Private 12 Bulan [1 Device] [Garansi 3 Bln] | Rp 6.500 | Rp 12.000 | **Rp 17.900** | Rp 11.400 | 63.7% |
| 36 | WeTV Premium 1 Bulan [Private] | Rp 30.000 | Rp 33.000 | **Rp 52.900** | Rp 22.900 | 43.3% |
| 37 | WeTV Premium 1 Bulan [Shared 1 Device] | Rp 8.500 | Rp 12.000 | **Rp 20.900** | Rp 12.400 | 59.3% |

---

## 3. Standardisasi Workbook & Perapihan Semua Tabel

File Excel telah diperbarui dan direkonstruksi secara penuh:
- File Utama: `Data_Produk_Aktif_Asterra_Store_MILESTONE_50_FINAL.xlsx`
- Export Rutin: `Data_Produk_Aktif_Asterra_Store.xlsx` (dapat diregenerasi kapan saja via `npm run export:excel`).

### Standar Struktur 4 Sheet:
1. **Sheet 1: `Produk Aktif`**
   - 41 produk aktif terkini di database Asterra Store.
   - Kolom: No, Nama Produk, Tipe Produk, Jenis (Private/Sharing), Status Tersedia, Modal, Harga Jual, Margin Rp, Margin %, Kode Layanan.
   - Badge warna: Private (Biru), Sharing (Kuning), Tersedia (Hijau), Kosong (Merah).
   - Baris Total & Rata-rata otomatis (`=SUM(...)`, `=AVERAGE(...)`).
2. **Sheet 2: `Semua Produk (DB)`**
   - 236 master produk lengkap (Aktif + Diarsipkan).
   - Dilengkapi filter, badge status toko, format mata uang `Rp #,##0`.
3. **Sheet 3: `Katalog Fallback (JSON)`**
   - 245 produk fallback offline dari `data/active-catalog.json`.
4. **Sheet 4: `Pricing Strategy`**
   - Dashboard KPI & Unit Economics Milestone 50.
   - Header Card A: Parameter Referral (Diskon Rp 1.000, Sales Baseline 10%, Sales Milestone 15%, Recruiter 2%, CEO 40%, COO 40%, Modal 20%).
   - Header Card B: Portfolio Impact 37 Produk (Total listed, total gross profit, delta uplift Rp 99.000).
   - Header Card C: Simulasi 50 Order (Profit Asterra +Rp 116.662, Komisi Sales +Rp 14.446, komisi sales naik +50% per transaksi).
   - Tabel Unit Economics lengkap dengan rumus dinamis komisi, recruiter, dan pembagian laba internal.
   - Catatan ketentuan non-retroaktif di bagian footer.

---

## 4. Perintah Operasional Terkait

- **Export Ulang Excel:**
  ```bash
  npm run export:excel
  ```
- **File Konfigurasi Tetap Milestone:**
  `data/pricing-strategy-milestone-50.json`
- **Database Engine Sync:**
  `scripts/apply_excel_prices_to_db.js`
