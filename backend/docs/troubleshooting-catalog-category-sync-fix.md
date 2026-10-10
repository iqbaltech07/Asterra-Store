---
title: Storefront Catalog Category and AI Tools Synchronization Fix
tags:
  - troubleshooting
  - nextjs
  - fastapi
  - catalog
  - postgresql
  - prisma
date: 2026-10-10
source: Catalog API Category Desync Investigation
confidence: High
---

# Storefront Catalog Category and AI Tools Synchronization Fix

## 1. Problem (Gejala Bug)
1. **Kategori Hilang di Storefront (`/products`)**:
   - Di halaman Katalog Produk (`frontend-user` `/products`), tab filter kategori hanya menampilkan `[Semua]` dan `[Apps & Streaming]`.
   - Kategori vital seperti `AI Tools` dan `Layanan Digital` tidak muncul sama sekali.
2. **Katalog Dipenuhi Paket K-Vision Satelit TV**:
   - Etalase utama menampilkan 24 produk pertama yang seluruhnya adalah paket satelit K-Vision/GOL TV yang berstatus non-aktif/archived di database.
   - Produk AI unggulan seperti Google AI Pro, Gemini AI Pro, dan ChatGPT tidak dapat diakses atau hilang dari etalase storefront.

---

## 2. Root Cause (Penyebab Utama)
1. **Fallback Catalog Hardcoded Category (`active-catalog.json`)**:
   - `backend/data/active-catalog.json` memuat dump lama 245 produk mentah, di mana seluruh 245 produk ditimpa secara keliru menjadi `{ id: "cat-apps-streaming", name: "Apps & Streaming" }`.
   - Tidak ada satu pun produk di `active-catalog.json` yang memiliki kategori `AI Tools`, bahkan untuk produk `ChatGPT` dan `Gemini AI`.
   - Selain itu, 200+ paket K-Vision berstatus `archived` di database Supabase secara keliru ditandai `status: "active"` di dalam file snapshot lokal tersebut dan ditempatkan di indeks paling atas.
2. **CatalogService Mengabaikan Status Riil Database Supabase**:
   - `CatalogService` di FastAPI membaca `active-catalog.json` secara statis tanpa menormalisasi kategori atau menyaring produk yang sebenarnya telah diarsipkan di Supabase (`prisma.product`).
3. **Database Kategori untuk Varian ChatGPT Plus**:
   - Sejumlah varian ChatGPT Plus di database memiliki `categoryName: "Apps & Streaming"` alih-alih `AI Tools`.
4. **Penyusunan Kategori Dinamis di Frontend**:
   - Komponen `ProductsContent` di `frontend-user/src/app/products/page.tsx` mengekstrak kategori secara murni dari hasil API `useCatalogProducts()`. Karena API mengembalikan semua produk dengan kategori `Apps & Streaming`, pil filter hanya memunculkan `[Semua]` dan `[Apps & Streaming]`.

---

## 3. Solution (Solusi yang Diterapkan)
1. **Update Kategori AI Tools di Supabase Database**:
   - Melakukan standardisasi seluruh record `Product` yang berkaitan dengan OpenAI / ChatGPT (`vip-chatgpt*`, `CHATGPT*`) dan Google Gemini ke `categoryId: "cat-ai-tools"` dan `categoryName: "AI Tools"`.
2. **Penyempurnaan Script Sinkronisasi (`backend/scripts/sync-supabase-to-json.js`)**:
   - Menambahkan ekspor sinkronisasi real-time untuk tabel `Product` dari PostgreSQL Supabase.
   - Mengaplikasikan `mapCategory` cerdas:
     - AI Tools (`cat-ai-tools`): ChatGPT, Gemini, Google AI Pro, Claude, OpenAI.
     - Apps & Streaming (`cat-apps-streaming`): Netflix, YouTube, Spotify, Canva, CapCut, Vidio, Viu, WeTV, Bstation, iQIYI, Alight Motion.
     - Layanan Digital (`cat-digital-services`): Lisensi Layanan Digital.
   - Menyaring hanya produk aktif (`status === 'active'`) ke dalam `data/active-catalog.json` (41 produk aktif) dan menyortir produk berlabel `popular` dan AI Tools di posisi teratas.
   - Menyinkronkan seluruh 236 produk (termasuk 195 produk archived) ke `data/managed-catalog.json` untuk konsol Admin.
3. **Normalisasi Otomatis di CatalogService FastAPI (`catalog_service.py`)**:
   - Menambahkan method `_normalize_product` yang menggaransi format category object `{ id, name }` dan mencegah misklasifikasi secara runtime.
   - Memastikan `load_managed_products` menyajikan katalog komprehensif bagi panel admin (`/api/v1/admin/products`), sementara storefront publik hanya menyajikan produk aktif terkurasi (`/api/v1/products`).
4. **Penyempurnaan Tab Kategori di Storefront (`frontend-user`)**:
   - Mengurutkan kategori dengan urutan prioritas: `Semua`, `AI Tools`, `Apps & Streaming`, `Layanan Digital`.
   - Menambahkan normalisasi query parameter `resolveCategoryParam` agar URL query seperti `?category=cat-ai-tools` atau `?category=AI Tools` langsung terpilih dengan benar.

---

## 4. Verification & Results
- **Endpoint Backend**: `GET http://localhost:8000/api/v1/products` mengembalikan 41 produk aktif dengan 3 kategori: `AI Tools` (12 produk), `Apps & Streaming` (28 produk), dan `Layanan Digital` (1 produk).
- **Endpoint Next.js Proxy**: `GET https://localhost:3000/api/v1/products` mengembalikan respons 200 OK yang identik.
- **Pengujian Browser Subagent**:
  - Halaman `https://localhost:3000/products` menampilkan pil kategori: `Semua`, `AI Tools`, `Apps & Streaming`, `Layanan Digital`.
  - Klik pada tab `AI Tools` menyaring etalase secara presisi menjadi 12 produk AI Tools (ChatGPT GO Plan, Gemini AI Pro, Google AI Pro, ChatGPT Plus) lengkap dengan gambar banner asli, harga resmi, dan status stok.
  - Paket TV satelit lama (K-Vision) telah bersih dari storefront consumer.
