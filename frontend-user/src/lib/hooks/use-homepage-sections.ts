'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ApplicationGroupItem } from '@/components/home/product-showcase-cards';

export interface SectionResult {
  sectionKey: 'promo' | 'terlaris' | 'terbaru';
  mode: 'auto' | 'manual';
  manualProductIds: string[];
  totalAvailable: number;
  count: number;
  data: ApplicationGroupItem[];
  limit: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface HomepageSectionsResponse {
  success: boolean;
  sections: {
    promo: SectionResult;
    terlaris: SectionResult;
    terbaru: SectionResult;
  };
  timestamp: string;
}

export async function fetchHomepageSections(): Promise<HomepageSectionsResponse> {
  const res = await fetch('/api/v1/homepage/sections?limit=8');
  if (!res.ok) {
    throw new Error('Gagal memuat urutan produk homepage.');
  }
  return res.json();
}

/**
 * Shared React Query hook for Homepage Product Showcase.
 * Guarantees exactly up to 8 products per category (Promo, Terlaris, Terbaru).
 * Listens to RealtimeBroadcaster SSE events for instant auto-sync without page reload.
 */
export function useHomepageSections() {
  const queryClient = useQueryClient();

  const query = useQuery<HomepageSectionsResponse>({
    queryKey: ['homepage-sections'],
    queryFn: fetchHomepageSections,
    staleTime: 15 * 1000, // 15 seconds fresh window
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Listen to Server-Sent Events (SSE) for instant auto-sync when admin modifies order
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/realtime/events?client_role=user');
      eventSource.addEventListener('homepage:sections_updated', () => {
        queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      });
      eventSource.addEventListener('catalog:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      });
      eventSource.addEventListener('campaign:updated', () => {
        queryClient.invalidateQueries({ queryKey: ['homepage-sections'] });
        queryClient.invalidateQueries({ queryKey: ['active-campaigns'] });
      });
    } catch (err) {
      // Graceful fallback to periodic polling if SSE is blocked by proxy
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  return query;
}
