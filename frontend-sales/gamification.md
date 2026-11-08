# Product Requirements Document (PRD)
# Asterra Store — Sales Gamification System

**Product:** Asterra Store  
**Feature:** Sales Gamification — Daily Streak, Daily Task, Product Suggestion, Weekly Streak Bonus  
**Document Type:** Product Requirements Document  
**Status:** Draft for Development  
**Target Users:** Sales / Affiliate  
**Primary Objective:** Meningkatkan konsistensi dan produktivitas penjualan melalui target komisi harian dan bonus mingguan yang berbasis performa transaksi aktual.

---

## 1. Product Overview

Asterra Store akan memiliki fitur gamification untuk mendorong sales menghasilkan transaksi secara konsisten setiap hari.

Sistem terdiri dari empat komponen utama:

1. **Daily Task:** Target akumulasi komisi sebesar Rp25.000 per hari.
2. **Daily Streak:** Status harian aktif apabila sales berhasil mencapai target komisi harian.
3. **Product Suggestion:** Rekomendasi produk yang berpotensi membantu sales mencapai target dengan lebih cepat dan efisien.
4. **Weekly Streak Bonus:** Bonus komisi tambahan apabila sales berhasil mempertahankan daily streak selama tujuh hari berturut-turut.

Gamification tidak memberikan reward hanya karena sales melakukan aktivitas promosi. Reward dan progress dihitung berdasarkan transaksi valid yang menghasilkan komisi.

---

## 2. Goals & Objectives

### Business Goals

- Meningkatkan jumlah transaksi harian.
- Mendorong sales untuk aktif berjualan setiap hari.
- Meningkatkan konsistensi penjualan selama satu minggu.
- Mengarahkan sales ke produk dengan potensi komisi yang lebih efisien.
- Menjaga agar biaya bonus tetap proporsional dengan performa bisnis.

### User Goals

Sales dapat:
- Mengetahui target komisi harian.
- Melihat progress komisi secara real-time.
- Mengetahui apakah daily streak sudah aktif.
- Mendapat rekomendasi produk untuk membantu mencapai target.
- Memantau weekly streak.
- Mengetahui estimasi bonus mingguan yang bisa diperoleh.

### Non-Goals

Fitur ini bukan:
- Sistem pemberian komisi tetap Rp25.000 per hari.
- Sistem reward berdasarkan jumlah posting atau aktivitas promosi.
- Sistem yang mewajibkan sales menjual produk tertentu.
- Sistem yang menjamin pendapatan minimum sales.

---

## 3. Core Business Rules

### 3.1 Daily Commission Target

Setiap sales memiliki target harian sebesar:

**Rp25.000 komisi langsung per hari.**

Progress dihitung dari akumulasi komisi langsung atas transaksi valid yang dihasilkan sales pada hari tersebut.

Formula:

`Daily Progress = Total Eligible Direct Sales Commission`

`Daily Target = Rp25.000`

`Progress Percentage = (Daily Progress / Rp25.000) × 100%`

Contoh:

| Transaksi | Komisi |
|---|---:|
| Transaksi A | Rp8.000 |
| Transaksi B | Rp7.000 |
| Transaksi C | Rp5.000 |
| Transaksi D | Rp5.000 |
| **Total** | **Rp25.000** |

Setelah total komisi mencapai Rp25.000, daily streak otomatis aktif.

Ketentuan:
- Progress dapat terakumulasi dari banyak transaksi.
- Progress tidak harus berasal dari satu produk.
- Progress dapat melebihi Rp25.000.
- Tidak ada tambahan reward harian sebesar Rp25.000.
- Rp25.000 merupakan target komisi yang harus dihasilkan sales dari transaksi.

### 3.2 Eligible Transaction

Hanya transaksi yang memenuhi ketentuan berikut yang dapat dihitung:

- Transaksi berhasil.
- Transaksi menghasilkan komisi langsung untuk sales.
- Transaksi telah melewati validasi sistem.
- Transaksi bukan transaksi internal, testing, atau fraud.

Transaksi berikut tidak dihitung:
- Pending.
- Failed.
- Cancelled.
- Refunded.
- Chargeback.
- Fraudulent transaction.
- Transaksi yang tidak menghasilkan komisi.

**Rekomendasi implementasi:** Gunakan status `validated` sebagai dasar perhitungan final. Jika transaksi masih pending, transaksi dapat ditampilkan sebagai estimasi progress, tetapi belum mengaktifkan streak.

Jika transaksi yang sudah dihitung kemudian direversal, sistem harus melakukan penyesuaian komisi dan progress sesuai status validasi transaksi.

### 3.3 Daily Cutoff

- Zona waktu: `Asia/Jakarta` (WIB).
- Periode harian: 00:00:00–23:59:59 WIB.
- Daily streak aktif jika target tercapai sebelum pergantian hari.
- Jika target tidak tercapai hingga akhir hari, daily streak hari tersebut berstatus gagal.
- Progress harian di-reset ketika memasuki hari berikutnya.
- Riwayat hari sebelumnya tetap tersimpan.

---

## 4. Daily Streak System

Daily streak adalah indikator konsistensi sales dalam mencapai target komisi harian.

### Streak Activation

Daily streak aktif secara otomatis ketika:

`Daily Progress >= Rp25.000`

Contoh:

| Hari | Komisi Harian | Status |
|---|---:|---|
| Senin | Rp30.000 | Active |
| Selasa | Rp25.000 | Active |
| Rabu | Rp18.000 | Failed |
| Kamis | Rp27.000 | Active |
| Jumat | Rp25.000 | Active |
| Sabtu | Rp32.000 | Active |
| Minggu | Rp26.000 | Active |

Pada contoh tersebut, streak mingguan tidak berhasil diselesaikan karena hari Rabu gagal mencapai target.

### Daily Streak Status

Sistem perlu menyediakan status:

- `NOT_STARTED`: Belum ada progress.
- `IN_PROGRESS`: Sudah ada transaksi, tetapi belum mencapai target.
- `COMPLETED`: Target Rp25.000 tercapai.
- `FAILED`: Target tidak tercapai hingga akhir hari.

### Daily Streak UI

Tampilkan:
- Target komisi harian.
- Total komisi yang sudah dikumpulkan.
- Progress bar.
- Sisa komisi untuk mencapai target.
- Status daily streak.
- Countdown menuju pergantian hari.

Contoh:

**Daily Mission**

`Rp18.000 / Rp25.000`

Progress: 72%

Sisa target: Rp7.000

Status: In Progress

---

## 5. Product Suggestion System

### Purpose

Product Suggestion berfungsi sebagai rekomendasi produk yang paling efisien untuk membantu sales mencapai target komisi harian.

**Penting:** Product Suggestion hanya berupa rekomendasi. Sales bebas memilih produk apa pun untuk dijual.

Sales tetap mendapatkan progress komisi dari seluruh produk yang memenuhi syarat, bukan hanya produk yang direkomendasikan.

### Suggestion Logic

Sistem harus menganalisis produk berdasarkan:

1. Potensi komisi per transaksi.
2. Harga jual.
3. Modal atau biaya supplier.
4. Estimasi profit transaksi.
5. Riwayat penjualan produk.
6. Tingkat keberhasilan transaksi.
7. Ketersediaan produk.
8. Jumlah transaksi yang dibutuhkan untuk mencapai target Rp25.000.

Prioritaskan produk yang memberikan kontribusi komisi tinggi dengan jumlah transaksi yang relatif sedikit.

### Product Efficiency Formula

`Estimated Transactions Needed = Ceiling(Remaining Daily Target / Estimated Commission per Transaction)`

Contoh:

| Produk | Estimasi Komisi | Transaksi untuk Rp25.000 |
|---|---:|---:|
| Produk A | Rp10.000 | 3 |
| Produk B | Rp7.500 | 4 |
| Produk C | Rp5.000 | 5 |
| Produk D | Rp2.500 | 10 |

Angka di atas hanya contoh. Sistem harus mengambil komisi aktual dari konfigurasi produk dan skema komisi yang berlaku.

### Random Suggestion

Sistem dapat menampilkan rekomendasi produk secara random dari kumpulan produk yang memenuhi kriteria efisiensi.

Randomisasi harus tetap mempertimbangkan:
- Produk aktif.
- Stok atau ketersediaan supplier.
- Potensi komisi.
- Performa transaksi.
- Produk yang dapat dijual oleh sales tersebut.

Hindari rekomendasi produk yang:
- Tidak tersedia.
- Tidak menghasilkan komisi.
- Memiliki tingkat kegagalan transaksi yang tinggi.
- Tidak dapat dijual oleh sales terkait.

### Suggestion UI

Contoh:

**Product Recommendation**

- Produk A — Estimasi komisi Rp10.000/transaksi.
- Produk B — Estimasi komisi Rp7.500/transaksi.
- Produk C — Estimasi komisi Rp5.000/transaksi.

Label: `Recommended for your daily target`

Tampilkan keterangan bahwa rekomendasi bukan kewajiban.

### Suggestion Refresh

- Sistem dapat menghasilkan rekomendasi baru ketika sales membuka halaman gamification.
- Sales dapat meminta rekomendasi baru melalui tombol `Refresh Suggestion`.
- Hindari rekomendasi yang sama secara berulang jika masih tersedia alternatif yang relevan.
- Rekomendasi tidak boleh mengubah komisi, harga, atau status transaksi.

---

## 6. Weekly Streak Bonus Commission

### Purpose

Weekly Streak Bonus memberikan komisi tambahan kepada sales yang berhasil mencapai target harian selama tujuh hari berturut-turut.

### Weekly Streak Requirement

Sales harus memenuhi seluruh ketentuan berikut:

- Mencapai komisi langsung minimal Rp25.000 setiap hari.
- Memenuhi target selama tujuh hari berturut-turut.
- Setiap hari harus memiliki status `COMPLETED`.
- Tidak boleh ada hari yang berstatus `FAILED`.

Periode mingguan menggunakan kalender tetap:

`Monday 00:00 WIB – Sunday 23:59 WIB`

Bonus diberikan setelah seluruh tujuh hari selesai dan transaksi telah melalui validasi.

### Bonus Formula

Bonus mingguan:

`Weekly Bonus = 10% × Total Direct Sales Commission selama 7 hari`

Ketentuan:
- Bonus dihitung dari komisi langsung milik sales tersebut.
- Bonus tidak dihitung dari recruitment bonus.
- Bonus tidak dihitung dari bonus mingguan sebelumnya.
- Bonus hanya diberikan jika streak berhasil 7/7 hari.
- Bonus tidak diberikan secara parsial untuk streak yang gagal.
- Bonus tidak boleh dihitung dari transaksi yang tidak valid.

### Example Calculation

| Hari | Direct Sales Commission |
|---|---:|
| Senin | Rp25.000 |
| Selasa | Rp30.000 |
| Rabu | Rp25.000 |
| Kamis | Rp35.000 |
| Jumat | Rp25.000 |
| Sabtu | Rp30.000 |
| Minggu | Rp25.000 |
| **Total** | **Rp195.000** |

Weekly Bonus:

`10% × Rp195.000 = Rp19.500`

Total komisi sales:

`Rp195.000 + Rp19.500 = Rp214.500`

### Weekly Streak Status

- `IN_PROGRESS`: Minggu berjalan dan streak masih berlangsung.
- `COMPLETED`: Target berhasil dicapai selama 7 hari.
- `FAILED`: Salah satu hari gagal mencapai target.
- `BONUS_PENDING`: Streak selesai, menunggu validasi final.
- `BONUS_APPROVED`: Bonus sudah disetujui sistem.
- `BONUS_PAID`: Bonus sudah dibayarkan.

### Weekly Bonus Payout

Bonus dicatat sebagai komponen komisi terpisah agar dapat diaudit.

Sistem harus:
- Membuat catatan bonus mingguan.
- Menyimpan periode bonus.
- Menyimpan total komisi yang menjadi dasar perhitungan.
- Menyimpan nominal bonus.
- Mencegah pembayaran bonus ganda.
- Menghubungkan bonus dengan sales terkait.
- Mengikuti mekanisme pencairan komisi yang berlaku.

---

## 7. Financial Safeguards

Gamification harus menjaga profitabilitas Asterra Store.

### Existing Commission Structure

Sistem harus mengikuti skema komisi yang sudah berlaku:

- Direct Sales Commission: 10% dari transaction profit.
- Recruitment Bonus: 2% dari transaction profit untuk recruiter yang memenuhi syarat.
- Weekly Streak Bonus: 10% dari akumulasi direct sales commission milik sales.

Weekly bonus merupakan biaya tambahan, bukan komisi yang dibebankan kepada pelanggan.

### Financial Impact

Jika direct sales commission adalah 10% dari transaction profit, maka:

`Weekly Bonus = 10% × 10% × Transaction Profit`

Dengan demikian, biaya weekly bonus setara dengan:

`1% dari Transaction Profit`

Untuk transaksi yang juga menghasilkan recruitment bonus, total komisi dan bonus yang perlu diperhitungkan adalah:

- Direct sales commission: 10%.
- Recruitment bonus: 2%.
- Weekly streak bonus: maksimal ekuivalen 1% dari transaction profit, jika seluruh syarat terpenuhi.

Total maksimum komponen tersebut adalah 13% dari transaction profit untuk transaksi yang memenuhi seluruh kondisi.

**Catatan:** Angka tersebut merupakan ilustrasi beban insentif. Perhitungan profit akhir tetap harus mengikuti seluruh biaya transaksi dan pembagian profit yang berlaku di Asterra Store.

### Safeguards

- Tidak ada bonus tetap yang harus dibayarkan jika tidak ada komisi yang dihasilkan.
- Weekly bonus selalu proporsional dengan komisi aktual.
- Tidak boleh ada bonus dari transaksi invalid.
- Bonus harus dicatat dalam ledger.
- Bonus harus masuk ke laporan pengeluaran komisi.
- Sistem harus mencegah duplicate bonus payout.
- Admin harus dapat melakukan audit terhadap dasar perhitungan bonus.

---

## 8. User Interface Requirements

### 8.1 Gamification Dashboard

Dashboard sales menampilkan:

**Section 1 — Daily Mission**
- Target Rp25.000.
- Total komisi hari ini.
- Progress bar.
- Sisa target.
- Status daily streak.
- Countdown harian.

**Section 2 — Product Suggestion**
- Daftar produk rekomendasi.
- Estimasi komisi per transaksi.
- Estimasi jumlah transaksi yang dibutuhkan.
- Tombol refresh suggestion.

**Section 3 — Weekly Streak**
- Progress 7 hari.
- Status masing-masing hari.
- Total komisi minggu ini.
- Estimasi bonus mingguan.
- Status kelayakan bonus.

**Section 4 — Commission Summary**
- Direct sales commission.
- Weekly bonus commission.
- Total komisi.
- Riwayat bonus.

### 8.2 Weekly Calendar

Tampilkan tujuh hari dalam bentuk kalender atau progress tracker.

Contoh:

| Hari | Target | Status |
|---|---:|---|
| Senin | Rp25.000 | ✓ |
| Selasa | Rp25.000 | ✓ |
| Rabu | Rp25.000 | ✓ |
| Kamis | Rp25.000 | ✓ |
| Jumat | Rp25.000 | ✓ |
| Sabtu | Rp25.000 | ✓ |
| Minggu | Rp25.000 | In Progress |

Tampilan harus membedakan hari yang selesai, hari berjalan, dan hari yang gagal.

### 8.3 Responsive Design

- Mobile-first.
- Dashboard harus nyaman digunakan melalui smartphone.
- Progress dan status utama harus mudah terlihat.
- Tidak boleh mengharuskan sales membuka banyak halaman untuk memahami progress.

---

## 9. Admin Requirements

Admin harus dapat:

- Melihat progress daily streak seluruh sales.
- Melihat weekly streak seluruh sales.
- Melihat total weekly bonus yang dihasilkan.
- Melihat detail transaksi yang membentuk progress.
- Melihat riwayat bonus.
- Memeriksa transaksi yang direversal.
- Mengatur target harian melalui konfigurasi jika diperlukan.
- Mengatur persentase weekly bonus melalui konfigurasi.
- Mengaktifkan atau menonaktifkan fitur gamification.
- Melihat laporan biaya gamification.

### Configuration Defaults

| Configuration | Default |
|---|---:|
| Daily commission target | Rp25.000 |
| Weekly streak duration | 7 days |
| Weekly bonus percentage | 10% |
| Timezone | Asia/Jakarta |
| Weekly start day | Monday |
| Eligible commission basis | Direct sales commission |
| Product suggestion | Enabled |

Perubahan konfigurasi harus memiliki audit log dan tidak boleh mengubah hasil periode yang sudah ditutup.

---

## 10. Data Model / Database Requirements

AI coding agent harus menyesuaikan struktur berikut dengan database dan arsitektur proyek yang sudah ada. Jangan membuat tabel duplikat jika data yang setara sudah tersedia.

### `sales_daily_gamification`

Menyimpan ringkasan gamification harian.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| sales_id | UUID | Sales owner |
| date | DATE | Tanggal WIB |
| target_amount | DECIMAL | Target harian |
| accumulated_commission | DECIMAL | Komisi valid terakumulasi |
| status | ENUM | Daily status |
| completed_at | TIMESTAMP | Waktu target tercapai |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

Unique constraint: `sales_id + date`.

### `sales_weekly_gamification`

Menyimpan ringkasan streak mingguan.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| sales_id | UUID | Sales owner |
| week_start | DATE | Awal minggu |
| week_end | DATE | Akhir minggu |
| completed_days | INTEGER | Jumlah hari berhasil |
| total_commission | DECIMAL | Total komisi langsung |
| bonus_percentage | DECIMAL | Persentase bonus |
| bonus_amount | DECIMAL | Nominal bonus |
| status | ENUM | Weekly status |
| bonus_paid_at | TIMESTAMP | Waktu pembayaran |
| created_at | TIMESTAMP | Created timestamp |
| updated_at | TIMESTAMP | Updated timestamp |

Unique constraint: `sales_id + week_start`.

### `sales_gamification_bonus_ledger`

Mencatat bonus mingguan secara terpisah.

| Field | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| sales_id | UUID | Sales owner |
| weekly_gamification_id | UUID | Referensi periode |
| bonus_type | ENUM | WEEKLY_STREAK |
| base_commission | DECIMAL | Dasar perhitungan |
| bonus_percentage | DECIMAL | Persentase |
| bonus_amount | DECIMAL | Nominal bonus |
| status | ENUM | PENDING / APPROVED / PAID / REVERSED |
| created_at | TIMESTAMP | Created timestamp |
| paid_at | TIMESTAMP | Waktu pembayaran |

Unique constraint: `weekly_gamification_id + bonus_type`.

### Transaction Integration

Sistem harus menggunakan sumber transaksi dan komisi yang sudah tersedia.

Jangan menghitung ulang komisi secara terpisah dengan formula yang berbeda dari commission engine utama.

Setiap transaksi harus dapat ditelusuri berdasarkan:
- Transaction ID.
- Sales ID.
- Product ID.
- Transaction status.
- Direct sales commission.
- Validation timestamp.
- Reversal/refund status.

---

## 11. System Logic & Processing

### Daily Progress Processing

Setiap transaksi yang berubah menjadi `validated`:

1. Ambil sales ID dari transaksi.
2. Ambil direct sales commission dari commission engine.
3. Tentukan tanggal transaksi berdasarkan aturan waktu bisnis yang konsisten.
4. Tambahkan komisi ke daily progress sales.
5. Periksa apakah total sudah mencapai Rp25.000.
6. Jika tercapai, ubah status menjadi `COMPLETED`.
7. Perbarui weekly progress.
8. Perbarui tampilan dashboard.

Proses harus idempotent. Satu transaksi tidak boleh menambah progress lebih dari satu kali.

### Weekly Bonus Processing

Pada penutupan minggu:

1. Ambil seluruh daily records sales untuk periode tersebut.
2. Periksa apakah terdapat tujuh hari yang berstatus `COMPLETED`.
3. Jika tidak, tandai weekly streak `FAILED`.
4. Jika ya, hitung total direct sales commission selama tujuh hari.
5. Hitung bonus sebesar 10% dari total direct sales commission.
6. Buat bonus ledger.
7. Jalankan validasi akhir.
8. Ubah status menjadi `BONUS_APPROVED`.
9. Masukkan bonus ke mekanisme pencairan komisi.

Bonus hanya boleh dibuat satu kali untuk setiap sales dalam satu periode mingguan.

---

## 12. Edge Cases

AI coding agent wajib menangani skenario berikut:

1. Sales mencapai Rp25.000 tepat sebelum pergantian hari.
2. Sales mencapai target melalui banyak transaksi kecil.
3. Satu transaksi menghasilkan komisi yang membuat progress melebihi Rp25.000.
4. Transaksi berubah menjadi refund setelah progress tercatat.
5. Transaksi divalidasi setelah hari transaksi berakhir.
6. Sales belum memiliki transaksi pada suatu hari.
7. Sales mencapai target pada hari terakhir minggu.
8. Sistem mengalami downtime ketika transaksi berhasil.
9. Event transaksi terkirim lebih dari satu kali.
10. Admin mengubah target ketika periode sedang berjalan.
11. Sales menerima direct commission dan recruitment bonus dari transaksi yang sama.
12. Bonus mingguan sudah dibuat tetapi pembayaran gagal.

Gunakan mekanisme idempotency, audit log, dan rekonsiliasi berkala untuk mencegah kesalahan perhitungan.

---

## 13. Analytics & Reporting

Metrik yang harus tersedia:

### Sales Performance
- Daily target completion rate.
- Average daily commission.
- Number of active streak days.
- Weekly streak completion rate.
- Average transactions per day.
- Average commission per transaction.

### Gamification Cost
- Total weekly bonus paid.
- Total weekly bonus pending.
- Total direct commission.
- Total gamification cost.
- Gamification cost as percentage of transaction profit.

### Product Suggestion Performance
- Product suggestion impressions.
- Product suggestion refreshes.
- Conversion rate dari produk rekomendasi.
- Average commission dari produk rekomendasi.
- Produk rekomendasi dengan performa terbaik.

---

## 14. Acceptance Criteria

Fitur dinyatakan selesai apabila:

### Daily Task
- [ ] Target harian default Rp25.000.
- [ ] Progress dihitung dari direct sales commission transaksi valid.
- [ ] Progress dapat diakumulasi dari banyak transaksi.
- [ ] Target otomatis aktif ketika mencapai Rp25.000.
- [ ] Transaksi invalid tidak dihitung.
- [ ] Progress harian terpisah berdasarkan tanggal WIB.

### Daily Streak
- [ ] Status streak berubah otomatis setelah target tercapai.
- [ ] Status harian tersimpan.
- [ ] Hari yang gagal tidak dihitung sebagai completed.
- [ ] Riwayat streak dapat ditampilkan.

### Product Suggestion
- [ ] Sistem dapat memberikan rekomendasi produk.
- [ ] Rekomendasi mempertimbangkan potensi komisi dan efisiensi.
- [ ] Sales bebas menjual produk apa pun.
- [ ] Semua transaksi valid tetap dihitung, terlepas dari rekomendasi.
- [ ] Sales dapat refresh rekomendasi.

### Weekly Streak Bonus
- [ ] Sistem memeriksa tujuh hari berturut-turut.
- [ ] Bonus hanya diberikan jika semua hari completed.
- [ ] Bonus sebesar 10% dari total direct sales commission.
- [ ] Recruitment bonus tidak masuk ke dasar perhitungan.
- [ ] Bonus tercatat di ledger.
- [ ] Tidak terjadi duplicate bonus.
- [ ] Bonus dapat ditelusuri dan diaudit.

### Admin & Analytics
- [ ] Admin dapat memantau performa sales.
- [ ] Admin dapat melihat rincian bonus.
- [ ] Admin dapat memeriksa sumber transaksi.
- [ ] Biaya gamification dapat dilaporkan.

---

## 15. Implementation Instructions for AI Coding Agent

Sebelum melakukan implementasi:

1. Audit codebase dan identifikasi framework, database, authentication, commission engine, transaction lifecycle, serta struktur dashboard sales.
2. Identifikasi sumber data komisi yang menjadi single source of truth.
3. Periksa apakah sudah ada sistem referral, commission ledger, atau sales performance tracking.
4. Gunakan kembali komponen dan tabel yang relevan.
5. Jangan mengubah skema komisi utama Asterra Store tanpa persetujuan.
6. Jangan membuat sistem komisi paralel.
7. Implementasikan backend calculation terlebih dahulu sebelum UI.
8. Pastikan seluruh perhitungan menggunakan decimal/integer rupiah, bukan floating-point yang berisiko menghasilkan selisih.
9. Gunakan database transaction, unique constraints, dan idempotency untuk proses yang berkaitan dengan komisi dan bonus.
10. Buat unit test dan integration test untuk seluruh business rules dan edge cases.
11. Pastikan data lama tidak berubah ketika fitur diaktifkan.
12. Buat migration yang aman dan dokumentasikan rollback.

### Required Deliverables

- Database migration.
- Backend services dan business logic.
- Transaction event integration.
- Daily streak calculation.
- Product suggestion logic.
- Weekly bonus calculation.
- Sales gamification dashboard.
- Admin monitoring interface.
- Automated tests.
- Dokumentasi konfigurasi dan perhitungan komisi.

**Implementation principle:** Prioritaskan akurasi perhitungan komisi dan integritas data. UI gamification tidak boleh menjadi sumber kebenaran perhitungan finansial; seluruh perhitungan final harus berasal dari backend dan commission engine Asterra Store.

---

## 16. Open Decisions Before Production

Hal-hal berikut perlu dikonfirmasi sebelum production release:

1. **Validation timing:** Apakah transaksi yang baru divalidasi setelah pergantian hari tetap masuk ke tanggal transaksi awal, atau tanggal validasinya? Rekomendasi: gunakan tanggal bisnis transaksi, tetapi streak baru difinalisasi setelah validasi.
2. **Reversal policy:** Jika transaksi direfund setelah streak mingguan dinyatakan selesai, apakah bonus yang belum dibayar dapat dibatalkan atau bonus yang sudah dibayar harus dikoreksi pada periode berikutnya?
3. **Weekly payout:** Apakah bonus mingguan langsung masuk ke saldo komisi tersedia, atau menunggu approval admin?
4. **Target configuration:** Apakah target Rp25.000 dan bonus 10% akan menjadi konfigurasi global atau dapat berbeda untuk kelompok sales?

**Recommended initial configuration:** Global target Rp25.000, weekly bonus 10%, tujuh hari kalender berturut-turut, timezone WIB, dan bonus melalui validasi sebelum payout.