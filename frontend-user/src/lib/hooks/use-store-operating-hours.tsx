'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { StoreHoursApi, StoreOperatingHoursStatus } from '@/lib/api-client';

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

export interface StoreOperatingHoursHookResult {
  status: StoreOperatingHoursStatus;
  isLoaded: boolean;
  isOpen: boolean;
  isClosed: boolean;
  mode: 'auto' | 'manual_open' | 'manual_closed';
  nextOpenDisplay: string | null;
  nextCloseDisplay: string | null;
  bannerMessage: string | null;
  allowPreorder: boolean;
  reopenEstimate: string | null;
  sleepingAdminNote: string;
  refetch: () => void;
}

const StoreOperatingHoursContext = createContext<StoreOperatingHoursHookResult | null>(null);

/**
 * Global Store Operating Hours Provider.
 * Hydrated with initialStatus from the Next.js server to guarantee 0ms blink on client load.
 * Automatically synchronizes with background polling every 20 seconds.
 */
export function StoreOperatingHoursProvider({
  children,
  initialStatus,
}: {
  children: React.ReactNode;
  initialStatus?: StoreOperatingHoursStatus | null;
}) {
  const queryClient = useQueryClient();

  const query = useQuery<{ success: boolean; data: StoreOperatingHoursStatus }>({
    queryKey: ['store-operating-hours'],
    queryFn: () => StoreHoursApi.getStatus(),
    initialData: initialStatus ? { success: true, data: initialStatus } : undefined,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
  });

  // Listen to Server-Sent Events (SSE) for instant sync when admin changes store operational status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/realtime/events?client_role=user');
      const handleStoreUpdate = (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed?.status) {
            queryClient.setQueryData(['store-operating-hours'], {
              success: true,
              data: parsed.status,
            });
          }
        } catch {
          // ignore parse error
        }
        queryClient.invalidateQueries({ queryKey: ['store-operating-hours'] });
      };

      eventSource.addEventListener('store_hours:updated', handleStoreUpdate);
      eventSource.addEventListener('store:updated', handleStoreUpdate);
    } catch {
      // Graceful fallback to periodic polling
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  const status = query.data?.data || initialStatus || DEFAULT_STORE_OPERATING_STATUS;
  const isLoaded = Boolean(query.data?.data || initialStatus);
  const isOpen = Boolean(status.isOpen ?? status.is_open);
  const isClosed = isLoaded ? !isOpen : false;
  const nextOpenDisplay = status.nextOpenDisplay || status.next_open_display || null;
  const nextCloseDisplay = status.nextCloseDisplay || null;
  const bannerMessage = status.bannerMessage || status.banner_message || null;
  const allowPreorder = status.allowPreorder ?? status.allow_preorder ?? true;
  const reopenEstimate = status.reopenEstimate || null;
  const sleepingAdminNote =
    status.sleepingAdminNote ||
    'Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴';

  const value: StoreOperatingHoursHookResult = useMemo(
    () => ({
      status,
      isLoaded,
      isOpen,
      isClosed,
      mode: status.mode || 'auto',
      nextOpenDisplay,
      nextCloseDisplay,
      bannerMessage,
      allowPreorder,
      reopenEstimate,
      sleepingAdminNote,
      refetch: () => {
        query.refetch();
      },
    }),
    [
      status,
      isLoaded,
      isOpen,
      isClosed,
      nextOpenDisplay,
      nextCloseDisplay,
      bannerMessage,
      allowPreorder,
      reopenEstimate,
      sleepingAdminNote,
      query,
    ]
  );

  return (
    <StoreOperatingHoursContext.Provider value={value}>
      {children}
    </StoreOperatingHoursContext.Provider>
  );
}

/**
 * Access store operating hours.
 * Pulls from server-hydrated context if available, or falls back to local query.
 */
export function useStoreOperatingHours(options?: {
  initialStatus?: StoreOperatingHoursStatus | null;
  enabled?: boolean;
}): StoreOperatingHoursHookResult {
  const context = useContext(StoreOperatingHoursContext);
  if (context) {
    return context;
  }

  // Fallback if rendered outside of Provider
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const query = useQuery<{ success: boolean; data: StoreOperatingHoursStatus }>({
    queryKey: ['store-operating-hours'],
    queryFn: () => StoreHoursApi.getStatus(),
    initialData: options?.initialStatus ? { success: true, data: options.initialStatus } : undefined,
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });

  const status = query.data?.data || options?.initialStatus || DEFAULT_STORE_OPERATING_STATUS;
  const isLoaded = Boolean(query.data?.data || options?.initialStatus);
  const isOpen = Boolean(status.isOpen ?? status.is_open);
  const isClosed = isLoaded ? !isOpen : false;
  const nextOpenDisplay = status.nextOpenDisplay || status.next_open_display || null;
  const nextCloseDisplay = status.nextCloseDisplay || null;
  const bannerMessage = status.bannerMessage || status.banner_message || null;
  const allowPreorder = status.allowPreorder ?? status.allow_preorder ?? true;
  const reopenEstimate = status.reopenEstimate || null;
  const sleepingAdminNote =
    status.sleepingAdminNote ||
    'Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴';

  return {
    status,
    isLoaded,
    isOpen,
    isClosed,
    mode: status.mode || 'auto',
    nextOpenDisplay,
    nextCloseDisplay,
    bannerMessage,
    allowPreorder,
    reopenEstimate,
    sleepingAdminNote,
    refetch: () => {
      query.refetch();
    },
  };
}
