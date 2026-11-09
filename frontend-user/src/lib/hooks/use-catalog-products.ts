'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { ProductItem } from '@/lib/products-data';

export interface CatalogProductsResponse {
  success: boolean;
  data: ProductItem[];
  total: number;
}

export async function fetchCatalogProducts(): Promise<CatalogProductsResponse> {
  const res = await fetch('/api/v1/products');
  if (!res.ok) {
    throw new Error('Gagal memuat produk dari katalog.');
  }
  return res.json();
}

/**
 * Shared React Query hook for storefront catalog products.
 *
 * Used by both Home ('/') and Katalog ('/products') to eliminate blank states
 * and redundant network fetches when navigating between pages.
 *
 * - staleTime: 5 minutes (prevents immediate re-fetching when already in cache)
 * - gcTime: 30 minutes (retains data in memory across route transitions)
 * - placeholderData: retains previous data during background sync
 */
export function useCatalogProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/realtime/events?client_role=user');
      const handleSync = () => {
        queryClient.invalidateQueries({ queryKey: ['products'] });
      };

      eventSource.addEventListener('catalog:updated', handleSync);
      eventSource.addEventListener('cards:updated', handleSync);
      eventSource.addEventListener('homepage:sections_updated', handleSync);
      eventSource.addEventListener('order:completed', handleSync);
    } catch (err) {
      // Graceful fallback to periodic polling if SSE is blocked by proxy
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  return useQuery<CatalogProductsResponse>({
    queryKey: ['products'],
    queryFn: fetchCatalogProducts,
    staleTime: 15 * 1000, // 15 seconds fresh window
    gcTime: 30 * 60 * 1000,
    refetchInterval: 15 * 1000, // Resilient background polling
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
