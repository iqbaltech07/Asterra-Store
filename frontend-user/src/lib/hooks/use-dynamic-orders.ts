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
 * Global Reference Epoch: Rabu, 28 Oktober 2026 00:00:00 WIB (27 Oktober 17:00:00 UTC)
 * Digunakan sebagai patokan waktu absolut agar seluruh browser (normal & incognito)
 * menghasilkan timeline simulasi yang 100% identik tanpa ketergantungan waktu mount.
 */
export const GLOBAL_SIMULATION_EPOCH = new Date('2026-10-28T00:00:00+07:00').getTime();

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
 * Pool nama depan dan belakang Indonesia yang kaya untuk generator nama tersamar dinamis.
 */
export const INDONESIAN_FIRST_NAMES = [
  'Ahmad', 'Aditya', 'Agus', 'Aldi', 'Alvin', 'Andi', 'Andre', 'Angga', 'Anisa', 'Arif',
  'Arya', 'Ayu', 'Bagus', 'Bambang', 'Bayu', 'Bima', 'Budi', 'Chandra', 'Citra', 'Danang',
  'Dedi', 'Denny', 'Devi', 'Dewi', 'Dian', 'Diki', 'Dimas', 'Dina', 'Doni', 'Dwi',
  'Eka', 'Eko', 'Fajar', 'Fandi', 'Farhan', 'Fauzan', 'Febri', 'Fikri', 'Galih', 'Gilang',
  'Gita', 'Hadi', 'Hafiz', 'Hendra', 'Hesti', 'Ilham', 'Indah', 'Indra', 'Intan', 'Irfan',
  'Kurnia', 'Lestari', 'Lukman', 'Mega', 'Maya', 'Maulana', 'Mita', 'Muhammad', 'Nabila', 'Nanda',
  'Novita', 'Nugroho', 'Nur', 'Panji', 'Permana', 'Pratama', 'Putra', 'Putri', 'Raden', 'Rafi',
  'Rahma', 'Rahmat', 'Rama', 'Randi', 'Rangga', 'Reza', 'Rian', 'Rifki', 'Riko', 'Rio',
  'Riri', 'Riska', 'Rizky', 'Roni', 'Ryan', 'Sandi', 'Satria', 'Septian', 'Sinta', 'Siti',
  'Surya', 'Taufik', 'Teguh', 'Tiara', 'Tri', 'Wahyu', 'Wawan', 'Widia', 'Winda', 'Yoga',
  'Yogi', 'Yuda', 'Yudi', 'Yulia', 'Yusuf', 'Zaki', 'Zahra', 'Zul',
];

export const INDONESIAN_LAST_NAMES = [
  'Abadi', 'Akbar', 'Alamsyah', 'Anggoro', 'Anshori', 'Ardiansyah', 'Arianto', 'Ariyanto', 'Ashari', 'Asyari',
  'Budiman', 'Cahyono', 'Darmawan', 'Effendi', 'Fachrezi', 'Fadillah', 'Fauzi', 'Firmansyah', 'Gunawan', 'Hakim',
  'Hamzah', 'Handayani', 'Hardiansyah', 'Hartanto', 'Hasan', 'Hasanah', 'Hasibuan', 'Hidayat', 'Hidayatullah', 'Ibrahim',
  'Irawan', 'Iskandar', 'Jaelani', 'Kamil', 'Kurniawan', 'Kusuma', 'Laksamana', 'Lubis', 'Mahardika', 'Mahendra',
  'Mansyur', 'Marpaung', 'Maulana', 'Mubarok', 'Mulyadi', 'Munandar', 'Nasution', 'Nugraha', 'Nugroho', 'Nurcahyo',
  'Pambudi', 'Pamungkas', 'Pangestu', 'Pasaribu', 'Permana', 'Pradana', 'Prakoso', 'Prasetya', 'Prasetyo', 'Pratama',
  'Prayoga', 'Purnomo', 'Purwanto', 'Puspasari', 'Putra', 'Putri', 'Qodir', 'Rachman', 'Raditya', 'Rahardjo',
  'Rahman', 'Ramadhan', 'Rasyid', 'Ridwan', 'Riyadi', 'Rosadi', 'Rusli', 'Safitri', 'Saleh', 'Santoso',
  'Saputra', 'Saputri', 'Sari', 'Sasmita', 'Setiawan', 'Sihombing', 'Siregar', 'Subagyo', 'Sudrajat', 'Sugeng',
  'Suharto', 'Sukoco', 'Sulaiman', 'Sumantri', 'Supriyadi', 'Suryadi', 'Susanto', 'Sutanto', 'Sutrisno', 'Syahputra',
  'Tanoto', 'Tanjung', 'Tarigan', 'Triyono', 'Utama', 'Utami', 'Wardhana', 'Wibawa', 'Wibowo', 'Wicaksono',
  'Widagdo', 'Widodo', 'Wijaya', 'Winata', 'Wirawan', 'Wulandari', 'Yudha', 'Yulianto', 'Yunani', 'Zulkarnain',
];

/**
 * Kompatibilitas mundur dengan daftar nama legacy
 */
export const MASKED_CUSTOMER_NAMES = [
  'D***s', 'A***a', 'F***n', 'K***a', 'S***a', 'B***i', 'M***y', 'E***o', 'T***o', 'N***a',
  'Z***i', 'R***n', 'I***l', 'P***a', 'H***a', 'V***o', 'W***i', 'Y***u', 'L***a', 'G***a',
  'O***n', 'J***o', 'C***a', 'U***r',
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
 * Menghasilkan nama pelanggan tersamar yang sepenuhnya dinamis, natural, dan variatif
 * dengan kombinasi >100.000 kemungkinan gaya dan format tanpa pola berulang monoton.
 */
export function generateMaskedCustomerName(seed: number): string {
  const fIdx = Math.floor(hashPRNG(seed, 101) * INDONESIAN_FIRST_NAMES.length);
  const lIdx = Math.floor(hashPRNG(seed, 102) * INDONESIAN_LAST_NAMES.length);
  const firstName = INDONESIAN_FIRST_NAMES[fIdx];
  const lastName = INDONESIAN_LAST_NAMES[lIdx];
  const style = Math.floor(hashPRNG(seed, 103) * 10);

  switch (style) {
    case 0:
      // Misal: "Dimas P***"
      return `${firstName} ${lastName.charAt(0)}***`;
    case 1:
      // Misal: "D*** Pratama"
      return `${firstName.charAt(0)}*** ${lastName}`;
    case 2:
      // Misal: "Dimas P."
      return `${firstName} ${lastName.charAt(0)}.`;
    case 3:
      // Misal: "D. Pratama"
      return `${firstName.charAt(0)}. ${lastName}`;
    case 4:
      // Misal: "Dim*** P***"
      return `${firstName.slice(0, 3)}*** ${lastName.charAt(0)}***`;
    case 5:
      // Misal: "D***s P***a"
      return `${firstName.charAt(0)}***${firstName.slice(-1)} ${lastName.charAt(0)}***${lastName.slice(-1)}`;
    case 6:
      // Misal: "Dimas P***a"
      return `${firstName} ${lastName.charAt(0)}***${lastName.slice(-1)}`;
    case 7:
      // Misal: "D*** Pra***"
      return `${firstName.charAt(0)}*** ${lastName.slice(0, 3)}***`;
    case 8:
      // Misal: "Dimas***"
      return `${firstName}***`;
    case 9:
    default: {
      // Misal: "dimas_***28" atau "dimas***82"
      const num = 10 + Math.floor(hashPRNG(seed, 104) * 89);
      const isUnderscore = hashPRNG(seed, 105) > 0.5;
      return isUnderscore
        ? `${firstName.toLowerCase()}_***${num}`
        : `${firstName.toLowerCase()}***${num}`;
    }
  }
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
    is_cancelled: boolean;
    process_estimate: string;
    _orderTime: number;
    _processingStartTime: number;
    _completedStartTime: number;
    _cancelTime: number;
  }

  const rawCandidates: RawOrderCandidate[] = [];

  while (curTime <= now + 600000) {
    // Interval pesanan baru acak antara 5–20 menit (300.000 ms hingga 1.200.000 ms)
    const intervalMs = 300000 + Math.floor(hashPRNG(orderIdx, 1) * 900000);
    curTime += intervalMs;

    // Status batal terjadi sangat sedikit (~1% dari seluruh pesanan)
    const isCancelled = hashPRNG(orderIdx, 7) < 0.01;

    // Tahap 1: Menunggu Pembayaran (Pending)
    // Berlangsung 1 - 3 menit sebelum dibayar (atau 2 - 8 menit sebelum kedaluwarsa jika batal)
    const pendingDurationMs = isCancelled
      ? 120000 + Math.floor(hashPRNG(orderIdx, 2) * 360000)
      : 60000 + Math.floor(hashPRNG(orderIdx, 2) * 120000);

    // Tahap 2: Di Proses (Processing) -> (jeda 1 menit - 35 menit)
    // Jeda di atas 10 menit jarang terjadi (hanya ~2% dari data)
    const isRareLongProcessing = hashPRNG(orderIdx, 8) < 0.02;
    let processingDurationMs: number;
    let processEstimate: string;

    if (isRareLongProcessing) {
      // 2% kasus: jeda 10 menit hingga 35 menit (600.000 ms - 2.100.000 ms)
      processingDurationMs = 600000 + Math.floor(hashPRNG(orderIdx, 3) * 1500000);
      processEstimate = 'Estimasi 10-35 Menit';
    } else {
      // 98% kasus: jeda cepat 1 menit hingga 10 menit (60.000 ms - 600.000 ms)
      processingDurationMs = 60000 + Math.floor(hashPRNG(orderIdx, 3) * 540000);
      processEstimate = 'Estimasi 1-10 Menit';
    }

    const processingStartTime = curTime + pendingDurationMs;
    const completedStartTime = processingStartTime + processingDurationMs;
    const cancelTime = curTime + pendingDurationMs;

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

    // Nama pelanggan samaran Indonesia yang dinamis dan bervariasi acak (tanpa pola konstan berulang)
    const customer_display = generateMaskedCustomerName(orderIdx);

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
      is_cancelled: isCancelled,
      process_estimate: processEstimate,
      _orderTime: curTime,
      _processingStartTime: processingStartTime,
      _completedStartTime: completedStartTime,
      _cancelTime: cancelTime,
    });

    orderIdx++;
  }

  // Filter pesanan yang sudah tercatat hingga saat ini (curTime <= now)
  const appearedOrders: PublicOrder[] = [];

  for (const candidate of rawCandidates) {
    if (candidate._orderTime <= now) {
      let status: PublicOrder['order_status'] = 'completed';

      if (candidate.is_cancelled) {
        // Melalui tahap pending (menunggu pembayaran) sebelum akhirnya batal
        if (now < candidate._cancelTime) {
          status = 'pending';
        } else {
          status = 'cancelled';
        }
      } else {
        // Alur normal: Menunggu Pembayaran -> Di Proses -> Selesai
        if (now < candidate._processingStartTime) {
          status = 'pending';
        } else if (now < candidate._completedStartTime) {
          status = 'processing';
        } else {
          status = 'completed';
        }
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
        process_estimate: status === 'processing' ? candidate.process_estimate : undefined,
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
