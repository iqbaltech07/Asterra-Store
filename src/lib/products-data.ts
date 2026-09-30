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
  guaranteeTitle?: string;
  guaranteeDesc?: string;
  processTitle?: string;
  processDesc?: string;
  privacyTitle?: string;
  privacyDesc?: string;
}

export const PRODUCTS_CATALOG: ProductItem[] = [];
