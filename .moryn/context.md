<!-- Moryn Context Snapshot | generatedAt: 2026-09-23T17:57:17.108Z | Freshness Gate AH-017: If project updatedAt is newer, refresh via .moryn/sync context > .moryn/context.md -->

<system_directives>
  <ui_governance>
    <surfaces base="#090A0C" level1="#121318" level2="#181A22" hover="#222634" primary_accent="#6366F1" />
    <radius data="0-4px" cards_inputs="4-8px" pills_only="9999px" />
    <typography headline_tracking="tight (-0.02em)" label_tracking="wide (+0.05em)" max_prose_chars="75" max_weights="3" />
    <motion duration="150-250ms" timing="cubic-bezier(0.16, 1, 0.3, 1)" />
    <mandate library="shadcn/ui (@/components/ui/*)" />
    <forbidden>
      [pure_black_#000000, navy_#0F172A, icon_container_syndrome, gradient_text_headlines, rounded-2xl_everywhere, nested_cards_gt_2, arbitrary_unapproved_libraries]
    </forbidden>
    <currency idr_billion="Rp X,XX M" idr_million="Rp X,XX Jt" idr_thousand="Rp XXX Rb" />
  </ui_governance>

  <anti_hallucination_rules>
  <rule id="AH-001">ZERO INVENTION: Never add unapproved libraries, frameworks, or dependencies outside explicit PRD specs.</rule>
  <rule id="AH-002">ZERO ASSUMPTION: Never assume database schemas, API contracts, response shapes, or undocumented business logic.</rule>
  <rule id="AH-003">STATUS SYNC: Update task status to 'in_progress' on start and 'done' upon verified completion via .moryn/sync.</rule>
  <rule id="AH-004">REALITY CHECK: Flag missing backend/API dependencies as blockers; never silent mock unverified endpoints.</rule>
  <rule id="AH-005">DESIGN SYSTEM SYNC: Verify design tokens in &lt;design_data&gt; before generating frontend components.</rule>
  <rule id="AH-006">CHECKPOINT HONOR: Stop and await user confirmation when encountering tasks marked [CHECKPOINT] or isCheckpoint: true.</rule>
  <rule id="AH-007">DESIGN TOKEN GROUND TRUTH: Use exact HEX colors and typography from &lt;design_data&gt;; never invent arbitrary colors.</rule>
  <rule id="AH-008">ZERO DUMMY DATA IN PRODUCTION: Replace all mock/dummy static arrays with real API and database seed data in Phase 6.</rule>
  <rule id="AH-009">MODERN CONVENTIONS VERIFICATION: Verify official latest framework conventions (Next.js 16 App Router, Turbopack, Better-Auth) before writing files.</rule>
  <rule id="AH-010">DEFINITION OF DONE: Strictly verify task completion criteria and acceptance criteria before marking done.</rule>
  <rule id="AH-011">DESIGN SKILL ROUTING: Activate and align with the specified taste skill key in &lt;system_directives&gt;.</rule>
  <rule id="AH-012">AUTONOMOUS COMPONENT DISCOVERY &amp; BESPOKE SYNTHESIS: Autonomously research and synthesize modern UI components, motion physics, and visual metaphors via web docs (React Bits, 21st.dev, Framer Motion, Magic UI) tailored to the product domain. Strictly forbid repetitive default-template anchoring.</rule>
  <rule id="AH-013">ON-DEMAND TASTE SKILL: Fetch full taste skill via .moryn/sync taste &lt;key&gt; for complex UI scaffolding.</rule>
  <rule id="AH-014">ZERO-SLOP VISUAL QUALITY: Ensure premium agency-grade aesthetics. Forbid default #0F172A navy, #000000 pure black, and uniform rounded-2xl.</rule>
  <rule id="AH-015">CONTEXT PERSISTENCE: Re-verify .moryn/context.md before starting new tasks to maintain 100% project memory.</rule>
  <rule id="AH-016">CHUNK-READ FOR LARGE FILES: Use chunked reading (StartLine/EndLine) for files &gt;800 lines to ensure zero truncated context.</rule>
  <rule id="AH-017">CONTEXT FRESHNESS: If project updatedAt is newer than snapshot generatedAt, refresh via .moryn/sync context &gt; .moryn/context.md.</rule>
  <rule id="AH-018">COMPREHENSIVE DESIGN COMPLIANCE: 100% adherence to design tokens, layout hierarchy, and typography constraints.</rule>
  <rule id="AH-019">MANDATORY FRONTEND DESIGN THINKING &amp; CREATIVE THESIS [CRITICAL]: Sebelum membuat atau mengubah komponen UI/UX Frontend, AI Agent WAJIB melakukan Autonomous Discovery (mencari referensi docs/web komponen modern), serta merumuskan tesis desain di blok '&lt;design_plan&gt;' (1. Product Visual Metaphor, 2. Bespoke Interaction Recipes, 3. Intentionally Rejected Clichés). Dilarang keras jatuh ke bias heuristik aman.</rule>
  <rule id="AH-021">SHADCN/UI COMPONENT MANDATE: Use shadcn/ui primitives (@/components/ui/*) for all UI components. Never create raw unstyled HTML buttons/inputs.</rule>
  <rule id="AH-022">ZERO NO-OP STUBS &amp; INTERACTIVE RUNTIME FIDELITY: Every interactive element (button, link, form, modal trigger, tab) MUST have a functional runtime handler, real state mutation, or working destination URL. Strictly prohibit empty 'onClick={() =&gt; {}}', placeholder 'console.log', dead 'href="#"', or dummy alert() as deliverables.</rule>
  <rule id="AH-023">AGGRESSIVE DEAD-CODE CLEANUP &amp; REFACTORING HYGIENE: When updating, refactoring, or switching themes, AI Agent MUST aggressively delete dead components, obsolete variables, unused imports, and commented-out code blocks. Never append new code without pruning dead code.</rule>
  </anti_hallucination_rules>

  <active_skill key="minimalistUi" fetch_cmd=".moryn/sync taste minimalistUi">
    Selected: Auto-selected 'minimalistUi' — matched keyword(s): minimal, editorial, calm, whitespace | Baseline: Obsidian (#090A0C), 150-250ms spring physics, shadcn/ui mandatory, zero-slop.
  </active_skill>
</system_directives>

<project_context>
<![CDATA[
{"id":"cmudmzuns0001kz042cyjg7p5","appName":"Asterra Store","appIdea":"Asterra Store adalah web app toko digital yang menyediakan berbagai produk dan layanan premium untuk dibeli secara online. Pengguna dapat menjelajahi katalog, melihat informasi, harga produk, dan detail. memilih layanan yang diinginkan, lalu melakukan pemesanan dan pembayaran secara online. Asterra Store dibuat untuk memberikan pengalaman pembelian produk digital yang praktis, cepat, dan mudah digunakan.\nproduk meliputi : \n- Canva Pro\n- Gemini Pro\n- ChatGPT Plus\n- Capcut Pro\n- Alight Motion Pro","status":"IN_PROGRESS","createdAt":"2026-09-23T05:02:44.728Z","updatedAt":"2026-09-23T17:53:41.509Z"}
]]>
</project_context>

<personalization_inputs>
<![CDATA[
{"appName":"Asterra Store","appIdea":"Asterra Store adalah web app toko digital yang menyediakan berbagai produk dan layanan premium untuk dibeli secara online. Pengguna dapat menjelajahi katalog, melihat informasi, harga produk, dan detail. memilih layanan yang diinginkan, lalu melakukan pemesanan dan pembayaran secara online. Asterra Store dibuat untuk memberikan pengalaman pembelian produk digital yang praktis, cepat, dan mudah digunakan.\nproduk meliputi : \n- Canva Pro\n- Gemini Pro\n- ChatGPT Plus\n- Capcut Pro\n- Alight Motion Pro","designData":"{\"paletteName\":\"Clean Product\",\"theme\":\"Slate / Cyan\",\"swatches\":[\"#0f172a\",\"#f1f5f9\",\"#0ea5e9\"]}","dynamicAnswers":{"primaryPersona":"Konsumen Individu / Masyarakat Umum (B2C)","userActivities":["Membuat pesanan, melakukan reservasi, atau pembayaran online","Menjelajahi, memfilter, dan mencari katalog produk atau konten"],"mvpFeatures":["Autentikasi Pengguna & Profil Akun (Login/Register)","Pemrosesan Pembayaran Otomatis / Checkout Instan","Notifikasi Transaksional & Pemberitahuan Real-time (Email / In-app / Webhook)","Dashboard Ringkasan Aktivitas & Manajemen Hak Akses Multi-Level"],"userFlow":"Pengguna mendaftar -> mencari atau memilih layanan -> mengisi detail kebutuhan -> menyelesaikan pembayaran -> menerima konfirmasi instan -> melacak progres eksekusi hingga tuntas.","managedData":["Akun Pengguna & Profil (Kredensial, preferensi, token sesi)","Entitas Master Utama / Katalog Produk & Layanan","Pesanan, Transaksi, Faktur & Rekam Jejak Pembayaran","Log Aktivitas Sistem, Audit Trail & Telemetri Event"],"userRoles":"Ya, ada beberapa peran pengguna berbeda (misal: Admin, Pelanggan, Staf)","userRoles_detail":"Admin, Pelanggan","specialRules":"Tidak, gunakan standar alur kerja aplikasi modern pada umumnya","specialRules_detail":""},"language":"id"}
]]>
</personalization_inputs>

<structure>
<![CDATA[
{"title":"Asterra Store","description":"Aplikasi web toko digital untuk pembelian produk dan layanan premium secara online, menawarkan pengalaman yang praktis, cepat, dan mudah bagi pengguna.","nodes":[{"id":"node-1","label":"Manajemen Pengguna & Autentikasi","phase":1,"color":null,"children":[{"id":"node-1-1","label":"Registrasi Akun Pengguna"},{"id":"node-1-2","label":"Login & Logout Akun"},{"id":"node-1-3","label":"Manajemen Profil Pengguna (Update data, kata sandi)"},{"id":"node-1-4","label":"Lupa & Reset Kata Sandi"},{"id":"node-1-5","label":"Manajemen Sesi Pengguna"}]},{"id":"node-2","label":"Katalog Produk Digital","phase":1,"color":null,"children":[{"id":"node-2-1","label":"Penjelajahan & Tampilan Produk"},{"id":"node-2-2","label":"Pencarian Produk Cerdas"},{"id":"node-2-3","label":"Filter & Sortir Produk (Harga, Kategori)"},{"id":"node-2-4","label":"Halaman Detail Produk (Deskripsi, Harga, Fitur)"}]},{"id":"node-3","label":"Manajemen Pesanan & Pembayaran","phase":1,"color":null,"children":[{"id":"node-3-1","label":"Pemilihan Produk & Konfigurasi"},{"id":"node-3-2","label":"Proses Checkout & Pengisian Data"},{"id":"node-3-3","label":"Integrasi Pembayaran Online (Multi-metode)"},{"id":"node-3-4","label":"Konfirmasi Pesanan Instan"},{"id":"node-3-5","label":"Riwayat Pesanan & Transaksi"},{"id":"node-3-6","label":"Pelacakan Status Pesanan"}]},{"id":"node-4","label":"Sistem Notifikasi","phase":1,"color":null,"children":[{"id":"node-4-1","label":"Notifikasi Email Transaksional (Konfirmasi, Status)"},{"id":"node-4-2","label":"Notifikasi Dalam Aplikasi (Pembaruan status)"},{"id":"node-4-3","label":"Pemberitahuan Penting (Promosi, Informasi Akun)"}]},{"id":"node-5","label":"Dashboard & Pelaporan","phase":2,"color":null,"children":[{"id":"node-5-1","label":"Dashboard Ringkasan Pengguna (Aktivitas, Pesanan)"},{"id":"node-5-2","label":"Dashboard Admin (Ringkasan Penjualan, Pesanan Aktif)"},{"id":"node-5-3","label":"Laporan Penjualan & Pendapatan (Admin)"},{"id":"node-5-4","label":"Log Aktivitas Sistem (Admin)"}]},{"id":"node-6","label":"Manajemen Admin & Konten","phase":2,"color":null,"children":[{"id":"node-6-1","label":"Manajemen Produk (Tambah, Edit, Hapus)"},{"id":"node-6-2","label":"Manajemen Kategori Produk"},{"id":"node-6-3","label":"Manajemen Pengguna & Peran (Admin, Pelanggan)"},{"id":"node-6-4","label":"Pengaturan Aplikasi (Informasi umum, kebijakan)"},{"id":"node-6-5","label":"Manajemen Pesanan (Admin: Lihat, Update Status, Batalkan)"}]}]}
]]>
</structure>

<prd_document>
<![CDATA[
# Product Requirements Document (PRD) - Asterra Store

**Versi Dokumen:** 1.0
**Tanggal:** 27 Oktober 2023
**Disusun Oleh:** [Nama Anda / Tim Produk]

---

## 1. Overview

### Latar Belakang Masalah
Di era digital saat ini, kebutuhan akan produk dan layanan premium seperti langganan perangkat lunak produktivitas, alat desain, atau layanan AI semakin meningkat. Namun, seringkali proses pembelian produk digital ini terfragmentasi, memerlukan kunjungan ke berbagai platform, dan alur pembayaran yang tidak efisien. Hal ini dapat menimbulkan friksi bagi pengguna yang menginginkan kemudahan, kecepatan, dan kepraktisan dalam mendapatkan produk digital pilihan mereka. Asterra Store hadir sebagai solusi terpadu untuk mengatasi tantangan ini, menyediakan platform tunggal yang intuitif dan aman untuk pembelian produk digital premium.

### Visi Produk & Sasaran Utama
**Visi Produk:** Menjadi platform terdepan untuk pembelian produk dan layanan digital premium di Indonesia, yang menawarkan pengalaman transaksi yang praktis, cepat, dan mudah bagi setiap pengguna.

**Sasaran Utama:**
1.  **Akuisisi Pengguna:** Mencapai target jumlah pengguna terdaftar dalam 6 bulan pertama setelah peluncuran.
2.  **Volume Transaksi:** Meningkatkan jumlah transaksi bulanan dan nilai rata-rata pesanan (AOV) secara konsisten.
3.  **Kepuasan Pengguna:** Memastikan tingkat kepuasan pengguna yang tinggi melalui pengalaman pengguna (UX) yang mulus dan dukungan pelanggan yang responsif.
4.  **Efisiensi Operasional:** Mengurangi waktu pemrosesan pesanan dan pembayaran melalui otomatisasi.

### Proposisi Nilai
Asterra Store menawarkan nilai unik kepada penggunanya melalui:
*   **Katalog Terkurasi:** Menyediakan akses mudah ke produk digital premium populer seperti Canva Pro, Gemini Pro, ChatGPT Plus, Capcut Pro, dan Alight Motion Pro dalam satu tempat.
*   **Pengalaman Pembelian Mulus:** Alur penjelajahan, pemilihan, dan pembayaran yang dirancang untuk kepraktisan dan kecepatan.
*   **Pembayaran Aman & Instan:** Integrasi dengan berbagai metode pembayaran online terkemuka dan konfirmasi pembayaran otomatis.
*   **Pelacakan Pesanan Real-time:** Pengguna dapat memantau status pesanan mereka dari awal hingga aktivasi produk.
*   **Dukungan Pelanggan Responsif:** Memastikan setiap pertanyaan dan masalah pengguna ditangani dengan cepat dan efektif.

### Metrik Keberhasilan & KPI
*   **Tingkat Konversi (Conversion Rate):** Persentase pengunjung yang melakukan pembelian.
*   **Nilai Pesanan Rata-Rata (Average Order Value - AOV):** Rata-rata nilai total per pesanan.
*   **Tingkat Retensi Pengguna:** Persentase pengguna yang kembali melakukan pembelian dalam periode waktu tertentu.
*   **Jumlah Pengguna Aktif Bulanan (Monthly Active Users - MAU):** Jumlah pengguna unik yang berinteraksi dengan platform setiap bulan.
*   **Waktu Pemrosesan Pesanan:** Rata-rata waktu dari pembayaran hingga aktivasi produk.
*   **Waktu Muat Halaman (Page Load Time):** Kecepatan respons aplikasi untuk pengalaman pengguna yang optimal.
*   **Tingkat Kepuasan Pelanggan (CSAT):** Diukur melalui survei atau umpan balik pengguna.
*   **Uptime Sistem:** Persentase waktu sistem beroperasi tanpa gangguan.

---

## 2. Requirements

### Persona Pengguna Utama & Hak Akses/Peran

#### Persona Pengguna Utama: Pelanggan (Konsumen Individu / Masyarakat Umum)
*   **Demografi:** Individu dari berbagai latar belakang usia dan profesi (pelajar, pekerja lepas, profesional kreatif, pebisnis kecil) yang membutuhkan alat digital untuk produktivitas, kreativitas, atau hiburan.
*   **Motivasi:** Mencari cara yang cepat, mudah, dan aman untuk mendapatkan langganan produk digital premium tanpa kerumitan.
*   **Tujuan:** Membeli produk digital yang dibutuhkan, memantau status pesanan, dan mengelola profil akun mereka.
*   **Kebutuhan:** Antarmuka yang intuitif, pilihan produk yang jelas, metode pembayaran yang beragam, konfirmasi instan, dan dukungan pelanggan yang responsif.

#### Hak Akses/Peran
1.  **Pelanggan:**
    *   **Deskripsi:** Pengguna terdaftar yang dapat menjelajahi katalog produk, membuat pesanan, melakukan pembayaran, melihat riwayat pesanan, dan mengelola profil pribadi.
    *   **Hak Akses:** Registrasi, Login/Logout, Lihat Katalog Produk, Lihat Detail Produk, Cari/Filter Produk, Tambah Produk ke Pesanan, Checkout, Pembayaran, Lihat Riwayat Pesanan, Lihat Status Pesanan, Edit Profil, Lupa/Reset Kata Sandi.
2.  **Admin:**
    *   **Deskripsi:** Pengguna internal yang bertanggung jawab untuk mengelola seluruh operasional Asterra Store, termasuk manajemen produk, pesanan, pengguna, dan konten sistem.
    *   **Hak Akses:** Login/Logout, Akses Dashboard Admin, Lihat Statistik Penjualan, Tambah/Edit/Hapus Produk, Tambah/Edit/Hapus Kategori, Lihat/Update Status Pesanan, Lihat/Edit/Blokir Akun Pengguna, Kelola Konten Halaman (FAQ, Kebijakan), Lihat Laporan & Analitik.

### Kebutuhan Fungsional Pengguna & Acceptance Criteria

Berikut adalah kebutuhan fungsional utama untuk Asterra Store, dilengkapi dengan kriteria penerimaan (Acceptance Criteria) untuk setiap fitur:

1.  **Manajemen Pengguna & Autentikasi:**
    *   **Registrasi Akun Pelanggan:** Pengguna dapat membuat akun baru dengan mengisi detail yang diperlukan.
        *   **AC:** Sistem berhasil membuat akun baru setelah pengguna mengisi formulir registrasi yang valid (nama, email unik, kata sandi) dan password terenkripsi disimpan. Pengguna menerima email konfirmasi pendaftaran.
    *   **Login & Logout Akun:** Pengguna dapat masuk dan keluar dari akun mereka.
        *   **AC:** Pengguna dapat login dengan kredensial yang benar dan logout untuk mengakhiri sesi.
    *   **Manajemen Profil Pengguna:** Pengguna dapat melihat dan mengubah informasi profil mereka.
        *   **AC:** Pengguna dapat memperbarui nama, email (jika diizinkan), dan kata sandi setelah melalui proses verifikasi yang sesuai.
    *   **Lupa Kata Sandi & Reset:** Pengguna dapat mengatur ulang kata sandi jika lupa.
        *   **AC:** Pengguna dapat meminta reset kata sandi melalui email dan berhasil mengatur kata sandi baru menggunakan tautan yang dikirimkan.
    *   **Manajemen Sesi Pengguna:** Sistem dapat mengelola sesi pengguna untuk keamanan dan kenyamanan.
        *   **AC:** Sesi pengguna tetap aktif selama periode tertentu dan dapat diakhiri secara manual atau otomatis setelah tidak aktif.
    *   **Manajemen Peran Pengguna:** Sistem dapat membedakan hak akses antara Pelanggan dan Admin.
        *   **AC:** Pengguna dengan peran Admin memiliki akses ke dashboard administrasi, sementara Pelanggan tidak.

2.  **Katalog Produk & Penemuan:**
    *   **Daftar Produk Digital:** Pengguna dapat melihat daftar produk yang tersedia.
        *   **AC:** Halaman utama menampilkan daftar produk digital dengan nama, harga, dan gambar ringkasan.
    *   **Halaman Detail Produk:** Pengguna dapat melihat informasi lengkap tentang suatu produk.
        *   **AC:** Mengklik produk akan menampilkan halaman detail dengan deskripsi lengkap, fitur, harga, dan instruksi pembelian.
    *   **Fungsi Pencarian Produk:** Pengguna dapat mencari produk berdasarkan kata kunci.
        *   **AC:** Hasil pencarian menampilkan produk yang relevan dengan kata kunci yang dimasukkan pengguna.
    *   **Filter & Sortir Produk:** Pengguna dapat memfilter dan menyortir daftar produk.
        *   **AC:** Pengguna dapat memfilter produk berdasarkan kategori atau menyortir berdasarkan harga (termurah/termahal) atau abjad.
    *   **Tampilan Produk Unggulan/Rekomendasi:** Sistem dapat menampilkan produk yang direkomendasikan.
        *   **AC:** Pada halaman tertentu, sistem menampilkan produk yang ditandai sebagai "unggulan" atau "rekomendasi".

3.  **Manajemen Pesanan & Pembayaran:**
    *   **Proses Pemilihan Produk & Konfigurasi:** Pengguna dapat memilih produk dan mengonfigurasi opsi (jika ada).
        *   **AC:** Pengguna dapat memilih produk, melihat opsi yang tersedia, dan menambahkannya ke daftar pesanan.
    *   **Alur Checkout & Pengisian Detail Pesanan:** Pengguna dapat menyelesaikan proses checkout.
        *   **AC:** Pengguna dapat mengisi detail yang diperlukan untuk pesanan (misal: akun tujuan aktivasi) dan meninjau pesanan sebelum pembayaran.
    *   **Integrasi Metode Pembayaran Online:** Pengguna dapat membayar melalui berbagai metode.
        *   **AC:** Sistem menampilkan pilihan metode pembayaran online (misal: kartu kredit, e-wallet, transfer bank) dan berhasil memproses transaksi melalui gateway pembayaran pihak ketiga.
    *   **Konfirmasi Pembayaran Otomatis:** Sistem secara otomatis mengkonfirmasi pembayaran.
        *   **AC:** Setelah pembayaran berhasil, sistem secara otomatis memperbarui status pesanan menjadi "Dibayar" atau "Diproses".
    *   **Riwayat Pesanan Pelanggan:** Pengguna dapat melihat daftar semua pesanan yang pernah dibuat.
        *   **AC:** Halaman riwayat pesanan menampilkan daftar pesanan lengkap dengan status, tanggal, dan total pembayaran.
    *   **Pelacakan Status Pesanan:** Pengguna dapat memantau status pesanan mereka secara real-time.
        *   **AC:** Pengguna dapat melihat status pesanan (misal: Menunggu Pembayaran, Diproses, Selesai, Dibatalkan) di halaman riwayat atau detail pesanan.

4.  **Sistem Notifikasi & Komunikasi:**
    *   **Notifikasi Email Transaksional:** Pengguna menerima notifikasi email terkait transaksi.
        *   **AC:** Pengguna menerima email konfirmasi pesanan, konfirmasi pembayaran, dan notifikasi aktivasi/penyelesaian pesanan.
    *   **Notifikasi In-App:** Pengguna menerima pemberitahuan di dalam aplikasi.
        *   **AC:** Pengguna menerima notifikasi di dashboard aplikasi mengenai perubahan status pesanan atau informasi penting lainnya.
    *   **Sistem Dukungan Pelanggan:** Pengguna dapat mencari bantuan atau menghubungi dukungan.
        *   **AC:** Tersedia halaman FAQ dan formulir kontak untuk mengirim pertanyaan kepada tim dukungan.

5.  **Dashboard & Administrasi Sistem (Admin):**
    *   **Dashboard Ringkasan Admin:** Admin dapat melihat ikhtisar operasional.
        *   **AC:** Dashboard Admin menampilkan statistik penjualan, pesanan baru, dan ringkasan aktivitas sistem.
    *   **Manajemen Produk:** Admin dapat mengelola produk (tambah, edit, hapus).
        *   **AC:** Admin dapat menambahkan produk baru dengan detail lengkap, mengedit informasi produk yang sudah ada, dan menghapus produk.
    *   **Manajemen Kategori Produk:** Admin dapat mengelola kategori produk.
        *   **AC:** Admin dapat membuat, mengedit, dan menghapus kategori untuk mengorganisir produk.
    *   **Manajemen Pesanan:** Admin dapat melihat dan memperbarui status pesanan.
        *   **AC:** Admin dapat melihat daftar semua pesanan, melihat detail pesanan, dan memperbarui status pesanan (misal: dari "Diproses" ke "Selesai").
    *   **Manajemen Pengguna:** Admin dapat melihat, mengedit, atau memblokir akun pengguna.
        *   **AC:** Admin dapat melihat daftar pengguna terdaftar, mengedit informasi profil pengguna, dan mengaktifkan/menonaktifkan akun pengguna.
    *   **Manajemen Konten Halaman:** Admin dapat mengelola konten statis (FAQ, Kebijakan).
        *   **AC:** Admin dapat mengedit teks dan informasi pada halaman seperti FAQ dan Kebijakan Privasi.

6.  **Pelaporan & Analitik (Admin):**
    *   **Laporan Penjualan:** Admin dapat melihat laporan penjualan berdasarkan periode atau produk.
        *   **AC:** Sistem menghasilkan laporan penjualan bulanan/tahunan atau laporan penjualan per produk.
    *   **Laporan Aktivitas Pengguna:** Admin dapat melihat ringkasan aktivitas pengguna.
        *   **AC:** Laporan menunjukkan aktivitas pengguna seperti jumlah registrasi baru atau kunjungan.
    *   **Laporan Status Pesanan:** Admin dapat melihat distribusi status pesanan.
        *   **AC:** Laporan menunjukkan jumlah pesanan dengan status "Diproses", "Selesai", atau "Dibatalkan".
    *   **Ekspor Laporan:** Admin dapat mengekspor laporan dalam format tertentu.
        *   **AC:** Admin dapat mengunduh laporan penjualan atau aktivitas dalam format CSV atau PDF.

### Kebutuhan Non-Fungsional

1.  **Performa SLA (Service Level Agreement):**
    *   **Waktu Respons:** Waktu respons API tidak lebih dari 500ms untuk 95% permintaan pada beban normal.
    *   **Waktu Muat Halaman:** Halaman utama dan detail produk harus dimuat sepenuhnya dalam waktu kurang dari 3 detik pada koneksi internet standar (3G/4G).
    *   **Uptime:** Sistem harus memiliki uptime minimal 99.9% per bulan.
    *   **Throughput:** Sistem harus mampu menangani minimal 500 permintaan per detik tanpa degradasi performa yang signifikan.

2.  **Keamanan Data:**
    *   **Autentikasi & Otorisasi:** Menggunakan standar OAuth2/JWT untuk autentikasi. Implementasi kontrol akses berbasis peran (RBAC).
    *   **Enkripsi Data:** Semua data sensitif (kata sandi, informasi pembayaran) harus dienkripsi saat transit (HTTPS/TLS) dan saat disimpan (at-rest encryption).
    *   **Perlindungan Terhadap Ancaman Umum:** Melindungi dari OWASP Top 10 Vulnerabilities (SQL Injection, XSS, CSRF, dll.).
    *   **Penyimpanan Data Pengguna:** Informasi pribadi pengguna harus disimpan sesuai dengan regulasi privasi data yang berlaku (misal: GDPR/UU PDP jika relevan).
    *   **Audit Trail:** Mencatat semua aktivitas penting pengguna dan admin untuk tujuan audit dan pelacakan.

3.  **Skalabilitas:**
    *   **Horizontal Scaling:** Arsitektur harus dirancang untuk memungkinkan penambahan instance server secara horizontal untuk menangani peningkatan beban pengguna.
    *   **Database Scalability:** Database harus dapat di-scale secara vertikal atau horizontal (sharding/replika) sesuai kebutuhan pertumbuhan data.
    *   **Cache:** Implementasi sistem caching (misal: Redis) untuk mengurangi beban database dan mempercepat respons.
    *   **Message Queues:** Menggunakan antrean pesan untuk memproses tugas-tugas berat secara asinkron (misal: pengiriman email notifikasi, pemrosesan pembayaran).

---

## 3. Core Features

### Fase 1 — Modul Inti & Fondasi
Fase ini berfokus pada pembangunan fungsionalitas dasar yang memungkinkan pengguna untuk mendaftar, menjelajahi produk, dan melakukan pembelian dasar.

**1. Manajemen Pengguna & Autentikasi**
*   **Registrasi Akun Pelanggan:**
    *   **Spesifikasi:** Form pendaftaran dengan input Nama Lengkap, Email (unique), Kata Sandi (min. 8 karakter, kombinasi huruf besar, kecil, angka, simbol), dan konfirmasi Kata Sandi. Validasi sisi klien dan server.
    *   **Alur Interaksi:** Pengguna mengakses `/register`, mengisi form, klik "Daftar". Sistem mengirim email verifikasi (opsional, untuk MVP bisa langsung aktif).
    *   **Aturan Validasi:** Email harus format valid dan belum terdaftar. Kata sandi harus memenuhi kriteria kompleksitas.
    *   **Kapabilitas:** Pembuatan akun, penyimpanan kredensial ter-hash.
*   **Login & Logout Akun:**
    *   **Spesifikasi:** Form login dengan input Email dan Kata Sandi. Tombol "Lupa Kata Sandi".
    *   **Alur Interaksi:** Pengguna mengakses `/login`, mengisi kredensial, klik "Login". Setelah berhasil, redirect ke halaman utama atau dashboard. Logout melalui menu profil.
    *   **Aturan Validasi:** Kredensial harus cocok dengan yang tersimpan.
    *   **Kapabilitas:** Autentikasi pengguna, pembuatan token sesi (JWT).
*   **Manajemen Profil Pengguna:**
    *   **Spesifikasi:** Halaman profil yang menampilkan Nama, Email, dan memungkinkan perubahan kata sandi.
    *   **Alur Interaksi:** Pengguna login, navigasi ke "Profil Saya", melihat/mengedit info, menyimpan perubahan. Untuk perubahan kata sandi, memerlukan konfirmasi kata sandi lama.
    *   **Aturan Validasi:** Email baru harus unik (jika bisa diubah), kata sandi baru memenuhi kriteria.
    *   **Kapabilitas:** Pembaruan data pengguna, keamanan perubahan kata sandi.
*   **Lupa Kata Sandi & Reset:**
    *   **Spesifikasi:** Fitur "Lupa Kata Sandi" yang mengirim tautan reset ke email terdaftar. Tautan reset memiliki masa berlaku.
    *   **Alur Interaksi:** Pengguna klik "Lupa Kata Sandi" di halaman login, memasukkan email, sistem mengirim tautan. Pengguna klik tautan, diarahkan ke halaman reset kata sandi, memasukkan kata sandi baru.
    *   **Aturan Validasi:** Email harus terdaftar. Tautan reset hanya berlaku sekali atau dalam durasi tertentu (misal: 30 menit).
    *   **Kapabilitas:** Pemulihan akun yang aman.

**2. Katalog Produk & Penemuan**
*   **Daftar Produk Digital:**
    *   **Spesifikasi:** Tampilan grid atau list untuk produk digital (Canva Pro, Gemini Pro, ChatGPT Plus, Capcut Pro, Alight Motion Pro). Setiap item menampilkan gambar produk, nama, harga, dan tombol "Lihat Detail".
    *   **Alur Interaksi:** Pengguna mengakses halaman utama `/products`, melihat daftar produk.
    *   **Aturan Validasi:** Tidak ada.
    *   **Kapabilitas:** Menampilkan data produk dari database.
*   **Halaman Detail Produk:**
    *   **Spesifikasi:** Halaman khusus per produk yang menampilkan gambar besar, nama produk, harga, deskripsi lengkap, daftar fitur utama, persyaratan sistem (jika ada), dan tombol "Beli Sekarang".
    *   **Alur Interaksi:** Pengguna mengklik produk dari daftar, diarahkan ke `/products/:id`.
    *   **Aturan Validasi:** ID produk harus valid.
    *   **Kapabilitas:** Menampilkan data detail produk.
*   **Fungsi Pencarian Produk:**
    *   **Spesifikasi:** Kolom pencarian di header atau halaman daftar produk. Mendukung pencarian berdasarkan nama produk atau kata kunci relevan.
    *   **Alur Interaksi:** Pengguna memasukkan kata kunci di kolom pencarian, menekan Enter atau ikon pencarian. Hasil ditampilkan di halaman daftar produk.
    *   **Aturan Validasi:** Tidak ada.
    *   **Kapabilitas:** Filter data produk berdasarkan input pencarian.
*   **Filter & Sortir Produk:**
    *   **Spesifikasi:** Dropdown atau checkbox untuk memfilter berdasarkan kategori (misal: "AI Tools", "Desain Grafis") dan menyortir berdasarkan harga (termurah, termahal) atau abjad.
    *   **Alur Interaksi:** Pengguna memilih opsi filter/sortir, daftar produk diperbarui secara dinamis.
    *   **Aturan Validasi:** Tidak ada.
    *   **Kapabilitas:** Mengatur urutan dan subset data produk yang ditampilkan.

**3. Manajemen Pesanan & Pembayaran**
*   **Proses Pemilihan Produk & Konfigurasi:**
    *   **Spesifikasi:** Di halaman detail produk, tombol "Beli Sekarang" akan mengarahkan pengguna ke halaman konfigurasi/checkout. Jika ada opsi (misal: durasi langganan), pengguna dapat memilihnya di sini.
    *   **Alur Interaksi:** Pengguna klik "Beli Sekarang", mengisi detail yang dibutuhkan (misal: email akun yang akan di-upgrade), lalu menuju ke ringkasan pesanan.
    *   **Aturan Validasi:** Semua field konfigurasi wajib diisi dan valid (misal: format email).
    *   **Kapabilitas:** Mengumpulkan informasi pesanan spesifik dari pengguna.
*   **Alur Checkout & Pengisian Detail Pesanan:**
    *   **Spesifikasi:** Halaman checkout yang menampilkan ringkasan pesanan (produk, harga, total), detail yang sudah diisi pengguna, dan pilihan metode pembayaran.
    *   **Alur Interaksi:** Pengguna meninjau ringkasan, memilih metode pembayaran, dan mengklik "Bayar Sekarang".
    *   **Aturan Validasi:** Ringkasan pesanan harus akurat.
    *   **Kapabilitas:** Finalisasi pesanan sebelum pembayaran.
*   **Integrasi Metode Pembayaran Online:**
    *   **Spesifikasi:** Integrasi dengan Payment Gateway pihak ketiga (misal: Midtrans, Xendit) yang mendukung berbagai metode pembayaran (Kartu Kredit/Debit, E-Wallet, Transfer Bank).
    *   **Alur Interaksi:** Pengguna memilih metode pembayaran, diarahkan ke halaman pembayaran Payment Gateway, menyelesaikan transaksi. Setelah pembayaran, diarahkan kembali ke Asterra Store.
    *   **Aturan Validasi:** Pembayaran harus berhasil diverifikasi oleh Payment Gateway.
    *   **Kapabilitas:** Memproses transaksi keuangan secara aman.
*   **Konfirmasi Pembayaran Otomatis:**
    *   **Spesifikasi:** Sistem menerima webhook dari Payment Gateway untuk status pembayaran. Jika berhasil, status pesanan otomatis diperbarui.
    *   **Alur Interaksi:** Payment Gateway mengirim webhook, sistem memprosesnya, status pesanan berubah dari "Menunggu Pembayaran" menjadi "Diproses".
    *   **Aturan Validasi:** Verifikasi tanda tangan webhook untuk keamanan.
    *   **Kapabilitas:** Otomatisasi pembaruan status pesanan, mengurangi intervensi manual.
*   **Riwayat Pesanan Pelanggan:**
    *   **Spesifikasi:** Halaman yang menampilkan daftar semua pesanan yang pernah dibuat pengguna, dengan informasi seperti ID Pesanan, Tanggal, Produk, Total, dan Status.
    *   **Alur Interaksi:** Pengguna login, navigasi ke "Riwayat Pesanan Saya".
    *   **Aturan Validasi:** Hanya pesanan milik pengguna yang login yang ditampilkan.
    *   **Kapabilitas:** Transparansi riwayat transaksi.
*   **Pelacakan Status Pesanan:**
    *   **Spesifikasi:** Pada halaman riwayat atau detail pesanan, status pesanan diperbarui secara real-time (Menunggu Pembayaran, Diproses, Selesai, Dibatalkan).
    *   **Alur Interaksi:** Pengguna melihat status pesanan yang diperbarui setelah pembayaran atau pemrosesan oleh admin.
    *   **Aturan Validasi:** Status harus mencerminkan kondisi sebenarnya.
    *   **Kapabilitas:** Memberikan informasi terkini tentang pesanan.

**4. Sistem Notifikasi & Komunikasi**
*   **Notifikasi Email Transaksional:**
    *   **Spesifikasi:** Pengiriman email otomatis untuk konfirmasi pendaftaran, konfirmasi pesanan, konfirmasi pembayaran, dan notifikasi penyelesaian/aktivasi produk.
    *   **Alur Interaksi:** Sistem memicu pengiriman email berdasarkan event transaksi.
    *   **Aturan Validasi:** Email dikirim ke alamat email terdaftar pengguna.
    *   **Kapabilitas:** Komunikasi penting dengan pengguna.
*   **Notifikasi In-App:**
    *   **Spesifikasi:** Pusat notifikasi di dashboard pengguna untuk pembaruan status pesanan.
    *   **Alur Interaksi:** Notifikasi muncul di ikon lonceng atau bagian notifikasi di dashboard pengguna.
    *   **Aturan Validasi:** Notifikasi relevan dengan aktivitas pengguna.
    *   **Kapabilitas:** Memberikan informasi real-time dalam aplikasi.
*   **Sistem Dukungan Pelanggan (FAQ & Kontak):**
    *   **Spesifikasi:** Halaman FAQ dengan pertanyaan dan jawaban umum, serta formulir kontak untuk pertanyaan yang lebih spesifik.
    *   **Alur Interaksi:** Pengguna mengakses halaman "Bantuan" atau "Kontak", melihat FAQ atau mengisi formulir.
    *   **Aturan Validasi:** Formulir kontak memerlukan input valid.
    *   **Kapabilitas:** Saluran komunikasi dan bantuan mandiri.

### Fase 2 — Modul Pertumbuhan & Operasional Harian
Fase ini berfokus pada pembangunan alat administrasi untuk manajemen operasional harian oleh tim internal (Admin).

**1. Dashboard & Administrasi Sistem (Admin)**
*   **Dashboard Ringkasan Admin:**
    *   **Spesifikasi:** Halaman dashboard khusus Admin yang menampilkan grafik ringkasan penjualan (harian/mingguan/bulanan), jumlah pesanan baru, pengguna terdaftar, dan produk terlaris.
    *   **Alur Interaksi:** Admin login, otomatis diarahkan ke dashboard ini.
    *   **Aturan Validasi:** Hanya pengguna dengan peran 'Admin' yang dapat mengakses.
    *   **Kapabilitas:** Memberikan gambaran umum operasional.
*   **Manajemen Produk:**
    *   **Spesifikasi:** Halaman CRUD (Create, Read, Update, Delete) untuk produk. Form untuk menambah/mengedit produk dengan field: Nama, Kategori, Deskripsi, Harga, Gambar, Status (Aktif/Tidak Aktif).
    *   **Alur Interaksi:** Admin navigasi ke "Manajemen Produk", dapat menambah produk baru, mengedit detail produk yang ada, atau menghapus produk.
    *   **Aturan Validasi:** Semua field wajib diisi. Harga harus numerik. Nama produk harus unik.
    *   **Kapabilitas:** Mengelola katalog produk secara dinamis.
*   **Manajemen Kategori Produk:**
    *   **Spesifikasi:** Halaman CRUD untuk kategori produk (misal: "AI Tools", "Desain Grafis").
    *   **Alur Interaksi:** Admin navigasi ke "Manajemen Kategori", dapat menambah, mengedit, atau menghapus kategori.
    *   **Aturan Validasi:** Nama kategori harus unik.
    *   **Kapabilitas:** Mengorganisir produk dalam kategori yang relevan.
*   **Manajemen Pesanan:**
    *   **Spesifikasi:** Daftar semua pesanan dengan kemampuan filter (berdasarkan status, tanggal), pencarian (berdasarkan ID pesanan, email pelanggan), dan detail pesanan. Admin dapat mengubah status pesanan (misal: dari "Diproses" ke "Selesai" setelah aktivasi).
    *   **Alur Interaksi:** Admin navigasi ke "Manajemen Pesanan", melihat daftar, mengklik pesanan untuk melihat detail, memperbarui status.
    *   **Aturan Validasi:** Hanya status yang valid yang dapat dipilih.
    *   **Kapabilitas:** Memproses dan mengelola siklus hidup pesanan.
*   **Manajemen Pengguna:**
    *   **Spesifikasi:** Daftar semua pengguna terdaftar. Admin dapat melihat detail profil, mengedit informasi dasar (kecuali kata sandi), dan memblokir/mengaktifkan kembali akun.
    *   **Alur Interaksi:** Admin navigasi ke "Manajemen Pengguna", mencari pengguna, mengklik untuk melihat detail, melakukan tindakan.
    *   **Aturan Validasi:** Tidak dapat mengubah peran pengguna menjadi Admin tanpa otorisasi khusus.
    *   **Kapabilitas:** Mengelola basis data pengguna dan menjaga keamanan.
*   **Manajemen Konten Halaman:**
    *   **Spesifikasi:** Antarmuka editor (WYSIWYG) untuk mengelola konten halaman statis seperti FAQ, Ketentuan Layanan, Kebijakan Privasi.
    *   **Alur Interaksi:** Admin navigasi ke "Manajemen Konten", memilih halaman, mengedit teks, menyimpan perubahan.
    *   **Aturan Validasi:** Konten harus valid (misal: tidak ada skrip berbahaya).
    *   **Kapabilitas:** Memperbarui informasi statis tanpa deployment kode.

### Fase 3 — Fitur Lanjutan & Pelaporan & Analitik
Fase ini memperkenalkan kapabilitas pelaporan dan analitik yang lebih mendalam untuk mendukung pengambilan keputusan bisnis.

**1. Pelaporan & Analitik**
*   **Laporan Penjualan:**
    *   **Spesifikasi:** Modul laporan yang memungkinkan Admin melihat laporan penjualan berdasarkan periode waktu (harian, mingguan, bulanan, kustom), berdasarkan produk, atau kategori. Menampilkan total pendapatan, jumlah pesanan, dan rata-rata nilai pesanan.
    *   **Alur Interaksi:** Admin mengakses "Laporan", memilih jenis laporan dan parameter, melihat hasilnya.
    *   **Aturan Validasi:** Parameter tanggal harus valid.
    *   **Kapabilitas:** Memberikan wawasan performa penjualan.
*   **Laporan Aktivitas Pengguna:**
    *   **Spesifikasi:** Laporan yang merangkum aktivitas pengguna seperti jumlah registrasi baru, jumlah login, dan aktivitas pembelian.
    *   **Alur Interaksi:** Admin memilih "Laporan Aktivitas Pengguna", melihat data.
    *   **Aturan Validasi:** Tidak ada.
    *   **Kapabilitas:** Memahami perilaku dan pertumbuhan pengguna.
*   **Laporan Status Pesanan:**
    *   **Spesifikasi:** Laporan yang menampilkan distribusi status pesanan (berapa banyak yang menunggu pembayaran, diproses, selesai, dibatalkan).
    *   **Alur Interaksi:** Admin memilih "Laporan Status Pesanan", melihat grafik dan angka.
    *   **Aturan Validasi:** Tidak ada.
    *   **Kapabilitas:** Memantau efisiensi pemrosesan pesanan.
*   **Ekspor Laporan (CSV/PDF):**
    *   **Spesifikasi:** Tombol "Ekspor" pada setiap halaman laporan yang memungkinkan Admin mengunduh data laporan dalam format CSV atau PDF.
    *   **Alur Interaksi:** Admin melihat laporan, mengklik "Ekspor", memilih format, file diunduh.
    *   **Aturan Validasi:** Data yang diekspor harus sesuai dengan tampilan laporan.
    *   **Kapabilitas:** Memungkinkan analisis data lebih lanjut di luar aplikasi.

### Fase 4 — Manajemen Akun, Keamanan & Penyempurnaan
Fase ini berfokus pada peningkatan keamanan akun, optimasi kinerja, dan penyempurnaan pengalaman pengguna secara keseluruhan.

**1. Keamanan Akun Lanjutan**
*   **Autentikasi Dua Faktor (2FA):**
    *   **Spesifikasi:** Memberikan opsi kepada pengguna untuk mengaktifkan 2FA (misal: melalui aplikasi autentikator seperti Google Authenticator) untuk login yang lebih aman.
    *   **Alur Interaksi:** Pengguna mengaktifkan 2FA di profil, memindai QR code, memasukkan kode verifikasi. Saat login, pengguna diminta memasukkan kode 2FA.
    *   **Aturan Validasi:** Kode 2FA harus valid dan sinkron.
    *   **Kapabilitas:** Meningkatkan keamanan akun pengguna.
*   **Log Aktivitas Akun:**
    *   **Spesifikasi:** Pengguna dapat melihat riwayat aktivitas penting di akun mereka (misal: login dari perangkat baru, perubahan kata sandi, perubahan profil).
    *   **Alur Interaksi:** Pengguna navigasi ke "Log Aktivitas" di profil mereka.
    *   **Aturan Validasi:** Hanya aktivitas milik pengguna yang ditampilkan.
    *   **Kapabilitas:** Transparansi dan keamanan akun.

**2. Penyempurnaan & Optimasi Kinerja**
*   **Optimasi Kinerja Frontend:**
    *   **Spesifikasi:** Implementasi teknik optimasi seperti lazy loading gambar, code splitting, caching aset statis, dan minifikasi kode untuk mempercepat waktu muat halaman.
    *   **Alur Interaksi:** Pengguna merasakan aplikasi yang lebih cepat dan responsif.
    *   **Aturan Validasi:** Page Load Time berkurang signifikan sesuai target KPI.
    *   **Kapabilitas:** Pengalaman pengguna yang lebih baik.
*   **Optimasi Kinerja Backend & Database:**
    *   **Spesifikasi:** Review dan optimasi query database, implementasi indeks yang tepat, penggunaan caching (misal: Redis) untuk data yang sering diakses, dan fine-tuning konfigurasi server.
    *   **Alur Interaksi:** Sistem backend merespons lebih cepat, mengurangi latency API.
    *   **Aturan Validasi:** Waktu respons API dan throughput meningkat sesuai target KPI.
    *   **Kapabilitas:** Sistem yang lebih efisien dan stabil.

**3. Peningkatan Pengalaman Pengguna (UX/UI)**
*   **Desain Responsif Lanjutan:**
    *   **Spesifikasi:** Penyesuaian desain dan tata letak yang lebih canggih untuk berbagai ukuran layar perangkat (desktop, tablet, mobile) untuk memastikan konsistensi dan kemudahan penggunaan.
    *   **Alur Interaksi:** Pengguna dapat mengakses dan menggunakan aplikasi dengan nyaman di perangkat apa pun.
    *   **Aturan Validasi:** Tampilan dan fungsionalitas tetap optimal di berbagai perangkat.
    *   **Kapabilitas:** Aksesibilitas dan kepuasan pengguna yang lebih luas.
*   **Feedback & Rating Produk:**
    *   **Spesifikasi:** Pengguna dapat memberikan ulasan dan rating untuk produk yang telah mereka beli.
    *   **Alur Interaksi:** Setelah pesanan selesai, pengguna dapat mengisi form ulasan di halaman detail produk atau riwayat pesanan.
    *   **Aturan Validasi:** Hanya pengguna yang telah membeli produk yang dapat memberikan ulasan.
    *   **Kapabilitas:** Membangun kepercayaan komunitas dan memberikan wawasan produk.

---

## 4. User Flow

Alur perjalanan pengguna end-to-end dimulai dari pendaftaran hingga tercapainya tujuan pembelian produk digital dan pelacakan.

```mermaid
flowchart TD
    A["Mulai: Pengguna Mengakses Asterra Store"] --> B{"Sudah Punya Akun?"};

    B -->|Ya| C["Login Akun"];
    B -->|Tidak| D["Registrasi Akun Baru"];

    C --> E["Dashboard/Halaman Utama"];
    D --> F["Verifikasi Email (Opsional/Jika Diperlukan)"] --> G["Profil Akun Dibuat"];
    G --> E;

    E --> H["Jelajahi Katalog Produk"];
    H --> I{"Pilih Produk?"};
    I -->|Ya| J["Lihat Halaman Detail Produk"];
    I -->|Tidak| H;

    J --> K{Konfigurasi Produk (Jika Ada) & Klik "Beli Sekarang"};
    K --> L["Ringkasan Pesanan & Checkout"];

    L --> M["Pilih Metode Pembayaran"];
    M --> N["Proses Pembayaran via Payment Gateway"];
    N -->|Pembayaran Berhasil| O["Konfirmasi Pembayaran Otomatis"];
    N -->|Pembayaran Gagal| P["Notifikasi Pembayaran Gagal"];
    P --> L;

    O --> Q[Pesanan Dibuat & Status "Diproses"];
    Q --> R["Notifikasi Email Konfirmasi Pesanan"];
    Q --> S["Pelacakan Status Pesanan"];

    S --> T{"Admin Memproses Pesanan & Mengaktivasi Produk"};
    T --> U[Status Pesanan "Selesai"];
    U --> V["Notifikasi Email Aktivasi Produk"];
    U --> W["Selesai: Produk Digital Siap Digunakan"];

```

---

## 5. Architecture

Arsitektur teknis Asterra Store akan mengadopsi pendekatan mikroservis atau arsitektur modular yang terdistribusi untuk memastikan skalabilitas, fleksibilitas, dan kemudahan pemeliharaan. Sistem akan terdiri dari beberapa layanan inti yang berkomunikasi melalui API RESTful dan antrean pesan.

```mermaid
flowchart LR
    User["Pengguna (Web Browser/Mobile)"] -->|HTTPS| CDN;
    CDN -->|HTTPS| Nginx["Reverse Proxy / Load Balancer"];

    Nginx --> |API Gateway| API_GW["API Gateway"];

    API_GW --> |HTTP/S| AUTH_SVC["Layanan Autentikasi (Auth Service)"];
    API_GW --> |HTTP/S| USER_SVC["Layanan Pengguna (User Service)"];
    API_GW --> |HTTP/S| PROD_SVC["Layanan Produk (Product Service)"];
    API_GW --> |HTTP/S| ORDER_SVC["Layanan Pesanan (Order Service)"];
    API_GW --> |HTTP/S| PAY_SVC["Layanan Pembayaran (Payment Service)"];
    API_GW --> |HTTP/S| NOTIF_SVC["Layanan Notifikasi (Notification Service)"];
    API_GW --> |HTTP/S| ADMIN_SVC["Layanan Admin (Admin Service)"];
    API_GW --> |HTTP/S| REPORT_SVC["Layanan Pelaporan (Reporting Service)"];

    AUTH_SVC --> DB_AUTH["DB Auth"];
    USER_SVC --> DB_USER["DB User"];
    PROD_SVC --> DB_PROD["DB Product"];
    ORDER_SVC --> DB_ORDER["DB Order"];
    PAY_SVC --> DB_PAY["DB Payment"];
    ADMIN_SVC --> DB_ADMIN["DB Admin"];
    REPORT_SVC --> DB_REPORT["DB Reporting"];

    subgraph Database Cluster
        DB_AUTH
        DB_USER
        DB_PROD
        DB_ORDER
        DB_PAY
        DB_ADMIN
        DB_REPORT
    end

    PAY_SVC -->|Webhook| PAYMENT_GW["Payment Gateway Pihak Ketiga"];
    PAYMENT_GW -->|Webhook| PAY_SVC;

    NOTIF_SVC -->|SMTP| EMAIL_SVC["Layanan Email (SendGrid/Mailgun)"];
    NOTIF_SVC -->|SMS/Push| SMS_PS["Layanan SMS/Push (Opsional)"];

    ORDER_SVC -->|Async| MSG_BROKER["Message Broker (Kafka/RabbitMQ)"];
    PAY_SVC -->|Async| MSG_BROKER;
    MSG_BROKER --> NOTIF_SVC;
    MSG_BROKER --> ADMIN_SVC;
    MSG_BROKER --> REPORT_SVC;

    CACHE["Cache (Redis)"] <--> AUTH_SVC;
    CACHE <--> PROD_SVC;

    MONITORING["Monitoring & Logging"] <--> Nginx;
    MONITORING <--> API_GW;
    MONITORING <--> AUTH_SVC;
    MONITORING <--> USER_SVC;
    MONITORING <--> PROD_SVC;
    MONITORING <--> ORDER_SVC;
    MONITORING <--> PAY_SVC;
    MONITORING <--> NOTIF_SVC;
    MONITORING <--> ADMIN_SVC;
    MONITORING <--> REPORT_SVC;
    MONITORING <--> MSG_BROKER;
    MONITORING <--> CACHE;
    MONITORING <--> Database Cluster;

```

**Penjelasan Komponen:**

*   **Pengguna (User):** Mengakses aplikasi melalui browser web atau aplikasi mobile.
*   **CDN (Content Delivery Network):** Untuk menyajikan aset statis (gambar, CSS, JS) secara cepat dan mengurangi beban pada server utama.
*   **Nginx (Reverse Proxy / Load Balancer):** Menerima semua permintaan masuk, meneruskannya ke API Gateway, dan mendistribusikan beban ke instance layanan yang berbeda.
*   **API Gateway:** Titik masuk tunggal untuk semua permintaan API eksternal. Bertanggung jawab untuk routing, autentikasi awal, otorisasi, rate limiting, dan caching.
*   **Layanan Mikro (Microservices):**
    *   **Auth Service:** Mengelola registrasi, login, logout, dan manajemen sesi pengguna (JWT generation/validation).
    *   **User Service:** Mengelola data profil pengguna, peran, dan preferensi.
    *   **Product Service:** Mengelola katalog produk, detail, pencarian, dan filter.
    *   **Order Service:** Mengelola pembuatan pesanan, riwayat, dan pelacakan status.
    *   **Payment Service:** Mengelola inisiasi pembayaran, pemrosesan webhook dari Payment Gateway, dan konfirmasi pembayaran.
    *   **Notification Service:** Mengirim notifikasi email dan in-app.
    *   **Admin Service:** Menyediakan fungsionalitas untuk dashboard admin, manajemen produk, pesanan, dan pengguna.
    *   **Reporting Service:** Mengumpulkan data dan menghasilkan laporan analitik.
*   **Database Cluster:** Setiap layanan mikro memiliki database-nya sendiri (atau skema yang terisolasi) untuk menjaga otonomi. Database relasional (PostgreSQL/MySQL) adalah pilihan utama.
*   **Payment Gateway Pihak Ketiga:** Layanan eksternal untuk memproses transaksi pembayaran (misal: Midtrans, Xendit). Berkomunikasi dengan Payment Service melalui webhook.
*   **Layanan Email (SendGrid/Mailgun):** Layanan pihak ketiga untuk pengiriman email transaksional.
*   **Message Broker (Kafka/RabbitMQ):** Digunakan untuk komunikasi asinkron antar layanan. Memastikan pengiriman pesan yang andal dan decoupling layanan, terutama untuk tugas-tugas background seperti notifikasi atau pembaruan status pesanan.
*   **Cache (Redis):** Digunakan untuk menyimpan data yang sering diakses (misal: token sesi, data produk populer) untuk mempercepat respons dan mengurangi beban database.
*   **Monitoring & Logging:** Sistem terpusat (misal: ELK Stack, Prometheus & Grafana) untuk mengumpulkan log, metrik, dan memantau kesehatan serta performa seluruh sistem.

**Alur Komunikasi:**
1.  Permintaan dari Pengguna diterima oleh Nginx, diteruskan ke API Gateway.
2.  API Gateway melakukan validasi token autentikasi (dengan Auth Service), kemudian merutekan permintaan ke layanan mikro yang sesuai.
3.  Layanan mikro berinteraksi dengan database-nya masing-masing dan/atau layanan lain melalui API RESTful atau Message Broker.
4.  Payment Service berkomunikasi dua arah dengan Payment Gateway eksternal.
5.  Notifikasi dikirim oleh Notification Service melalui layanan email pihak ketiga atau Message Broker.
6.  Event penting (misal: pesanan baru, pembayaran berhasil) diterbitkan ke Message Broker untuk diproses secara asinkron oleh layanan lain (misal: Notifikasi, Admin, Pelaporan).

---

## 6. Database Schema

Berikut adalah skema database relasional utama untuk Asterra Store menggunakan notasi `erDiagram`.

```mermaid
erDiagram
    USERS {
        UUID id PK "UUID unik pengguna"
        VARCHAR email UK "Email pengguna, unik"
        VARCHAR password_hash "Hash kata sandi"
        VARCHAR full_name "Nama lengkap"
        VARCHAR phone_number "Nomor telepon"
        VARCHAR role ENUM("customer", "admin") "Peran pengguna"
        BOOLEAN is_active "Status akun aktif"
        TIMESTAMP created_at "Waktu pembuatan akun"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    PRODUCTS {
        UUID id PK "UUID unik produk"
        VARCHAR name UK "Nama produk, unik"
        TEXT description "Deskripsi produk"
        TEXT features "Fitur produk (JSONB/Array)"
        DECIMAL price "Harga produk"
        VARCHAR image_url "URL gambar produk"
        UUID category_id FK "ID kategori produk"
        VARCHAR status ENUM("active", "inactive") "Status produk"
        TIMESTAMP created_at "Waktu pembuatan produk"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    CATEGORIES {
        UUID id PK "UUID unik kategori"
        VARCHAR name UK "Nama kategori, unik"
        TEXT description "Deskripsi kategori"
        TIMESTAMP created_at "Waktu pembuatan kategori"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    ORDERS {
        UUID id PK "UUID unik pesanan"
        UUID user_id FK "ID pengguna pemesan"
        DECIMAL total_amount "Jumlah total pesanan"
        VARCHAR order_status ENUM("pending", "paid", "processing", "completed", "cancelled", "refunded") "Status pesanan"
        TIMESTAMP order_date "Tanggal pesanan dibuat"
        TEXT customer_notes "Catatan dari pelanggan"
        TIMESTAMP created_at "Waktu pembuatan pesanan"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    ORDER_ITEMS {
        UUID id PK "UUID unik item pesanan"
        UUID order_id FK "ID pesanan"
        UUID product_id FK "ID produk"
        VARCHAR product_name "Nama produk saat dipesan"
        DECIMAL unit_price "Harga produk per unit saat dipesan"
        INTEGER quantity "Jumlah produk"
        TEXT purchased_details "Detail spesifik produk yang dibeli (misal: akun email untuk aktivasi)"
        TIMESTAMP created_at "Waktu pembuatan item pesanan"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    PAYMENTS {
        UUID id PK "UUID unik pembayaran"
        UUID order_id FK "ID pesanan terkait"
        DECIMAL amount "Jumlah pembayaran"
        VARCHAR payment_method "Metode pembayaran"
        VARCHAR transaction_id UK "ID transaksi dari Payment Gateway"
        VARCHAR payment_status ENUM("pending", "success", "failed", "refunded") "Status pembayaran"
        TIMESTAMP transaction_date "Tanggal transaksi"
        TIMESTAMP created_at "Waktu pembuatan pembayaran"
        TIMESTAMP updated_at "Waktu terakhir diubah"
    }

    NOTIFICATIONS {
        UUID id PK "UUID unik notifikasi"
        UUID user_id FK "ID pengguna penerima"
        VARCHAR type ENUM("email", "in-app") "Tipe notifikasi"
        VARCHAR subject "Subjek notifikasi"
        TEXT message "Isi pesan notifikasi"
        BOOLEAN is_read "Status dibaca"
        TIMESTAMP created_at "Waktu notifikasi dibuat"
    }

    USERS ||--o{ ORDERS : "membuat"
    ORDERS ||--|{ ORDER_ITEMS : "terdiri dari"
    ORDER_ITEMS }--|| PRODUCTS : "merujuk pada"
    PRODUCTS }--|| CATEGORIES : "termasuk dalam"
    ORDERS ||--o{ PAYMENTS : "memiliki"
    USERS ||--o{ NOTIFICATIONS : "menerima"

```

**Penjelasan Tabel:**

*   **USERS:** Menyimpan informasi dasar pengguna, kredensial, dan peran.
*   **PRODUCTS:** Menyimpan detail tentang produk digital yang dijual.
*   **CATEGORIES:** Menyimpan kategori untuk mengelompokkan produk.
*   **ORDERS:** Menyimpan detail setiap pesanan yang dibuat oleh pengguna.
*   **ORDER_ITEMS:** Menyimpan detail produk individual yang termasuk dalam suatu pesanan.
*   **PAYMENTS:** Menyimpan informasi setiap transaksi pembayaran.
*   **NOTIFICATIONS:** Menyimpan log notifikasi yang dikirim kepada pengguna.

---

## 7. Tech Stack

Pemilihan tumpukan teknologi berikut didasarkan pada pertimbangan skalabilitas, performa, komunitas yang kuat, dan kemudahan pengembangan.

*   **Frontend:**
    *   **Framework:** **React.js**
        *   **Justifikasi:** Populer, ekosistem besar, mendukung pengembangan komponen yang reusable, performa tinggi dengan Virtual DOM. Ideal untuk membangun antarmuka pengguna yang kompleks dan interaktif.
    *   **State Management:** **React Query / Zustand**
        *   **Justifikasi:** React Query sangat baik untuk manajemen state asinkron (data fetching, caching, sinkronisasi server state). Zustand adalah alternatif ringan untuk state manajemen lokal yang sederhana dan cepat.
    *   **Styling:** **Tailwind CSS**
        *   **Justifikasi:** Framework CSS utility-first yang memungkinkan pengembangan UI yang cepat dan sangat dapat disesuaikan tanpa perlu menulis CSS kustom yang banyak.
    *   **Build Tool:** **Vite**
        *   **Justifikasi:** Build tool generasi berikutnya yang sangat cepat, menawarkan pengalaman pengembangan yang lebih baik daripada Webpack untuk proyek React.
*   **Backend:**
    *   **Framework:** **Node.js dengan Express.js / NestJS**
        *   **Justifikasi:** Node.js adalah pilihan yang sangat baik untuk layanan mikro karena sifatnya yang non-blocking I/O, cocok untuk aplikasi real-time dan API yang efisien. Express.js ringan dan fleksibel, sementara NestJS menawarkan struktur yang lebih terorganisir dan mendukung TypeScript secara native, ideal untuk proyek skala besar.
    *   **Language:** **TypeScript**
        *   **Justifikasi:** Menambahkan type safety ke JavaScript, mengurangi bug, dan meningkatkan maintainability kode, terutama dalam tim besar.
    *   **ORM:** **Prisma / TypeORM**
        *   **Justifikasi:** Prisma menyediakan ORM yang modern, type-safe, dan mudah digunakan. TypeORM adalah ORM yang matang dengan dukungan TypeScript yang kuat.
*   **Database:**
    *   **Primary Database:** **PostgreSQL**
        *   **Justifikasi:** Database relasional open-source yang sangat andal, kuat, dan skalabel, mendukung fitur-fitur canggih seperti JSONB untuk menyimpan data semi-terstruktur (misal: fitur produk).
    *   **Cache/Message Queue:** **Redis**
        *   **Justifikasi:** In-memory data store yang sangat cepat, cocok untuk caching, manajemen sesi, dan sebagai message broker sederhana untuk tugas-tugas real-time.
*   **Cloud/Hosting:**
    *   **Platform:** **AWS (Amazon Web Services) / Google Cloud Platform (GCP)**
        *   **Justifikasi:** Kedua platform menawarkan ekosistem layanan cloud yang komprehensif dan skalabel (EC2/Compute Engine, RDS/Cloud SQL, S3/Cloud Storage, Lambda/Cloud Functions, EKS/GKE untuk Kubernetes). AWS memiliki pangsa pasar terbesar dan layanan yang sangat beragam.
*   **Pustaka/Library Pihak Ketiga:**
    *   **Payment Gateway SDK:** **Midtrans API Client / Xendit API Client**
        *   **Justifikasi:** Memungkinkan integrasi pembayaran yang mudah dan aman dengan penyedia layanan pembayaran lokal.
    *   **Email Service:** **Nodemailer (dengan SendGrid/Mailgun)**
        *   **Justifikasi:** Nodemailer adalah modul Node.js untuk pengiriman email, dapat diintegrasikan dengan layanan email transaksional pihak ketiga yang andal seperti SendGrid atau Mailgun untuk pengiriman email yang skalabel.
    *   **Authentication:** **jsonwebtoken**
        *   **Justifikasi:** Untuk mengimplementasikan JSON Web Tokens (JWT) sebagai metode autentikasi stateless dan aman.
    *   **Validation:** **Joi / class-validator**
        *   **Justifikasi:** Untuk validasi skema data pada input API, memastikan data yang masuk ke sistem selalu valid dan sesuai ekspektasi.
    *   **Logging:** **Winston / Pino**
        *   **Justifikasi:** Library logging yang efisien dan fleksibel untuk aplikasi Node.js, memungkinkan pencatatan log yang terstruktur dan mudah dianalisis.

---

## 8. API Endpoints

Berikut adalah spesifikasi kontrak API RESTful untuk beberapa modul inti Asterra Store. Semua endpoint akan memerlukan header `Authorization: Bearer <token_jwt>` untuk autentikasi pengguna (kecuali `/register` dan `/login`).

### Modul: Autentikasi & Pengguna

#### 1. Registrasi Akun
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/auth/register`
*   **Skema Request JSON:**
    ```json
    {
      "full_name": "Nama Lengkap Pengguna",
      "email": "email@example.com",
      "password": "PasswordSangatRahasia123!"
    }
    ```
*   **Skema Response JSON (201 Created):**
    ```json
    {
      "message": "Registrasi berhasil. Silakan login.",
      "user": {
        "id": "uuid-user-123",
        "full_name": "Nama Lengkap Pengguna",
        "email": "email@example.com",
        "role": "customer",
        "is_active": true,
        "created_at": "2023-10-27T10:00:00Z"
      }
    }
    ```
*   **Status Kode:**
    *   `201 Created`: Registrasi berhasil.
    *   `400 Bad Request`: Data input tidak valid.
    *   `409 Conflict`: Email sudah terdaftar.

#### 2. Login Akun
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/auth/login`
*   **Skema Request JSON:**
    ```json
    {
      "email": "email@example.com",
      "password": "PasswordSangatRahasia123!"
    }
    ```
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "message": "Login berhasil.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkLXVzZXItMTIzIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNjc4NjQ0NDAwLCJleHAiOjE2Nzg2NDgwMDB9.signature",
      "user": {
        "id": "uuid-user-123",
        "full_name": "Nama Lengkap Pengguna",
        "email": "email@example.com",
        "role": "customer"
      }
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Login berhasil.
    *   `401 Unauthorized`: Kredensial tidak valid.

#### 3. Dapatkan Profil Pengguna
*   **HTTP Method:** `GET`
*   **Path URL:** `/api/v1/users/profile`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>`
*   **Skema Request JSON:** N/A
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "id": "uuid-user-123",
      "full_name": "Nama Lengkap Pengguna",
      "email": "email@example.com",
      "phone_number": "08123456789",
      "role": "customer",
      "is_active": true,
      "created_at": "2023-10-27T10:00:00Z",
      "updated_at": "2023-10-27T11:30:00Z"
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Profil pengguna berhasil diambil.
    *   `401 Unauthorized`: Token tidak valid atau hilang.

### Modul: Produk

#### 1. Dapatkan Semua Produk
*   **HTTP Method:** `GET`
*   **Path URL:** `/api/v1/products`
*   **Parameter Query (Opsional):**
    *   `search`: Kata kunci pencarian nama produk.
    *   `category_id`: Filter berdasarkan ID kategori.
    *   `sort_by`: `price_asc`, `price_desc`, `name_asc`, `name_desc`.
    *   `page`: Nomor halaman (default 1).
    *   `limit`: Jumlah item per halaman (default 10).
*   **Skema Request JSON:** N/A
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "uuid-prod-001",
          "name": "Canva Pro",
          "description": "Langganan premium Canva...",
          "price": 75000.00,
          "image_url": "https://example.com/canva.png",
          "category": {
            "id": "uuid-cat-001",
            "name": "Desain Grafis"
          },
          "status": "active"
        },
        {
          "id": "uuid-prod-002",
          "name": "ChatGPT Plus",
          "description": "Langganan premium ChatGPT...",
          "price": 150000.00,
          "image_url": "https://example.com/chatgpt.png",
          "category": {
            "id": "uuid-cat-002",
            "name": "AI Tools"
          },
          "status": "active"
        }
      ],
      "pagination": {
        "total_items": 20,
        "current_page": 1,
        "total_pages": 2,
        "items_per_page": 10
      }
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Daftar produk berhasil diambil.

#### 2. Dapatkan Detail Produk
*   **HTTP Method:** `GET`
*   **Path URL:** `/api/v1/products/:id`
*   **Skema Request JSON:** N/A
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "id": "uuid-prod-001",
      "name": "Canva Pro",
      "description": "Langganan premium Canva untuk desain grafis profesional...",
      "features": ["Akses penuh ke semua template", "Ribuan aset premium", "Penghapusan latar belakang instan"],
      "price": 75000.00,
      "image_url": "https://example.com/canva.png",
      "category": {
        "id": "uuid-cat-001",
        "name": "Desain Grafis"
      },
      "status": "active",
      "created_at": "2023-10-20T08:00:00Z",
      "updated_at": "2023-10-25T09:00:00Z"
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Detail produk berhasil diambil.
    *   `404 Not Found`: Produk tidak ditemukan.

### Modul: Pesanan & Pembayaran

#### 1. Buat Pesanan Baru
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/orders`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>`
*   **Skema Request JSON:**
    ```json
    {
      "items": [
        {
          "product_id": "uuid-prod-001",
          "quantity": 1,
          "purchased_details": {
            "target_email": "akun_anda@gmail.com",
            "duration": "1_month"
          }
        }
      ],
      "customer_notes": "Mohon segera diproses."
    }
    ```
*   **Skema Response JSON (201 Created):**
    ```json
    {
      "message": "Pesanan berhasil dibuat.",
      "order": {
        "id": "uuid-order-001",
        "user_id": "uuid-user-123",
        "total_amount": 75000.00,
        "order_status": "pending",
        "order_date": "2023-10-27T15:00:00Z",
        "items": [
          {
            "id": "uuid-orderitem-001",
            "product_id": "uuid-prod-001",
            "product_name": "Canva Pro",
            "unit_price": 75000.00,
            "quantity": 1,
            "purchased_details": {
              "target_email": "akun_anda@gmail.com",
              "duration": "1_month"
            }
          }
        ]
      }
    }
    ```
*   **Status Kode:**
    *   `201 Created`: Pesanan berhasil dibuat.
    *   `400 Bad Request`: Data input tidak valid atau stok produk habis.
    *   `401 Unauthorized`: Token tidak valid atau hilang.

#### 2. Inisiasi Pembayaran untuk Pesanan
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/orders/:order_id/pay`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>`
*   **Skema Request JSON:**
    ```json
    {
      "payment_method": "gopay"
    }
    ```
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "message": "Pembayaran berhasil diinisiasi.",
      "payment": {
        "id": "uuid-payment-001",
        "order_id": "uuid-order-001",
        "amount": 75000.00,
        "payment_method": "gopay",
        "transaction_id": "trx-midtrans-abc123",
        "payment_status": "pending",
        "redirect_url": "https://app.midtrans.com/snap/v1/transactions/..." // URL untuk redirect ke Payment Gateway
      }
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Pembayaran berhasil diinisiasi.
    *   `400 Bad Request`: Metode pembayaran tidak valid atau pesanan tidak dapat dibayar.
    *   `401 Unauthorized`: Token tidak valid atau hilang.
    *   `404 Not Found`: Pesanan tidak ditemukan.

#### 3. Webhook Pembayaran (dari Payment Gateway)
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/payments/webhook`
*   **Header Autentikasi:** Biasanya menggunakan `X-Signature` atau `X-Callback-Token` dari Payment Gateway.
*   **Skema Request JSON:** (Sesuai format webhook dari Payment Gateway, contoh Midtrans)
    ```json
    {
      "transaction_status": "settlement",
      "order_id": "uuid-order-001",
      "gross_amount": "75000.00",
      "payment_type": "gopay",
      "transaction_id": "trx-midtrans-abc123",
      "signature_key": "..."
      // ... field lain dari Payment Gateway
    }
    ```
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "message": "Webhook diterima dan diproses."
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Webhook berhasil diproses.
    *   `400 Bad Request`: Payload webhook tidak valid.
    *   `401 Unauthorized`: Signature webhook tidak valid.

#### 4. Dapatkan Riwayat Pesanan Pengguna
*   **HTTP Method:** `GET`
*   **Path URL:** `/api/v1/orders`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>`
*   **Parameter Query (Opsional):**
    *   `status`: Filter berdasarkan status pesanan (e.g., `completed`, `pending`).
    *   `page`: Nomor halaman.
    *   `limit`: Jumlah item per halaman.
*   **Skema Request JSON:** N/A
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "uuid-order-001",
          "total_amount": 75000.00,
          "order_status": "completed",
          "order_date": "2023-10-27T15:00:00Z",
          "items": [
            {
              "product_name": "Canva Pro",
              "quantity": 1,
              "unit_price": 75000.00
            }
          ],
          "payment_status": "success"
        },
        {
          "id": "uuid-order-002",
          "total_amount": 150000.00,
          "order_status": "pending",
          "order_date": "2023-10-28T09:00:00Z",
          "items": [
            {
              "product_name": "ChatGPT Plus",
              "quantity": 1,
              "unit_price": 150000.00
            }
          ],
          "payment_status": "pending"
        }
      ],
      "pagination": {
        "total_items": 2,
        "current_page": 1,
        "total_pages": 1,
        "items_per_page": 10
      }
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Riwayat pesanan berhasil diambil.
    *   `401 Unauthorized`: Token tidak valid atau hilang.

### Modul: Admin (Memerlukan peran `admin`)

#### 1. Tambah Produk Baru
*   **HTTP Method:** `POST`
*   **Path URL:** `/api/v1/admin/products`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>` (dengan peran admin)
*   **Skema Request JSON:**
    ```json
    {
      "name": "Produk Baru Premium",
      "description": "Deskripsi produk baru yang menarik.",
      "features": ["Fitur A", "Fitur B"],
      "price": 99000.00,
      "image_url": "https://example.com/new_product.png",
      "category_id": "uuid-cat-003",
      "status": "active"
    }
    ```
*   **Skema Response JSON (201 Created):**
    ```json
    {
      "message": "Produk berhasil ditambahkan.",
      "product": {
        "id": "uuid-prod-003",
        "name": "Produk Baru Premium",
        "price": 99000.00,
        "status": "active"
      }
    }
    ```
*   **Status Kode:**
    *   `201 Created`: Produk berhasil ditambahkan.
    *   `400 Bad Request`: Data input tidak valid.
    *   `401 Unauthorized`: Token tidak valid atau peran bukan admin.

#### 2. Perbarui Status Pesanan
*   **HTTP Method:** `PATCH`
*   **Path URL:** `/api/v1/admin/orders/:order_id/status`
*   **Header Autentikasi:** `Authorization: Bearer <token_jwt>` (dengan peran admin)
*   **Skema Request JSON:**
    ```json
    {
      "new_status": "completed"
    }
    ```
*   **Skema Response JSON (200 OK):**
    ```json
    {
      "message": "Status pesanan berhasil diperbarui.",
      "order": {
        "id": "uuid-order-001",
        "order_status": "completed",
        "updated_at": "2023-10-27T16:30:00Z"
      }
    }
    ```
*   **Status Kode:**
    *   `200 OK`: Status pesanan berhasil diperbarui.
    *   `400 Bad Request`: Status baru tidak valid.
    *   `401 Unauthorized`: Token tidak valid atau peran bukan admin.
    *   `404 Not Found`: Pesanan tidak ditemukan.
]]>
</prd_document>

<design_data>
  <color_tokens>
<![CDATA[
[{"token":"--color-bg","hex":"#F7F5F0","role":"Color Token"},{"token":"--color-surface","hex":"#FCFBF8","role":"Color Token"},{"token":"--color-surface-raised","hex":"#FFFFFF","role":"Color Token"},{"token":"--color-ink","hex":"#171A18","role":"Color Token"},{"token":"--color-ink-soft","hex":"#303633","role":"Color Token"},{"token":"--color-muted","hex":"#707874","role":"Color Token"},{"token":"--color-border","hex":"#D9DDD8","role":"Color Token"},{"token":"--color-border-strong","hex":"#B9BFBB","role":"Color Token"},{"token":"--color-accent","hex":"#C66543","role":"Color Token"},{"token":"--color-accent-dark","hex":"#A94F32","role":"Color Token"},{"token":"--color-accent-soft","hex":"#F1DFD7","role":"Color Token"},{"token":"--color-success","hex":"#2F6B4F","role":"Color Token"},{"token":"--color-warning","hex":"#A56A21","role":"Color Token"},{"token":"--color-danger","hex":"#B4433A","role":"Color Token"},{"token":"--color-info","hex":"#486875","role":"Color Token"}]
]]>
  </color_tokens>
</design_data>

<task_list>
<![CDATA[
{"phasesOverview":[{"id":"phase-1","name":"Fase 1: Environment & Core Setup","total":6,"done":0},{"id":"phase-2","name":"Fase 2: Database Schema & Auth","total":8,"done":0},{"id":"phase-3","name":"Fase 3: Backend APIs & Integrations","total":12,"done":0},{"id":"phase-4","name":"Fase 4: Frontend UI & State Management","total":9,"done":0},{"id":"phase-5","name":"Fase 5: Testing & Anti-Slop Guardrails","total":7,"done":0},{"id":"phase-6","name":"Fase 6: Deployment & Launch Verification","total":6,"done":0}],"activeTasksWindow":[{"id":"T-1.1","phaseName":"Fase 1: Environment & Core Setup","title":"Inisialisasi Proyek Backend (Node.js, TypeScript, Express.js)","status":"todo","estimasi":"2h","description":"Buat proyek Node.js baru dengan TypeScript. Instal Express.js dan dependensi dasar lainnya seperti 'dotenv', 'cors', 'helmet'. Konfigurasi tsconfig.json dan package.json.","definitionOfDone":"Proyek backend TypeScript dengan Express.js berhasil diinisialisasi dan dapat dijalankan dengan 'npm run dev'."},{"id":"T-1.2","phaseName":"Fase 1: Environment & Core Setup","title":"Inisialisasi Proyek Frontend (React.js, Vite, TypeScript)","status":"todo","estimasi":"1h","description":"Buat proyek React.js baru menggunakan Vite dan TypeScript. Konfigurasi vite.config.ts dan package.json.","definitionOfDone":"Proyek frontend React.js dengan Vite dan TypeScript berhasil diinisialisasi dan dapat dijalankan dengan 'npm run dev'."},{"id":"T-1.3","phaseName":"Fase 1: Environment & Core Setup","title":"Konfigurasi Linter & Formatter (ESLint, Prettier) untuk Backend & Frontend","status":"todo","estimasi":"2h","description":"Instal dan konfigurasi ESLint dan Prettier untuk proyek backend dan frontend. Pastikan aturan konsisten dan terintegrasi dengan editor (VS Code).","definitionOfDone":"ESLint dan Prettier terinstal dan berfungsi di kedua proyek, dengan konfigurasi yang konsisten. Kode dapat diformat secara otomatis."}],"taskStatuses":{}}
]]>
</task_list>