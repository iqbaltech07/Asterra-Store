import { ParsedVariant } from '@/lib/services/product-variant-parser';

export interface DurationOption {
  id: string;
  label: string;
  price: number;
  multiplier: number;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  imageUrl: string;
  stock?: number;
  providerStatus?: string;
  brand?: string;
  providerCode?: string;
}

export interface ProductDetailData {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  description: string;
  features: string[];
  status: 'active' | 'out_of_stock' | 'archived';
  providerStatus?: 'available' | 'empty' | 'maintenance' | 'unknown' | string;
  stock?: number;
  imageUrl: string;
  popular?: boolean;
  brand?: string;
  providerCode?: string;
  guaranteeTitle?: string | null;
  guaranteeDesc?: string | null;
  processTitle?: string | null;
  processDesc?: string | null;
  privacyTitle?: string | null;
  privacyDesc?: string | null;
  durations: DurationOption[];
  specifications: SpecItem[];
  faqs: FaqItem[];
  relatedProducts: RelatedProduct[];
  variants?: ParsedVariant[];
  selectedVariant?: ParsedVariant;
  familySlug?: string;
  familyImageUrl?: string;
  rating?: string;
  soldCount?: number;
}

export interface ProductDetailClientProps {
  id: string;
  initialData?: ProductDetailData | null;
}

export interface VariantDetails {
  title: string;
  desc: string;
  features: string[];
  guaranteeTitle: string;
  guaranteeDesc: string;
  processTitle: string;
  processDesc: string;
  privacyTitle: string;
  privacyDesc: string;
  specifications: SpecItem[];
  warrantyText: string;
}
