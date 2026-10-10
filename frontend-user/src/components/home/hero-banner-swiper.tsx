'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

const DEFAULT_BANNER: PromoBannerItem = {
  id: 'default-welcome-hero',
  title: 'Selamat Datang di Asterra Store — Pusat Akun & Lisensi Premium Resmi Bergaransi',
  imageUrl: '/images/banners/hero-banner-welcome.webp',
  linkUrl: '/#katalog',
  destinationUrl: '/#katalog',
};

export function HeroBannerSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fetch active banners for homepage from API
  const { data } = useQuery<{ success: boolean; data: PromoBannerItem[] }>({
    queryKey: ['home-promo-banners'],
    queryFn: async () => {
      const res = await fetch('/api/v1/banners?targetPage=home&activeOnly=true');
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
    staleTime: 60000, // 1 minute fresh cache
  });

  const apiBanners = data?.data && data.data.length > 0 ? data.data : [];
  const banners = apiBanners.length > 0 ? apiBanners : [DEFAULT_BANNER];
  const hasMultiple = banners.length >= 2;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Autoplay every 5 seconds if there are at least 2 banners
  useEffect(() => {
    if (!hasMultiple || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [hasMultiple, isPaused, nextSlide]);

  // Touch Swipe Handlers for mobile smartphones
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <section
      aria-label="Banner Promo Asterra"
      data-gsap="hero-banner"
      className="group relative w-full max-w-full mb-3.5 sm:mb-5 overflow-hidden select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs bg-[#121A2A] aspect-[2640/882]">
        {/* Slides Track */}
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => {
            const targetUrl = banner.destinationUrl || banner.linkUrl || '/#katalog';
            const isPriority = index === 0;

            return (
              <div key={banner.id} className="min-w-full shrink-0 relative">
                <Link
                  href={targetUrl}
                  title={banner.title}
                  className="block relative w-full overflow-hidden group"
                >
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title}
                    width={2640}
                    height={882}
                    priority={isPriority}
                    quality={95}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1320px"
                    className="w-full max-w-full h-auto block rounded-xl sm:rounded-2xl md:rounded-3xl object-contain transition-transform duration-300 group-hover:scale-[1.004]"
                  />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows (Visible on desktop hover if >= 2 banners) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                prevSlide();
              }}
              aria-label="Banner Sebelumnya"
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ink/40 hover:bg-ink/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md cursor-pointer z-10"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                nextSlide();
              }}
              aria-label="Banner Selanjutnya"
              className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-ink/40 hover:bg-ink/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md cursor-pointer z-10"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}

        {/* Dot Pagination Indicators (if >= 2 banners) */}
        {hasMultiple && (
          <div className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10 px-2.5 py-1 rounded-full bg-ink/30 backdrop-blur-md">
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Ke banner ${index + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isActive
                      ? 'w-5 sm:w-6 h-1.5 sm:h-2 bg-white shadow-xs'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
