'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { ProductItem } from '@/lib/products-data';

export interface PublicOrder {
  id: string;
  raw_id: string;
  product_name: string;
  items_summary: string;
  items_count: number;
  order_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  customer_display: string;
  product_id?: string;
  product_sku?: string;
}

export interface DynamicActivity {
  id: string;
  raw_id: string;
  product_id: string;        // ID produk aktif dari katalog resmi
  product_sku?: string;      // SKU / provider_code dari katalog resmi
  product_name: string;
  items_summary: string;
  items_count: number;
  customer_display: string;
  startTime: number;        // Epoch timestamp (Date.now()) saat aktivitas dimulai
  totalDurationMs: number;  // Total durasi antara 10–30 menit (600.000 - 1.800.000 ms)
  transitionMs: number;     // Waktu transisi dari Processing ke Sukses (sebelum totalDurationMs berakhir)
  productIndex: number;
}

export interface ProcessedOrder extends PublicOrder {
  effectiveStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  isDynamicActivity: boolean;
  processingProgressPercent?: number;
  remainingProcessingSeconds?: number;
  effectiveDate: string;
  product_id?: string;
  product_sku?: string;
}

const STORAGE_KEY = 'asterra_orders_dynamic_timeline_v5';
const LEGACY_STORAGE_KEYS = [
  'asterra_orders_dynamic_timeline_v4',
  'asterra_orders_dynamic_timeline_v3',
  'asterra_orders_dynamic_timeline_v2',
  'asterra_orders_dynamic_timeline_v1',
];

export const MIN_TOTAL_DURATION_MS = 10 * 60 * 1000; // 10 menit (600.000 ms)
export const MAX_TOTAL_DURATION_MS = 30 * 60 * 1000; // 30 menit (1.800.000 ms)
export const UPDATE_INTERVAL_MS = 3000;              // 3 detik interval agar halaman tetap ringan

/**
 * Kumpulan nama samaran konsisten dan natural:
 * Pola: Huruf awal kapital, 4 asterisk, huruf akhir kecil (X****y)
 * Tanpa awalan huruf M mendominasi dan tanpa embel-embel ID pelanggan buatan / label Demo.
 */
export const MASKED_CUSTOMERS: string[] = [
  'A****a', // Adinda / Anisa
  'R****n', // Rayhan / Ridwan
  'D****i', // Dewi / Dwiki
  'F****a', // Farida / Fatiya
  'N****i', // Nabila / Novita
  'Y****a', // Yudha / Yoga
  'S****a', // Salsa / Safira
  'K****n', // Kevin / Krisna
  'B****g', // Bintang / Bambang
  'Z****a', // Zahra / Zaskia
  'G****g', // Gilang / Galang
  'H****a', // Hendra / Hanifa
  'I****m', // Ilham / Ikhram
  'C****a', // Citra / Clarissa
  'W****u', // Wahyu / Wisnu
  'P****a', // Pratama / Pandu
  'T****h', // Teguh / Thoriq
  'E****o', // Eko / Erlangga
  'L****s', // Laras / Lestari
  'V****a', // Vania / Valerie
  'J****n', // Jonathan / Johan
  'O****a', // Olivia / Oktavia
];

/**
 * Memilih nama samaran yang belum digunakan pada aktivitas yang terlihat bersamaan
 */
export function pickNonOverlappingCustomer(existingNames: string[] = []): string {
  const used = new Set(existingNames);
  const available = MASKED_CUSTOMERS.filter((n) => !used.has(n));
  const pool = available.length > 0 ? available : MASKED_CUSTOMERS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Menghasilkan total durasi bervariasi antara 10–30 menit (600.000 - 1.800.000 ms)
 * Memastikan durasi tidak selalu sama dengan durasi sebelumnya
 */
export function getRandomTotalDuration(previousDuration?: number): number {
  const options = [10, 12, 15, 18, 20, 25, 30];
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
  return Math.min(transition, totalDurationMs - 60000); // Minimal 1 menit dalam status Sukses
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

  // Batas mutlak 30 menit atau batas total durasi aktivitas
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
 * Memvalidasi apakah suatu aktivitas dinamis merujuk ke produk aktif yang sah di katalog
 * berdasarkan kecocokan ID atau SKU (bukan hanya kemiripan nama).
 */
export function isActivityValid(act: DynamicActivity, activeCatalog: ProductItem[]): boolean {
  if (!act || !activeCatalog || activeCatalog.length === 0) return false;
  return activeCatalog.some((p) => {
    if (p.status !== 'active') return false;
    const matchId = Boolean(act.product_id && p.id === act.product_id);
    const prodSku = p.providerCode || p.provider_code;
    const matchSku = Boolean(act.product_sku && prodSku && act.product_sku === prodSku);
    return matchId || matchSku;
  });
}

/**
 * Membaca rekaman aktivitas timeline dari sessionStorage dan membersihkan legacy key
 */
export function readStoredTimeline(): DynamicActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    // Bersihkan storage lawas yang berpotensi menyimpan durasi lama atau produk hardcode
    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      sessionStorage.removeItem(legacyKey);
    }

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
 * Membuat objek aktivitas baru dari katalog produk aktif yang terverifikasi
 * dengan variasi konten produk yang tidak berulang dan nama samaran natural.
 */
export function createNewDynamicActivity(
  startTime: number,
  lastProductIdOrIndex: string | number,
  activeProducts: ProductItem[],
  lastDurationMs?: number,
  existingCustomerNames: string[] = []
): DynamicActivity | null {
  if (!activeProducts || activeProducts.length === 0) {
    return null;
  }

  // Filter ketat: Hanya produk berstatus active dengan ID yang valid
  const verifiedActive = activeProducts.filter((p) => p && p.id && p.status === 'active');
  if (verifiedActive.length === 0) {
    return null;
  }

  let lastIndex = -1;
  if (typeof lastProductIdOrIndex === 'string') {
    lastIndex = verifiedActive.findIndex((p) => p.id === lastProductIdOrIndex);
  } else if (typeof lastProductIdOrIndex === 'number') {
    lastIndex = lastProductIdOrIndex;
  }

  const safeLastIndex = (lastIndex >= 0 && lastIndex < verifiedActive.length) ? lastIndex : 0;

  // Pastikan produk berikutnya berbeda dari produk sebelumnya (variasi konten)
  const productIndex =
    verifiedActive.length > 1
      ? (safeLastIndex + 1 + Math.floor(Math.random() * (verifiedActive.length - 1))) % verifiedActive.length
      : 0;

  const prod = verifiedActive[productIndex];
  if (!prod || prod.status !== 'active' || !prod.id) {
    return null;
  }

  const now = new Date(startTime);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const id = `AST-ORD-${y}${m}${d}-${randomSuffix}`;

  // Pilih nama samaran yang tidak duplikat dengan aktivitas yang sedang tampil bersamaan
  const customer = pickNonOverlappingCustomer(existingCustomerNames);

  // Total durasi bervariasi antara 10–30 menit (misal 10m, 12m, 15m, 18m, 20m, 25m, 30m)
  const totalDurationMs = getRandomTotalDuration(lastDurationMs);
  // Waktu transisi ke Sukses dihitung di dalam total durasi
  const transitionMs = calculateTransitionMs(totalDurationMs);

  const sku = prod.providerCode || prod.provider_code || undefined;

  return {
    id,
    raw_id: id,
    product_id: prod.id,
    product_sku: sku,
    product_name: prod.name,
    items_summary: prod.name,
    items_count: 1,
    customer_display: customer,
    startTime,
    totalDurationMs,
    transitionMs,
    productIndex,
  };
}

/**
 * Inisialisasi awal jadwal tumpang tindih (overlapping schedule) dari katalog produk aktif.
 * Menghasilkan 3 aktivitas dengan waktu mulai bertingkat (staggered), durasi bervariasi (10–30 menit),
 * serta nama samaran dan produk yang berbeda satu sama lain.
 */
export function initializeOverlappingSchedule(
  now: number,
  activeProducts: ProductItem[]
): DynamicActivity[] {
  if (!activeProducts || activeProducts.length === 0) return [];

  // Aktivitas 1: Dimulai ~12 menit lalu, total durasi 15 menit, transisi ~9 menit (status saat ini: Sukses)
  const act1Duration = 15 * 60 * 1000;
  const act1Trans = 9 * 60 * 1000;
  const act1Base = createNewDynamicActivity(now - 12 * 60 * 1000, 0, activeProducts, act1Duration, []);
  if (!act1Base) return [];
  const act1: DynamicActivity = {
    ...act1Base,
    totalDurationMs: act1Duration,
    transitionMs: act1Trans,
  };

  // Aktivitas 2: Dimulai ~6 menit lalu, total durasi 25 menit, transisi ~15 menit (status saat ini: Processing, sisa ~9 menit)
  const act2Duration = 25 * 60 * 1000;
  const act2Trans = 15 * 60 * 1000;
  const act2Base = createNewDynamicActivity(
    now - 6 * 60 * 1000,
    act1.product_id,
    activeProducts,
    act2Duration,
    [act1.customer_display]
  );
  if (!act2Base) return [act1];
  const act2: DynamicActivity = {
    ...act2Base,
    totalDurationMs: act2Duration,
    transitionMs: act2Trans,
  };

  // Aktivitas 3: Dimulai ~1.5 menit lalu, total durasi 18 menit, transisi ~12 menit (status saat ini: Processing, sisa ~10.5 menit)
  const act3Duration = 18 * 60 * 1000;
  const act3Trans = 12 * 60 * 1000;
  const act3Base = createNewDynamicActivity(
    now - 90 * 1000,
    act2.product_id,
    activeProducts,
    act3Duration,
    [act1.customer_display, act2.customer_display]
  );
  if (!act3Base) return [act2, act1];
  const act3: DynamicActivity = {
    ...act3Base,
    totalDurationMs: act3Duration,
    transitionMs: act3Trans,
  };

  return [act3, act2, act1]; // Urutan terbaru di paling atas
}

/**
 * Hook utama aktivitas dinamis halaman /orders:
 * - Menggunakan sumber katalog produk aktif resmi AsterraStore (tidak menggunakan hardcoded demo).
 * - Setiap aktivitas terverifikasi memiliki ID atau SKU produk aktif yang valid.
 * - Durasi satu aktivitas antara 10–30 menit (Processing + Sukses dihitung dalam satu total durasi).
 * - Transisi status Processing -> Sukses terjadi sebelum aktivitas berakhir.
 * - Jadwal aktivitas tumpang tindih (overlapping): beberapa aktivitas boleh Processing bersamaan.
 * - Jarak antarkemunculan bervariasi dalam hitungan menit (1–3 aktivitas baru dalam rentang 30 menit).
 * - Variasi konten produk terjamin tidak mengulang item yang sama berturut-turut.
 * - Menggunakan nama samaran konsisten dan natural (X****y) tanpa label demo.
 * - Pengelolaan waktu berbasis waktu sistem aktual (Date.now()) dengan pembersihan timer aman.
 */
export function useDynamicOrderActivities(
  rawOrders: PublicOrder[],
  activeProductsProp?: ProductItem[]
) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [activities, setActivities] = useState<DynamicActivity[]>([]);
  const isInitializedRef = useRef(false);

  // Akses query katalog produk resmi dari backend jika tidak dipass dari luar
  const { data: catalogResponse } = useCatalogProducts();

  // Sumber kebenaran katalog produk aktif AsterraStore
  const activeProducts = useMemo<ProductItem[]>(() => {
    const candidateList = activeProductsProp ?? catalogResponse?.data;
    if (!candidateList || !Array.isArray(candidateList)) return [];
    return candidateList.filter(
      (p): p is ProductItem => Boolean(p && p.id && p.status === 'active')
    );
  }, [activeProductsProp, catalogResponse?.data]);

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

  // 2. Inisialisasi dan pengelolaan jadwal tumpang tindih (overlapping timeline) tersinkronisasi
  useEffect(() => {
    if (activeProducts.length === 0) return;

    const currentSystemTime = Date.now();
    const stored = readStoredTimeline();

    // Verifikasi ketat setiap aktivitas tersimpan: buang produk non-aktif/tidak terverifikasi
    const validStored = stored.filter((act) => isActivityValid(act, activeProducts));

    let currentList: DynamicActivity[];
    if (validStored.length >= 3) {
      currentList = validStored;
    } else {
      currentList = initializeOverlappingSchedule(currentSystemTime, activeProducts);
      writeStoredTimeline(currentList);
    }

    setActivities(currentList);
    isInitializedRef.current = true;
  }, [activeProducts]);

  // 3. Periksa kedatangan aktivitas baru dalam rentang 30 menit (berjarak variatif)
  useEffect(() => {
    if (!isInitializedRef.current || activities.length === 0 || activeProducts.length === 0) return;

    const currentSystemTime = now;
    const newest = activities[0];
    const timeSinceNewestMs = currentSystemTime - newest.startTime;

    // Jarak antarkemunculan bervariasi dalam hitungan menit: ~4 menit (240.000 ms)
    const staggerIntervalMs = 4 * 60 * 1000;

    // Hitung jumlah aktivitas yang dimulai dalam rentang 30 menit terakhir
    const activitiesInLast30Min = activities.filter(
      (a) => currentSystemTime - a.startTime <= MAX_TOTAL_DURATION_MS
    );

    // Boleh ada 2–4 aktivitas baru dalam rentang 30 menit
    if (timeSinceNewestMs >= staggerIntervalMs && activitiesInLast30Min.length < 5) {
      const currentNames = activities.slice(0, 5).map((a) => a.customer_display);
      const newAct = createNewDynamicActivity(
        currentSystemTime,
        newest.product_id,
        activeProducts,
        newest.totalDurationMs,
        currentNames
      );

      if (newAct) {
        // Pertahankan riwayat (maksimum 12 aktivitas terakhir agar storage tetap bersih)
        const updated = [newAct, ...activities.slice(0, 11)];
        setActivities(updated);
        writeStoredTimeline(updated);
      }
    }
  }, [now, activities, activeProducts]);

  // 4. Hitung status efektif pesanan: gabungkan aktivitas dinamis dan pesanan asli
  const processedOrders = useMemo<ProcessedOrder[]>(() => {
    // Filter ketat: Hanya tampilkan aktivitas dinamis yang terverifikasi aktif berdasarkan ID atau SKU
    const verifiedActivities = activities.filter((act) => isActivityValid(act, activeProducts));

    // A. Petakan aktivitas dinamis ke format pesanan
    const dynamicOrdersList: ProcessedOrder[] = verifiedActivities.map((act) => {
      const { status, progressPercent, remainingProcessingSeconds } = getActivityStatus(act, now);

      return {
        id: act.id,
        raw_id: act.raw_id,
        product_id: act.product_id,
        product_sku: act.product_sku,
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

    // B. Petakan pesanan asli dari backend dengan perlindungan batas 30 menit untuk status processing
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
  }, [activities, activeProducts, rawOrders, now]);

  return {
    processedOrders,
    now,
    activities,
  };
}
