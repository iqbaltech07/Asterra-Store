/**
 * Presentation-layer dummy original price helper for Promo products.
 *
 * This utility operates strictly on the UI/presentation layer and does NOT
 * modify actual prices in the database, API responses, or backend calculation.
 *
 * It generates a realistic, higher anchor price (originalPrice > currentPrice)
 * formatted in Indonesian Rupiah with a clean, rounded figure.
 */

export interface PromoPriceResult {
  isPromo: boolean;
  originalPrice: number;
  originalPriceFormatted: string;
  currentPrice: number;
  currentPriceFormatted: string;
}

/**
 * Generate a realistic dummy original price that is strictly greater than current price.
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
 * Accepts any product object structure safely.
 */
export function isPromoItem(item?: unknown): boolean {
  if (!item || typeof item !== 'object') return false;
  const anyItem = item as Record<string, unknown>;
  if (anyItem.isPromo === true) return true;
  if (typeof anyItem.badgeLabel === 'string' && anyItem.badgeLabel.toLowerCase().includes('promo')) return true;
  if (typeof anyItem.badge === 'string' && anyItem.badge.toLowerCase().includes('promo')) return true;
  if (typeof anyItem.status === 'string' && anyItem.status.toLowerCase().includes('promo')) return true;
  if (typeof anyItem.categoryTag === 'string' && anyItem.categoryTag.toLowerCase().includes('promo')) return true;
  if (Array.isArray(anyItem.tags) && anyItem.tags.some((t) => typeof t === 'string' && t.toLowerCase().includes('promo'))) return true;
  return false;
}

