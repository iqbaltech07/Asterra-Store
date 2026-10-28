import { StoreOperatingHoursStatus } from '@/lib/api-client';

const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.BACKEND_URL ||
  'http://localhost:8000';

export const DEFAULT_STORE_OPERATING_STATUS: StoreOperatingHoursStatus = {
  status: 'open',
  isOpen: true,
  is_open: true,
  mode: 'auto',
  statusLabel: 'Buka',
  currentTimeWIB: new Date().toISOString(),
  currentDay: 'thursday',
  currentDayID: 'Kamis',
  nextOpenAt: null,
  nextOpenDisplay: null,
  next_open_display: null,
  nextCloseAt: null,
  nextCloseDisplay: null,
  bannerMessage: null,
  banner_message: null,
  allowPreorder: true,
  allow_preorder: true,
  weeklySchedule: {},
  manualCloseReason: null,
  reopenEstimate: null,
  sleepingAdminNote: 'Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴',
  timezone: 'Asia/Jakarta',
  updatedAt: null,
  updatedBy: null,
};

/**
 * Server-side helper to fetch store operating status directly from the backend.
 * Uses Next.js fetch with 10s revalidation and 3.5s timeout.
 * Returns default open status on build or network fallback without throwing.
 */
export async function getStoreOperatingHoursServer(): Promise<StoreOperatingHoursStatus> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/store/operating-hours`, {
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      return DEFAULT_STORE_OPERATING_STATUS;
    }

    const json = await res.json();
    if (json?.data) {
      return {
        ...DEFAULT_STORE_OPERATING_STATUS,
        ...json.data,
      };
    }

    return DEFAULT_STORE_OPERATING_STATUS;
  } catch (_err) {
    return DEFAULT_STORE_OPERATING_STATUS;
  }
}
