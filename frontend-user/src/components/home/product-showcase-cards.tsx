'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faStar,
  faEye,
  faClock,
} from '@fortawesome/free-solid-svg-icons';
import { AppBrandBadge } from '@/components/home/app-brand-badge';
import { ProductItem } from '@/lib/products-data';
import {
  calculateCampaignPrice,
  getCampaignCountdown,
  isCampaignActiveNow,
  isProductInCampaign,
  sortCampaignsByPriority,
  ActiveCampaign,
} from '@/lib/utils/promo-pricing';

export interface ApplicationGroupItem {
  id?: string;
  name: string;
  slug: string;
  category: string;
  categoryId?: string;
  categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'other';
  minPrice: number;
  soldCount?: number;
  targetMax?: number;
  rating?: string;
  badgeLabel?: string;
  isPromo?: boolean;
  isTerlaris?: boolean;
  isTerbaru?: boolean;
  logoUrl?: string;
  imageUrl?: string;
  description?: string;
  items: ProductItem[];
  isOutOfStock?: boolean;
  rank?: number;
}

export function isAppOutOfStock(app: ApplicationGroupItem): boolean {
  if (typeof app.isOutOfStock === 'boolean') return app.isOutOfStock;
  if (!app.items || app.items.length === 0) return true;
  return app.items.every((item) => {
    const isZeroStock = item.stock !== undefined && item.stock <= 0;
    const isEmpty = item.providerStatus === 'empty';
    const isInactive = item.status === 'out_of_stock' || item.status === 'archived';
    return isZeroStock || isEmpty || isInactive;
  });
}

export function FeaturedGridCardSkeleton() {
  return (
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between w-full h-[155px] sm:h-[165px] animate-pulse select-none">
      <div>
        <div className="flex items-start gap-2 sm:gap-2.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-[#121A2A]/8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 bg-[#121A2A]/10 rounded-md w-3/4" />
            <div className="h-2.5 bg-[#121A2A]/6 rounded-md w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-1.5 mt-2.5 pt-0.5">
          <div className="w-10 h-3.5 bg-[#121A2A]/6 rounded" />
          <div className="w-12 h-3.5 bg-[#121A2A]/6 rounded" />
          <div className="w-14 h-3.5 bg-[#121A2A]/6 rounded" />
        </div>
      </div>
      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 sm:mt-2.5 flex items-center justify-between">
        <div className="h-4 sm:h-5 bg-[#121A2A]/10 rounded-md w-20" />
        <div className="h-6 sm:h-7 bg-[#C96F55]/15 rounded-md w-12" />
      </div>
    </div>
  );
}

export function ShowcaseLoopingCardSkeleton() {
  return (
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-3xl p-4 sm:p-5 flex flex-col justify-between shrink-0 flex-none w-[260px] sm:w-[280px] lg:w-[290px] h-[195px] sm:h-[205px] mr-3 sm:mr-4 animate-pulse select-none">
      <div>
        <div className="w-16 h-5 bg-[#121A2A]/8 rounded-full mb-3" />
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#121A2A]/8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 bg-[#121A2A]/10 rounded w-3/4" />
            <div className="h-3 bg-[#121A2A]/6 rounded w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3">
          <div className="w-12 h-4 bg-[#121A2A]/6 rounded" />
          <div className="w-14 h-4 bg-[#121A2A]/6 rounded" />
          <div className="w-16 h-4 bg-[#121A2A]/6 rounded" />
        </div>
      </div>
      <div className="pt-2.5 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
        <div className="h-5 bg-[#121A2A]/10 rounded w-24" />
        <div className="h-7 bg-[#121A2A]/8 rounded-full w-16" />
      </div>
    </div>
  );
}

export function FeaturedGridCard({
  app,
  activeCampaigns = [],
  onQuickView,
}: {
  app: ApplicationGroupItem;
  activeCampaigns?: ActiveCampaign[];
  onQuickView?: (app: ApplicationGroupItem) => void;
}) {
  const minPrice = app.minPrice;
  if (!minPrice || minPrice <= 0) return null;
  const promoCalc = calculateCampaignPrice(minPrice, app, activeCampaigns);
  const isPromo = promoCalc.hasPromo;
  const isOutOfStock = isAppOutOfStock(app);

  return (
    <div
      data-gsap="product-card"
      data-card-wrapper
      className="group bg-white border border-[rgba(18,26,42,0.09)] hover:border-[#C96F55]/70 hover:shadow-card-hover hover:-translate-y-0.5 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 transition-[border-color,box-shadow] duration-200 flex flex-col justify-between w-full h-full select-none"
    >
      <div>
        <div className="flex items-start gap-2 sm:gap-2.5">
          <Link
            href={`/products/${app.slug}`}
            data-gsap="product-image"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          >
            <AppBrandBadge name={app.name} imageUrl={app.logoUrl} />
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

            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-[#121A2A]/75 font-medium mt-0.5">
              <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 shrink-0" />
              <span className="font-semibold text-[#121A2A]">{app.rating || '5.0'}</span>
              <span className="text-[#121A2A]/45 truncate">
                ({typeof app.soldCount === 'number' && app.soldCount > 0 ? `${app.soldCount.toLocaleString('id-ID')} terjual` : (isOutOfStock ? 'Stok Habis' : 'Ready')})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 mt-2 sm:mt-2.5 pt-0.5 flex-wrap">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200/60 leading-none">
              Stok Habis
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
              Ready
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
            Garansi
          </span>
          {isPromo && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-[#DC2626] to-[#C96F55] text-white shadow-2xs leading-none select-none">
              🔥 {promoCalc.discountBadge}
            </span>
          )}
          {!isPromo && app.badgeLabel && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20 leading-none truncate max-w-[90px]">
              {app.badgeLabel}
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 sm:mt-2.5 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          {isPromo && (
            <div className="flex items-center gap-1 leading-none flex-wrap">
              <span className="text-[10px] sm:text-[11px] text-[#121A2A]/40 line-through font-semibold leading-none block">
                {promoCalc.originalPriceFormatted}
              </span>
              <span className="text-[8px] font-black text-[#DC2626] bg-[#DC2626]/10 px-1 py-0.2 rounded border border-[#DC2626]/20">
                {promoCalc.savingsText}
              </span>
            </div>
          )}
          <Link
            href={`/products/${app.slug}`}
            data-gsap="product-price"
            className={`font-black text-xs sm:text-sm lg:text-[15px] tracking-tight hover:text-[#C96F55] transition-colors mt-0.5 block truncate ${
              isPromo ? 'text-[#DC2626] sm:text-[#C96F55]' : 'text-[#121A2A]'
            }`}
          >
            {isPromo ? promoCalc.discountedPriceFormatted : `Rp${minPrice.toLocaleString('id-ID')}`}
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

interface ShowcaseRankTheme {
  title: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  crownEmoji: string;
  watermarkType: 'crown' | 'canva' | 'chatgpt' | 'netflix' | 'youtube';
}

const SHOWCASE_RANK_THEMES: Record<number, ShowcaseRankTheme> = {
  1: {
    title: 'TOP 1',
    cardBg: 'from-[#FFFDF5] via-[#FFFDF5] to-[#FEF3C7]/45',
    cardBorder: 'border-[#FDE68A]/90 hover:border-[#F59E0B]',
    badgeBg: 'bg-[#FEF3C7]',
    badgeText: 'text-[#92400E]',
    badgeBorder: 'border-[#FDE68A]',
    crownEmoji: '👑',
    watermarkType: 'crown',
  },
  2: {
    title: 'TOP 2',
    cardBg: 'from-[#F8FAFC] via-[#F8FAFC] to-[#E0F2FE]/45',
    cardBorder: 'border-[#BAE6FD]/90 hover:border-[#0284C7]',
    badgeBg: 'bg-[#E0F2FE]',
    badgeText: 'text-[#0369A1]',
    badgeBorder: 'border-[#BAE6FD]',
    crownEmoji: '👑',
    watermarkType: 'canva',
  },
  3: {
    title: 'TOP 3',
    cardBg: 'from-[#FAF5FF] via-[#FAF5FF] to-[#EDE9FE]/45',
    cardBorder: 'border-[#DDD6FE]/90 hover:border-[#7C3AED]',
    badgeBg: 'bg-[#EDE9FE]',
    badgeText: 'text-[#6D28D9]',
    badgeBorder: 'border-[#DDD6FE]',
    crownEmoji: '👑',
    watermarkType: 'chatgpt',
  },
  4: {
    title: 'TOP 4',
    cardBg: 'from-[#FFF5F5] via-[#FFF5F5] to-[#FCE7F3]/45',
    cardBorder: 'border-[#FBCFE8]/90 hover:border-[#E11D48]',
    badgeBg: 'bg-[#FCE7F3]',
    badgeText: 'text-[#BE185D]',
    badgeBorder: 'border-[#FBCFE8]',
    crownEmoji: '👑',
    watermarkType: 'netflix',
  },
  5: {
    title: 'TOP 5',
    cardBg: 'from-[#F8FAFC] via-[#F8FAFC] to-[#E2E8F0]/45',
    cardBorder: 'border-[#CBD5E1]/90 hover:border-[#475569]',
    badgeBg: 'bg-[#E2E8F0]',
    badgeText: 'text-[#334155]',
    badgeBorder: 'border-[#CBD5E1]',
    crownEmoji: '👑',
    watermarkType: 'youtube',
  },
};

export function ShowcaseLoopingCard({
  app,
  rank = 1,
  isDuplicate = false,
  activeCampaigns = [],
  onQuickView,
}: {
  app: ApplicationGroupItem;
  rank?: number;
  isDuplicate?: boolean;
  activeCampaigns?: ActiveCampaign[];
  onQuickView?: (app: ApplicationGroupItem) => void;
}) {
  const minPrice = app.minPrice;
  if (!minPrice || minPrice <= 0) return null;
  const promoCalc = calculateCampaignPrice(minPrice, app, activeCampaigns);
  const isPromo = promoCalc.hasPromo;
  const isOutOfStock = isAppOutOfStock(app);

  // Normalize rank 1..5
  const effectiveRank = app.rank || rank || 1;
  const rankIndex = ((effectiveRank - 1) % 5) + 1;
  const theme = SHOWCASE_RANK_THEMES[rankIndex] || SHOWCASE_RANK_THEMES[1];

  // Watermark detection by app slug if needed
  const slugLower = (app.slug || app.name || '').toLowerCase();
  let watermarkKind = theme.watermarkType;
  if (slugLower.includes('canva')) watermarkKind = 'canva';
  else if (slugLower.includes('chatgpt')) watermarkKind = 'chatgpt';
  else if (slugLower.includes('netflix')) watermarkKind = 'netflix';
  else if (slugLower.includes('youtube')) watermarkKind = 'youtube';
  else if (rankIndex === 1) watermarkKind = 'crown';

  return (
    <div
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      className={`group relative bg-gradient-to-b ${theme.cardBg} border ${theme.cardBorder} hover:shadow-card-hover hover:-translate-y-1 rounded-3xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shrink-0 flex-none w-[260px] sm:w-[280px] lg:w-[290px] h-[195px] sm:h-[205px] mr-3 sm:mr-4 select-none overflow-hidden shadow-2xs`}
    >
      {/* Background Watermark in top-right */}
      <div className="absolute top-2.5 right-3.5 pointer-events-none select-none z-0">
        {watermarkKind === 'crown' && (
          <span className="text-4xl sm:text-5xl opacity-40 filter drop-shadow-xs">👑</span>
        )}
        {watermarkKind === 'canva' && (
          <span className="font-serif italic text-3xl sm:text-4xl font-extrabold text-sky-500/20">Canva</span>
        )}
        {watermarkKind === 'chatgpt' && (
          <span className="text-3xl sm:text-4xl text-purple-600/20 font-mono">✦ OpenAI</span>
        )}
        {watermarkKind === 'netflix' && (
          <span className="font-black text-4xl sm:text-5xl text-rose-600/20 font-sans tracking-tighter">N</span>
        )}
        {watermarkKind === 'youtube' && (
          <span className="text-3xl sm:text-4xl text-slate-600/20">▶</span>
        )}
      </div>

      {/* Subtle curved background wave glow at bottom */}
      <div className="absolute -bottom-8 -right-8 w-36 h-36 rounded-full bg-white/45 blur-xl pointer-events-none z-0" />

      {/* Row 1: Rank Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-2xs border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}>
          <span>{theme.crownEmoji}</span>
          <span>{theme.title}</span>
        </span>
      </div>

      {/* Row 2: Brand Logo + Name + Star Rating & Sold Count */}
      <div className="relative z-10 flex items-center gap-3 mt-1.5">
        <Link
          href={`/products/${app.slug}`}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-2xs border border-black/5 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
        >
          <AppBrandBadge name={app.name} imageUrl={app.logoUrl} />
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            href={`/products/${app.slug}`}
            className="font-extrabold text-sm sm:text-base text-[#121A2A] group-hover:text-[#C96F55] transition-colors truncate block leading-snug"
            title={app.name}
          >
            {app.name}
          </Link>

          <div className="flex items-center gap-1 text-[11px] text-[#121A2A]/75 font-medium mt-0.5">
            <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="font-bold text-[#121A2A]">{app.rating || '5.0'}</span>
            <span className="text-[#121A2A]/50 truncate text-[11px]">
              ({typeof app.soldCount === 'number' && app.soldCount > 0 ? `${app.soldCount.toLocaleString('id-ID')} terjual` : (isOutOfStock ? 'Stok Habis' : 'Ready')})
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Feature Badges (Ready/Habis, Garansi, DISKON 15%) */}
      <div className="relative z-10 flex items-center gap-1.5 mt-2">
        {isOutOfStock ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200/60 leading-none">
            Stok Habis
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
            Ready
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
          🛡️ Garansi
        </span>
        {isPromo && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 leading-none select-none">
            🏷️ {promoCalc.discountBadge || 'DISKON 15%'}
          </span>
        )}
        {!isPromo && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200/60 leading-none select-none">
            🏷️ DISKON 15%
          </span>
        )}
      </div>

      {/* Row 4: Pricing & Pill "Pilih" Button */}
      <div className="relative z-10 pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1 leading-none">
            <span className="text-[10px] sm:text-[11px] text-[#121A2A]/40 line-through font-semibold leading-none block">
              {promoCalc.hasPromo ? promoCalc.originalPriceFormatted : `Rp${Math.round(minPrice * 1.15).toLocaleString('id-ID')}`}
            </span>
            <span className="text-[8px] font-black text-[#DC2626] bg-[#DC2626]/10 px-1 py-0.2 rounded border border-[#DC2626]/20">
              {promoCalc.hasPromo ? promoCalc.savingsText : `Hemat Rp${Math.round(minPrice * 0.15).toLocaleString('id-ID')}`}
            </span>
          </div>

          <Link
            href={`/products/${app.slug}`}
            className="font-black text-sm sm:text-base text-[#121A2A] hover:text-[#C96F55] transition-colors mt-0.5 block truncate"
          >
            {promoCalc.hasPromo ? promoCalc.discountedPriceFormatted : `Rp ${minPrice.toLocaleString('id-ID')}`}
          </Link>
        </div>

        <div className="flex items-center">
          {onQuickView ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(app);
              }}
              title="Lihat Cepat"
              aria-label={`Pilih ${app.name}`}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-full px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-slate-500" />
              <span>Pilih</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-slate-500" />
            </button>
          ) : (
            <Link
              href={`/products/${app.slug}`}
              className="bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 rounded-full px-3 py-1.5 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
            >
              <FontAwesomeIcon icon={faEye} className="w-3 h-3 text-slate-500" />
              <span>Pilih</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-2.5 h-2.5 text-slate-500" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function FeaturedSectionCountdownBadge({
  activeCampaigns,
  featuredApps,
}: {
  activeCampaigns: ActiveCampaign[];
  featuredApps: ApplicationGroupItem[];
}) {
  const [countdownText, setCountdownText] = useState('');
  const [isSectionExpired, setIsSectionExpired] = useState(true);

  const relevantFeaturedCampaigns = React.useMemo(() => {
    if (!activeCampaigns.length || !featuredApps.length) return [];
    const matched = activeCampaigns.filter((camp) => {
      if (!isCampaignActiveNow(camp)) return false;
      return featuredApps.some((app) =>
        app.items.some((item) =>
          isProductInCampaign({ id: item.id, name: item.name, category: item.category?.name }, camp)
        )
      );
    });
    return sortCampaignsByPriority(matched);
  }, [activeCampaigns, featuredApps]);

  useEffect(() => {
    if (relevantFeaturedCampaigns.length === 0) {
      setCountdownText('');
      setIsSectionExpired(true);
      return;
    }

    const updateCountdown = () => {
      let activeRep: ActiveCampaign | null = null;
      let cdResult: ReturnType<typeof getCampaignCountdown> | null = null;

      for (const camp of relevantFeaturedCampaigns) {
        const res = getCampaignCountdown(camp.endsAt || camp.endDate, camp.startsAt || camp.startDate);
        if (!res.isExpired) {
          activeRep = camp;
          cdResult = res;
          break;
        }
      }

      if (!activeRep || !cdResult || cdResult.isExpired) {
        setCountdownText('');
        setIsSectionExpired(true);
        return;
      }

      const hasDifferentEndDates = relevantFeaturedCampaigns.some((c) => {
        const cEnd = c.endsAt || c.endDate;
        const repEnd = activeRep?.endsAt || activeRep?.endDate;
        return cEnd !== repEnd;
      });

      const label = hasDifferentEndDates && activeRep.name ? `${activeRep.name}: ` : '';
      setCountdownText(`${label}${cdResult.countdownText}`);
      setIsSectionExpired(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [relevantFeaturedCampaigns]);

  if (isSectionExpired || !countdownText) return null;

  return (
    <div className="mb-3 sm:mb-3.5 flex items-center justify-between px-0.5">
      <div
        data-gsap="section-countdown"
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C96F55]/10 border border-[#C96F55]/25 text-[#C96F55] text-xs sm:text-[13px] font-semibold shadow-2xs select-none"
      >
        <span className="shrink-0 text-xs">⏳</span>
        <span className="font-medium tracking-tight">{countdownText}</span>
      </div>
    </div>
  );
}
