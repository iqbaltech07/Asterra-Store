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
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shrink-0 flex-none w-[230px] sm:w-[260px] lg:w-[280px] h-[150px] sm:h-[158px] mr-3 sm:mr-4 animate-pulse select-none">
      <div>
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#121A2A]/8 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <div className="h-3.5 bg-[#121A2A]/10 rounded-md w-3/4" />
            <div className="h-2.5 bg-[#121A2A]/6 rounded-md w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5 pt-0.5">
          <div className="w-10 h-3.5 bg-[#121A2A]/6 rounded" />
          <div className="w-12 h-3.5 bg-[#121A2A]/6 rounded" />
          <div className="w-14 h-3.5 bg-[#121A2A]/6 rounded" />
        </div>
      </div>
      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
        <div className="h-4 sm:h-5 bg-[#121A2A]/10 rounded-md w-20" />
        <div className="h-6 sm:h-7 bg-[#C96F55]/15 rounded-md w-12" />
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
                ({typeof app.soldCount === 'number' && app.soldCount > 0 ? `${Math.min(40, Math.max(20, app.soldCount)).toLocaleString('id-ID')} terjual` : (isOutOfStock ? 'Stok Habis' : 'Ready')})
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

export function ShowcaseLoopingCard({
  app,
  isDuplicate = false,
  activeCampaigns = [],
  onQuickView,
}: {
  app: ApplicationGroupItem;
  isDuplicate?: boolean;
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
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      className="group bg-white border border-[rgba(18,26,42,0.09)] hover:border-[#C96F55]/70 hover:shadow-card-hover hover:-translate-y-0.5 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 transition-[border-color,box-shadow,transform] duration-200 flex flex-col justify-between shrink-0 flex-none w-[230px] sm:w-[260px] lg:w-[280px] h-[150px] sm:h-[158px] mr-3 sm:mr-4 select-none"
    >
      <div>
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Link
            href={`/products/${app.slug}`}
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          >
            <AppBrandBadge name={app.name} imageUrl={app.logoUrl} />
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
                ({typeof app.soldCount === 'number' && app.soldCount > 0 ? `${Math.min(40, Math.max(20, app.soldCount)).toLocaleString('id-ID')} terjual` : (isOutOfStock ? 'Stok Habis' : 'Ready')})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 pt-0.5">
          {isOutOfStock ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200/60 leading-none">
              Stok Habis
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
              Ready
            </span>
          )}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
            Garansi
          </span>
          {isPromo && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-[#DC2626] to-[#C96F55] text-white shadow-2xs leading-none select-none">
              🔥 {promoCalc.discountBadge}
            </span>
          )}
          {!isPromo && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C96F55]/10 text-[#C96F55] border border-[#C96F55]/20 leading-none">
              Unggulan
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
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
            className={`font-black text-sm sm:text-[15px] tracking-tight hover:text-[#C96F55] transition-colors mt-0.5 block truncate ${
              isPromo ? 'text-[#DC2626] sm:text-[#C96F55]' : 'text-[#121A2A]'
            }`}
          >
            {isPromo ? promoCalc.discountedPriceFormatted : `Rp${minPrice.toLocaleString('id-ID')}`}
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
