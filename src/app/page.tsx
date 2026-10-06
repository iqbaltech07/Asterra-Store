'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved,
  faBolt,
  faCreditCard,
  faLayerGroup,
  faHeadphones,
  faCircleCheck,
  faArrowRight,
  faPlus,
  faMinus,
  faTv,
  faCircleQuestion,
  faBox,
  faTableCellsLarge,
  faStar,
  faFire,
  faEye,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import {
  faYoutube,
  faSpotify,
} from '@fortawesome/free-brands-svg-icons';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { getDummyOriginalPrice, isPromoItem } from '@/lib/utils/promo-pricing';
import { QuickViewModal, QuickViewProductData } from '@/components/products/quick-view-modal';
import { getRecentlyViewed, RecentlyViewedItem } from '@/lib/services/recently-viewed';
import { ProductItem } from '@/lib/products-data';

// Helper to render crisp, brand-accurate badges for the top digital applications
function AppBrandBadge({ name }: { name: string }) {
  const n = name.toLowerCase();

  if (n.includes('gemini') || n.includes('google ai')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/gemini.png"
          alt="Google Gemini"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('chatgpt')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/chatgpt.png"
          alt="ChatGPT"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('canva')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs">
        <img
          src="/images/apps/canva.png"
          alt="Canva"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('capcut')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/capcut.png"
          alt="CapCut"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('alight')) {
    return (
      <div className="w-full h-full bg-[#181d2a] rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
        <img
          src="/images/apps/alightmotion.png"
          alt="Alight Motion"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('youtube')) {
    return (
      <div className="w-full h-full bg-[#FF0000] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faYoutube} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    );
  }

  if (n.includes('spotify')) {
    return (
      <div className="w-full h-full bg-[#1DB954] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faSpotify} className="w-5 h-5 sm:w-6 sm:h-6 text-[#121A2A]" />
      </div>
    );
  }

  if (n.includes('netflix')) {
    return (
      <div className="w-full h-full bg-black rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <span className="font-black text-[#E50914] text-xs sm:text-sm tracking-tighter">NETFLIX</span>
      </div>
    );
  }

  if (n.includes('disney')) {
    return (
      <div className="w-full h-full bg-[#113CCF] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs">Disney+</span>
      </div>
    );
  }

  if (n.includes('vidio')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/vidio.png"
          alt="Vidio"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('wetv')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/wetv.png"
          alt="WeTV"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('iqiyi')) {
    return (
      <div className="w-full h-full bg-[#00CC4C] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-xs sm:text-sm">iQIYI</span>
      </div>
    );
  }

  if (n.includes('bstation')) {
    return (
      <div className="w-full h-full bg-[#23ADE5] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs">Bstation</span>
      </div>
    );
  }

  if (n.includes('viu')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/viu.png"
          alt="Viu"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('k-vision') || n.includes('nex') || n.includes('vision') || n.includes('orange tv')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faTv} className="w-5 h-5 text-[#C96F55]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#C96F55]/10 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
      <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5 text-[#C96F55]" />
    </div>
  );
}

export interface ApplicationGroupItem {
  id?: string;
  name: string;
  slug: string;
  category: string;
  categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'other';
  fallbackCount: number;
  fallbackPrice: number;
  soldCount?: number;
  rating?: string;
  badgeLabel?: string;
  isPromo?: boolean;
  items: ProductItem[];
}

/**
 * FEATURED PRODUCT CARD (STATIC GRID)
 * Dedicated card for the Featured section grid (NO MARQUEE, NO HORIZONTAL SCROLL).
 * Responsive: 4 columns desktop, 2 columns mobile.
 */
function FeaturedGridCard({
  app,
  onQuickView,
}: {
  app: ApplicationGroupItem;
  onQuickView?: (app: ApplicationGroupItem) => void;
}) {
  const activePrices = app.items.map((p) => p.price).filter((p) => p > 0);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : app.fallbackPrice;
  const isPromo = isPromoItem(app);
  const dummyOriginal = getDummyOriginalPrice(minPrice);

  return (
    <div
      data-gsap="featured-card"
      data-card-wrapper
      className="group bg-white border border-[rgba(18,26,42,0.09)] hover:border-[#C96F55]/70 hover:shadow-card-hover hover:-translate-y-0.5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between w-full h-full select-none"
    >
      <div>
        {/* 1. Header: Logo + Info */}
        <div className="flex items-start gap-2 sm:gap-2.5">
          <Link
            href={`/products/${app.slug}`}
            data-gsap="product-image"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#121A2A]/5 border border-[rgba(18,26,42,0.08)] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
          >
            <AppBrandBadge name={app.name} />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${app.slug}`}
              data-gsap="product-title"
              className="font-bold text-xs sm:text-[13px] lg:text-sm text-[#121A2A] group-hover:text-[#C96F55] transition-colors truncate block leading-snug"
              title={app.name}
            >
              {app.name}
            </Link>

            {/* Rating + Sold */}
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#121A2A]/75 font-medium mt-0.5">
              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
              <span className="font-semibold text-[#121A2A]">{app.rating || '5.0'}</span>
              <span className="text-[#121A2A]/45 truncate">
                ({app.soldCount ? `${app.soldCount.toLocaleString('id-ID')} terjual` : 'Ready'})
              </span>
            </div>
          </div>
        </div>

        {/* 2. Benefit Tags */}
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 pt-0.5 flex-wrap">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
            Ready
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
            Garansi
          </span>
          {app.badgeLabel && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20 leading-none truncate max-w-[90px]">
              {app.badgeLabel}
            </span>
          )}
        </div>
      </div>

      {/* 3. Pricing & Quick View */}
      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 sm:mt-2.5 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          {isPromo && (
            <span className="text-[10px] sm:text-[11px] text-[#121A2A]/40 line-through font-medium leading-none block">
              {dummyOriginal.originalPriceFormatted}
            </span>
          )}
          <Link
            href={`/products/${app.slug}`}
            data-gsap="product-price"
            className="font-black text-xs sm:text-sm lg:text-[15px] text-[#121A2A] tracking-tight hover:text-[#C96F55] transition-colors mt-0.5 block truncate"
          >
            Rp{minPrice.toLocaleString('id-ID')}
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(app);
              }}
              title="Lihat Cepat"
              aria-label={`Tampilan cepat ${app.name}`}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[rgba(18,26,42,0.05)] hover:bg-[#C96F55] text-[#121A2A]/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faEye} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          )}

          <Link
            href={`/products/${app.slug}`}
            data-gsap="product-button"
            className="text-[10px] sm:text-xs font-bold text-[#C96F55] hover:text-[#B86047] flex items-center gap-1 py-1 px-1.5 rounded transition-colors"
          >
            <span>Pilih</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * SHOWCASE LOOPING CARD (VISUAL MARQUEE ONLY)
 * Dedicated card for the Product Looping Showcase below Featured Products.
 * Has fixed width and margins for smooth infinite horizontal loop.
 */
function ShowcaseLoopingCard({
  app,
  isDuplicate = false,
  onQuickView,
}: {
  app: ApplicationGroupItem;
  isDuplicate?: boolean;
  onQuickView?: (app: ApplicationGroupItem) => void;
}) {
  const activePrices = app.items.map((p) => p.price).filter((p) => p > 0);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : app.fallbackPrice;
  const isPromo = isPromoItem(app);
  const dummyOriginal = getDummyOriginalPrice(minPrice);

  return (
    <div
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      className="group bg-white border border-[rgba(18,26,42,0.09)] hover:border-[#C96F55]/70 hover:shadow-card-hover hover:-translate-y-0.5 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between shrink-0 flex-none w-[230px] sm:w-[260px] lg:w-[280px] h-[150px] sm:h-[158px] mr-3 sm:mr-4 select-none"
    >
      <div>
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Link
            href={`/products/${app.slug}`}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#121A2A]/5 border border-[rgba(18,26,42,0.08)] flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform"
          >
            <AppBrandBadge name={app.name} />
          </Link>

          <div className="min-w-0 flex-1">
            <Link
              href={`/products/${app.slug}`}
              className="font-bold text-xs sm:text-sm text-[#121A2A] group-hover:text-[#C96F55] transition-colors truncate block leading-snug"
              title={app.name}
            >
              {app.name}
            </Link>

            <div className="flex items-center gap-1 text-[11px] text-[#121A2A]/75 font-medium mt-0.5">
              <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="font-semibold text-[#121A2A]">{app.rating || '5.0'}</span>
              <span className="text-[#121A2A]/45 truncate">
                (Terjual {app.soldCount ? app.soldCount.toLocaleString('id-ID') : 100 * (app.items.length || app.fallbackCount)})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 pt-0.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
            Ready
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
            Garansi
          </span>
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20 leading-none">
            Unggulan
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          {isPromo && (
            <span className="text-[10px] sm:text-[11px] text-[#121A2A]/40 line-through font-medium leading-none block">
              {dummyOriginal.originalPriceFormatted}
            </span>
          )}
          <Link href={`/products/${app.slug}`} className="font-black text-sm sm:text-[15px] text-[#121A2A] tracking-tight hover:text-[#C96F55] transition-colors mt-0.5 block truncate">
            Rp{minPrice.toLocaleString('id-ID')}
          </Link>
        </div>

        <div className="flex items-center gap-1.5">
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(app);
              }}
              title="Lihat Cepat"
              aria-label={`Tampilan cepat ${app.name}`}
              className="w-7 h-7 rounded-lg bg-[rgba(18,26,42,0.05)] hover:bg-[#C96F55] text-[#121A2A]/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faEye} className="w-3.5 h-3.5" />
            </button>
          )}

          <Link
            href={`/products/${app.slug}`}
            className="text-[11px] sm:text-xs font-bold text-[#C96F55] hover:text-[#B86047] flex items-center gap-1 py-1 px-1.5 rounded transition-colors"
          >
            <span>Pilih</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // 1. Selector category state: ONLY PROMO, TERLARIS, TERBARU. (PROMO is default & priority)
  const [activeCategory, setActiveCategory] = useState<'promo' | 'terlaris' | 'terbaru'>('promo');

  // 2. Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProductData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  // 3. Recently Viewed Products (localStorage)
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setRecentlyViewed(getRecentlyViewed());
  }, []);

  // Dynamic products fetched from catalog API (cached via shared query)
  const { data: catalogResponse } = useCatalogProducts();

  const allProducts = useMemo(
    () => catalogResponse?.data || [],
    [catalogResponse?.data]
  );

  // Curated Application definitions for the Featured views
  const appConfigurations = useMemo(() => {
    return [
      {
        name: 'Google Gemini',
        match: (t: string) => t.includes('gemini') || t.includes('google ai'),
        cat: 'AI Assistant & Cloud',
        tag: 'ai' as const,
        fallbackCount: 11,
        fallbackPrice: 19000,
        soldCount: 620,
        rating: '5.0',
        isPromo: true,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Canva',
        match: (t: string) => t.includes('canva'),
        cat: 'Design & Kreatif',
        tag: 'design' as const,
        fallbackCount: 13,
        fallbackPrice: 4000,
        soldCount: 1420,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'CapCut',
        match: (t: string) => t.includes('capcut'),
        cat: 'Video Editing & Content',
        tag: 'video' as const,
        fallbackCount: 11,
        fallbackPrice: 9000,
        soldCount: 980,
        rating: '4.9',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'ChatGPT',
        match: (t: string) => t.includes('chatgpt') || t.includes('chat gpt') || t.includes('plus plan'),
        cat: 'AI Assistant & Writing',
        tag: 'ai' as const,
        fallbackCount: 20,
        fallbackPrice: 16000,
        soldCount: 850,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Alight Motion',
        match: (t: string) => t.includes('alightmotion') || t.includes('alight motion'),
        cat: 'Motion Graphic & VFX',
        tag: 'video' as const,
        fallbackCount: 1,
        fallbackPrice: 8000,
        soldCount: 340,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'YouTube',
        match: (t: string) => t.includes('youtube'),
        cat: 'Streaming & Video',
        tag: 'streaming' as const,
        fallbackCount: 33,
        fallbackPrice: 4000,
        soldCount: 2100,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Spotify',
        match: (t: string) => t.includes('spotify'),
        cat: 'Music & Podcast',
        tag: 'streaming' as const,
        fallbackCount: 24,
        fallbackPrice: 12000,
        soldCount: 780,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Netflix',
        match: (t: string) => t.includes('netflix'),
        cat: 'Movie & Series HD',
        tag: 'streaming' as const,
        fallbackCount: 15,
        fallbackPrice: 25000,
        soldCount: 1650,
        rating: '5.0',
        isPromo: true,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'Vidio',
        match: (t: string) => t.includes('vidio'),
        cat: 'Live Sports & Premier',
        tag: 'streaming' as const,
        fallbackCount: 25,
        fallbackPrice: 15000,
        soldCount: 1100,
        rating: '4.9',
        isPromo: false,
        isTerlaris: true,
        isTerbaru: false,
      },
      {
        name: 'WeTV',
        match: (t: string) => t.includes('wetv'),
        cat: 'Asian Drama VIP',
        tag: 'streaming' as const,
        fallbackCount: 12,
        fallbackPrice: 7000,
        soldCount: 560,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'iQIYI',
        match: (t: string) => t.includes('iqiyi'),
        cat: 'Anime & Drama HD',
        tag: 'streaming' as const,
        fallbackCount: 9,
        fallbackPrice: 10000,
        soldCount: 420,
        rating: '4.8',
        isPromo: true,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Bstation',
        match: (t: string) => t.includes('bstation'),
        cat: 'Anime & Pop Culture',
        tag: 'streaming' as const,
        fallbackCount: 8,
        fallbackPrice: 8000,
        soldCount: 390,
        rating: '4.8',
        isPromo: false,
        isTerlaris: false,
        isTerbaru: true,
      },
      {
        name: 'Viu',
        match: (t: string) => t.includes('viu'),
        cat: 'Asian Drama & Variety',
        tag: 'streaming' as const,
        fallbackCount: 16,
        fallbackPrice: 5000,
        soldCount: 910,
        rating: '4.9',
        isPromo: false,
        isTerlaris: true,
        isTerbaru: true,
      },
    ];
  }, []);

  // Map to Featured Products (filtered by active category: Promo / Terlaris / Terbaru)
  const featuredApps = useMemo(() => {
    let filteredConfig = appConfigurations;

    if (activeCategory === 'promo') {
      filteredConfig = appConfigurations.filter((a) => a.isPromo);
    } else if (activeCategory === 'terlaris') {
      filteredConfig = appConfigurations.filter((a) => a.isTerlaris);
    } else if (activeCategory === 'terbaru') {
      filteredConfig = appConfigurations.filter((a) => a.isTerbaru);
    }

    // Limit to max 8 items so homepage remains clean and product-first
    return filteredConfig.slice(0, 8).map((target) => {
      const items = allProducts.filter((p) => {
        const text = `${p.name} ${(p as unknown as { id?: string }).id || ''} ${(p as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
        if (text.includes('lisensi')) return false;
        return target.match(text);
      });

      return {
        name: target.name,
        slug: target.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: target.cat,
        categoryTag: target.tag,
        fallbackCount: target.fallbackCount,
        fallbackPrice: target.fallbackPrice,
        soldCount: target.soldCount,
        rating: target.rating,
        badgeLabel:
          activeCategory === 'promo'
            ? '🔥 Promo'
            : activeCategory === 'terlaris'
            ? 'Terlaris'
            : 'Baru',
        isPromo: activeCategory === 'promo' || target.isPromo,
        items,
      };
    });
  }, [allProducts, appConfigurations, activeCategory]);

  // Product Looping Showcase: Curated list of popular accounts that stays completely independent of the selector
  const showcaseApps = useMemo(() => {
    const showcaseNames = ['Canva', 'ChatGPT', 'Netflix', 'YouTube', 'CapCut', 'Google Gemini', 'Spotify', 'Vidio', 'Alight Motion', 'iQIYI'];
    return showcaseNames.map((name) => {
      const conf = appConfigurations.find((a) => a.name === name) || {
        name,
        match: (t: string) => t.includes(name.toLowerCase()),
        cat: 'Digital Product',
        tag: 'other' as const,
        fallbackCount: 10,
        fallbackPrice: 10000,
        soldCount: 500,
        rating: '5.0',
      };

      const items = allProducts.filter((p) => {
        const text = `${p.name} ${(p as unknown as { id?: string }).id || ''}`.toLowerCase();
        return conf.match(text);
      });

      return {
        name: conf.name,
        slug: conf.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: conf.cat,
        categoryTag: conf.tag,
        fallbackCount: conf.fallbackCount,
        fallbackPrice: conf.fallbackPrice,
        soldCount: conf.soldCount,
        rating: conf.rating,
        items,
      };
    });
  }, [allProducts, appConfigurations]);

  const handleOpenQuickView = (app: ApplicationGroupItem) => {
    const activePrices = app.items.map((p) => p.price).filter((p) => p > 0);
    const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : app.fallbackPrice;

    setQuickViewProduct({
      id: app.slug,
      name: app.name,
      slug: app.slug,
      category: app.category,
      price: minPrice,
      priceFormatted: `Rp ${minPrice.toLocaleString('id-ID')}`,
      rating: app.rating,
      soldCount: app.soldCount,
      description: `Akses resmi dan bergaransi penuh untuk ${app.name} di Asterra Store dengan konfirmasi otomatis dan dukungan CS 24 jam.`,
      guaranteeTitle: 'Garansi Penuh 100% Penggantian',
      processTitle: 'Aktivasi Otomatis 1 - 15 Menit',
      privacyTitle: 'Akun Private / Sharing Workspace Resmi',
    });
    setIsQuickViewOpen(true);
  };

  const handleOpenQuickViewRecent = (item: RecentlyViewedItem) => {
    setQuickViewProduct({
      id: item.id,
      name: item.name,
      slug: item.slug || item.id,
      category: item.categoryName,
      price: item.price,
      priceFormatted: item.priceFormatted || `Rp ${item.price.toLocaleString('id-ID')}`,
      rating: item.rating || '5.0',
      description: `Akses akun digital resmi ${item.name} dengan jaminan garansi penggantian penuh.`,
      guaranteeTitle: 'Garansi Penuh 100% Penggantian',
      processTitle: 'Aktivasi Cepat 1 - 15 Menit',
      privacyTitle: 'Akun Terverifikasi',
    });
    setIsQuickViewOpen(true);
  };

  const showNotification = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => {
      setActiveNotification(null);
    }, 3500);
  };

  const faqItems = [
    {
      q: 'Bagaimana cara membeli produk di Asterra Store?',
      a: 'Pilih aplikasi atau produk yang Anda inginkan, tentukan durasi masa aktif, isi nama dan email aktif pada halaman checkout, lalu selesaikan pembayaran melalui QRIS otomatis atau transfer bank.',
    },
    {
      q: 'Berapa lama proses aktivasi produk?',
      a: 'Sebagian besar produk diproses secara instan dalam 1 hingga 15 menit setelah pembayaran Anda terverifikasi oleh gateway pembayaran otomatis kami.',
    },
    {
      q: 'Apakah semua produk memiliki garansi resmi?',
      a: 'Ya, seluruh produk aktif di Asterra Store dilengkapi garansi resmi 100% penggantian jika akun mengalami kendala akses selama masa aktif langganan masih berlaku.',
    },
    {
      q: 'Bagaimana jika produk mengalami kendala?',
      a: 'Anda dapat langsung menghubungi tim Customer Service resmi Asterra Store melalui WhatsApp CS 24 Jam dengan melampirkan nomor Invoice pesanan Anda.',
    },
    {
      q: 'Bagaimana cara melihat pesanan saya?',
      a: 'Anda dapat membuka menu "Pesanan Saya" pada navigasi atas atau memasukkan ID invoice pesanan untuk melihat detail aktivasi dan status lisensi Anda.',
    },
    {
      q: 'Metode pembayaran apa saja yang tersedia?',
      a: 'Kami mendukung QRIS (bisa discan dengan seluruh aplikasi m-Banking dan e-Wallet seperti GoPay, OVO, Dana, ShopeePay), serta Virtual Account perbankan terkemuka.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50 bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-[#C96F55] shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-8 sm:pb-12 w-full overflow-hidden">
        {/*
          SECTION 2: HERO BANNER IMAGE (HIGH RESOLUTION RETINA 2X, MAXIMUM SHARPNESS)
          Master source resolution is 2640x882 (intrinsic aspect ratio 2.993:1).
          - Desktop container slot: ~1320px (exact 1:1 pixel fidelity for 2x Retina)
          - Responsive sizes ensures mobile receives light payload while desktop receives razor-sharp high-res
          - quality 95 for visually lossless crisp typography and logo linework
          - priority for immediate above-the-fold LCP preloading
        */}
        <section aria-label="Banner Promo Asterra" data-gsap="hero-banner" className="w-full max-w-full mb-3.5 sm:mb-5 overflow-hidden">
          <Link
            href="/seller"
            title="Program Reseller Asterra Store - Jadi Bagian dari AsterraStore"
            data-gsap="hero-banner-inner"
            className="group block relative w-full max-w-full overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(18,26,42,0.08)] shadow-xs hover:shadow-md transition-shadow bg-[#f0f5ff]"
          >
            <Image
              src="/images/banners/hero-banner-reseller.webp"
              alt="Program Reseller Asterra Store - Jadi Bagian dari AsterraStore, Dapatkan Komisi 10-15% per Produk"
              width={2640}
              height={882}
              priority
              quality={95}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 1320px"
              className="w-full max-w-full h-auto block rounded-xl sm:rounded-2xl md:rounded-3xl object-contain transition-transform duration-300 group-hover:scale-[1.004]"
            />
          </Link>
        </section>

        {/*
          SECTION 3: FEATURED PRODUCTS (STATIC GRID: [ 🔥 Promo ] [ Terlaris ] [ Terbaru ])
          MUST BE LOCATED IMMEDIATELY BELOW THE BANNER.
          - Selector: ONLY Promo / Terlaris / Terbaru (Best Seller is removed).
          - Promo is default and visually prioritized with Asterra coral accent.
          - Cards are STATIC (NOT marquee, NOT slider, NOT looping).
          - 4 columns on desktop, 2 columns on mobile.
          - Immediately visible in first viewport!
        */}
        <section id="produk-unggulan" aria-label="Produk Unggulan Asterra" data-gsap="featured-section" className="mb-6 sm:mb-8">
          {/* Selector Tabs: [ 🔥 Promo ] [ Terlaris ] [ Terbaru ] */}
          <div data-gsap="featured-tabs" className="flex items-center justify-between gap-2 mb-3 sm:mb-4 pb-1 border-b border-[rgba(18,26,42,0.06)] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Tab 1: PROMO (DEFAULT & VISUALLY PROMINENT) */}
              <button
                type="button"
                onClick={() => setActiveCategory('promo')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all cursor-pointer ${
                  activeCategory === 'promo'
                    ? 'bg-[#C96F55] text-white shadow-xs scale-102 ring-2 ring-[#C96F55]/30'
                    : 'bg-white text-[#C96F55] border border-[#C96F55]/40 hover:bg-[#C96F55]/10'
                }`}
              >
                <FontAwesomeIcon icon={faFire} className="w-3.5 h-3.5" />
                <span>Promo</span>
              </button>

              {/* Tab 2: Terlaris */}
              <button
                type="button"
                onClick={() => setActiveCategory('terlaris')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeCategory === 'terlaris'
                    ? 'bg-[#121A2A] text-white font-bold shadow-xs'
                    : 'bg-white text-[#121A2A]/70 border border-[rgba(18,26,42,0.12)] hover:border-[#121A2A]/40 hover:text-[#121A2A] font-semibold'
                }`}
              >
                <span>Terlaris</span>
              </button>

              {/* Tab 3: Terbaru */}
              <button
                type="button"
                onClick={() => setActiveCategory('terbaru')}
                className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] transition-all cursor-pointer ${
                  activeCategory === 'terbaru'
                    ? 'bg-[#121A2A] text-white font-bold shadow-xs'
                    : 'bg-white text-[#121A2A]/70 border border-[rgba(18,26,42,0.12)] hover:border-[#121A2A]/40 hover:text-[#121A2A] font-semibold'
                }`}
              >
                <span>Terbaru</span>
              </button>
            </div>

            {/* Quick Link to Full Catalog */}
            <Link
              href="/product"
              className="text-xs font-semibold text-[#C96F55] hover:text-[#B86047] hidden md:inline-flex items-center gap-1 shrink-0"
            >
              <span>Semua Katalog</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </Link>
          </div>

          {/* STATIC PRODUCT GRID (4 columns desktop, 2 columns mobile) */}
          <div key={activeCategory} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5 lg:gap-4 animate-tab-glide">
            {featuredApps.map((app) => (
              <FeaturedGridCard
                key={`featured-${activeCategory}-${app.name}`}
                app={app}
                onQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        </section>

        {/*
          SECTION 4: PRODUCT LOOPING SHOWCASE (VISUAL PEMANIS ONLY)
          MUST BE LOCATED BELOW FEATURED PRODUCTS.
          - Smooth infinite horizontal marquee loop.
          - Independent showcase: NOT affected when user switches between Promo / Terlaris / Terbaru.
          - Clear visual separation with dedicated section heading.
        */}
        <section aria-label="Showcase Produk Asterra" className="mt-7 sm:mt-10 mb-6 sm:mb-8 pt-6 sm:pt-7 border-t border-[rgba(18,26,42,0.06)]">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#121A2A]/85">
                Showcase Katalog Pilihan
              </h2>
            </div>
            <span className="text-[11px] text-[#121A2A]/50 font-medium hidden sm:inline">
              Aktivasi instan 1 - 15 menit · Garansi resmi
            </span>
          </div>

          {/* Marquee Track Container with Edge Fades */}
          <div className="carousel-viewport relative w-full overflow-hidden py-1">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-3 sm:w-6 z-10 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-3 sm:w-6 z-10 bg-gradient-to-l from-white to-transparent" />

            <div
              className="carousel-track flex flex-nowrap w-max shrink-0 items-stretch"
              style={{
                display: 'flex',
                width: 'max-content',
                flexShrink: 0,
                willChange: 'transform',
                animation: 'infinite-scroll 45s linear infinite',
              }}
            >
              {/* Original Showcase Items */}
              {showcaseApps.map((app) => (
                <ShowcaseLoopingCard
                  key={`showcase-orig-${app.name}`}
                  app={app}
                  onQuickView={handleOpenQuickView}
                />
              ))}

              {/* Duplicated Items for continuous -50% loop */}
              {showcaseApps.map((app) => (
                <ShowcaseLoopingCard
                  key={`showcase-dup-${app.name}`}
                  app={app}
                  isDuplicate
                  onQuickView={handleOpenQuickView}
                />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: TERAKHIR DILIHAT (Conditional from localStorage: Rendered ONLY if history exists) */}
        {recentlyViewed.length > 0 && (
          <section
            aria-label="Produk Terakhir Dilihat"
            className="mt-6 sm:mt-8 mb-6 p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#C96F55]/10 text-[#C96F55] flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-[#121A2A]">
                  Terakhir Dilihat
                </h3>
              </div>
              <span className="text-[11px] text-[#121A2A]/50 font-medium">
                Tersimpan di peramban Anda
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
              {recentlyViewed.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 sm:p-3 bg-white rounded-xl border border-[rgba(18,26,42,0.08)] hover:border-[#C96F55]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#C96F55] block truncate">
                      {item.categoryName || 'Akun Digital'}
                    </span>
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="font-bold text-xs sm:text-sm text-[#121A2A] hover:text-[#C96F55] transition-colors line-clamp-1 mt-0.5"
                      title={item.name}
                    >
                      {item.name}
                    </Link>
                  </div>

                  <div className="pt-2 mt-2 border-t border-[rgba(18,26,42,0.06)] flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm text-[#121A2A]">
                      {item.priceFormatted || `Rp ${item.price.toLocaleString('id-ID')}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenQuickViewRecent(item)}
                      title="Lihat Cepat"
                      aria-label={`Tampilan cepat ${item.name}`}
                      className="w-6 h-6 rounded-md bg-[rgba(18,26,42,0.05)] hover:bg-[#C96F55] text-[#121A2A]/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: LIHAT SEMUA KATALOG BUTTON */}
        <div className="flex justify-center mt-5 mb-10 sm:mb-14">
          <Link href="/product" className="w-full max-w-sm sm:max-w-md">
            <Button
              variant="outline"
              className="w-full h-10 sm:h-11 rounded-xl border-[rgba(18,26,42,0.18)] hover:border-[#C96F55] bg-white hover:bg-[rgba(201,111,85,0.04)] text-[#121A2A] hover:text-[#C96F55] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-subtle"
            >
              <span>Lihat Semua Katalog</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* SECTION 7: KENAPA ASTERRA (6 COMMITMENTS) */}
        <section id="keunggulan" data-gsap-section="keunggulan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="keunggulan-header" className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Standar Kualitas &amp; Layanan
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Kenapa Asterra?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Enam komitmen utama yang menjadikan Asterra Store pilihan ribuan kreator, mahasiswa,
              dan profesional di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4.5">
            {/* 1. Produk Terverifikasi */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Produk Terverifikasi</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Setiap layanan memiliki informasi lisensi, durasi masa aktif, dan ketentuan garansi yang
                tercantum jelas dan transparan.
              </p>
            </div>

            {/* 2. Aktivasi Cepat */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Aktivasi Cepat</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Alur pemrosesan pesanan otomatis terintegrasi. Anda mendapatkan akses kerja siap pakai
                dalam 1 hingga 15 menit.
              </p>
            </div>

            {/* 3. Pilihan Lengkap */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faLayerGroup} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Pilihan Lengkap</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Dari asisten AI, software desain, video editing, hingga hiburan streaming premium
                semuanya tersedia dalam satu platform.
              </p>
            </div>

            {/* 4. Pembayaran Praktis */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faCreditCard} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Pembayaran Praktis</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Dukungan gateway pembayaran terpadu melalui QRIS real-time, dompet digital e-Wallet,
                serta Virtual Account bank resmi.
              </p>
            </div>

            {/* 5. Garansi Jelas */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Garansi Jelas</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Klaim garansi mudah dan transparan. Jika terjadi kendala akses sebelum masa aktif
                berakhir, kami sediakan penggantian unit 100%.
              </p>
            </div>

            {/* 6. Customer Support */}
            <div data-gsap="keunggulan-card" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-1.5 sm:space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <FontAwesomeIcon icon={faHeadphones} className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-xs sm:text-base font-bold text-[#121A2A] leading-tight">Customer Support</h3>
              <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                Tim bantuan profesional siap merespons kebutuhan dan pertanyaan teknis Anda melalui
                saluran WhatsApp resmi Asterra Store.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 8: CARA PEMESANAN (4 STEPS) */}
        <section id="panduan" data-gsap-section="panduan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="panduan-header" className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Panduan Transaksi
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Cara Pemesanan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Empat langkah praktis untuk mendapatkan lisensi digital premium Anda tanpa ribet.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4.5">
            {/* Step 01 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    01
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faTableCellsLarge} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Pilih Aplikasi
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Tentukan aplikasi atau tools digital yang ingin Anda gunakan dari katalog Asterra.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    02
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faBox} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Pilih Produk
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Pilih paket durasi masa aktif dan jenis lisensi (Private/Sharing) sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    03
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faCreditCard} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Lakukan Pembayaran
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Scan kode QRIS instan atau bayar via Virtual Account tanpa perlu unggah bukti manual.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div data-gsap="panduan-step" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-[border-color,box-shadow,background-color] duration-200">
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <span className="text-xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    04
                  </span>
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <FontAwesomeIcon icon={faBolt} className="w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#121A2A] mb-0.5 sm:mb-1">
                  Terima Aktivasi
                </h3>
                <p className="text-[10px] sm:text-xs text-[#121A2A]/65 leading-snug sm:leading-relaxed">
                  Kredensial atau tautan ruang kerja dikirimkan ke email Anda dan tercatat di menu pesanan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: FAQ */}
        <section id="faq" data-gsap-section="faq" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div data-gsap="faq-header" className="max-w-2xl mb-6">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C96F55] uppercase tracking-wider mb-1">
              <FontAwesomeIcon icon={faCircleQuestion} className="w-3.5 h-3.5" />
              <span>Bantuan &amp; Panduan</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Jawaban seputar layanan, garansi, proses aktivasi, dan pembayaran di Asterra Store.
            </p>
          </div>

          <div className="space-y-2.5 max-w-4xl">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  data-gsap="faq-item"
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                      {isOpen ? (
                        <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5 text-[#C96F55]" />
                      ) : (
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed border-t border-[rgba(18,26,42,0.06)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 10: FINAL CTA */}
        <section id="cta" data-gsap-section="cta" className="mb-6 sm:mb-8 p-5 sm:p-8 bg-[#121A2A] text-[#F7F5EF] rounded-2xl border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div data-gsap="cta-content" className="space-y-1 max-w-xl">
            <h3 className="text-base sm:text-xl lg:text-2xl font-black text-[#F7F5EF] tracking-tight">
              Dapatkan Akun Premium Pilihan Anda Hari Ini
            </h3>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/70 leading-relaxed">
              Jelajahi seluruh katalog Asterra Store dengan konfirmasi otomatis dan garansi penggantian penuh.
            </p>
          </div>

          <div data-gsap="cta-actions">
            <Link href="/product">
              <Button className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold text-xs sm:text-sm gap-2 shrink-0 active:scale-95 transition-all">
                <span>Jelajahi Produk</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </div>
  );
}
