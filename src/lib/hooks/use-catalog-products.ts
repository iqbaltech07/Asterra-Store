'use client';

import { useQuery } from '@tanstack/react-query';
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
  return useQuery<CatalogProductsResponse>({
    queryKey: ['products'],
    queryFn: fetchCatalogProducts,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}
