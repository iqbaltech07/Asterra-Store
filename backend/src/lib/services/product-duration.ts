/**
 * Helper utility to extract accurate duration, package details, and warranty
 * from product metadata and supplier naming patterns.
 */

export interface ProductDurationOption {
  id: string;
  label: string;
  price: number;
  multiplier: number;
}

export interface ParsedProductSpecs {
  durations: ProductDurationOption[];
  primaryDurationLabel: string;
  warranty: string;
}

export function parseProductDurations(product: {
  name: string;
  price: number;
  providerCode?: string;
  category?: { id: string; name: string };
}): ParsedProductSpecs {
  const name = product.name || '';
  const code = product.providerCode || '';
  const text = `${name} ${code}`.toLowerCase();

  // 1. Detect Warranty from Product Name (e.g. [ Garansi 6 Bulan ], [ Garansi 12 Bulan ], [ Garansi 1 Bulan ])
  let warranty = 'Garansi Penuh Selama Masa Aktif';
  const warrantyMatch = name.match(/garansi\s+(\d+\s*(?:bulan|hari|tahun)|lifetime)/i);
  if (warrantyMatch) {
    warranty = `${warrantyMatch[1].trim()} (Garansi Penuh)`;
  }

  // 2. Detect Duration from Product Name and Supplier Code
  let durationId = 'standard';
  let durationLabel = 'Masa Aktif Penuh';

  if (/\blifetime\b|\bpermanen\b/i.test(text)) {
    durationId = 'lifetime';
    durationLabel = 'Lifetime (Masa Aktif Permanen)';
  } else if (/\b(1\s*tahun|1\s*thn|12\s*bulan|12\s*bln|365\s*hari|360\s*hari)\b/i.test(text)) {
    durationId = '1_year';
    durationLabel = '1 Tahun (Masa Aktif Penuh)';
  } else if (/\b(6\s*bulan|6\s*bln|180\s*hari)\b/i.test(text)) {
    durationId = '6_months';
    durationLabel = '6 Bulan';
  } else if (/\b(3\s*bulan|3\s*bln|90\s*hari)\b/i.test(text)) {
    durationId = '3_months';
    durationLabel = '3 Bulan';
  } else if (/\b(2\s*bulan|2\s*bln|60\s*hari)\b/i.test(text)) {
    durationId = '2_months';
    durationLabel = '2 Bulan';
  } else if (/\b(1\s*bulan|1\s*bln|30\s*hari)\b/i.test(text)) {
    durationId = '1_month';
    durationLabel = '1 Bulan';
  } else if (/\b(7\s*hari|1\s*minggu)\b/i.test(text)) {
    durationId = '7_days';
    durationLabel = '7 Hari';
  } else if (product.category?.id === 'cat-games') {
    durationId = 'instant_topup';
    durationLabel = 'Top Up Instan Langsung Masuk';
  } else if (
    product.category?.id === 'cat-emoney' ||
    product.category?.id === 'cat-pln' ||
    product.category?.id === 'cat-pulsa'
  ) {
    durationId = 'instant_credit';
    durationLabel = 'Pengisian Saldo Instan';
  }

  return {
    durations: [
      {
        id: durationId,
        label: durationLabel,
        price: product.price,
        multiplier: 1,
      },
    ],
    primaryDurationLabel: durationLabel,
    warranty,
  };
}
