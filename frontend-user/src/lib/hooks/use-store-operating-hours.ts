'use client';

import { useQuery } from '@tanstack/react-query';
import { StoreHoursApi, StoreOperatingHoursStatus } from '@/lib/api-client';

/**
 * Shared React Query hook for store operating hours and operational status.
 * Evaluated strictly in Asia/Jakarta timezone.
 *
 * Automatically refetches every 20 seconds to stay synchronized with admin changes
 * and automatic opening/closing schedule triggers without needing manual page reloads.
 */
export function useStoreOperatingHours(options?: { enabled?: boolean }) {
  const query = useQuery<{ success: boolean; data: StoreOperatingHoursStatus }>({
    queryKey: ['store-operating-hours'],
    queryFn: () => StoreHoursApi.getStatus(),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  });

  const status = query.data?.data;
  const isLoaded = Boolean(status);
  const isOpen = status ? Boolean(status.isOpen ?? status.is_open) : true;
  const isClosed = isLoaded ? !isOpen : false;
  const nextOpenDisplay = status?.nextOpenDisplay || status?.next_open_display || null;
  const nextCloseDisplay = status?.nextCloseDisplay || null;
  const bannerMessage = status?.bannerMessage || status?.banner_message || null;
  const allowPreorder = status?.allowPreorder ?? status?.allow_preorder ?? true;

  return {
    ...query,
    status,
    isLoaded,
    isOpen,
    isClosed,
    mode: status?.mode || 'auto',
    nextOpenDisplay,
    nextCloseDisplay,
    bannerMessage,
    allowPreorder,
  };
}

