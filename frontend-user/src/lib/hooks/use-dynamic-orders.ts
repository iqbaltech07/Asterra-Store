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

export interface DynamicActivityRecord {
  orderId: string;
  startTime: number;    // System timestamp (Date.now()) when processing started
  durationMs: number;   // Random duration strictly between 5 and 8 minutes (300,000 - 480,000 ms)
}

export interface ProcessedOrder extends PublicOrder {
  effectiveStatus: 'pending' | 'processing' | 'completed' | 'cancelled';
  isDynamicActivity: boolean;
  processingProgressPercent?: number;
  remainingProcessingSeconds?: number;
  effectiveDate: string;
}

const STORAGE_KEY = 'asterra_orders_dynamic_activity_v1';
export const MIN_PROCESSING_MS = 5 * 60 * 1000; // 5 menit (300,000 ms)
export const MAX_PROCESSING_MS = 8 * 60 * 1000; // 8 menit (480,000 ms)
export const UPDATE_INTERVAL_MS = 3000;         // 3 detik interval agar halaman tetap ringan

/**
 * Menghasilkan durasi Processing acak antara 5–8 menit (300.000 - 480.000 ms)
 */
export function getRandomProcessingDuration(): number {
  return Math.floor(MIN_PROCESSING_MS + Math.random() * (MAX_PROCESSING_MS - MIN_PROCESSING_MS));
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
 * Membaca rekaman aktivitas dari sessionStorage
 */
export function readStoredActivities(): Record<string, DynamicActivityRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Menyimpan rekaman aktivitas ke sessionStorage
 */
export function writeStoredActivities(activities: Record<string, DynamicActivityRecord>) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch {
    // Ignore quota/sessionStorage errors silently
  }
}

/**
 * Hook utama aktivitas dinamis halaman /orders:
 * - Menangani transisi status Processing -> Sukses
 * - Durasi Processing acak 5-8 menit
 * - Memastikan batas mutlak maksimum 8 menit menggunakan waktu sistem
 * - Timer tunggal aman dari kebocoran memori (memory leak safe)
 * - Ringan dan tidak mengirim data buatan ke backend
 */
export function useDynamicOrderActivities(rawOrders: PublicOrder[]) {
  const [now, setNow] = useState<number>(() => Date.now());
  const [activeRecords, setActiveRecords] = useState<Record<string, DynamicActivityRecord>>({});
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

  // 2. Inisialisasi aktivitas dinamis dari transaksi asli saat data tersedia
  useEffect(() => {
    if (!rawOrders || rawOrders.length === 0) return;

    const stored = readStoredActivities();
    const updated = { ...stored };
    let hasChanges = false;
    const currentSystemTime = Date.now();

    // Ambil order terbaru dari transaksi asli untuk dijadikan aktivitas dinamis aktif
    const candidateOrder = rawOrders[0];
    if (candidateOrder && candidateOrder.id) {
      const existing = updated[candidateOrder.id];
      if (!existing) {
        // Durasi acak antara 5 hingga 8 menit (300.000 - 480.000 ms)
        const randomDuration = getRandomProcessingDuration();
        // Berikan waktu mulai: jika baru pertama kali diinisialisasi dalam sesi ini,
        // pasang startTime sekitar 60–120 detik yang lalu agar pengunjung dapat melihat
        // proses berjalan dan transisi menuju Sukses secara natural
        const initialOffsetMs = Math.floor(60_000 + Math.random() * 60_000);
        updated[candidateOrder.id] = {
          orderId: candidateOrder.id,
          startTime: currentSystemTime - initialOffsetMs,
          durationMs: randomDuration,
        };
        hasChanges = true;
      }
    }

    // Bersihkan rekaman yang lebih tua dari 24 jam agar storage tetap bersih dan ringan
    for (const id in updated) {
      if (currentSystemTime - updated[id].startTime > 24 * 60 * 60 * 1000) {
        delete updated[id];
        hasChanges = true;
      }
    }

    if (hasChanges || !isInitializedRef.current) {
      isInitializedRef.current = true;
      setActiveRecords(updated);
      writeStoredActivities(updated);
    }
  }, [rawOrders]);

  // 3. Hitung status efektif setiap pesanan berdasarkan waktu sistem dan durasi 5-8 menit
  const processedOrders = useMemo<ProcessedOrder[]>(() => {
    if (!rawOrders || rawOrders.length === 0) return [];

    return rawOrders.map((order) => {
      const record = activeRecords[order.id];

      if (record) {
        const elapsed = Math.max(0, now - record.startTime);

        // ATURAN MUTLAK: Tidak boleh ada aktivitas yang tetap Processing lebih dari 8 menit (480.000 ms)
        // atau jika durasi acak (antara 5-8 menit) telah tercapai
        if (elapsed >= MAX_PROCESSING_MS || elapsed >= record.durationMs) {
          return {
            ...order,
            effectiveStatus: 'completed',
            order_status: 'completed',
            isDynamicActivity: true,
            processingProgressPercent: 100,
            remainingProcessingSeconds: 0,
            effectiveDate: new Date(record.startTime).toISOString(),
          };
        }

        // Masih dalam rentang waktu Processing (5–8 menit)
        const progress = Math.min(99, Math.max(10, Math.round((elapsed / record.durationMs) * 100)));
        const remainingSec = Math.max(0, Math.ceil((record.durationMs - elapsed) / 1000));

        return {
          ...order,
          effectiveStatus: 'processing',
          order_status: 'processing',
          isDynamicActivity: true,
          processingProgressPercent: progress,
          remainingProcessingSeconds: remainingSec,
          effectiveDate: new Date(record.startTime).toISOString(),
        };
      }

      // Jika pesanan asli dari backend berstatus processing tetapi bukan record aktif:
      // Pastikan aturan batas maksimum 8 menit tetap berlaku
      if (order.order_status === 'processing') {
        const orderTime = parseSafeDate(order.order_date).getTime();
        const elapsedSinceCreated = Math.max(0, now - orderTime);

        // Jika pesanan processing sudah lebih dari 8 menit sejak dibuat, ubah ke completed (Sukses)
        if (elapsedSinceCreated >= MAX_PROCESSING_MS) {
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
  }, [rawOrders, activeRecords, now]);

  return {
    processedOrders,
    now,
    activeRecords,
  };
}
