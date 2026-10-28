/**
 * Authentic AsterraStore Product Catalog
 * Source of Truth: data/active-catalog.json & backend/docs/asterra-referral-profit-model.md
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
  baseCommission: number; // Estimasi komisi standar 15% dari transaksi profit resmi
  isCommissionEligible?: boolean;
  brand?: string;
  popular?: boolean;
}

/**
 * Curated list of active, authentic AsterraStore products with verified base commissions.
 * Base Commission = 15% of authentic transaction profit (Sales Pemula Standard Tier).
 */
export const AUTHENTIC_CATALOG_PRODUCTS: SimulatedProduct[] = [
  {
    id: 'vip-canvaedu1thn-s1',
    name: 'Canva Education 1 Tahun [Garansi 6 Bulan]',
    category: 'Apps & Streaming',
    price: 26900,
    baseCommission: 2310,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: true,
  },
  {
    id: 'vip-chatgptplus1bgar28d-s1',
    name: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]',
    category: 'AI Tools',
    price: 95900,
    baseCommission: 7335,
    isCommissionEligible: true,
    brand: 'ChatGPT',
    popular: true,
  },
  {
    id: 'vip-ntflxshare30dgar28d-s2',
    name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 28 Hari]',
    category: 'Apps & Streaming',
    price: 25000,
    baseCommission: 750,
    isCommissionEligible: true,
    brand: 'Netflix',
    popular: true,
  },
  {
    id: 'vip-canvaanggota1bln-s1',
    name: 'Canva Pro Anggota 1 Bulan [Garansi 1 Bulan]',
    category: 'Apps & Streaming',
    price: 6900,
    baseCommission: 840,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: true,
  },
  {
    id: 'vip-ytpreminvt1bln-s3',
    name: 'YouTube Premium Family Anggota 1 Bulan [Invite] [Garansi 1x]',
    category: 'Apps & Streaming',
    price: 18000,
    baseCommission: 1350,
    isCommissionEligible: true,
    brand: 'YouTube',
    popular: true,
  },
  {
    id: 'vip-capcutprivate30d-s1',
    name: 'CapCut Pro Private 30 Hari [Garansi 25 Hari] [Reg Indonesia]',
    category: 'Apps & Streaming',
    price: 63900,
    baseCommission: 4485,
    isCommissionEligible: true,
    brand: 'CapCut',
    popular: true,
  },
  {
    id: 'vip-chatgptgo1thngar1b-s1',
    name: 'ChatGPT GO Private 1 Tahun [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 42900,
    baseCommission: 3435,
    isCommissionEligible: true,
    brand: 'ChatGPT',
    popular: true,
  },
  {
    id: 'vip-geminiprohead1thngar3bln-s2',
    name: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 3 Bulan]',
    category: 'AI Tools',
    price: 105900,
    baseCommission: 6885,
    isCommissionEligible: true,
    brand: 'Gemini AI',
    popular: true,
  },
  {
    id: 'prod-muniiqze-jyh0',
    name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 89900,
    baseCommission: 12060,
    isCommissionEligible: true,
    brand: 'Google AI',
    popular: false,
  },
  {
    id: 'vip-canvadesainer1bln-s1',
    name: 'Canva Pro Desainer 1 Bulan [Garansi 1 Bulan]',
    category: 'Apps & Streaming',
    price: 9900,
    baseCommission: 1140,
    isCommissionEligible: true,
    brand: 'Canva',
    popular: false,
  },
  {
    id: 'vip-alightmotionpriv1thn-s1',
    name: 'Alight Motion Pro Private 1 Tahun [Garansi 3 Bulan]',
    category: 'Apps & Streaming',
    price: 15900,
    baseCommission: 1635,
    isCommissionEligible: true,
    brand: 'Alight Motion',
    popular: false,
  },
  {
    id: 'vip-geminiproinvt1thngar1bln-s2',
    name: 'Google Gemini Pro Anggota 1 Tahun [5 TB GDrive] [Garansi 1 Bulan]',
    category: 'AI Tools',
    price: 31900,
    baseCommission: 2835,
    isCommissionEligible: true,
    brand: 'Gemini AI',
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

