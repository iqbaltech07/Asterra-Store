---
name: frontend
description: Guidance for distinctive visual aesthetics, typography pairing, color palettes, and signature design choices that avoid generic AI templates.
---

# 🎨 frontend — Visual Identity & Aesthetic Direction

[[INDEX|file:///C:/Marchelino%20Kurniawan/linox/INDEX.md]] | [[02 Standards/anti_slop_rules|file:///C:/Marchelino%20Kurniawan/linox/02%20Standards/anti_slop_rules.md]]

## 📌 1. Triggers & When to Use
Gunakan skill ini ketika:
- Merumuskan arah estetika, tema visual, atau palet warna unik untuk halaman web atau aplikasi.
- Memilih pasangan tipografi (display font + body font) yang memiliki karakter kuat dan tidak klise.
- Menentukan elemen khas (*signature design element*) agar produk tidak terlihat seperti template AI generik.
- **RUTE KERJA**:
  - Untuk eksekusi pembuatan halaman dan perakitan komponen: Rujuk ke skill `piardify`.
  - Untuk audit responsivitas layar dan kontras warna: Rujuk ke skill `validate-ui`.

---

## 🎯 2. Scope & Batasan
- **Scope**: Pengambilan keputusan estetika tingkat tinggi (warna, tipografi, ritme ruang, hierarki visual).
- **Batasan**:
  - Dilarang membuat komponen UI tanpa menggunakan `shadcn/ui` primitives (AH-021).
  - Jangan memaksakan template default AI (hindari kombinasi otomatis: dark theme + neon purple glow + aurora background).

---

## 🛠️ 3. Prerequisites
1. Pengetahuan tentang domain bisnis produk dan persona pengguna target.
2. Token desain yang telah disepakati atau file konfigurasi tema (`tailwind.config.ts`).

---

## 🔄 4. Sequential Execution Workflow

### Langkah 1: Penentuan Subjek & Thesis Visual
- Tentukan satu metafora visual konkret yang mencerminkan dunia nyata produk (misal: nuansa editorial kertas untuk bacaan, tekstur presisi untuk finansial, elemen hangat untuk lifestyle).
- Tentukan pesan utama yang harus disampaikan oleh section hero.

### Langkah 2: Kurasi Palet Warna & Tipografi
- Pilih 4–6 nilai hex spesifik dengan fungsi yang jelas (Background, Surface, Text Primary, Text Muted, Accent, Border).
- Padukan 2 font family: satu font display berkarakter untuk heading dan satu font body yang sangat mudah dibaca.

### Langkah 3: Penentuan Signature Element
- Ciptakan satu interaksi atau visual memorable yang menjadi ciri khas produk (misal: carousel dengan motif background unik per brand, preview interaktif live, atau hover micro-interaction yang halus).

### Langkah 4: Rute ke Piardify untuk Implementasi
- Setelah arah visual disepakati, alihkan eksekusi perakitan komponen ke skill `piardify` untuk memastikan penerapan `shadcn/ui` dan runtime handlers.

---

## ⚖️ 5. Aturan Pengambilan Keputusan
- Preferensi brief spesifik pengguna **selalu mengalahkan** preferensi bawaan.
- Berani mengambil satu risiko estetika yang terjustifikasi, namun jaga elemen sekitarnya tetap tenang dan rapi.

---

## 📦 6. Expected Output
- Rencana desain visual terstruktur: palet warna (hex), pairing font, tata letak grid, dan signature element yang siap diimplementasikan oleh `piardify`.

---

## ✅ 7. Verification Checklist
- [ ] Warna dan tipografi memiliki kontras yang terbaca jelas.
- [ ] Bebas dari 3 klise template AI utama (ungu/indigo default, partikel acak, nomor palsu 01/02).
- [ ] Siap dioper ke `piardify` untuk perakitan komponen.

---

## 🚨 8. Failure Handling
- Jika desain terasa terlalu ramai, terapkan prinsip Chanel: hilangkan satu elemen dekoratif tambahan untuk mengembalikan fokus utama.
