'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

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
  const swiperRef = useRef<SwiperType | null>(null);
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

  return (
    <section
      aria-label="Banner Promo Asterra"
      data-gsap="hero-banner"
      className="group relative w-full max-w-full mb-3.5 sm:mb-5 overflow-hidden select-none"
      onMouseEnter={() => {
        setIsHovered(true);
        swiperRef.current?.autoplay?.stop();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        swiperRef.current?.autoplay?.start();
      }}
    >
      <div className="relative w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs bg-[#121A2A] aspect-[2640/882]">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          slidesPerView={1}
          spaceBetween={0}
          loop={hasMultiple}
          speed={600}
          autoplay={
            hasMultiple
              ? {
                  delay: 5000,
                  disableOnInteraction: false,
                }
              : false
          }
          pagination={
            hasMultiple
              ? {
                  clickable: true,
                  bulletClass: 'hero-bullet',
                  bulletActiveClass: 'hero-bullet-active',
                }
              : false
          }
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          className="hero-banner-swiper w-full h-full"
        >
          {banners.map((banner, index) => {
            const targetUrl = banner.destinationUrl || banner.linkUrl || '/#katalog';
            const isPriority = index === 0;

            return (
              <SwiperSlide key={banner.id} className="relative w-full h-full">
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
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Custom Navigation Arrows (Visible on desktop hover if >= 2 banners) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                swiperRef.current?.slidePrev();
              }}
              aria-label="Banner Sebelumnya"
              className={`absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121A2A]/40 hover:bg-[#121A2A]/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer z-20 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                swiperRef.current?.slideNext();
              }}
              aria-label="Banner Selanjutnya"
              className={`absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#121A2A]/40 hover:bg-[#121A2A]/80 text-white backdrop-blur-md flex items-center justify-center transition-all duration-200 shadow-md cursor-pointer z-20 ${
                isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
              }`}
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </>
        )}
      </div>

      {/* Styled Swiper pagination bullets */}
      <style jsx global>{`
        .hero-banner-swiper .swiper-pagination {
          bottom: 10px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          z-index: 20;
        }
        @media (min-width: 640px) {
          .hero-banner-swiper .swiper-pagination {
            bottom: 14px !important;
            gap: 8px;
          }
        }
        .hero-bullet {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @media (min-width: 640px) {
          .hero-bullet {
            width: 8px;
            height: 8px;
          }
        }
        .hero-bullet:hover {
          background: rgba(255, 255, 255, 0.8);
        }
        .hero-bullet-active {
          width: 22px !important;
          background: #ffffff !important;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }
        @media (min-width: 640px) {
          .hero-bullet-active {
            width: 26px !important;
          }
        }
      `}</style>
    </section>
  );
}
