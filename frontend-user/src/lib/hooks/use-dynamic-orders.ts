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
 * Visual Social-Proof Order Generator (Khusus /orders di frontend-user untuk menambah trust customer).
 * - Tidak dicatat ke database dan tidak mempengaruhi keuangan/laporan penjualan admin.
 * - Interval pesanan baru konsisten setiap 5–20 menit.
 * - Bersifat 100% deterministik global berbasis GLOBAL_SIMULATION_EPOCH.
 */
export function getDeterministicSimulationOrders(
  now: number = Date.now(),
  maxOrders: number = 150
): PublicOrder[] {
  let curTime = GLOBAL_SIMULATION_EPOCH;
  let orderIdx = 0;

  interface RawOrderCandidate {
    id: string;
    raw_id: string;
    product_name: string;
    items_summary: string;
    items_count: number;
    order_date: string;
    created_at: string;
    createdAt: string;
    customer_display: string;
    product_sku: string;
    warranty: string | null;
    _orderTime: number;
    _processingStartTime: number;
    _completedStartTime: number;
  }

  const rawCandidates: RawOrderCandidate[] = [];

  while (curTime <= now + 600000) {
    // Interval pesanan baru acak antara 5–20 menit (300.000 ms hingga 1.200.000 ms)
    const intervalMs = 300000 + Math.floor(hashPRNG(orderIdx, 1) * 900000);
    curTime += intervalMs;

    // Transisi status realistis:
    // Menunggu Pembayaran -> Processing: 1–3 menit
    const pendingDurationMs = 60000 + Math.floor(hashPRNG(orderIdx, 2) * 120000);
    // Processing -> Sukses: 8–20 menit
    const processingDurationMs = 480000 + Math.floor(hashPRNG(orderIdx, 3) * 720000);

    const processingStartTime = curTime + pendingDurationMs;
    const completedStartTime = processingStartTime + processingDurationMs;

    // Format tanggal WIB (UTC+7)
    const wibDate = new Date(curTime + 7 * 3600000);
    const yyyy = wibDate.getUTCFullYear();
    const mm = String(wibDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getUTCDate()).padStart(2, '0');
    const dateKey = `${yyyy}${mm}${dd}`;

    // ID unik visual format AST-ORD-YYYYMMDD-NNNN (cegah tabrakan dengan pesanan riil 7615)
    let orderNum = 1000 + Math.floor(hashPRNG(orderIdx, 4) * 8990);
    if (orderNum === 7615) orderNum = 7616;
    const id = `AST-ORD-${dateKey}-${orderNum}`;

    // Nama pelanggan samaran Indonesia realistis
    const customerIdx = Math.floor(hashPRNG(orderIdx, 5) * MASKED_CUSTOMER_NAMES.length);
    const customer_display = MASKED_CUSTOMER_NAMES[customerIdx];

    // Produk aktif dari katalog Asterra
    const productIdx = Math.floor(hashPRNG(orderIdx, 6) * ACTIVE_CATALOG_PRODUCTS.length);
    const product = ACTIVE_CATALOG_PRODUCTS[productIdx];

    const dateIso = new Date(curTime).toISOString();

    rawCandidates.push({
      id,
      raw_id: `vis-${orderIdx}`,
      product_name: product.name,
      items_summary: product.name,
      items_count: 1,
      order_date: dateIso,
      created_at: dateIso,
      createdAt: dateIso,
      customer_display,
      product_sku: product.sku,
      warranty: product.warranty,
      _orderTime: curTime,
      _processingStartTime: processingStartTime,
      _completedStartTime: completedStartTime,
    });

    orderIdx++;
  }

  // Filter pesanan yang sudah tercatat hingga saat ini (curTime <= now)
  const appearedOrders: PublicOrder[] = [];

  for (const candidate of rawCandidates) {
    if (candidate._orderTime <= now) {
      let status: PublicOrder['order_status'] = 'completed';
      if (now < candidate._processingStartTime) {
        status = 'pending';
      } else if (now < candidate._completedStartTime) {
        status = 'processing';
      }

      appearedOrders.push({
        id: candidate.id,
        raw_id: candidate.raw_id,
        product_name: candidate.product_name,
        items_summary: candidate.items_summary,
        items_count: candidate.items_count,
        order_status: status,
        status,
        order_date: candidate.order_date,
        created_at: candidate.created_at,
        createdAt: candidate.createdAt,
        customer_display: candidate.customer_display,
        product_sku: candidate.product_sku,
        process_estimate: status === 'processing' ? 'Estimasi 5-15 Menit' : undefined,
        warranty_info: status === 'completed' ? candidate.warranty : null,
      });
    }
  }

  // Urutkan dari pesanan yang paling baru ke terlama
  appearedOrders.sort((a, b) => {
    const timeA = new Date(a.order_date).getTime();
    const timeB = new Date(b.order_date).getTime();
    return timeB - timeA;
  });

  // Batasi maxOrders untuk riwayat pagination
  return appearedOrders.slice(0, maxOrders);
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
