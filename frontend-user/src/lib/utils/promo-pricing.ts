/**
 * Dynamic Campaign & Promo Pricing Engine (AsterraStore)
 *
 * Provides genuine promotional pricing calculated strictly against active campaigns
 * (Admin Console -> Marketing & Growth -> Campaign) using authoritative normal product prices.
 * Strictly adheres to non-overlapping priority rules, live time windows, and Asia/Jakarta timezone.
 */

export interface ActiveCampaign {
  id?: string;
  name?: string;
  slug?: string;
  tagline?: string;
  targetScope?: 'all' | 'category' | 'specific_products' | string;
  targetCategories?: string[];
  targetCategory?: string;
  targetProducts?: string[];
  priority?: number;
  discountType?: 'percentage' | 'fixed' | string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minPurchase?: number;
  minOrderAmount?: number;
  startDate?: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
  isActive?: boolean;
  affiliateBonusPercent?: number;
  affiliateCommissionOverride?: number;
}

export interface CalculatedPromoPrice {
  hasPromo: boolean;
  campaignId?: string;
  campaignName?: string;
  campaignSlug?: string;
  discountType?: string;
  discountValue?: number;
  originalPrice: number;
  originalPriceFormatted: string;
  discountedPrice: number;
  discountedPriceFormatted: string;
  discountAmount: number;
  savings?: number;
  discountBadge: string;
  savingsText?: string;
  startDate?: string;
  endDate?: string;
  startsAt?: string;
  endsAt?: string;
  endDateFormatted?: string;
  periodFormatted?: string;
}

/**
 * Formats campaign end date into a clear, readable Indonesian text (e.g. "Berakhir 26 Okt 2026").
 * Always evaluates using Asia/Jakarta timezone to prevent date shifts.
 */
export function formatCampaignEndDate(endsAtOrDate?: string): string {
  if (!endsAtOrDate) return '';
  try {
    const raw = endsAtOrDate.trim();
    // If only date string (YYYY-MM-DD), append T23:59:59+07:00
    const isoString = raw.length === 10 ? `${raw}T23:59:59+07:00` : (raw.includes('+') || raw.endsWith('Z') ? raw : `${raw}+07:00`);
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
    return `Berakhir ${formatter.format(date)}`;
  } catch {
    return '';
  }
}

/**
 * Formats campaign start and end dates into an Indonesian period string (e.g. "12–26 Oktober 2026").
 */
export function formatCampaignPeriod(startsAtOrDate?: string, endsAtOrDate?: string): string {
  if (!startsAtOrDate || !endsAtOrDate) return '';
  try {
    const sRaw = startsAtOrDate.trim();
    const eRaw = endsAtOrDate.trim();
    const sIso = sRaw.length === 10 ? `${sRaw}T00:00:00+07:00` : (sRaw.includes('+') || sRaw.endsWith('Z') ? sRaw : `${sRaw}+07:00`);
    const eIso = eRaw.length === 10 ? `${eRaw}T23:59:59+07:00` : (eRaw.includes('+') || eRaw.endsWith('Z') ? eRaw : `${eRaw}+07:00`);

    const sDate = new Date(sIso);
    const eDate = new Date(eIso);
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) return '';

    const sDay = sDate.toLocaleDateString('id-ID', { day: 'numeric', timeZone: 'Asia/Jakarta' });
    const eDay = eDate.toLocaleDateString('id-ID', { day: 'numeric', timeZone: 'Asia/Jakarta' });
    const sMonth = sDate.toLocaleDateString('id-ID', { month: 'long', timeZone: 'Asia/Jakarta' });
    const eMonth = eDate.toLocaleDateString('id-ID', { month: 'long', timeZone: 'Asia/Jakarta' });
    const sYear = sDate.toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' });
    const eYear = eDate.toLocaleDateString('id-ID', { year: 'numeric', timeZone: 'Asia/Jakarta' });

    if (sYear !== eYear) {
      return `${sDay} ${sMonth} ${sYear} – ${eDay} ${eMonth} ${eYear}`;
    }
    if (sMonth !== eMonth) {
      return `${sDay} ${sMonth} – ${eDay} ${eMonth} ${eYear}`;
    }
    return `${sDay}–${eDay} ${eMonth} ${eYear}`;
  } catch {
    return '';
  }
}

/**
 * Computes remaining time until campaign ends.
 * Stops cleanly at 0 without negative numbers.
 */
export function getCampaignCountdown(endsAtOrDate?: string): {
  isExpired: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  countdownText: string;
} {
  if (!endsAtOrDate) {
    return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, countdownText: 'Promo berakhir' };
  }
  try {
    const raw = endsAtOrDate.trim();
    const isoString = raw.length === 10 ? `${raw}T23:59:59+07:00` : (raw.includes('+') || raw.endsWith('Z') ? raw : `${raw}+07:00`);
    const endMs = new Date(isoString).getTime();
    if (isNaN(endMs)) {
      return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, countdownText: 'Promo berakhir' };
    }

    const nowMs = Date.now();
    const diffMs = endMs - nowMs;

    if (diffMs <= 0) {
      return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, countdownText: 'Promo berakhir' };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    const timeFormatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

    const countdownText = `Promo berakhir dalam ${timeFormatted}`;

    return {
      isExpired: false,
      totalSeconds,
      days,
      hours,
      minutes,
      seconds,
      countdownText,
    };
  } catch {
    return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, countdownText: 'Promo berakhir' };
  }
}

/**
 * Checks if a campaign is currently valid within its live time-window (now >= startsAt && now < endsAt).
 */
export function isCampaignActiveNow(campaign: ActiveCampaign): boolean {
  if (!campaign || campaign.isActive === false || campaign.status === 'ended') {
    return false;
  }
  const endsVal = campaign.endsAt || campaign.endDate;
  if (endsVal) {
    const raw = endsVal.trim();
    const isoString = raw.length === 10 ? `${raw}T23:59:59+07:00` : (raw.includes('+') || raw.endsWith('Z') ? raw : `${raw}+07:00`);
    const endMs = new Date(isoString).getTime();
    if (!isNaN(endMs) && Date.now() >= endMs) {
      return false;
    }
  }
  const startsVal = campaign.startsAt || campaign.startDate;
  if (startsVal) {
    const raw = startsVal.trim();
    const isoString = raw.length === 10 ? `${raw}T00:00:00+07:00` : (raw.includes('+') || raw.endsWith('Z') ? raw : `${raw}+07:00`);
    const startMs = new Date(isoString).getTime();
    if (!isNaN(startMs) && Date.now() < startMs) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a product or application matches an active campaign.
 */
export function isProductInCampaign(
  product: any,
  campaign: ActiveCampaign
): boolean {
  if (!isCampaignActiveNow(campaign)) {
    return false;
  }

  const scope = campaign.targetScope || 'all';
  if (scope === 'all') return true;

  if (scope === 'category') {
    const targetCats = (campaign.targetCategories || [campaign.targetCategory || ''])
      .filter(Boolean)
      .map((c) => c.toLowerCase().trim());

    const rawCat = product.category;
    const catName = (
      typeof rawCat === 'string'
        ? rawCat
        : rawCat && typeof rawCat === 'object'
        ? rawCat.name || ''
        : product.categoryName || ''
    ).toLowerCase().trim();

    const catId = (
      rawCat && typeof rawCat === 'object' ? rawCat.id || '' : product.categoryId || ''
    ).toLowerCase().trim();

    const catSlug = catName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return targetCats.some((tc) => {
      const tcClean = tc.toLowerCase().trim();
      const tcSlug = tcClean.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return (
        catName === tcClean ||
        catName.includes(tcClean) ||
        tcClean.includes(catName) ||
        catId === tcClean ||
        catSlug === tcSlug ||
        catSlug.includes(tcSlug) ||
        tcSlug.includes(catSlug)
      );
    });
  }

  if (scope === 'specific_products') {
    const targetProds = (campaign.targetProducts || []).map((p) => p.toLowerCase().trim());
    const prodId = (product.id || '').toLowerCase().trim();
    const prodSlug = (product.slug || '').toLowerCase().trim();
    if (prodId && targetProds.includes(prodId)) return true;
    if (prodSlug && targetProds.includes(prodSlug)) return true;
  }

  return false;
}

/**
 * Sorts active campaigns by deterministic priority:
 * 1. priority DESC
 * 2. Scope specificity: specific_products (3) > category (2) > all (1)
 * 3. startsAt ASC (earliest start first)
 * 4. id ASC (stable tie-break)
 */
export function sortCampaignsByPriority(campaigns: ActiveCampaign[]): ActiveCampaign[] {
  return [...campaigns].sort((a, b) => {
    const pA = Number(a.priority || 0);
    const pB = Number(b.priority || 0);
    if (pB !== pA) return pB - pA;

    const getScopeRank = (scope?: string) => {
      if (scope === 'specific_products') return 3;
      if (scope === 'category') return 2;
      return 1;
    };
    const sA = getScopeRank(a.targetScope);
    const sB = getScopeRank(b.targetScope);
    if (sB !== sA) return sB - sA;

    const startA = a.startsAt || a.startDate || '';
    const startB = b.startsAt || b.startDate || '';
    if (startA !== startB) return startA.localeCompare(startB);

    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

/**
 * Calculates genuine campaign discount and crossed-out price based on active campaigns.
 * Strictly adheres to:
 * - Harga promo = harga normal * (1 - persentase diskon / 100)
 * - Single campaign application when overlapping (highest deterministic priority, no stacking)
 * - Returns to normal price when campaign ends (no fake markup)
 */
export function calculateCampaignPrice(
  price: number,
  product: any = {},
  activeCampaigns: ActiveCampaign[] = []
): CalculatedPromoPrice {
  if (!price || price <= 0) {
    return {
      hasPromo: false,
      originalPrice: 0,
      originalPriceFormatted: 'Rp 0',
      discountedPrice: 0,
      discountedPriceFormatted: 'Rp 0',
      discountAmount: 0,
      savings: 0,
      discountBadge: '',
      savingsText: '',
    };
  }

  // 1. Filter and sort matching active campaigns deterministically
  const sorted = sortCampaignsByPriority(activeCampaigns);
  const campaign = sorted.find((c) => isProductInCampaign(product, c));

  if (campaign) {
    const minP = Number(campaign.minPurchase || campaign.minOrderAmount || 0);
    if (price >= minP) {
      let discount = 0;
      if (campaign.discountType === 'percentage') {
        const pct = Number(campaign.discountValue || 0);
        discount = Math.round((price * pct) / 100);
      } else {
        discount = Number(campaign.discountValue || 0);
      }

      const maxDisc = Number(campaign.maxDiscountAmount || 0);
      if (maxDisc > 0 && discount > maxDisc) {
        discount = maxDisc;
      }

      discount = Math.min(price, Math.max(0, discount));
      const discountedPrice = Math.max(0, price - discount);

      if (discount > 0) {
        const discountBadge =
          campaign.discountType === 'percentage'
            ? `DISKON ${campaign.discountValue}%`
            : `-Rp ${discount.toLocaleString('id-ID')}`;

        const endsVal = campaign.endsAt || campaign.endDate;
        const startsVal = campaign.startsAt || campaign.startDate;

        return {
          hasPromo: true,
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignSlug: campaign.slug,
          discountType: campaign.discountType,
          discountValue: campaign.discountValue,
          originalPrice: price,
          originalPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
          discountedPrice,
          discountedPriceFormatted: `Rp ${discountedPrice.toLocaleString('id-ID')}`,
          discountAmount: discount,
          savings: discount,
          discountBadge,
          savingsText: `Hemat Rp ${discount.toLocaleString('id-ID')}`,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          startsAt: campaign.startsAt,
          endsAt: campaign.endsAt,
          endDateFormatted: formatCampaignEndDate(endsVal),
          periodFormatted: formatCampaignPeriod(startsVal, endsVal),
        };
      }
    }
  }

  // No active promo applies: return pure regular price
  return {
    hasPromo: false,
    originalPrice: price,
    originalPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
    discountedPrice: price,
    discountedPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
    discountAmount: 0,
    savings: 0,
    discountBadge: '',
    savingsText: '',
  };
}

/**
 * Checks if a product matches an active campaign.
 */
export function isPromoItem(item?: unknown, activeCampaigns: ActiveCampaign[] = []): boolean {
  if (!item || typeof item !== 'object' || activeCampaigns.length === 0) return false;
  const anyItem = item as Record<string, unknown>;

  const rawCat = anyItem.category;
  const catName = typeof rawCat === 'string' ? rawCat : (rawCat && typeof rawCat === 'object' ? (rawCat as { name?: string }).name : '');

  return activeCampaigns.some((c) =>
    isProductInCampaign(
      {
        id: (anyItem.id as string) || undefined,
        slug: (anyItem.slug as string) || undefined,
        category: catName || undefined,
        categoryId: (anyItem.categoryId as string) || undefined,
        categoryName: (anyItem.categoryName as string) || undefined,
        name: (anyItem.name as string) || undefined,
      },
      c
    )
  );
}
