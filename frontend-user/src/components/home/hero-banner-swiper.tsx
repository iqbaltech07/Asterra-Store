'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

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

const INITIAL_STOREFRONT_BANNERS: PromoBannerItem[] = [
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
    imageUrl: '/images/banners/hero-banner-affiliate.webp',
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

export function HeroBannerSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swipe support for mobile devices
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Fetch active hero banners from API with placeholderData for instant render & background sync
  const { data } = useQuery<{ success: boolean; data: PromoBannerItem[] }>({
    queryKey: ['home-promo-banners', 'v3'],
    queryFn: async () => {
      const res = await fetch('/api/v1/banners?targetPage=home&activeOnly=true&bannerType=hero&_t=' + Date.now(), {
        cache: 'no-store',
        headers: { Accept: 'application/json', 'Cache-Control': 'no-cache, no-store' },
      });
      if (!res.ok) throw new Error('Gagal mengambil data banner promo');
      return res.json();
    },
    placeholderData: {
      success: true,
      data: INITIAL_STOREFRONT_BANNERS,
    },
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Filter and sort banners
  const banners = useMemo(() => {
    const rawList = data?.data && Array.isArray(data.data) && data.data.length > 0
      ? data.data
      : INITIAL_STOREFRONT_BANNERS;

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
        // Secondary sort: newest createdAt first
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [data?.data]);

  const totalBanners = banners.length;
  const hasMultiple = totalBanners >= 2;

  // Boundary check: clamp currentIndex if banners list shrinks
  useEffect(() => {
    if (currentIndex >= totalBanners && totalBanners > 0) {
      setCurrentIndex(0);
    }
  }, [currentIndex, totalBanners]);

  // Autoplay 5s when >= 2 banners and not hovered
  useEffect(() => {
    if (!hasMultiple || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalBanners);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasMultiple, isHovered, totalBanners]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  const handleNext = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % totalBanners);
  }, [totalBanners]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
    touchEndXRef.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45; // Threshold in px
    if (diff > minSwipeDistance) {
      // Swiped Left -> Next slide
      handleNext();
    } else if (diff < -minSwipeDistance) {
      // Swiped Right -> Prev slide
      handlePrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  if (totalBanners === 0) return null;

  return (
    <section
      aria-label="Banner Promo Asterra Store"
      data-gsap="hero-banner"
      className="group relative w-full max-w-full mb-3.5 sm:mb-5 overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs bg-[#121A2A] aspect-[2640/882]">
        {/* Slides Track */}
        <div
          className="flex w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const targetUrl = banner.destinationUrl || banner.linkUrl || '/#katalog';
            const isPriority = index === 0;

            return (
              <div key={banner.id} className="w-full h-full shrink-0 relative">
                <Link
                  href={targetUrl}
                  title={banner.title}
                  className="block relative w-full h-full overflow-hidden group"
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    width={2640}
                    height={882}
                    priority={isPriority}
                    quality={95}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1320px"
                    className="w-full h-full object-cover block transition-transform duration-500 group-hover:scale-[1.006]"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Custom Navigation Arrows (Visible on desktop hover if >= 2 banners) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Banner Sebelumnya"
              className={`absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121A2A]/40 hover:bg-[#121A2A]/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer z-20 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Banner Selanjutnya"
              className={`absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121A2A]/40 hover:bg-[#121A2A]/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer z-20 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Styled pagination bullets */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 sm:bottom-3.5 left-0 right-0 flex items-center justify-center gap-1.5 sm:gap-2 z-20">
            {banners.map((banner, idx) => (
              <button
                key={`bullet-${banner.id}-${idx}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ke ${idx + 1}: ${banner.title}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  currentIndex === idx
                    ? 'w-5 sm:w-6.5 h-1.5 sm:h-2 bg-white shadow-xs'
                    : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/45 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
