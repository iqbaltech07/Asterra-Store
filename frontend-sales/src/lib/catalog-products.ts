/**
 * Authentic AsterraStore Product Catalog
 * Source of Truth: Asterra Store Business Model v2.0 (model-bisnis.md) & Active Catalog
 * Used for public sales simulator and educational projections.
 *
 * DATA PROTECTION:
 * Internal provider costs (providerPrice) and profit margins (profitMargin)
 * are strictly removed from public and client bundles to maintain confidential
 * store financials while preserving accurate commission projections.
 */

export interface SimulatedProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  baseCommission: number; // Estimasi komisi standar 30% dari profit transaksi resmi (Model Bisnis v2.0)
  isCommissionEligible?: boolean;
  brand?: string;
  popular?: boolean;
}

/**
 * Curated list of active, authentic AsterraStore products with verified base commissions.
 * Base Commission = 30% of authentic transaction profit (Model Bisnis v2.0 SSOT).
 */
export const AUTHENTIC_CATALOG_PRODUCTS: SimulatedProduct[] = [
  {
    id: 'prod-muniiqze-jyh0',
    name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 57000,
    baseCommission: 13080,
    isCommissionEligible: true,
    brand: 'Google AI',
    popular: true,
  },
  {
    id: 'vip-capcutprivate30d-s1',
    name: 'CapCut Pro Private 30 Hari [Garansi 25 Hari] [Reg Indonesia]',
    category: 'Apps & Streaming',
    price: 63900,
    baseCommission: 8970,
    isCommissionEligible: true,
    brand: 'CapCut',
    popular: true,
  },
  {
    id: 'vip-canvaedu1thn-s1',
    name: 'Canva Education 1 Tahun [Garansi 6 Bulan]',
    category: 'Apps & Streaming',
    price: 26900,
    baseCommission: 4620,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: true,
  },
  {
    id: 'vip-chatgptplus1bgar28d-s1',
    name: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]',
    category: 'AI Tools',
    price: 95900,
    baseCommission: 14670,
    isCommissionEligible: true,
    brand: 'ChatGPT',
    popular: true,
  },
  {
    id: 'vip-chatgptgo1thngar1b-s1',
    name: 'ChatGPT GO Private 1 Tahun [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 42900,
    baseCommission: 6870,
    isCommissionEligible: true,
    brand: 'ChatGPT',
    popular: true,
  },
  {
    id: 'vip-geminiprohead1thngar3bln-s2',
    name: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 3 Bulan]',
    category: 'AI Tools',
    price: 105900,
    baseCommission: 13770,
    isCommissionEligible: true,
    brand: 'Gemini AI',
    popular: true,
  },
  {
    id: 'vip-geminiproinvt1thngar1bln-s2',
    name: 'Google Gemini Pro Anggota 1 Tahun [5 TB GDrive] [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 31900,
    baseCommission: 5670,
    isCommissionEligible: true,
    brand: 'Gemini AI',
    popular: false,
  },
  {
    id: 'prod-1793407128733',
    name: 'ZOOM - 30 HARI [AKUN DARI KAMI]',
    category: 'Apps & Streaming',
    price: 20000,
    baseCommission: 4050,
    isCommissionEligible: true,
    brand: 'Zoom',
    popular: true,
  },
  {
    id: 'prod-1793362358291',
    name: 'YOUTUBE FAMHEAD - 1 BULAN - PRIVATE [ AKUN ANDA ]',
    category: 'Apps & Streaming',
    price: 23000,
    baseCommission: 4350,
    isCommissionEligible: true,
    brand: 'YouTube',
    popular: true,
  },
  {
    id: 'vip-ytpreminvt1bln-s3',
    name: 'YouTube Premium Family Anggota 1 Bulan [Invite] [Garansi 1x]',
    category: 'Apps & Streaming',
    price: 18000,
    baseCommission: 2700,
    isCommissionEligible: true,
    brand: 'YouTube',
    popular: true,
  },
  {
    id: 'vip-ntflxshare30dgar14d-s2',
    name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 14 Hari]',
    category: 'Apps & Streaming',
    price: 20000,
    baseCommission: 1950,
    isCommissionEligible: true,
    brand: 'Netflix',
    popular: true,
  },
  {
    id: 'vip-canvaanggota1bln-s1',
    name: 'Canva Pro Anggota 1 Bulan [Garansi 1 Bulan]',
    category: 'Apps & Streaming',
    price: 6900,
    baseCommission: 1680,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: false,
  },
  {
    id: 'vip-canvadesainer1bln-s1',
    name: 'Canva Pro Desainer 1 Bulan [Garansi 1 Bulan]',
    category: 'Apps & Streaming',
    price: 9900,
    baseCommission: 2280,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: false,
  },
  {
    id: 'vip-alightmotionpriv1thn-s1',
    name: 'Alight Motion Pro Private 1 Tahun [Garansi 3 Bulan]',
    category: 'Apps & Streaming',
    price: 15900,
    baseCommission: 3270,
    isCommissionEligible: true,
    brand: 'Alight Motion',
    popular: false,
  },
];

/**
 * Format a numeric amount to Indonesian Rupiah representation (e.g. Rp 45.000 or -Rp 5.000)
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const rounded = Math.round(amount);
  if (rounded < 0) {
    return '-Rp ' + Math.abs(rounded).toLocaleString('id-ID');
  }
  return 'Rp ' + rounded.toLocaleString('id-ID');
}
