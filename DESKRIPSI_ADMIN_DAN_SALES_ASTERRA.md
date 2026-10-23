# DOKUMENTASI & DESKRIPSI LENGKAP
# ASTERRASTORE: ADMIN CONSOLE & SALES PORTAL

Dokumen ini menyajikan ringkasan dan rincian arsitektur antarmuka (UI), fungsionalitas, alur bisnis, serta sistem motion dari dua portal utama platform e-commerce produk digital **AsterraStore**:
1. **Admin Console AsterraStore** (`http://localhost:3001/admin`)
2. **Sales Portal AsterraStore** (`http://localhost:3002/sales`)

---

## 1. ADMIN CONSOLE ASTERRASTORE
- **URL Akses Default**: `http://localhost:3001/admin`
- **Route Login**: `http://localhost:3001/admin/login`
- **Akun Default Pengujian**: `admin@asterra.store` / `AsterraAdmin#2026`
- **Tujuan Utama**: Pusat kendali operasional bisnis menyeluruh untuk manajemen katalog produk digital (Canva Pro, Gemini AI, Spotify, Netflix, dll.), pemantauan pesanan gateway secara live, pengawasan stok supplier VIP Reseller, analitik margin laba/HPP, serta pembinaan jaringan mitra sales.

### A. Fitur & Komponen Utama Halaman Admin

1. **Top Header & Action Bar**:
   - **Breadcrumb Navigasi**: Menampilkan posisi menu aktif (misal: *Admin Console / Overview / Dashboard Eksekutif*).
   - **Tombol Sinkronkan VIP**: Menghubungi API supplier VIP Reseller secara live untuk mengimpor dan memutakhirkan katalog layanan.
   - **Tombol Cek Stok**: Memeriksa ketersediaan stok server dan supplier secara real-time.
   - **Tombol Tambah Produk**: Membuka modal form komprehensif untuk merilis produk digital baru, menentukan harga modal, harga jual, margin, dan fitur layanan.

2. **5 Kartu Eksekutif Utama (Top Executive Metrics)**:
   - **Total Revenue (Omzet Kotor)**: Total pendapatan kotor dari seluruh transaksi lunas.
   - **Total Orders (Jumlah Transaksi)**: Akumulasi seluruh pesanan yang berhasil diproses oleh gateway.
   - **Customers CRM**: Jumlah basis data pelanggan aktif terdaftar.
   - **Gross Profit (Estimasi Laba Kotor)**: Perhitungan margin bersih keuntungan setelah dikurangi biaya modal (HPP).
   - **Pending Orders**: Jumlah pesanan yang sedang menunggu pembayaran atau verifikasi manual.
   *Dilengkapi animasi transisi angka halus (`useCountUp`) dengan kurva cubic-out 500ms tanpa flicker saat refresh data.*

3. **Visualizer Tren Penjualan (Sales Trend Visualizer)**:
   - **Filter Periode Interaktif**: Pilihan filter periode *Hari Ini*, *7 Hari*, dan *30 Hari*.
   - **Monetira Sliding Indicator**: Tombol pill aktif berpindah dengan animasi sliding presisi mengikuti klik pengguna.
   - **Smooth Bar Height Interpolation**: Setiap batang grafik bervolume dinamis bertransisi ketinggiannya secara halus (`transition-[height] duration-500ms`) tanpa memuat ulang (remount) canvas.
   - **Micro-elevation Tooltip**: Tooltip popover menampilkan nominal rupiah presisi saat kursor diarahkan ke masing-masing bar tanggal/jam.

4. **Tabel Transaksi Terbaru (Recent Transactions)**:
   - Daftar pesanan real-time yang memuat ID Pesanan, Nama Pembeli, Waktu Pembelian, Metode Pembayaran (QRIS, VA, E-Wallet), Total Tagihan, dan Badge Status (*Lunas, Diproses, Pending, Dibatalkan*).
   - Efek transisi hover baris data (`hover:bg-surface-raised/70`) yang responsif.

5. **Modul Manajemen Komprehensif (Sidebar Navigasi)**:
   - **Katalog & Layanan**: Manajemen Produk, Kategori Layanan, VIP Reseller Explorer, Koneksi Supplier Gateway.
   - **Transaksi & CRM**: Pesanan Pelanggan, Database Pembeli (CRM), Antrean Komplain & Refund Garansi.
   - **Marketing & Growth**: Sistem Afiliasi Sales, Voucher Diskon, Flash Sale & Campaign Booster, Manajemen Banner Hero.
   - **Keuangan & Finansial**: Laporan Pendapatan (Bruto), Pengeluaran & HPP, Analisis Margin Laba Bersih, Mutasi Saldo & Wallet Pembayaran.
   - **Sistem & Konfigurasi**: Metode Pembayaran & Gateway, Log Audit Keamanan, Pengaturan Notifikasi WhatsApp/Email, Kelola Administrator.

---

## 2. SALES PORTAL ASTERRASTORE (PORTAL MITRA PENJUALAN)
- **URL Akses Default**: `http://localhost:3002/sales`
- **Route Login**: `http://localhost:3002/sales/login`
- **Akun Default Pengujian**: `marchelinokurniawan321@gmail.com` / `AsterraSales#2026`
- **Tujuan Utama**: Area kerja mandiri bagi mitra afiliasi (sales) untuk mendistribusikan link rujukan, memantau omzet penjualan referral, memeriksa komisi langsung dan bonus tim, serta mencairkan komisi ke rekening pribadi.

### A. Fitur & Komponen Utama Halaman Sales

1. **Banner Sambutan & Referral Hub**:
   - **Status Akun & Tier Kemitraan**: Menampilkan status aktif dan tingkatan mitra saat ini (contoh: *Standard 10%* dengan jalur kenaikan otomatis ke *Tier 15%* setelah mencapai 50 pesanan).
   - **Kotak Link Referral Cepat**: Menampilkan kode unik mitra beserta URL rujukan siap salin dalam satu klik (`?ref=KODE_MITRA`).
   - **Tombol Bagikan ke WhatsApp**: Menghasilkan tautan langsung dengan template pesan promosi resmi bergaransi untuk dipasang di WhatsApp Story / Chat.

2. **Active Campaign Booster Teaser**:
   - Banner event promo flash sale khusus yang sedang berjalan.
   - Memberikan insentif komisi dinamis yang lebih tinggi (booster 15% - 20%) dibandingkan komisi reguler.

3. **4 Kartu Metrik Performa Mitra**:
   - **Saldo Siap Tarik**: Jumlah komisi yang telah melewati masa garansi pembeli dan siap dicairkan ke rekening bank / e-wallet.
   - **Pesanan Referral**: Jumlah transaksi yang dihasilkan oleh link mitra, dilengkapi ringkasan total omzet dan total komisi kotor.
   - **Traffic & Klik Link**: Jumlah klik kunjungan calon pembeli ke toko melalui link mitra, dilengkapi perhitungan tingkat konversi (*Conversion Rate %*) dan konfirmasi masa aktif cookie pelacak (30 hari).
   - **Tingkat Kemitraan**: Persentase bagi hasil profit aktif (10%), target sisa transaksi menuju tier berikutnya (15%), dan estimasi benefit.

4. **Sistem Proteksi Garansi 3 Hari**:
   - Komisi penjualan dipisahkan secara transparan antara *Komisi Tertahan Garansi (3 Hari)* untuk perlindungan konsumen dan *Saldo Siap Tarik (Lolos Garansi)*.

5. **Menu & Tab Spesialisasi Sales**:
   - **Ringkasan Performa (Overview)**: Dasbor visual metrik, banner referral, dan status akun.
   - **Katalog Produk & Estimasi Komisi**: Daftar produk toko dengan kalkulator potensi pendapatan per unit produk terjual.
   - **Generator Tautan & Materi Promosi**: Alat pembuat link khusus per halaman produk atau per event promo beserta materi banner promosi siap posting.
   - **Pesanan Referral Saya**: Tabel lengkap transaksi referral langsung dan pesanan campaign promo.
   - **Bonus Komisi Tim (1-Level Referral)**: Fitur undang teman menjadi mitra sales dengan hak bonus 2% dari profit teman tanpa memotong komisi 10% milik teman (bukan skema MLM).
   - **Dompet & Penarikan Dana (Sales Wallet)**: Form pengajuan penarikan dana ke Bank Mandiri, BCA, BRI, BNI, Dana, GoPay, OVO, disertai riwayat mutasi dana.
   - **Sales Academy**: Panduan dasar, tips copywriting, dan strategi pemasaran online untuk meningkatkan konversi penjualan.

---

## 3. PRINSIP DESAIN VISUAL & MOTION (STANDAR MONETIRA)

Kedua antarmuka dibangun dengan standar estetika SaaS modern berkelas editorial:
1. **Identitas Warna AsterraStore**:
   - **Asterra Coral**: `#C96F55` (Warna aksen utama, badge, fokus tombol).
   - **Deep Studio Navy**: `#121A2A` (Latar belakang gelap premium, sidebar, kontras tinggi).
   - **Warna Status Fungsional**: Hijau `#10B981` (Sukses/Lunas), Amber `#F59E0B` (Garansi/Pending), Merah `#EF4444` (Batal/Ditolak).
2. **Karakter Motion yang Diterapkan**:
   - **Entrance Reveal (GSAP)**: Stagger fade-up bertingkat (`y: 16px -> 0px`, durasi 0.55s, kurva `cubic-bezier(0.16, 1, 0.3, 1)`).
   - **Numeric Count-Up**: Transisi angka menggunakan `requestAnimationFrame` dengan peredaman kubik, tidak pernah berkedip ke 0 saat background query diperbarui.
   - **Tab Glide Transition**: Perpindahan antar-tab dan filter halus bebas kedipan (`animate-tab-glide`).
   - **Interactive Card Hover**: Efek angkat halus (`-translate-y-0.5`) dengan border glow saat kursor melayang di atas kartu metrik.
   - **Aksesibilitas & Kinerja**: Sepenuhnya menghormati `prefers-reduced-motion` dan dioptimalkan pada layer GPU compositor.

---

## 4. INTEGRASI & KEAMANAN SISTEM
- **Pemisahan Otoritas**: Administrator memiliki akses penuh ke pengaturan sistem, supplier VIP, database CRM, dan jurnal pembukuan. Mitra Sales hanya memiliki visibilitas atas performa, pesanan, dan dompet pribadi mereka sendiri.
- **Integritas Bisnis**: Semua kalkulasi finansial (laba, komisi, saldo, tier) dihitung di sisi backend FastAPI dan diverifikasi secara kriptografis menggunakan token sesi terpisah.

---
*Dokumen ini diterbitkan sebagai dokumentasi resmi arsitektur antarmuka AsterraStore 2026.*
