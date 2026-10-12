'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface PromoBannerItem {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  destinationUrl?: string;
  isActive?: boolean;
}

const INITIAL_STOREFRONT_BANNERS: PromoBannerItem[] = [
  {
    id: 'default-affiliate-hero',
    title: 'Program Mitra Affiliate Asterra Store — Raih Komisi 10% Penjualan Produk Digital',
    imageUrl: '/images/banners/hero-banner-affiliate.webp',
    linkUrl: '/daftar-sales',
    destinationUrl: '/daftar-sales',
  },
  {
    id: 'default-welcome-hero',
    title: 'Selamat Datang di Asterra Store — Pusat Akun & Lisensi Premium Resmi Bergaransi',
    imageUrl: '/images/banners/hero-banner-welcome.webp',
    linkUrl: '/#katalog',
    destinationUrl: '/#katalog',
  },
];

export function HeroBannerSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Fetch active banners for homepage from API with initialData to eliminate hydration flash
  const { data } = useQuery<{ success: boolean; data: PromoBannerItem[] }>({
    queryKey: ['home-promo-banners'],
    queryFn: async () => {
      const res = await fetch('/api/v1/banners?targetPage=home&activeOnly=true');
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
    initialData: {
      success: true,
      data: INITIAL_STOREFRONT_BANNERS,
    },
    staleTime: 60000, // 1 minute fresh cache
  });

  const apiBanners = data?.data && data.data.length > 0 ? data.data : [];
  const banners = apiBanners.length > 0 ? apiBanners : INITIAL_STOREFRONT_BANNERS;
  const hasMultiple = banners.length >= 2;

  // Autoplay 5s when >= 2 banners and not hovered
  useEffect(() => {
    if (!hasMultiple || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [hasMultiple, isHovered, banners.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  return (
    <section
      aria-label="Banner Promo Asterra"
      data-gsap="hero-banner"
      className="group relative w-full max-w-full mb-3.5 sm:mb-5 overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
                key={`bullet-${banner.id}`}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                aria-label={`Slide ke ${idx + 1}`}
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
