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
  referral_code?: string;
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
 * Robust fetch wrapper with automatic retry on transient cold-start errors (404, 502, 503, 504)
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries: number = 2
): Promise<Response> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && (res.status === 404 || res.status >= 502) && attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      return res;
    } catch (err) {
      if (attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Core HTTP Request Wrapper with standard error handling and cold-start resilience
 */
async function requestJson<T>(
  url: string,
  options?: RequestInit,
  retries: number = 2
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
        ...options,
      });

      if (!res.ok && (res.status === 404 || res.status >= 502) && attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }

      const data = await res.json();
      if (!res.ok || (data && data.success === false)) {
        const errorMsg =
          (typeof data?.detail === 'string' ? data?.detail : data?.detail?.message) ||
          data?.error ||
          data?.message ||
          data?.data?.error ||
          data?.data?.message ||
          `Request failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (err) {
      if (attempt < retries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 600 * attempt));
        continue;
      }
      throw err;
    }
  }
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

  async completeManual(
    orderId: string,
    payload: {
      credentials: Array<{ label: string; value: string }>;
      notes?: string;
    }
  ) {
    return requestJson<{
      success: boolean;
      message: string;
      email_sent: boolean;
      email_status: 'sent' | 'failed' | 'pending';
      order: Order;
    }>(`/api/v1/admin/orders/${orderId}/complete-manual`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async resendCompletionEmail(orderId: string) {
    return requestJson<{
      success: boolean;
      message: string;
      email_status: 'sent' | 'failed' | 'pending';
      email_error?: string;
      order: Order;
    }>(`/api/v1/admin/orders/${orderId}/resend-completion-email`, {
      method: 'POST',
    });
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
  async validate(
    code: string,
    subtotal: number,
    userEmail?: string,
    items?: Array<{ id?: string; product_id?: string; quantity?: number; price?: number; priceNumeric?: number }>,
    referralDiscount?: number
  ): Promise<PromoValidationResponse> {
    const json = await requestJson<{ success: boolean; data: PromoValidationResponse }>('/api/v1/promos/validate', {
      method: 'POST',
      body: JSON.stringify({
        code,
        subtotal,
        email: userEmail,
        user_email: userEmail,
        items,
        referral_discount: referralDiscount,
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

  async getPublicConfig(): Promise<{ success: boolean; data: import('@/types/payment').PublicPaymentConfig }> {
    return requestJson<{ success: boolean; data: import('@/types/payment').PublicPaymentConfig }>('/api/v1/payment-config');
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

/**
 * Store Operating Hours API
 */
export interface WeeklyScheduleDay {
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export type WeeklySchedule = Record<string, WeeklyScheduleDay>;

export interface StoreOperatingHoursStatus {
  status: 'open' | 'closed';
  isOpen: boolean;
  is_open: boolean;
  mode: 'auto' | 'manual_open' | 'manual_closed';
  statusLabel: string;
  currentTimeWIB: string;
  currentDay: string;
  currentDayID: string;
  nextOpenAt: string | null;
  nextOpenDisplay: string | null;
  next_open_display: string | null;
  nextCloseAt: string | null;
  nextCloseDisplay: string | null;
  bannerMessage: string | null;
  banner_message: string | null;
  allowPreorder: boolean;
  allow_preorder: boolean;
  weeklySchedule: WeeklySchedule;
  manualCloseReason: string | null;
  reopenEstimate: string | null;
  sleepingAdminNote?: string | null;
  timezone: string;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface AdminStoreHoursResponse {
  success: boolean;
  data: {
    config: {
      id: string;
      mode: 'auto' | 'manual_open' | 'manual_closed';
      weeklySchedule: WeeklySchedule;
      manualCloseReason: string | null;
      reopenEstimate: string | null;
      allowPreorder: boolean;
      timezone: string;
      updatedBy: string | null;
      updatedAt: string | null;
    };
    status: StoreOperatingHoursStatus;
  };
}

export const StoreHoursApi = {
  async getStatus(): Promise<{ success: boolean; data: StoreOperatingHoursStatus }> {
    return requestJson<{ success: boolean; data: StoreOperatingHoursStatus }>('/api/v1/store/operating-hours');
  },

  async getAdminConfig(): Promise<AdminStoreHoursResponse> {
    return requestJson<AdminStoreHoursResponse>('/api/v1/admin/store/operating-hours');
  },

  async updateConfig(payload: {
    mode: 'auto' | 'manual_open' | 'manual_closed';
    weeklySchedule: WeeklySchedule;
    manualCloseReason?: string | null;
    reopenEstimate?: string | null;
    allowPreorder: boolean;
  }): Promise<{ success: boolean; message: string; data: AdminStoreHoursResponse['data'] }> {
    return requestJson<{ success: boolean; message: string; data: AdminStoreHoursResponse['data'] }>(
      '/api/v1/admin/store/operating-hours',
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    );
  },
};

/**
 * System Order Processing & Reseller API Configuration
 */
export interface OrderProcessingConfig {
  id: string;
  orderMode: 'manual' | 'automatic';
  order_mode: 'manual' | 'automatic';
  activeReseller: string;
  active_reseller: string;
  autoFulfillOnPayment: boolean;
  auto_fulfill_on_payment: boolean;
  notifyAdminOnManualOrder: boolean;
  notify_admin_on_manual_order: boolean;
  updatedBy?: string;
  updated_by?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface ResellerConfigItem {
  id: string;
  name: string;
  baseUrl?: string;
  base_url?: string;
  isActive?: boolean;
  is_active?: boolean;
  environment?: string;
  hasApiKey?: boolean;
  has_api_key?: boolean;
  hasApiSign?: boolean;
  has_api_sign?: boolean;
  maskedApiKey?: string;
  masked_api_key?: string;
  maskedApiSign?: string;
  masked_api_sign?: string;
  isSupported?: boolean;
  is_supported?: boolean;
  isProductionReady?: boolean;
  is_production_ready?: boolean;
  readiness?: 'ready' | 'unsupported';
  isConnected?: boolean;
  is_connected?: boolean;
  balance?: number | null;
  username?: string | null;
  capabilities?: {
    supports_balance?: boolean;
    supports_status_check?: boolean;
    supports_webhook?: boolean;
    supports_stock_sync?: boolean;
    is_production_ready?: boolean;
    documentation?: string;
    notes?: string;
  };
}

export const ConfigApi = {
  async getOrderProcessing() {
    return requestJson<{ success: boolean; data: OrderProcessingConfig }>('/api/v1/admin/config/order-processing');
  },

  async updateOrderProcessing(payload: {
    orderMode: 'manual' | 'automatic';
    activeReseller?: string;
    autoFulfillOnPayment?: boolean;
    notifyAdminOnManualOrder?: boolean;
  }) {
    return requestJson<{ success: boolean; message: string; data: OrderProcessingConfig }>(
      '/api/v1/admin/config/order-processing',
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  async getResellerConfigs() {
    return requestJson<{ success: boolean; data: ResellerConfigItem[] }>('/api/v1/admin/config/reseller-api');
  },

  async updateResellerConfig(providerId: string, payload: {
    baseUrl?: string;
    apiKey?: string;
    apiSign?: string;
    isActive?: boolean;
    environment?: string;
  }) {
    return requestJson<{ success: boolean; message: string; data: ResellerConfigItem }>(
      `/api/v1/admin/config/reseller-api/${providerId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }
    );
  },

  async testResellerConnection(providerId: string) {
    return requestJson<{
      success: boolean;
      message: string;
      data: {
        connected: boolean;
        latency_ms?: number;
        balance?: number;
        username?: string;
        message?: string;
      };
    }>(`/api/v1/admin/config/reseller-api/${providerId}/test-connection`, {
      method: 'POST',
    });
  },
};
