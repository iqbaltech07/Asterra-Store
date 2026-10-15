# Arsip Komponen: HomepagePreloader (Splash Screen / Loading Screen)

Komponen ini diarsipkan berdasarkan permintaan pengguna untuk mengaktifkan **mode render langsung instan (zero-delay rendering)** pada beranda Asterra Store tanpa memblokir tampilan dengan splash screen / loading screen di awal.

---

## 📋 Ringkasan Komponen
- **File Komponen**: [`homepage-preloader.tsx`](./homepage-preloader.tsx)
- **Fitur Utama**:
  - Centerpiece visual 3D planet berputar (152 frames, 20fps webp).
  - Track orbit melingkar ganda dengan satelit bercahaya.
  - Wordmark resmi AsterraStore putih dengan drop-shadow lembut.
  - Mesin pelacak progres 8 task tertimbang (Hydration, Katalog, Kampanye, Banner, Gambar, DOM Render, Validasi).
  - Transisi keluar halus (`scale-[1.015]` + `opacity-0`).

---

## 🔄 Cara Mengaktifkan / Mengembalikan Kembali (Restore)
Jika di kemudian hari splash screen / loading screen ingin dimunculkan kembali:

1. **Import komponen di [`frontend-user/src/app/page.tsx`](../../app/page.tsx)**:
   ```tsx
   import { HomepagePreloader } from '@/components/home/archive/homepage-preloader';
   ```

2. **Pasang di bagian atas JSX return `page.tsx`**:
   ```tsx
   <HomepagePreloader
     isCatalogReady={!isCatalogLoading && (!!catalogResponse?.data || isCatalogError)}
     isCatalogError={isCatalogError}
     isCampaignsReady={isCampaignsLoaded}
     isCampaignsError={isCampaignsError}
     isBannersReady={!isBannersLoading && heroBanners.length > 0}
     isComponentReady={isMounted && heroBanners.length > 0 && !isCatalogLoading && isCampaignsLoaded}
   />
   ```

3. **Sinkronkan animasi di [`frontend-user/src/components/layout/page-transition.tsx`](../layout/page-transition.tsx)** jika ingin animasi hero menunggu preloader selesai.
