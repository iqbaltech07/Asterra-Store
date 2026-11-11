import { ProductItem } from '@/lib/products-data';

export interface ManagedProductItem extends ProductItem {
  status: 'active' | 'archived';
  provider: 'native' | 'xaviera' | 'vip-reseller';
  providerCode?: string;
  providerPrice?: number;
  providerStatus?: 'available' | 'empty' | 'maintenance' | 'unknown';
  providerName?: string;
  lastProviderCheck?: string;
  profitMargin?: number;
  profitPercentage?: number;
}

export type ManagedProduct = ManagedProductItem;

export interface XavieraPrice {
  basic: number;
  premium?: number;
  special?: number;
}

export interface XavieraRawService {
  id?: string | number;
  code: string;
  name: string;
  brand?: string;
  category?: string;
  type?: string;
  price: XavieraPrice | number;
  status: 'available' | 'empty' | string;
  stock?: number;
  note?: string;
  hasVariants?: boolean;
  productId?: string;
  variantId?: string;
  gameBrand?: string;
  game?: string;
  sku?: string;
  serviceId?: string | number;
  description?: string;
  multi_trx?: boolean;
  server?: string;
}

export type VipResellerPrice = XavieraPrice;
export type VipRawService = XavieraRawService;
