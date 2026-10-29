'use client';

import { useQuery } from '@tanstack/react-query';

export interface ProductCardItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  logoUrl?: string;
  bannerUrl?: string;
  badge?: string;
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
  return useQuery<ProductCardsResponse>({
    queryKey: ['product-cards'],
    queryFn: fetchProductCards,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
