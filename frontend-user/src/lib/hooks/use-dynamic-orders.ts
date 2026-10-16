'use client';

import { useState, useEffect, useMemo, useRef } from 'react';

export interface PublicOrder {
  id: string;
  raw_id: string;
  product_name: string;
  items_summary: string;
  items_count: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  customer_display: string;
}

export interface DynamicActivity {
  id: string;
  raw_id: string;
  product_name: string;
  items_summary: string;
  items_count: number;
  customer_display: string;
  startTime: number;        // Epoch timestamp (Date.now()) saat aktivitas dimulai
  totalDurationMs: number;  // Total durasi antara 3–8 menit (180.000 - 480.000 ms)
  transitionMs: number;     // Waktu transisi dari Processing ke Sukses (sebelum totalDurationMs berakhir)
  productIndex: number;
}

export interface ProcessedOrder extends PublicOrder {
  effectiveStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  isDynamicActivity: boolean;
  processingProgressPercent?: number;
  remainingProcessingSeconds?: number;
  effectiveDate: string;
}

const STORAGE_KEY = 'asterra_orders_dynamic_timeline_v2';
export const MIN_TOTAL_DURATION_MS = 3 * 60 * 1000; // 3 menit (180.000 ms)
export const MAX_TOTAL_DURATION_MS = 8 * 60 * 1000; // 8 menit (480.000 ms)
export const UPDATE_INTERVAL_MS = 3000;             // 3 detik interval agar halaman tetap ringan

export interface DemoProductTemplate {
  name: string;
  items_summary: string;
  items_count: number;
}

export const DEMO_PRODUCTS: DemoProductTemplate[] = [
  {
    name: 'Netflix Premium UHD 4K (1 Bulan Private)',
    items_summary: 'Netflix Premium UHD 4K [1 Akun Private 4 Profil]',
    items_count: 1,
  },
  {
    name: 'Spotify Premium Individual (3 Bulan)',
    items_summary: 'Spotify Premium Individual Resmi [Garansi Full]',
    items_count: 1,
  },
  {
    name: 'ChatGPT Plus Shared License (1 Bulan)',
    items_summary: 'ChatGPT Plus GPT-4o & Canvas Shared Access',
    items_count: 1,
  },
  {
    name: 'Canva Pro Edu Lifetime Private',
    items_summary: 'Canva Pro Private Invite Email [Garansi Selamanya]',
    items_count: 1,
  },
  {
    name: 'YouTube Premium Family Plan (1 Bulan)',
    items_summary: 'YouTube Music & Premium No Ads Family Invite',
    items_count: 1,
  },
  {
    name: 'Disney+ Hotstar VIP Premium (1 Bulan)',
    items_summary: 'Disney+ Hotstar VIP Private Screen Full HD',
    items_count: 1,
  },
  {
    name: 'CapCut Pro Private 30 Hari [Reg Indonesia]',
    items_summary: 'CapCut Pro Desktop & Mobile Cloud 100GB',
    items_count: 1,
  },
  {
    name: 'Midjourney Standard Shared Plan (1 Bulan)',
    items_summary: 'Midjourney Fast Hours Shared Discord Access',
    items_count: 1,
  },
  {
    name: 'Claude Pro Shared License (1 Bulan)',
    items_summary: 'Anthropic Claude Pro Artifacts Access',
    items_count: 1,
  },
  {
    name: 'Gramedia Digital Full Access (1 Bulan)',
    items_summary: 'Paket Premium Gramedia Digital Majalah & Buku',
    items_count: 1,
  },
];

const DEMO_CUSTOMERS = [
  'Pelanggan Demo #A12',
  'Pengguna Demo (ID-38)',
  'Pelanggan Demo #B45',
  'Pengguna Demo (ID-71)',
  'Pelanggan Demo #C29',
  'Pengguna Demo (ID-54)',
  'Pelanggan Demo #D88',
  'Pengguna Demo (ID-92)',
];

/**
 * Menghasilkan total durasi bervariasi antara 3–8 menit (180.000 - 480.000 ms)
 * Memastikan durasi tidak selalu sama dengan durasi sebelumnya
 */
export function getRandomTotalDuration(previousDuration?: number): number {
  const options = [3, 4, 5, 6, 7, 8];
  const filtered = previousDuration ? options.filter((o) => o * 60000 !== previousDuration) : options;
  const pickedMinutes = filtered[Math.floor(Math.random() * filtered.length)];
  return pickedMinutes * 60 * 1000;
}

/**
 * Menghitung waktu transisi ke Sukses di dalam rentang total durasi:
 * Status berubah menjadi Sukses sebelum aktivitas berakhir (sekitar 55%–75% dari total durasi)
 */
export function calculateTransitionMs(totalDurationMs: number): number {
  const ratio = 0.55 + Math.random() * 0.20; // 55% sampai 75%
  const transition = Math.round(totalDurationMs * ratio);
  return Math.min(transition, totalDurationMs - 30000); // Minimal 30 detik dalam status Sukses
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
  const targetMs = typeof dateStringOrTimestamp === 'number'
    ? dateStringOrTimestamp
    : parseSafeDate(dateStringOrTimestamp).getTime();
  const diffInSeconds = Math.max(0, Math.floor((nowMs - targetMs) / 1000));

  if (diffInSeconds < 60) return 'Baru saja';
  if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + ' menit lalu';
  if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + ' jam lalu';
  return Math.floor(diffInSeconds / 86400) + ' hari lalu';
}

/**
 * Evaluasi status terkini dari suatu aktivitas dinamis berbasis waktu sistem (Date.now())
 */
export function getActivityStatus(activity: DynamicActivity, now: number): {
  status: 'processing' | 'completed';
  progressPercent: number;
  remainingProcessingSeconds: number;
  isCompletedCycle: boolean;
} {
  const elapsed = Math.max(0, now - activity.startTime);

  // Batas mutlak 8 menit atau batas total durasi aktivitas
  if (elapsed >= MAX_TOTAL_DURATION_MS || elapsed >= activity.totalDurationMs) {
    return {
      status: 'completed',
      progressPercent: 100,
      remainingProcessingSeconds: 0,
      isCompletedCycle: true,
    };
  }

  // Transisi status menjadi 'Sukses' sebelum aktivitas berakhir
  if (elapsed >= activity.transitionMs) {
    return {
      status: 'completed',
      progressPercent: 100,
      remainingProcessingSeconds: 0,
      isCompletedCycle: false,
    };
  }

  // Masih dalam fase 'Processing'
  const progress = Math.min(99, Math.max(10, Math.round((elapsed / activity.transitionMs) * 100)));
  const remainingSec = Math.max(1, Math.ceil((activity.transitionMs - elapsed) / 1000));

  return {
    status: 'processing',
    progressPercent: progress,
    remainingProcessingSeconds: remainingSec,
    isCompletedCycle: false,
  };
}

/**
 * Membaca rekaman aktivitas timeline dari sessionStorage
 */
export function readStoredTimeline(): DynamicActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menyimpan rekaman aktivitas timeline ke sessionStorage
 */
export function writeStoredTimeline(activities: DynamicActivity[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch {
    // Ignore quota/sessionStorage errors silently
  }
}

/**
 * Membuat objek aktivitas baru dengan variasi konten produk yang tidak berulang
 */
function createNewDynamicActivity(
  startTime: number,
  lastProductIndex: number,
  lastDurationMs?: number
): DynamicActivity {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const id = `AST-ACT-${randomSuffix}`;

  // Pastikan produk berikutnya berbeda dari produk sebelumnya (variasi konten)
  const productIndex = (lastProductIndex + 1 + Math.floor(Math.random() * (DEMO_PRODUCTS.length - 1))) % DEMO_PRODUCTS.length;
  const prod = DEMO_PRODUCTS[productIndex];
  const customer = DEMO_CUSTOMERS[Math.floor(Math.random() * DEMO_CUSTOMERS.length)];

  // Total durasi bervariasi antara 3–8 menit (misal 3m, 4m, 5m, 6m, 7m, 8m)
  const totalDurationMs = getRandomTotalDuration(lastDurationMs);
  // Waktu transisi ke Sukses dihitung di dalam total durasi
  const transitionMs = calculateTransitionMs(totalDurationMs);

  return {
    id,
    raw_id: id,
    product_name: prod.name,
    items_summary: prod.items_summary,
    items_count: prod.items_count,
    customer_display: customer,
    startTime,
    totalDurationMs,
    transitionMs,
    productIndex,
  };
}

/**
 * Inisialisasi awal jadwal tumpang tindih (overlapping schedule)
 * Menghasilkan 3 aktivitas dengan waktu mulai bertingkat (staggered) dan durasi berbeda
 * sehingga pengunjung langsung dapat mengamati beberapa aktivitas berstatus Processing bersamaan
 * dan transisi status independen secara real-time.
 */
function initializeOverlappingSchedule(now: number): DynamicActivity[] {
  // Aktivitas 1: Dimulai ~1.8 menit lalu, total durasi 3.5 menit (segera transisi ke Sukses)
  const act1Duration = 3.5 * 60 * 1000;
  const act1Trans = Math.round(act1Duration * 0.65); // ~2.27m
  const act1 = {
    ...createNewDynamicActivity(now - 110 * 1000, 0, act1Duration),
    totalDurationMs: act1Duration,
    transitionMs: act1Trans,
  };

  // Aktivitas 2: Dimulai ~1 menit lalu, total durasi 6 menit (masih aktif di Processing)
  const act2Duration = 6 * 60 * 1000;
  const act2Trans = Math.round(act2Duration * 0.65); // ~3.9m
  const act2 = {
    ...createNewDynamicActivity(now - 60 * 1000, act1.productIndex, act2Duration),
    totalDurationMs: act2Duration,
    transitionMs: act2Trans,
  };

  // Aktivitas 3: Dimulai ~15 detik lalu, total durasi 4.5 menit (baru mulai Processing)
  const act3Duration = 4.5 * 60 * 1000;
  const act3Trans = Math.round(act3Duration * 0.65); // ~2.9m
  const act3 = {
    ...createNewDynamicActivity(now - 15 * 1000, act2.productIndex, act3Duration),
    totalDurationMs: act3Duration,
    transitionMs: act3Trans,
  };

  return [act3, act2, act1]; // Urutan terbaru di paling atas
}

/**
 * Hook utama aktivitas dinamis halaman /orders:
 * - Durasi satu aktivitas antara 3–8 menit (Processing + Sukses dihitung dalam satu total durasi).
 * - Transisi status Processing -> Sukses terjadi sebelum aktivitas berakhir.
 * - Jadwal aktivitas tumpang tindih (overlapping): beberapa aktivitas boleh Processing bersamaan.
 * - Jarak antarkemunculan bervariasi dalam hitungan menit (1–3 aktivitas baru dalam 8 menit).
 * - Variasi konten produk terjamin tidak mengulang item yang sama berturut-turut.
 * - Menggunakan identitas khusus demo (tidak disajikan sebagai bukti pelanggan nyata).
 * - Pengelolaan waktu berbasis waktu sistem aktual (Date.now()) dengan pembersihan timer aman.
 */
export function useDynamicOrderActivities(rawOrders: PublicOrder[]) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [activities, setActivities] = useState<DynamicActivity[]>([]);
  const isInitializedRef = useRef(false);

  // 1. Timer Tunggal berbasis Waktu Sistem (Date.now()) dengan pembersihan memori aman
  useEffect(() => {
    let isMounted = true;
    const timerId = setInterval(() => {
      if (isMounted) {
        setNow(Date.now());
      }
    }, UPDATE_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(timerId);
    };
  }, []);

  // 2. Inisialisasi dan pengelolaan jadwal tumpang tindih (overlapping timeline)
  useEffect(() => {
    const currentSystemTime = Date.now();
    const stored = readStoredTimeline();

    let currentList = stored;
    if (stored.length === 0) {
      currentList = initializeOverlappingSchedule(currentSystemTime);
      writeStoredTimeline(currentList);
    }

    setActivities(currentList);
    isInitializedRef.current = true;
  }, []);

  // 3. Periksa kedatangan aktivitas baru dalam rentang 8 menit (1-3 aktivitas baru berjarak variatif)
  useEffect(() => {
    if (!isInitializedRef.current || activities.length === 0) return;

    const currentSystemTime = now;
    const newest = activities[0];
    const timeSinceNewestMs = currentSystemTime - newest.startTime;

    // Jarak antarkemunculan bervariasi dalam hitungan menit: antara 1.5 sampai 2.5 menit (90.000 - 150.000 ms)
    const staggerIntervalMs = 2 * 60 * 1000;

    // Hitung jumlah aktivitas yang dimulai dalam rentang 8 menit terakhir
    const activitiesInLast8Min = activities.filter(
      (a) => currentSystemTime - a.startTime <= 8 * 60 * 1000
    );

    // Boleh ada 1–3 aktivitas baru dalam rentang 8 menit
    if (timeSinceNewestMs >= staggerIntervalMs && activitiesInLast8Min.length < 3) {
      const newAct = createNewDynamicActivity(
        currentSystemTime,
        newest.productIndex,
        newest.totalDurationMs
      );

      // Pertahankan riwayat (maksimum 12 aktivitas terakhir agar storage tetap bersih)
      const updated = [newAct, ...activities.slice(0, 11)];
      setActivities(updated);
      writeStoredTimeline(updated);
    }
  }, [now, activities]);

  // 4. Hitung status efektif pesanan: gabungkan aktivitas dinamis dan pesanan asli
  const processedOrders = useMemo<ProcessedOrder[]>(() => {
    // A. Petakan aktivitas dinamis ke format pesanan
    const dynamicOrdersList: ProcessedOrder[] = activities.map((act) => {
      const { status, progressPercent, remainingProcessingSeconds } = getActivityStatus(act, now);

      return {
        id: act.id,
        raw_id: act.raw_id,
        product_name: act.product_name,
        items_summary: act.items_summary,
        items_count: act.items_count,
        customer_display: act.customer_display,
        order_status: status,
        effectiveStatus: status,
        isDynamicActivity: true,
        processingProgressPercent: progressPercent,
        remainingProcessingSeconds: remainingProcessingSeconds,
        order_date: new Date(act.startTime).toISOString(),
        effectiveDate: new Date(act.startTime).toISOString(),
      };
    });

    // B. Petakan pesanan asli dari backend dengan perlindungan batas 8 menit untuk status processing
    const realOrdersList: ProcessedOrder[] = (rawOrders || []).map((order) => {
      if (order.order_status === 'processing') {
        const orderTime = parseSafeDate(order.order_date).getTime();
        const elapsedSinceCreated = Math.max(0, now - orderTime);

        if (elapsedSinceCreated >= MAX_TOTAL_DURATION_MS) {
          return {
            ...order,
            effectiveStatus: 'completed',
            order_status: 'completed',
            isDynamicActivity: false,
            effectiveDate: order.order_date,
          };
        }

        return {
          ...order,
          effectiveStatus: 'processing',
          order_status: 'processing',
          isDynamicActivity: false,
          effectiveDate: order.order_date,
        };
      }

      return {
        ...order,
        effectiveStatus: order.order_status,
        isDynamicActivity: false,
        effectiveDate: order.order_date,
      };
    });

    // Gabungkan: aktivitas dinamis di bagian atas, diikuti transaksi asli
    return [...dynamicOrdersList, ...realOrdersList];
  }, [activities, rawOrders, now]);

  return {
    processedOrders,
    now,
    activities,
  };
}
