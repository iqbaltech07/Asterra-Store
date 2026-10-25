'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface PromoBannerItem {
  id: string;
  title: string;
  description?: string;
  ctaText?: string;
  bannerType?: string;
  type?: string;
  imageUrl: string;
  blobUrl?: string;
  linkUrl?: string;
  destinationUrl?: string;
  targetPage?: string;
  displayOrder?: number;
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_STOREFRONT_BANNERS: PromoBannerItem[] = [
  {
    id: 'banner_bf3e3c48d9bb',
    title: 'Grand Opening! Asterra Store — Beli Sekarang & Nikmati Promo Spesial',
    description: 'Promo Spesial Grand Opening Asterra Store. Akun resmi & lisensi digital bergaransi penuh.',
    ctaText: 'Beli Sekarang',
    bannerType: 'hero',
    type: 'hero',
    imageUrl: '/images/banners/hero-banner-grand-opening.webp',
    linkUrl: '/#katalog',
    destinationUrl: '/#katalog',
    targetPage: 'home',
    displayOrder: 1,
    isActive: true,
    status: 'active',
    createdAt: '2026-10-12T12:26:43.159Z',
  },
  {
    id: 'banner_53f48c92dd91',
    title: 'Program Mitra Affiliate Asterra Store — Raih Komisi 10% Penjualan Produk Digital',
    description: 'Rekomendasikan produk lisensi digital resmi, raih komisi 10% per transaksi. Dashboard real-time, pencairan kilat ke rekening/e-wallet.',
    ctaText: 'Daftar Affiliate',
    bannerType: 'hero',
    type: 'hero',
    imageUrl: '/images/banners/hero-banner-seller.webp',
    linkUrl: '/daftar-sales',
    destinationUrl: '/daftar-sales',
    targetPage: 'home',
    displayOrder: 2,
    isActive: true,
    status: 'active',
    createdAt: '2026-10-11T09:05:18.084Z',
  },
  {
    id: 'banner_f5673e22c8e1',
    title: 'Selamat Datang di Asterra Store — Pusat Akun & Lisensi Premium Resmi Bergaransi',
    description: 'Pusat Akun & Lisensi Premium Resmi Bergaransi. Canva Pro, Gemini AI, Netflix kilat 1 menit.',
    ctaText: 'Eksplor Katalog',
    bannerType: 'hero',
    type: 'hero',
    imageUrl: '/images/banners/hero-banner-welcome.webp',
    linkUrl: '/#katalog',
    destinationUrl: '/#katalog',
    targetPage: 'home',
    displayOrder: 3,
    isActive: true,
    status: 'active',
    createdAt: '2026-10-11T09:05:21.209Z',
  },
];

async function fetchHeroBanners(): Promise<PromoBannerItem[]> {
  const res = await fetch('/api/v1/banners?targetPage=home&activeOnly=true&bannerType=hero', {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Gagal mengambil data banner promo');
  const json = await res.json();
  if (json.success && Array.isArray(json.data)) {
    return json.data;
  }
  return INITIAL_STOREFRONT_BANNERS;
}

/**
 * Shared React Query hook for hero promo banners.
 *
 * Ensures:
 * - Single source of truth for both HomepagePreloader & HeroBannerSwiper.
 * - staleTime: 5 minutes (prevents endless network re-fetching on render or mount).
 * - Immediate fallback with INITIAL_STOREFRONT_BANNERS to prevent layout shift.
 */
export function useHeroBanners() {
  const { data, isLoading, isError } = useQuery<{ success?: boolean; data?: PromoBannerItem[] } | PromoBannerItem[]>({
    queryKey: ['home-promo-banners'],
    queryFn: fetchHeroBanners,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const banners = useMemo(() => {
    let rawList: PromoBannerItem[] = INITIAL_STOREFRONT_BANNERS;
    if (Array.isArray(data)) {
      rawList = data.length > 0 ? data : INITIAL_STOREFRONT_BANNERS;
    } else if (data && 'data' in data && Array.isArray(data.data) && data.data.length > 0) {
      rawList = data.data;
    }

    return rawList
      .filter((b) => {
        const slotType = (b.bannerType || b.type || 'hero').toLowerCase();
        const isHero = slotType === 'hero' || slotType === 'heromain';
        const isActive = b.isActive !== false && b.status !== 'inactive';
        const hasImage = Boolean(b.imageUrl && b.imageUrl.trim().length > 0);
        return isHero && isActive && hasImage;
      })
      .sort((a, b) => {
        const orderA = typeof a.displayOrder === 'number' ? a.displayOrder : 0;
        const orderB = typeof b.displayOrder === 'number' ? b.displayOrder : 0;
        if (orderA !== orderB) return orderA - orderB;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [data]);

  return {
    banners,
    isLoading,
    isError,
    primaryBannerUrl: banners[0]?.imageUrl || '/images/banners/hero-banner-grand-opening.webp',
  };
}
