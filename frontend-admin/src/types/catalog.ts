import { ProductItem } from '@/lib/products-data';

export interface ManagedProductItem extends ProductItem {
  status: 'active' | 'archived';
  provider: 'native' | 'vip-reseller';
  providerCode?: string;
  providerPrice?: number;
  providerStatus?: 'available' | 'empty' | 'maintenance' | 'unknown';
  providerName?: string;
  lastProviderCheck?: string;
  profitMargin?: number;
  profitPercentage?: number;
}

export type ManagedProduct = ManagedProductItem;

export interface VipResellerPrice {
  basic: number;
  premium: number;
  special: number;
}

export interface VipRawService {
  brand: string;
  code: string;
  name: string;
  note?: string;
  price: VipResellerPrice | number;
  status: 'available' | 'empty' | string;
  multi_trx?: boolean;
  maintenace?: string;
  category?: string;
  prepost?: string;
  type?: string;
  game?: string;
  server?: string;
  id?: string | number;
  description?: string;
}
