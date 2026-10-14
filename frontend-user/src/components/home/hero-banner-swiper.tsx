'use client';

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useHeroBanners, PromoBannerItem, INITIAL_STOREFRONT_BANNERS } from '@/lib/hooks/use-hero-banners';

export type { PromoBannerItem };
export { INITIAL_STOREFRONT_BANNERS };

export const HeroBannerSwiper = memo(function HeroBannerSwiper() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Touch swipe support for mobile devices
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  // Fetch active hero banners from shared query hook
  const { banners } = useHeroBanners();

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
});
