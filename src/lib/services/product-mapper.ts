import { ProductItem } from '@/lib/products-data';
import { VipRawService } from './vip-reseller.service';

export interface MarginConfig {
  percentage: number; // e.g., 0.08 for 8%
  minFixedMargin: number; // e.g., 3000 for minimum Rp 3.000 profit
}

export const DEFAULT_MARGIN_CONFIG: MarginConfig = {
  percentage: 0.08, // 8% profit margin
  minFixedMargin: 2500, // Rp 2.500 minimal margin
};

/**
 * Format raw number to readable Indonesian Rupiah string
 */
export function formatRupiah(amount: number): string {
  if (amount >= 1000000) {
    const juta = amount / 1000000;
    return `Rp ${juta % 1 === 0 ? juta : juta.toFixed(1)} Jt`;
  }
  if (amount >= 1000) {
    const ribu = amount / 1000;
    return `Rp ${ribu % 1 === 0 ? ribu : ribu.toFixed(0)} Rb`;
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Calculates retail selling price:
 * Retail = Math.ceil((BasePrice * (1 + margin%) + minFixedMargin) / 1000) * 1000
 */
export function calculateSellingPrice(
  basePrice: number,
  config: MarginConfig = DEFAULT_MARGIN_CONFIG
): number {
  if (basePrice <= 0) return 0;
  const calculatedMargin = Math.max(
    basePrice * config.percentage,
    config.minFixedMargin
  );
  const rawPrice = basePrice + calculatedMargin;
  // Round up to nearest 500 or 1000 for clean consumer pricing
  return Math.ceil(rawPrice / 1000) * 1000;
}

/**
 * Map raw VIP Reseller service type/brand into Asterra Store category taxonomy
 */
export function mapCategory(
  type?: string,
  brand?: string,
  serviceName?: string
): { id: string; name: string } {
  const normalizedType = (type || '').toLowerCase();
  const normalizedBrand = (brand || '').toUpperCase();
  const normalizedName = (serviceName || '').toUpperCase();

  // 1. AI Tools (ChatGPT, Gemini, OpenAI, Claude, Midjourney, etc.)
  if (
    normalizedBrand.includes('GEMINI') ||
    normalizedBrand.includes('CHATGPT') ||
    normalizedBrand.includes('OPENAI') ||
    normalizedBrand.includes('CLAUDE') ||
    normalizedBrand.includes('MIDJOURNEY') ||
    normalizedName.includes('GEMINI') ||
    normalizedName.includes('CHATGPT') ||
    normalizedName.includes('CHAT GPT') ||
    normalizedName.includes('OPENAI') ||
    normalizedName.includes('CLAUDE') ||
    normalizedType.includes('ai')
  ) {
    return { id: 'cat-ai-tools', name: 'AI Tools' };
  }

  // 2. Apps & Streaming (Sisanya)
  if (
    normalizedType.includes('streaming') ||
    normalizedType.includes('app') ||
    normalizedBrand.includes('ALIGHT MOTION') ||
    normalizedBrand.includes('AMAZON') ||
    normalizedBrand.includes('PRIME VIDEO') ||
    normalizedBrand.includes('BSTATION') ||
    normalizedBrand.includes('CANVA') ||
    normalizedBrand.includes('CAPCUT') ||
    normalizedBrand.includes('IQIYI') ||
    normalizedBrand.includes('SPOTIFY') ||
    normalizedBrand.includes('VIDIO') ||
    normalizedBrand.includes('VISION') ||
    normalizedBrand.includes('VIU') ||
    normalizedBrand.includes('WETV') ||
    normalizedBrand.includes('YOUTUBE') ||
    normalizedBrand.includes('NETFLIX') ||
    normalizedBrand.includes('DISNEY')
  ) {
    return { id: 'cat-apps-streaming', name: 'Apps & Streaming' };
  }

  if (
    normalizedType.includes('game') ||
    normalizedBrand.includes('MOBILE LEGENDS') ||
    normalizedBrand.includes('FREE FIRE') ||
    normalizedBrand.includes('STEAM') ||
    normalizedBrand.includes('GENSHIN') ||
    normalizedBrand.includes('VALORANT')
  ) {
    return { id: 'cat-games', name: 'Voucher Game' };
  }

  if (
    normalizedType.includes('emoney') ||
    normalizedBrand.includes('DANA') ||
    normalizedBrand.includes('GOPAY') ||
    normalizedBrand.includes('OVO') ||
    normalizedBrand.includes('SHOPEEPAY')
  ) {
    return { id: 'cat-emoney', name: 'Saldo E-Money' };
  }

  if (
    normalizedType.includes('internet') ||
    normalizedType.includes('data')
  ) {
    return { id: 'cat-data', name: 'Paket Data & Internet' };
  }

  if (normalizedType.includes('pulsa')) {
    return { id: 'cat-pulsa', name: 'Pulsa Reguler' };
  }

  if (normalizedType.includes('pln')) {
    return { id: 'cat-pln', name: 'Token Listrik PLN' };
  }

  return { id: 'cat-digital-services', name: 'Layanan Digital' };
}

/**
 * Default product banner visual used for any product without custom banner image
 */
export const DEFAULT_PRODUCT_BANNER = '/images/default-product-banner.png';

/**
 * Provides default product visual banner (replaces external unsplash fallbacks)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getProductImageUrl(..._args: unknown[]): string {
  return DEFAULT_PRODUCT_BANNER;
}

/**
 * Transform raw VIP Reseller service item to Asterra Store ProductItem
 */
export function mapVipServiceToProduct(
  raw: VipRawService,
  marginConfig?: MarginConfig
): ProductItem | null {
  if (!raw.code || !raw.name) return null;

  // Extract base price
  let basePrice = 0;
  if (typeof raw.price === 'object' && raw.price !== null) {
    basePrice = raw.price.basic || raw.price.premium || 0;
  } else if (typeof raw.price === 'number') {
    basePrice = raw.price;
  }

  if (basePrice <= 0) return null;

  const sellingPrice = calculateSellingPrice(basePrice, marginConfig);
  const category = mapCategory(raw.type, raw.brand);
  const status: 'active' | 'out_of_stock' =
    raw.status === 'available' ? 'active' : 'out_of_stock';

  const features: string[] = [
    `Brand: ${raw.brand || 'Digital'}`,
    `Tipe: ${raw.type || 'Layanan Resmi'}`,
    `Kode Layanan: ${raw.code}`,
    raw.note && raw.note !== '-' ? `Catatan: ${raw.note}` : 'Proses aktivasi cepat & otomatis',
  ];

  return {
    id: `vip-${raw.code.toLowerCase().replace(/[^a-z0-9_-]/g, '-')}`,
    name: raw.name,
    category,
    price: sellingPrice,
    priceFormatted: formatRupiah(sellingPrice),
    description:
      raw.note && raw.note !== '-'
        ? `${raw.name}. ${raw.note}`
        : `${raw.name} - Layanan digital resmi terverifikasi dengan aktivasi instan.`,
    features,
    status,
    imageUrl: getProductImageUrl(raw.brand, raw.type),
    popular: raw.status === 'available' && raw.type === 'streaming-tv',
  };
}
