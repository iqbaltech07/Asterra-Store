# Integrasi Backend FastAPI Asterra Store

## 📌 Ringkasan Masalah & Akar Penyebab 404
Sebelumnya terjadi error 404 saat frontend mengakses backend karena 3 faktor utama:
1. **Mismatch URL Prefix**: Frontend Next.js me-rewrite request `/api/:path*` ke `${BACKEND_URL}/api/:path*`. Namun di FastAPI rute hanya didaftarkan sebagai `/v1/...` (tanpa `/api/`), sehingga request ke `/api/v1/products` otomatis menghasilkan 404 Not Found.
2. **Inkonsistensi Konfigurasi Port**: `frontend-admin` dan `frontend-sales` masih mengarah ke `http://localhost:4000` (port legacy Next.js BFF yang tidak aktif), sementara backend yang dijalankan pengguna adalah FastAPI di `http://localhost:8000`.
3. **Endpoint FastAPI Belum Lengkap**: Endpoint di `backend/app/main.py` sebelumnya hanya berupa stub kosong (5 rute) tanpa data katalog aktif, payment configuration, order creation, promo validation, dan rute admin.

---

## 🛠️ Solusi & Integrasi yang Diterapkan
1. **Dual Prefix Routing**:
   Seluruh router FastAPI kini didaftarkan di dua prefix sekaligus:
   - `/api/v1` (kompatibel dengan rewrites dan panggilan frontend)
   - `/v1` (kompatibel dengan direct API call)
2. **Katalog Produk Aktif**:
   `CatalogService` memuat dan memfilter 245 produk aktif dari `backend/data/active-catalog.json`, mendukung pencarian (`search`) dan filter kategori (`category`).
3. **Konfigurasi Pembayaran**:
   `PaymentConfigService` menyajikan konfigurasi publik (QRIS, BCA, DANA, CS WhatsApp) dan konfigurasi admin.
4. **Validasi Kupon Promo**:
   `PromoService` memvalidasi kupon (`ASTERRA2026`, dll.) dan menghitung nominal diskon secara akurat.
5. **Manajemen Order & Pembayaran**:
   `OrderService` mengelola pembuatan order, kode unik transfer, status lifecycle (`pending`, `completed`, `cancelled`), dan kalkulasi metrik pesanan admin.
6. **Kalkulasi Komisi Sales**:
   `ReferralProfitService` terintegrasi langsung untuk menghitung komisi mitra 10% dan bonus sponsor 2% via endpoint `/sales/waterfall/calculate`.
7. **Real-time Server-Sent Events (SSE)**:
   Endpoint `/events` menyiarkan heartbeat dan event stream untuk storefront dan admin.
8. **Sinkronisasi Konfigurasi Frontend**:
   Semua file `.env`, `.env.example`, `next.config.ts`, dan `src/lib/env.ts` di `frontend-user`, `frontend-admin`, dan `frontend-sales` telah diselaraskan ke `http://localhost:8000`.

---

## 🧪 Hasil Verifikasi Integrasi
- `http://localhost:3000/api/v1/products` ➔ **200 OK** (245 Produk)
- `http://localhost:3001/api/v1/payment-config` ➔ **200 OK** (Gateway BCA & QRIS)
- `http://localhost:3002/api/v1/sales/me` ➔ **200 OK** (Profil Mitra & Komisi)
- `http://localhost:8000/api/v1/admin/orders` ➔ **200 OK** (Daftar & Metrik Pesanan)
- Validasi Promo `ASTERRA2026` ➔ **200 OK** (Diskon 10% aktif)
- Pembuatan Pesanan (`POST /api/v1/orders`) ➔ **200 OK** (ID Pesanan ter-generate & tersimpan)
