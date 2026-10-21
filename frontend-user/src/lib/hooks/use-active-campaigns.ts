'use client';

import { useQuery } from '@tanstack/react-query';
import { ActiveCampaign } from '@/lib/utils/promo-pricing';

export interface ActiveCampaignsResponse {
  success: boolean;
  data: ActiveCampaign[];
}

export async function fetchActiveCampaigns(): Promise<ActiveCampaignsResponse> {
  try {
    const res = await fetch('/api/v1/campaigns/active');
    if (!res.ok) {
      return { success: false, data: [] };
    }
    const json = await res.json();
    return {
      success: Boolean(json?.success),
      data: Array.isArray(json?.data) ? json.data : [],
    };
  } catch {
    return { success: false, data: [] };
  }
}

/**
 * Shared React Query hook for active marketing campaigns and promo pricing.
 *
 * Eliminates redundant network fetches across Home, Products, Product Detail,
 * Product Cards, and Analytics Tracker.
 *
 * - staleTime: 3 minutes (retains valid cache, prevents re-fetching on navigation)
 * - gcTime: 15 minutes (retains data in memory across route transitions)
 * - refetchOnWindowFocus: false (avoids disruptive background re-fetches)
 */
export function useActiveCampaigns(options?: { enabled?: boolean }) {
  const query = useQuery<ActiveCampaignsResponse>({
    queryKey: ['active-campaigns'],
    queryFn: fetchActiveCampaigns,
    staleTime: 3 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
  });

  return {
    ...query,
    campaigns: query.data?.data || [],
  };
}
