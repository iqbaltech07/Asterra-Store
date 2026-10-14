'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { prefersReducedMotion } from '@/lib/animations/gsap-utils';

export type TaskStatus = 'pending' | 'success' | 'fallback';

export interface PreloaderTaskState {
  homepageData: TaskStatus;       // 1. Persiapan data homepage
  mainCatalog: TaskStatus;        // 2. Pengambilan dan pemrosesan data utama
  promoCampaigns: TaskStatus;     // 3. Pengambilan data produk promo
  heroBanners: TaskStatus;        // 4. Pengambilan data banner
  componentRender: TaskStatus;    // 5. Rendering komponen homepage yang wajib tersedia
  bannerImages: TaskStatus;       // 6. Pemuatan gambar banner yang wajib tersedia
  promoImages: TaskStatus;        // 7. Pemuatan gambar produk promo yang wajib tersedia
  finalValidation: TaskStatus;    // 8. Validasi kesiapan akhir sebelum transisi keluar
}

interface HomepagePreloaderProps {
  isCatalogReady: boolean;
  isCatalogError?: boolean;
  isCampaignsReady: boolean;
  isCampaignsError?: boolean;
  isBannersReady: boolean;
  isComponentReady?: boolean;
  onPreloaderComplete?: () => void;
}

// Stable weighted tasks strictly summing to 100%
const TASK_WEIGHTS: Record<keyof PreloaderTaskState, number> = {
  homepageData: 15,      // Hydration & initial context
  mainCatalog: 20,       // Catalog products API & normalization
  promoCampaigns: 15,    // Active campaign API & discount models
  heroBanners: 10,       // Hero banners cache / query
  componentRender: 10,   // React component mount & layout tree
  bannerImages: 15,      // Priority hero banner WebP image
  promoImages: 10,       // Priority promotional product app badges
  finalValidation: 5,    // Final readiness verification before exit
};

export function HomepagePreloader({
  isCatalogReady,
  isCatalogError = false,
  isCampaignsReady,
  isCampaignsError = false,
  isBannersReady,
  isComponentReady = true,
  onPreloaderComplete,
}: HomepagePreloaderProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [statusText, setStatusText] = useState('Menyiapkan AsterraStore...');
  const [hasFallbackOccurred, setHasFallbackOccurred] = useState(false);

  // 8 Dedicated operational task states
  const [tasks, setTasks] = useState<PreloaderTaskState>({
    homepageData: 'pending',
    mainCatalog: 'pending',
    promoCampaigns: 'pending',
    heroBanners: 'pending',
    componentRender: 'pending',
    bannerImages: 'pending',
    promoImages: 'pending',
    finalValidation: 'pending',
  });

  const maxReachedRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const isCompletedRef = useRef(false);
  const isReducedMotion = useMemo(() => prefersReducedMotion(), []);

  // Check sessionStorage so internal client-side navigation doesn't replay the preloader
  useEffect(() => {
    try {
      const alreadyPreloaded = sessionStorage.getItem('asterra_home_preloaded');
      if (alreadyPreloaded === 'true') {
        onPreloaderComplete?.();
        return;
      }
    } catch {
      // sessionStorage unavailable or blocked
    }
    setShouldRender(true);
  }, [onPreloaderComplete]);

  // 1. Task: Persiapan data homepage (Hydration & DOM baseline)
  useEffect(() => {
    if (!shouldRender) return;
    setTasks((prev) => ({ ...prev, homepageData: 'success' }));
  }, [shouldRender]);

  // 2. Task: Pengambilan dan pemrosesan data utama (/api/v1/products)
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

  // 4. Task: Pengambilan data banner
  useEffect(() => {
    if (isBannersReady) {
      setTasks((prev) => ({ ...prev, heroBanners: 'success' }));
    }
  }, [isBannersReady]);

  // 5. Task: Rendering komponen homepage yang wajib tersedia
  useEffect(() => {
    if (isComponentReady) {
      setTasks((prev) => ({ ...prev, componentRender: 'success' }));
    }
  }, [isComponentReady]);

  // 6. Task: Pemuatan gambar banner yang wajib tersedia & 7. Gambar produk promo
  useEffect(() => {
    if (!shouldRender || typeof window === 'undefined') return;

    // A. Priority Hero Banner Image
    const bannerImg = new window.Image();
    bannerImg.src = '/images/banners/hero-banner-grand-opening.webp';
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

    // B. Critical Promo Product App Icons
    const promoIconUrls = [
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

  // 8. Task: Validasi kesiapan akhir sebelum transisi keluar
  useEffect(() => {
    const isStep1to7Settled =
      tasks.homepageData !== 'pending' &&
      tasks.mainCatalog !== 'pending' &&
      tasks.promoCampaigns !== 'pending' &&
      tasks.heroBanners !== 'pending' &&
      tasks.componentRender !== 'pending' &&
      tasks.bannerImages !== 'pending' &&
      tasks.promoImages !== 'pending';

    if (isStep1to7Settled && tasks.finalValidation === 'pending') {
      setTasks((prev) => ({
        ...prev,
        finalValidation: hasFallbackOccurred ? 'fallback' : 'success',
      }));
    }
  }, [tasks, hasFallbackOccurred]);

  // Failsafe Safety Timeout (3.8 seconds max to guarantee user is never trapped)
  useEffect(() => {
    if (!shouldRender) return;
    const timeout = setTimeout(() => {
      setTasks((prev) => {
        const updated = { ...prev };
        let anyTimedOut = false;
        (Object.keys(updated) as Array<keyof PreloaderTaskState>).forEach((key) => {
          if (updated[key] === 'pending') {
            updated[key] = 'fallback';
            anyTimedOut = true;
          }
        });
        if (anyTimedOut) {
          setHasFallbackOccurred(true);
        }
        return updated;
      });
    }, 3800);
    return () => clearTimeout(timeout);
  }, [shouldRender]);

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

  // Smooth Interpolation Engine (Monotonically non-decreasing lerp)
  useEffect(() => {
    if (!shouldRender) return;

    const animate = () => {
      setDisplayProgress((current) => {
        // Enforce strictly non-decreasing progress
        const target = Math.max(current, targetProgress);
        maxReachedRef.current = Math.max(maxReachedRef.current, target);

        if (current >= maxReachedRef.current) {
          if (maxReachedRef.current >= 100 && !isCompletedRef.current) {
            isCompletedRef.current = true;
            // Short respectful visual pause for user gratification
            setTimeout(() => {
              setIsExiting(true);
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

        // Smooth easing step
        const step = Math.max(1, Math.ceil((maxReachedRef.current - current) * 0.16));
        const next = Math.min(maxReachedRef.current, current + step);
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
        @keyframes planetPulse {
          0%, 100% { transform: scale(1); opacity: 0.98; }
          50% { transform: scale(1.025); opacity: 1; }
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[440px] h-[320px] sm:h-[440px] bg-[#C96F55]/12 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Centerpiece Container */}
        <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
          {/* Orbital Brand Centerpiece */}
          <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center mb-6">
            {/* SVG Orbital Track Geometry */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 144 144"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Subtle Orbit */}
              <circle
                cx="72"
                cy="72"
                r="68"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              {/* Main Accent Orbit */}
              <circle
                cx="72"
                cy="72"
                r="56"
                stroke="rgba(201, 111, 85, 0.35)"
                strokeWidth="1.2"
              />
            </svg>

            {/* Rotating Orbit Ring with Glowing Satellite Node */}
            <div
              className="absolute inset-2 rounded-full pointer-events-none"
              style={{
                animation: isReducedMotion ? 'none' : 'orbitSpinClockwise 10s linear infinite',
              }}
            >
              {/* Orbiting Satellite Particle */}
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#C96F55] shadow-[0_0_12px_#C96F55]" />
            </div>

            {/* Counter-rotating Inner Ring with Secondary Soft Node */}
            <div
              className="absolute inset-4 rounded-full pointer-events-none"
              style={{
                animation: isReducedMotion ? 'none' : 'orbitSpinCounterClockwise 7s linear infinite',
              }}
            >
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/50 shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
            </div>

            {/* Central Official Asterra Planet Mark */}
            <div
              className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center drop-shadow-[0_4px_20px_rgba(201,111,85,0.3)]"
              style={{
                animation: isReducedMotion ? 'none' : 'planetPulse 3s ease-in-out infinite',
              }}
            >
              <Image
                src="/images/brand/asterra-mark.png"
                alt="Asterra Store Planet"
                width={160}
                height={160}
                priority
                className="w-full h-full object-contain select-none"
              />
            </div>
          </div>

          {/* Official Wordmark Text */}
          <div className="mb-8">
            <Image
              src="/images/brand/asterra-wordmark-light.png"
              alt="ASTERRASTORE"
              width={260}
              height={36}
              priority
              className="h-4 sm:h-5 w-auto object-contain mx-auto opacity-95 select-none"
            />
          </div>

          {/* Real-Time Progress Bar & Metrics */}
          <div className="w-64 sm:w-72 space-y-2.5">
            {/* Dynamic Status and Percentage */}
            <div className="flex items-center justify-between text-xs font-medium tracking-tight">
              <span className="text-white/70 text-[11px] truncate pr-2 text-left">
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
            <div className="pt-1 text-[10px] text-white/35 tracking-widest uppercase font-mono">
              Lisensi & Akun Digital Resmi
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
