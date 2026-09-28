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
  imageUrl: string;
  popular?: boolean;
}

export const PRODUCTS_CATALOG: ProductItem[] = [];
