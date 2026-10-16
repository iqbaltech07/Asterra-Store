/**
 * @archive
 * COMPONENT: HomepagePreloader (AsterraStore Initial Splash/Loading Screen Engine)
 * STATUS: Archived on user request (Instant direct rendering mode active)
 *
 * DESCRIPTION:
 * Official Orbital Centerpiece with 3D Animated Planet (152 frames, 20fps),
 * Wordmark brand lighting, dynamic weighted 8-task progress engine,
 * and graceful exit transition.
 *
 * TO RESTORE:
 * 1. Move or import this component in frontend-user/src/app/page.tsx:
 *    import { HomepagePreloader } from '@/components/home/archive/homepage-preloader';
 * 2. Add <HomepagePreloader ... /> inside the Homepage component.
 * 3. Update frontend-user/src/components/layout/page-transition.tsx to synchronize with preloader exit.
 */

'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';

export type TaskStatus = 'pending' | 'success' | 'fallback';

export interface PreloaderTaskState {
  homepageData: TaskStatus;       // 1. Persiapan data homepage (Hydration & baseline)
  mainCatalog: TaskStatus;        // 2. Pengambilan dan pemrosesan data utama (Catalog mapped)
  promoCampaigns: TaskStatus;     // 3. Pengambilan data produk promo (Active campaigns)
  heroBanners: TaskStatus;        // 4. Pengambilan data banner (Hero banners list)
  bannerImages: TaskStatus;       // 5. Pemuatan gambar banner prioritas aktual
  promoImages: TaskStatus;        // 6. Pemuatan gambar produk promo prioritas aktual
  componentRender: TaskStatus;    // 7. Rendering fisik komponen homepage di DOM
  finalValidation: TaskStatus;    // 8. Validasi kesiapan akhir sebelum transisi keluar
}

export interface HomepagePreloaderProps {
  isCatalogReady: boolean;
  isCatalogError?: boolean;
  isCampaignsReady: boolean;
  isCampaignsError?: boolean;
  isBannersReady: boolean;
  primaryBannerUrl?: string;
  isComponentReady?: boolean;
  onPreloaderComplete?: () => void;
}

// Track if homepage has already been preloaded during client-side SPA navigation
let hasPreloadedInSpa = false;

// Stable weighted tasks strictly summing to 100%
const TASK_WEIGHTS: Record<keyof PreloaderTaskState, number> = {
  homepageData: 15,      // Hydration & initial context
  mainCatalog: 20,       // Catalog products API & mapped to featured list
  promoCampaigns: 15,    // Active campaign API & discount models
  heroBanners: 10,       // Hero banners query & store dataset
  bannerImages: 15,      // Actual priority hero banner image load
  promoImages: 10,       // Priority promotional product app badges
  componentRender: 10,   // Physical presence of banner & cards in DOM without skeletons
  finalValidation: 5,    // Final readiness verification before exit
};

export function HomepagePreloader({
  isCatalogReady,
  isCatalogError = false,
  isCampaignsReady,
  isCampaignsError = false,
  isBannersReady,
  primaryBannerUrl = '/images/banners/hero-banner-grand-opening.webp',
  isComponentReady = false,
  onPreloaderComplete,
}: HomepagePreloaderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [statusText, setStatusText] = useState('Menyiapkan AsterraStore...');
  const [hasFallbackOccurred, setHasFallbackOccurred] = useState(false);

  // 8 Dedicated operational task states strictly tied to actual app work
  const [tasks, setTasks] = useState<PreloaderTaskState>({
    homepageData: 'pending',
    mainCatalog: 'pending',
    promoCampaigns: 'pending',
    heroBanners: 'pending',
    bannerImages: 'pending',
    promoImages: 'pending',
    componentRender: 'pending',
    finalValidation: 'pending',
  });

  const maxReachedRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);

  // Check if preloader has already completed in this session (e.g. page refresh / F5)
  useEffect(() => {
    try {
      const alreadyPreloaded = sessionStorage.getItem('asterra_home_preloaded');
      if (alreadyPreloaded === 'true' || hasPreloadedInSpa) {
        hasPreloadedInSpa = true;
        onPreloaderComplete?.();
        return;
      }
    } catch {
      if (hasPreloadedInSpa) {
        onPreloaderComplete?.();
        return;
      }
    }

    setShouldRender(true);
  }, [onPreloaderComplete]);

  // 1. Task: Persiapan data homepage (Hydration & DOM baseline)
  useEffect(() => {
    if (!shouldRender) return;
    setTasks((prev) => ({ ...prev, homepageData: 'success' }));
  }, [shouldRender]);

  // 2. Task: Pengambilan dan pemrosesan data utama (/api/v1/products + mapped)
  useEffect(() => {
    if (isCatalogReady) {
      setTasks((prev) => ({ ...prev, mainCatalog: 'success' }));
    } else if (isCatalogError) {
      setHasFallbackOccurred(true);
      setTasks((prev) => ({ ...prev, mainCatalog: 'fallback' }));
    }
  }, [isCatalogReady, isCatalogError]);

  // 3. Task: Pengambilan data produk promo (/api/v1/campaigns/active)
  useEffect(() => {
    if (isCampaignsReady) {
      setTasks((prev) => ({
        ...prev,
        promoCampaigns: isCampaignsError ? 'fallback' : 'success',
      }));
      if (isCampaignsError) setHasFallbackOccurred(true);
    }
  }, [isCampaignsReady, isCampaignsError]);

  // 4. Task: Pengambilan data banner (Hero banners)
  useEffect(() => {
    if (isBannersReady) {
      setTasks((prev) => ({ ...prev, heroBanners: 'success' }));
    }
  }, [isBannersReady]);

  // 5. Task: Pemuatan gambar banner prioritas aktual
  useEffect(() => {
    if (!shouldRender || typeof window === 'undefined' || !primaryBannerUrl) return;

    const bannerImg = new window.Image();
    bannerImg.src = primaryBannerUrl;
    if (bannerImg.complete && bannerImg.naturalWidth > 0) {
      setTasks((prev) => ({ ...prev, bannerImages: 'success' }));
    } else {
      bannerImg.onload = () => {
        setTasks((prev) => ({ ...prev, bannerImages: 'success' }));
      };
      bannerImg.onerror = () => {
        setHasFallbackOccurred(true);
        setTasks((prev) => ({ ...prev, bannerImages: 'fallback' }));
      };
    }
  }, [shouldRender, primaryBannerUrl]);

  // 6. Task: Pemuatan gambar produk promo prioritas aktual
  useEffect(() => {
    if (!shouldRender || typeof window === 'undefined') return;

    const promoIconUrls = [
      '/assets/asterra-planet-navbar.webp',
      '/images/brand/asterra-wordmark-light.png',
      '/images/brand/asterra-mark.png',
      '/images/apps/gemini.png',
      '/images/apps/chatgpt.png',
      '/images/apps/canva.png',
      '/images/apps/capcut.png',
    ];
    let loadedIcons = 0;
    let hasIconFailed = false;

    const checkAllPromoIcons = (failed = false) => {
      loadedIcons++;
      if (failed) hasIconFailed = true;
      if (loadedIcons >= promoIconUrls.length) {
        if (hasIconFailed) {
          setHasFallbackOccurred(true);
          setTasks((prev) => ({ ...prev, promoImages: 'fallback' }));
        } else {
          setTasks((prev) => ({ ...prev, promoImages: 'success' }));
        }
      }
    };

    promoIconUrls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
      if (img.complete && img.naturalWidth > 0) {
        checkAllPromoIcons(false);
      } else {
        img.onload = () => checkAllPromoIcons(false);
        img.onerror = () => checkAllPromoIcons(true);
      }
    });
  }, [shouldRender]);

  // 7. Task: Rendering fisik komponen homepage di DOM (Verifikasi bebas skeleton)
  useEffect(() => {
    if (!shouldRender || typeof document === 'undefined') return;

    if (isComponentReady) {
      const verifyDom = () => {
        const bannerEl = document.querySelector('[data-gsap="hero-banner"]');
        const cards = document.querySelectorAll('[data-card-wrapper], [data-gsap="product-card"]');
        // Ensure no active skeletons in the featured product grid
        const skeletons = document.querySelectorAll('#produk-unggulan [class*="skeleton"], #produk-unggulan [class*="Skeleton"]');
        const hasContentOrFallback = cards.length >= 2 || isCatalogError || Boolean(document.querySelector('#produk-unggulan p'));
        return Boolean(bannerEl && hasContentOrFallback && skeletons.length === 0);
      };

      if (verifyDom()) {
        setTasks((prev) => ({ ...prev, componentRender: 'success' }));
      } else {
        const checkInterval = setInterval(() => {
          if (verifyDom()) {
            clearInterval(checkInterval);
            setTasks((prev) => ({ ...prev, componentRender: 'success' }));
          }
        }, 80);

        return () => clearInterval(checkInterval);
      }
    }
  }, [shouldRender, isComponentReady, isCatalogError]);

  // 8. Task: Validasi kesiapan akhir sebelum transisi keluar (Hanya jika task 1-7 benar-benar settled)
  useEffect(() => {
    const isStep1to7Settled =
      tasks.homepageData !== 'pending' &&
      tasks.mainCatalog !== 'pending' &&
      tasks.promoCampaigns !== 'pending' &&
      tasks.heroBanners !== 'pending' &&
      tasks.bannerImages !== 'pending' &&
      tasks.promoImages !== 'pending' &&
      tasks.componentRender !== 'pending';

    if (isStep1to7Settled && tasks.finalValidation === 'pending') {
      setTasks((prev) => ({
        ...prev,
        finalValidation: hasFallbackOccurred ? 'fallback' : 'success',
      }));
    }
  }, [tasks, hasFallbackOccurred]);

  // Compute Target Progress from Completed Weighted Tasks
  const targetProgress = useMemo(() => {
    let score = 0;
    (Object.keys(tasks) as Array<keyof PreloaderTaskState>).forEach((key) => {
      if (tasks[key] !== 'pending') {
        score += TASK_WEIGHTS[key];
      }
    });
    return Math.min(100, score);
  }, [tasks]);

  // Dynamic Priority Status Messages (Honest, strictly based on actual active tasks)
  useEffect(() => {
    if (tasks.homepageData === 'pending') {
      setStatusText('Menyiapkan AsterraStore...');
    } else if (tasks.mainCatalog === 'pending') {
      setStatusText('Memuat data utama katalog...');
    } else if (tasks.promoCampaigns === 'pending') {
      setStatusText('Memuat produk promo...');
    } else if (tasks.heroBanners === 'pending') {
      setStatusText('Memuat data banner...');
    } else if (tasks.bannerImages === 'pending') {
      setStatusText('Memuat gambar banner...');
    } else if (tasks.promoImages === 'pending') {
      setStatusText('Memuat gambar produk...');
    } else if (tasks.componentRender === 'pending') {
      setStatusText('Menyiapkan tampilan homepage...');
    } else if (tasks.finalValidation === 'pending') {
      setStatusText(hasFallbackOccurred ? 'Menyiapkan tampilan mode cadangan...' : 'Finalisasi tampilan...');
    } else {
      setStatusText(hasFallbackOccurred ? 'AsterraStore siap ditampilkan' : 'AsterraStore siap!');
    }
  }, [tasks, hasFallbackOccurred]);

  // Smooth Interpolation Engine (Graceful, non-decreasing lerp capped per frame)
  useEffect(() => {
    if (!shouldRender) return;

    const animate = () => {
      setDisplayProgress((current) => {
        const target = Math.max(current, targetProgress);
        maxReachedRef.current = Math.max(maxReachedRef.current, target);

        if (current >= maxReachedRef.current) {
          if (maxReachedRef.current >= 100 && !isCompletedRef.current) {
            isCompletedRef.current = true;
            // Short respectful visual pause for user gratification
            setTimeout(() => {
              setIsExiting(true);
              hasPreloadedInSpa = true;
              try {
                sessionStorage.setItem('asterra_home_preloaded', 'true');
              } catch {}
              // Complete callback after exit animation finishes
              setTimeout(() => {
                setShouldRender(false);
                onPreloaderComplete?.();
              }, 450);
            }, 250);
          }
          return maxReachedRef.current;
        }

        // Graceful pacing: max delta 2% per frame to prevent jumping
        const remaining = maxReachedRef.current - current;
        const dynamicStep = Math.ceil(remaining * 0.12);
        const cappedStep = Math.min(2, Math.max(1, dynamicStep));
        const next = Math.min(maxReachedRef.current, current + cappedStep);
        return next;
      });

      if (displayProgress < 100 || !isCompletedRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [shouldRender, targetProgress, displayProgress, onPreloaderComplete]);

  if (!shouldRender) return null;

  return (
    <>
      <style>{`
        @keyframes orbitSpinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitSpinCounterClockwise {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-label="Memuat AsterraStore"
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0C121E] select-none transition-all duration-450 ease-out ${
          isExiting
            ? 'opacity-0 scale-[1.015] pointer-events-none'
            : 'opacity-100 scale-100'
        }`}
      >
        {/* Ambient Warm Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[440px] h-[340px] sm:h-[440px] bg-[#C96F55]/12 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Centerpiece Container: Perfectly Centered Along the Vertical Axis */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6 text-center">
          {/* 1. Official Orbital Centerpiece with 3D Animated Planet (Navbar Asset: 152 frames, 20fps) */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-6 mx-auto">
            {/* SVG Orbital Track Geometry */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 144 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Subtle Dashed Orbit */}
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              {/* Main Accent Orbit */}
              <circle
                cx="72"
                cy="72"
                r="52"
                stroke="rgba(201, 111, 85, 0.35)"
                strokeWidth="1.2"
              />
            </svg>

            {/* Rotating Outer Ring with Glowing Satellite Node */}
            <div
              className="absolute inset-3 rounded-full pointer-events-none"
              style={{
                animation: 'orbitSpinClockwise 10s linear infinite',
              }}
            >
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C96F55] shadow-[0_0_12px_#C96F55]" />
            </div>

            {/* Counter-rotating Inner Ring with Secondary White Node */}
            <div
              className="absolute inset-5 rounded-full pointer-events-none"
              style={{
                animation: 'orbitSpinCounterClockwise 7s linear infinite',
              }}
            >
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/70 shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
            </div>

            {/* Central 3D Animated Asterra Planet (Identical in Asset, Motion, Speed, and Looping to Navbar) */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center drop-shadow-[0_4px_24px_rgba(201,111,85,0.45)]">
              <picture className="w-full h-full flex items-center justify-center pointer-events-none select-none">
                <source srcSet="/assets/asterra-planet-navbar.webp" type="image/webp" />
                <img
                  src="/assets/asterra-planet-navbar.webp"
                  alt="Asterra Planet"
                  width={200}
                  height={107}
                  decoding="async"
                  draggable={false}
                  className="w-full h-auto object-contain pointer-events-none select-none scale-135"
                />
              </picture>
            </div>
          </div>

          {/* 2. Official Brand Wordmark in Pure White (AsterraStore) */}
          <div className="mb-7 sm:mb-8 flex items-center justify-center mx-auto">
            <Image
              src="/images/brand/asterra-wordmark-light.png"
              alt="AsterraStore"
              width={381}
              height={49}
              priority
              className="h-5 sm:h-6 w-auto object-contain mx-auto select-none drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)]"
            />
          </div>

          {/* 3. Real-Time Progress Bar & Metrics */}
          <div className="w-64 sm:w-72 mx-auto space-y-2.5">
            {/* Dynamic Status and Percentage */}
            <div className="flex items-center justify-between text-xs font-medium tracking-tight">
              <span className="text-white/75 text-[11px] truncate pr-2 text-left">
                {statusText}
              </span>
              <span className="font-mono font-bold text-white tracking-wider text-[11px] shrink-0">
                {displayProgress}%
              </span>
            </div>

            {/* Progress Track */}
            <div className="relative w-full h-[3px] bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C96F55] via-[#E07A5F] to-white rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(201,111,85,0.7)]"
                style={{ width: `${displayProgress}%` }}
              />
            </div>

            {/* Minimalist Sub-Status Footer */}
            <div className="pt-1 text-[10px] text-white/40 tracking-widest uppercase font-mono text-center">
              Lisensi & Akun Digital Resmi
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomepagePreloader;
