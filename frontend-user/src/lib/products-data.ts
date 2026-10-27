export interface ProductItem {
  id: string;
  name: string;
  category: {
    id: string;
    name: string;
  };
  price: number;
  priceFormatted: string;
  description: string;
  features: string[];
  status: 'active' | 'out_of_stock' | 'archived';
  stock?: number;
  providerStatus?: 'available' | 'empty' | string;
  imageUrl: string;
  popular?: boolean;
  brand?: string;
  providerCode?: string;
  provider_code?: string;
  guaranteeTitle?: string;
  guaranteeDesc?: string;
  processTitle?: string;
  processDesc?: string;
  privacyTitle?: string;
  privacyDesc?: string;
}

export const PRODUCTS_CATALOG: ProductItem[] = [];

/**
 * Authoritative helper to check if a catalog product or variant is out of stock.
 * Checks stock <= 0, providerStatus === 'empty', or status === 'out_of_stock'.
 */
export function isProductOutOfStock(product?: {
  stock?: number;
  providerStatus?: string;
  status?: string;
} | null): boolean {
  if (!product) return false;
  return (
    (product.stock !== undefined && product.stock <= 0) ||
    product.providerStatus === 'empty' ||
    product.status === 'out_of_stock'
  );
}

