/**
 * Centralized API Client Layer
 * Standardizes all client-side HTTP requests, query handling, and API endpoints.
 * Complies with Knowledge OS: Modular Component Architecture & Centralized API Pattern.
 */

import { Order } from '@/lib/orders-data';
import { ProductItem } from '@/lib/products-data';

export interface CreateOrderPayload {
  items: Array<{
    product_id: string;
    product_name: string;
    unit_price: number;
    quantity: number;
    purchased_details?: {
      target_email?: string;
      phone?: string;
      duration?: string;
    };
  }>;
  customer_notes?: string;
  payment_method?: string;
  promo_code?: string;
  customer_contact?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface PromoValidationResponse {
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

export interface PaymentConfigResponse {
  success: boolean;
  data: {
    mode: 'gateway' | 'manual';
    manualAccounts: Array<{
      id: string;
      bankName: string;
      accountNumber: string;
      accountHolder: string;
      qrImageUrl?: string;
      isActive: boolean;
    }>;
    enableUniqueCode: boolean;
    orderExpiryHours: number;
    whatsappNotificationNumber?: string;
    adminContactPhone?: string;
  };
}

/**
 * Core HTTP Request Wrapper with standard error handling
 */
async function requestJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok || (data && data.success === false)) {
    const errorMsg = data?.error || data?.message || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export interface OrdersApiResponse {
  success: boolean;
  data: Order[];
  pagination?: {
    total_items: number;
    current_page: number;
    total_pages: number;
    items_per_page: number;
  };
  metrics?: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    totalRevenue?: number;
  };
}

/**
 * Centralized Orders API
 */
export const OrdersApi = {
  async getAll(params?: { status?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.search?.trim()) query.append('search', params.search.trim());
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    return requestJson<OrdersApiResponse>(`/api/v1/admin/orders?${query.toString()}`);
  },

  async getById(orderId: string) {
    return requestJson<{ success: boolean; data: Order }>(`/api/v1/admin/orders/${orderId}`);
  },

  async create(payload: CreateOrderPayload) {
    return requestJson<{ success: boolean; order: Order; message?: string }>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateStatus(
    orderId: string,
    statusOrPayload: string | { status: string; notes?: string },
    notes?: string
  ) {
    const payload =
      typeof statusOrPayload === 'string'
        ? { status: statusOrPayload, notes }
        : statusOrPayload;

    return requestJson<{ success: boolean; data: Order; message?: string }>(
      `/api/v1/admin/orders/${orderId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  async pay(orderId: string, paymentMethod?: string) {
    return requestJson<{
      success: boolean;
      message?: string;
      payment: {
        id: string;
        order_id: string;
        amount: number;
        payment_method: string;
        transaction_id: string;
        payment_status: 'pending' | 'success';
        redirect_url?: string;
        checkout_url?: string;
        va_number?: string;
        qr_url?: string;
        qr_string?: string;
        expired_at?: string;
        instructions?: Array<{ title: string; steps: string[] }>;
      };
    }>(`/api/v1/orders/${orderId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payment_method: paymentMethod || 'qris' }),
    });
  },
};

/**
 * Centralized Promo Codes API
 */
export const PromosApi = {
  async validate(code: string, subtotal: number, userEmail?: string): Promise<PromoValidationResponse> {
    const json = await requestJson<{ success: boolean; data: PromoValidationResponse }>('/api/v1/promos/validate', {
      method: 'POST',
      body: JSON.stringify({
        code,
        subtotal,
        email: userEmail,
        user_email: userEmail,
      }),
    });
    return json.data;
  },
};

/**
 * Centralized Payment Config API
 */
export const PaymentConfigApi = {
  async getConfig(): Promise<PaymentConfigResponse> {
    return requestJson<PaymentConfigResponse>('/api/v1/payment-config');
  },

  async getPublicConfig(): Promise<{ success: boolean; data: import('@/lib/services/payment-config.service').PublicPaymentConfig }> {
    return requestJson<{ success: boolean; data: import('@/lib/services/payment-config.service').PublicPaymentConfig }>('/api/v1/payment-config');
  },

  async updateConfig(configData: Record<string, unknown>) {
    return requestJson<{ success: boolean; message: string }>('/api/v1/admin/payment-config', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  },
};

/**
 * Centralized Products Catalog API
 */
export const ProductsApi = {
  async getActive(params?: { category?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'Semua' && params.category !== 'all') {
      query.append('category', params.category);
    }
    if (params?.search?.trim()) {
      query.append('search', params.search.trim());
    }
    return requestJson<{ success: boolean; data: ProductItem[]; total: number }>(
      `/api/v1/products?${query.toString()}`
    );
  },

  async getById(id: string) {
    return requestJson<{ success: boolean; data: ProductItem & { durations?: Array<Record<string, unknown>> } }>(
      `/api/v1/products/${id}`
    );
  },
};
