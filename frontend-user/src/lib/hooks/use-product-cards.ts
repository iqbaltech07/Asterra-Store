'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

export interface ProductCardItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logoUrl?: string;
  imageUrl?: string;
  bannerUrl?: string;
  badge?: string;
  badgeLabel?: string;
  categoryId?: string;
  categoryName?: string;
  minPrice: number;
  stockStatus: 'in_stock' | 'out_of_stock' | 'low_stock' | 'ready';
  isOutOfStock?: boolean;
  soldCount: number;
  rating: number | string;
  sections: string[];
  displayOrder: number;
  status: 'active' | 'inactive' | 'archived';
  catalogsCount?: number;
}

export interface ProductCardsResponse {
  success: boolean;
  data: ProductCardItem[];
  total: number;
}

export async function fetchProductCards(): Promise<ProductCardsResponse> {
  const res = await fetch('/api/v1/cards');
  if (!res.ok) {
    throw new Error('Gagal memuat card produk.');
  }
  return res.json();
}

export function useProductCards() {
  const queryClient = useQueryClient();

  // Listen to Server-Sent Events (SSE) for instant sold count and card updates
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/v1/realtime/events?client_role=user');
      const handleSync = () => {
        queryClient.invalidateQueries({ queryKey: ['product-cards'] });
      };

      eventSource.addEventListener('cards:updated', handleSync);
      eventSource.addEventListener('homepage:sections_updated', handleSync);
      eventSource.addEventListener('catalog:updated', handleSync);
      eventSource.addEventListener('order:completed', handleSync);
      eventSource.addEventListener('order:status_changed', handleSync);
    } catch (err) {
      // Graceful fallback to periodic polling if SSE is blocked by proxy
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [queryClient]);

  return useQuery<ProductCardsResponse>({
    queryKey: ['product-cards'],
    queryFn: fetchProductCards,
    staleTime: 15 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 15 * 1000, // Resilient background polling
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
