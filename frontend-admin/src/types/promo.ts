export interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  startDate: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromoUsage {
  id: string;
  promoCodeId: string;
  orderId: string | null;
  userEmail: string;
  discountApplied: number;
  createdAt: string;
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  description?: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountAmount?: number;
  finalTotal?: number;
  minOrderAmount?: number;
  maxDiscount?: number | null;
  message?: string;
  error?: string;
}
