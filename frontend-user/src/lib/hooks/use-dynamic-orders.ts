'use client';

export interface PublicOrder {
  id: string;
  raw_id: string;
  product_name: string;
  items_summary: string;
  items_count: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  created_at?: string;
  createdAt?: string;
  customer_display: string;
  product_id?: string;
  product_sku?: string;
  process_estimate?: string;
  warranty_info?: string | null;
}

/**
 * Global Reference Epoch: Kamis, 15 Oktober 2026 00:00:00 WIB (14 Oktober 17:00:00 UTC)
 * Digunakan sebagai patokan waktu absolut agar seluruh browser (normal & incognito)
 * menghasilkan timeline simulasi yang 100% identik tanpa ketergantungan waktu mount.
 */
export const GLOBAL_SIMULATION_EPOCH = new Date('2026-10-15T00:00:00+07:00').getTime();

/**
 * Katalog produk aktif AsterraStore yang diaudit langsung dari backend/data/active-catalog.json.
 * Seluruh nama produk, varian, SKU, dan garansi resmi persis sesuai katalog nyata.
 */
export const ACTIVE_CATALOG_PRODUCTS = [
  {
    sku: 'vip-ytpreminvt1bln-s3',
    name: 'YouTube Premium Family Anggota 1 Bulan [Invite] [Garansi 1x]',
    warranty: 'Garansi 1x Invite Ulang',
  },
  {
    sku: 'vip-ntflxshare30dgar28d-s2',
    name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 28 Hari]',
    warranty: 'Garansi 28 Hari',
  },
  {
    sku: 'vip-ntflxshare30dgar14d-s2',
    name: 'Netflix Premium Shared 30 Hari [1 Profile] [Garansi 14 Hari]',
    warranty: 'Garansi 14 Hari',
  },
  {
    sku: 'prod-muniiqze-jyh0',
    name: 'Google AI Pro Private 18 Bulan [Garansi 1 Bulan]',
    warranty: 'Garansi 1 Bulan',
  },
  {
    sku: 'vip-capcutshared1bln-s2',
    name: 'CapCut Pro Shared 1 Bulan [1 Device - 2 User] [Garansi 7 Hari]',
    warranty: 'Garansi 7 Hari',
  },
  {
    sku: 'vip-bspremshrd1bln-s1',
    name: 'Bstation Premium Shared 1 Bulan [1 Device]',
    warranty: 'Garansi Resmi',
  },
  {
    sku: 'vip-viu1thngar1bln-s1',
    name: 'Viu Premium Private 1 Tahun [1 Device] [Garansi 1 Bulan]',
    warranty: 'Garansi 1 Bulan',
  },
  {
    sku: 'vip-wetvprivate1bln-s1',
    name: 'WeTV VIP Private 1 Bulan',
    warranty: 'Garansi Resmi',
  },
  {
    sku: 'vip-vidioplatmobprivate-s1',
    name: 'Vidio Premier Platinum Private 1 Bulan [Khusus Mobile]',
    warranty: 'Garansi Resmi',
  },
  {
    sku: 'vip-vidiosharedmbl1bln-s2',
    name: 'Vidio Premier Platinum Shared 1 Bulan [1 Device - 2 User] [Khusus Mobile]',
    warranty: 'Garansi Resmi',
  },
  {
    sku: 'vip-canvaanggota1bln-s1',
    name: 'Canva Pro Anggota 1 Bulan [Garansi 1 Bulan]',
    warranty: 'Garansi 1 Bulan',
  },
  {
    sku: 'vip-geminiprohead1thngar1bln-s2',
    name: 'Google Gemini Pro Head Invite 1 Tahun [5 Anggota] [5 TB GDrive] [Garansi 1 Bulan]',
    warranty: 'Garansi 1 Bulan',
  },
  {
    sku: 'vip-chatgptgo1thngar6b-s1',
    name: 'ChatGPT GO Private 1 Tahun [Garansi 6 Bulan]',
    warranty: 'Garansi 6 Bulan',
  },
  {
    sku: 'vip-chatgptplus1bgar28d-s1',
    name: 'ChatGPT Plus Private 1 Bulan [Garansi 28 Hari]',
    warranty: 'Garansi 28 Hari',
  },
  {
    sku: 'vip-iqiyishared-s1',
    name: 'iQIYI Premium Shared 1 Bulan',
    warranty: 'Garansi Resmi',
  },
];

/**
 * Daftar nama pelanggan samaran Indonesia yang bervariasi dengan pola M***u, D***s, A***a.
 */
export const MASKED_CUSTOMER_NAMES = [
  'D***s',
  'A***a',
  'F***n',
  'K***a',
  'S***a',
  'B***i',
  'M***y',
  'E***o',
  'T***o',
  'N***a',
  'Z***i',
  'R***n',
  'I***l',
  'P***a',
  'H***a',
  'V***o',
  'W***i',
  'Y***u',
  'L***a',
  'G***a',
  'O***n',
  'J***o',
  'C***a',
  'U***r',
];

/**
 * Fungsi hashing PRNG deterministik (Mulberry32-based).
 * Menghasilkan nilai float [0, 1) seragam dan 100% konsisten lintas browser & runtime JS.
 */
export function hashPRNG(seed: number, stream: number): number {
  let h = Math.imul(seed ^ 0x6d2b79f5, 0x9e3779b9) + stream * 0x85ebca6b;
  h = Math.imul(h ^ (h >>> 15), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 13), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Generator timeline simulasi deterministik global.
 * Menghitung gelombang pesanan (setiap 3–8 menit), pesanan dalam gelombang (jarak 1–10 menit),
 * serta siklus status independen dengan pembatasan maksimal 3 pesanan Processing:
 * - Menunggu Pembayaran -> Processing setelah 1–3 menit
 * - Processing -> Sukses setelah 10–30 menit sejak masuk Processing, ATAU dipercepat menjadi Sukses
 *   ketika slot Processing (maksimal 3) penuh dan ada pesanan baru yang masuk ke Processing.
 */
export function getDeterministicSimulationOrders(
  _now?: number,
  _maxOrders?: number
): PublicOrder[] {
  // Hardcoded simulation deactivated. Real database orders are the single source of truth.
  return [];
}

const LEGACY_STORAGE_KEYS = [
  'asterra_orders_dynamic_timeline_v5',
  'asterra_orders_dynamic_timeline_v4',
  'asterra_orders_dynamic_timeline_v3',
  'asterra_orders_dynamic_timeline_v2',
  'asterra_orders_dynamic_timeline_v1',
];

/**
 * Membersihkan seluruh key timeline simulasi lokal terdahulu
 * agar browser tidak menyimpan atau menampilkan order palsu / acak.
 */
export function clearLegacySyntheticTimelineStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors in restrictive environments
  }
}

/**
 * Parse tanggal secara aman dengan fallback ke waktu saat ini jika tidak valid
 */
export function parseSafeDate(dateString: string): Date {
  if (!dateString) return new Date();
  const normalized = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Format waktu relatif berbasis waktu sistem saat ini
 */
export function formatRelativeTime(dateStringOrTimestamp: string | number, nowMs: number = Date.now()): string {
  if (!dateStringOrTimestamp) return '-';
  const targetMs =
    typeof dateStringOrTimestamp === 'number'
      ? dateStringOrTimestamp
      : parseSafeDate(dateStringOrTimestamp).getTime();
  const diffInSeconds = Math.max(0, Math.floor((nowMs - targetMs) / 1000));

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' menit lalu';
  if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' jam lalu';
  return Math.floor(diffInSeconds / 86400) + ' hari lalu';
}
