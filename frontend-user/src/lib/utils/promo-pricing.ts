/**
 * Dynamic Campaign & Promo Pricing Engine
 *
 * Provides genuine promotional pricing and crossed-out original prices calculated
 * directly against active campaigns (discountType: percentage/fixed, targetScope, discountValue).
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
  discountType?: 'percentage' | 'fixed' | string;
  discountValue?: number;
  maxDiscountAmount?: number;
  minPurchase?: number;
  minOrderAmount?: number;
  status?: string;
  isActive?: boolean;
}

export interface CalculatedPromoPrice {
  hasPromo: boolean;
  campaignName?: string;
  discountType?: string;
  discountValue?: number;
  originalPrice: number;
  originalPriceFormatted: string;
  discountedPrice: number;
  discountedPriceFormatted: string;
  discountAmount: number;
  discountBadge: string;
  savingsText?: string;
}

/**
 * Checks if a product or application matches an active campaign.
 */
export function isProductInCampaign(
  product: {
    id?: string;
    slug?: string;
    category?: string | { id?: string; name?: string };
    categoryId?: string;
    name?: string;
    tags?: string[];
  },
  campaign: ActiveCampaign
): boolean {
  if (!campaign || campaign.status === 'ended' || campaign.isActive === false) {
    return false;
  }
  const scope = campaign.targetScope || 'all';
  if (scope === 'all') return true;

  if (scope === 'category') {
    const cats = (campaign.targetCategories || [campaign.targetCategory || ''])
      .filter(Boolean)
      .map((c) => c.toLowerCase().trim());
    const rawCat = product.category;
    const prodCat = (
      typeof rawCat === 'string'
        ? rawCat
        : rawCat && typeof rawCat === 'object'
        ? rawCat.name || ''
        : ''
    ).toLowerCase().trim();
    return cats.some((c) => prodCat.includes(c) || c.includes(prodCat));
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
 * Calculates genuine campaign discount and crossed-out price based on active campaigns,
 * with retail anchor psychological pricing fallback for promo/popular products.
 */
export function calculateCampaignPrice(
  price: number,
  product: {
    id?: string;
    slug?: string;
    category?: string | { id?: string; name?: string };
    categoryId?: string;
    name?: string;
    tags?: string[];
    popular?: boolean;
    isPromo?: boolean;
  } = {},
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
      discountBadge: '',
      savingsText: '',
    };
  }

  // 1. Check if matching any active campaign
  const campaign = (activeCampaigns || []).find((c) => isProductInCampaign(product, c));

  if (campaign) {
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

    const discountBadge =
      campaign.discountType === 'percentage'
        ? `-${campaign.discountValue}%`
        : `-Rp ${discount.toLocaleString('id-ID')}`;

    return {
      hasPromo: discount > 0,
      campaignName: campaign.name,
      discountType: campaign.discountType,
      discountValue: campaign.discountValue,
      originalPrice: price,
      originalPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
      discountedPrice,
      discountedPriceFormatted: `Rp ${discountedPrice.toLocaleString('id-ID')}`,
      discountAmount: discount,
      discountBadge,
      savingsText: `Hemat Rp ${discount.toLocaleString('id-ID')}`,
    };
  }

  // 2. Check if product is marked as promo item (popular / promo in name / isPromo flag)
  if (isPromoItem(product, activeCampaigns)) {
    const anchor = getDummyOriginalPrice(price);
    const originalPrice = anchor.originalPrice;
    const discountAmount = Math.max(0, originalPrice - price);
    const pct = Math.round((discountAmount / originalPrice) * 100);
    const discountBadge = `-${pct}%`;

    return {
      hasPromo: true,
      campaignName: 'Promo Diskon',
      discountType: 'percentage',
      discountValue: pct,
      originalPrice,
      originalPriceFormatted: anchor.originalPriceFormatted,
      discountedPrice: price,
      discountedPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
      discountAmount,
      discountBadge,
      savingsText: `Hemat Rp ${discountAmount.toLocaleString('id-ID')}`,
    };
  }

  return {
    hasPromo: false,
    originalPrice: price,
    originalPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
    discountedPrice: price,
    discountedPriceFormatted: `Rp ${price.toLocaleString('id-ID')}`,
    discountAmount: 0,
    discountBadge: '',
    savingsText: '',
  };
}

/**
 * Backward compatibility fallback anchor price generator.
 * Follows retail psychological anchor pricing:
 * - < 10,000: ~40% markup, rounded to nearest 1,000 (e.g. 4,000 -> 6,000)
 * - 10,000 - 100,000: ~35% markup, rounded to nearest 1,000 (e.g. 21,000 -> 30,000, 18,000 -> 25,000)
 * - > 100,000: ~30% markup, rounded to nearest 5,000
 */
export function getDummyOriginalPrice(price: number): {
  originalPrice: number;
  originalPriceFormatted: string;
} {
  if (!price || price <= 0) {
    return { originalPrice: 0, originalPriceFormatted: '' };
  }

  let markup = 1.35;
  let roundBase = 1000;

  if (price < 10000) {
    markup = 1.4;
    roundBase = 1000;
  } else if (price >= 100000) {
    markup = 1.3;
    roundBase = 5000;
  }

  const rawOriginal = Math.ceil((price * markup) / roundBase) * roundBase;
  const originalPrice = rawOriginal <= price ? price + roundBase : rawOriginal;

  return {
    originalPrice,
    originalPriceFormatted: `Rp ${originalPrice.toLocaleString('id-ID')}`,
  };
}

/**
 * Check if a product item or app configuration has active Promo status.
 */
export function isPromoItem(item?: unknown, activeCampaigns: ActiveCampaign[] = []): boolean {
  if (!item || typeof item !== 'object') return false;
  const anyItem = item as Record<string, unknown>;

  // 1. Check if matching any active campaign
  if (activeCampaigns.length > 0) {
    const isMatching = activeCampaigns.some((c) =>
      isProductInCampaign(
        {
          id: (anyItem.id as string) || undefined,
          slug: (anyItem.slug as string) || undefined,
          category: (anyItem.category as string) || undefined,
          name: (anyItem.name as string) || undefined,
        },
        c
      )
    );
    if (isMatching) return true;
  }

  // 2. Explicit promo flags
  if (anyItem.isPromo === true) return true;
  if (anyItem.isCampaignActive === true) return true;
  if (Boolean(anyItem.campaignId || anyItem.campaign || anyItem.campaignSlug)) return true;

  // 3. Popular products are promo / featured deals in AsterraStore
  if (anyItem.popular === true) return true;

  // 4. Promo keywords in badges or titles
  if (
    typeof anyItem.badgeLabel === 'string' &&
    (anyItem.badgeLabel.toLowerCase().includes('promo') ||
      anyItem.badgeLabel.toLowerCase().includes('sale') ||
      anyItem.badgeLabel.toLowerCase().includes('laris') ||
      anyItem.badgeLabel.toLowerCase().includes('flash') ||
      anyItem.badgeLabel.toLowerCase().includes('diskon'))
  )
    return true;

  if (
    typeof anyItem.badge === 'string' &&
    (anyItem.badge.toLowerCase().includes('promo') ||
      anyItem.badge.toLowerCase().includes('sale') ||
      anyItem.badge.toLowerCase().includes('laris') ||
      anyItem.badge.toLowerCase().includes('flash') ||
      anyItem.badge.toLowerCase().includes('diskon'))
  )
    return true;

  if (
    typeof anyItem.name === 'string' &&
    (anyItem.name.toLowerCase().includes('promo') ||
      anyItem.name.toLowerCase().includes('sale') ||
      anyItem.name.toLowerCase().includes('diskon'))
  )
    return true;

  if (
    typeof anyItem.status === 'string' &&
    (anyItem.status.toLowerCase().includes('promo') || anyItem.status.toLowerCase().includes('sale'))
  )
    return true;

  if (
    typeof anyItem.categoryTag === 'string' &&
    anyItem.categoryTag.toLowerCase().includes('promo')
  )
    return true;

  if (
    Array.isArray(anyItem.tags) &&
    anyItem.tags.some(
      (t) =>
        typeof t === 'string' &&
        (t.toLowerCase().includes('promo') ||
          t.toLowerCase().includes('sale') ||
          t.toLowerCase().includes('diskon'))
    )
  )
    return true;

  // 5. Explicitly treat CapCut products as promo items
  const nameStr = typeof anyItem.name === 'string' ? anyItem.name.toLowerCase() : '';
  const slugStr = typeof anyItem.slug === 'string' ? anyItem.slug.toLowerCase() : '';
  if (nameStr.includes('capcut') || slugStr.includes('capcut')) return true;

  return false;
}
