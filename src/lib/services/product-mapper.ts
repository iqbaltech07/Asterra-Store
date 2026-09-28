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
  brand?: string
): { id: string; name: string } {
  const normalizedType = (type || '').toLowerCase();
  const normalizedBrand = (brand || '').toUpperCase();

  // 1. Apps & Streaming (Exact category from VIP Reseller)
  if (
    normalizedType.includes('streaming') ||
    normalizedType.includes('app') ||
    normalizedBrand.includes('ALIGHT MOTION') ||
    normalizedBrand.includes('AMAZON') ||
    normalizedBrand.includes('PRIME VIDEO') ||
    normalizedBrand.includes('BSTATION') ||
    normalizedBrand.includes('CANVA') ||
    normalizedBrand.includes('CAPCUT') ||
    normalizedBrand.includes('GEMINI') ||
    normalizedBrand.includes('CHATGPT') ||
    normalizedBrand.includes('OPENAI') ||
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
 * Provides curated image URLs based on brand/category
 */
export function getProductImageUrl(brand?: string, type?: string): string {
  const b = (brand || '').toUpperCase();
  const t = (type || '').toLowerCase();

  // Apps & Streaming specific branded visuals
  if (b.includes('GEMINI')) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('CANVA')) {
    return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('CAPCUT')) {
    return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('ALIGHT MOTION')) {
    return 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('SPOTIFY')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('YOUTUBE')) {
    return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('AMAZON') || b.includes('PRIME')) {
    return 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('BSTATION') || b.includes('VIU') || b.includes('WETV') || b.includes('IQIYI')) {
    return 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('VIDIO') || b.includes('VISION')) {
    return 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80';
  }
  if (b.includes('K-VISION') || b.includes('NEX PARABOLA') || t.includes('streaming')) {
    return 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('game') || b.includes('STEAM') || b.includes('FREE FIRE')) {
    return 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('emoney') || b.includes('DANA') || b.includes('GOPAY')) {
    return 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80';
  }
  if (t.includes('internet') || t.includes('pulsa')) {
    return 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
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
