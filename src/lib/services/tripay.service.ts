import crypto from 'crypto';
import { getAppBaseUrl } from '@/lib/utils/url';

export interface TripayCallbackPayload {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_method_code: string;
  total_amount: number;
  fee_merchant?: number;
  fee_customer?: number;
  total_fee?: number;
  amount_received?: number;
  is_closed_payment: number;
  status: 'PAID' | 'UNPAID' | 'FAILED' | 'EXPIRED' | 'REFUND';
  paid_at?: number;
  note?: string;
}

export interface TripayOrderItem {
  sku?: string;
  name: string;
  price: number;
  quantity: number;
  subtotal?: number;
  product_url?: string;
  image_url?: string;
}

export interface TripayCreateTransactionParams {
  method: string;
  merchantRef: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderItems: TripayOrderItem[];
  origin?: string;
  callbackUrl?: string;
  returnUrl?: string;
  expiredTime?: number;
}

export interface TripayCreateTransactionResponse {
  success: boolean;
  message?: string;
  data?: {
    reference: string;
    merchant_ref: string;
    payment_selection_type: string;
    payment_method: string;
    payment_name: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    callback_url?: string;
    return_url?: string;
    amount: number;
    fee_merchant: number;
    fee_customer: number;
    total_fee: number;
    amount_received: number;
    pay_code?: string | null;
    pay_url?: string | null;
    checkout_url: string;
    status: string;
    expired_time: number;
    qr_string?: string | null;
    qr_url?: string | null;
    instructions?: Array<{
      title: string;
      steps: string[];
    }>;
  };
}

export class TripayService {
  private static getPrivateKey(): string {
    return process.env.TRIPAY_PRIVATE_KEY || 'DEV-tripay-private-key-test-default';
  }

  private static getApiKey(): string {
    return process.env.TRIPAY_API_KEY || 'DEV-tripay-api-key-test-default';
  }

  private static getMerchantCode(): string {
    return process.env.TRIPAY_MERCHANT_CODE || 'T12345';
  }

  private static getBaseUrl(): string {
    const isProd = process.env.TRIPAY_IS_PRODUCTION === 'true';
    return isProd ? 'https://tripay.co.id/api' : 'https://tripay.co.id/api-sandbox';
  }

  /**
   * Verify HMAC SHA-256 signature sent by Tripay in X-Callback-Signature header
   */
  public static verifyCallbackSignature(rawBody: string, signatureFromHeader: string | null): boolean {
    if (!signatureFromHeader) return false;

    try {
      const privateKey = this.getPrivateKey();
      const hmac = crypto.createHmac('sha256', privateKey);
      hmac.update(rawBody);
      const computedSignature = hmac.digest('hex');

      const bufA = Buffer.from(computedSignature, 'utf-8');
      const bufB = Buffer.from(signatureFromHeader, 'utf-8');
      if (bufA.length !== bufB.length) return false;

      return crypto.timingSafeEqual(bufA, bufB);
    } catch (err) {
      console.warn('[TripayService] Signature verification exception:', err);
      return false;
    }
  }

  /**
   * Generate signature for creating a closed payment transaction
   */
  public static generateTransactionSignature(merchantRef: string, amount: number): string {
    const privateKey = this.getPrivateKey();
    const merchantCode = this.getMerchantCode();
    return crypto
      .createHmac('sha256', privateKey)
      .update(`${merchantCode}${merchantRef}${amount}`)
      .digest('hex');
  }

  /**
   * Create a closed transaction on Tripay API
   */
  public static async createTransaction(
    params: TripayCreateTransactionParams
  ): Promise<TripayCreateTransactionResponse> {
    const signature = this.generateTransactionSignature(params.merchantRef, params.amount);
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    const appOrigin = params.origin || getAppBaseUrl();
    const returnUrl = params.returnUrl || `${appOrigin}/orders`;
    const callbackUrl = params.callbackUrl || `${appOrigin}/api/v1/webhooks/tripay`;

    const expiredTime =
      params.expiredTime ||
      Math.floor(Date.now() / 1000) + 24 * 3600;

    const targetAmount = Math.round(params.amount);
    let items = params.orderItems.map((item, idx) => ({
      sku: item.sku || `ITEM-${idx + 1}`,
      name: item.name,
      price: Math.max(1, Math.round(item.price)),
      quantity: Math.max(1, item.quantity),
      subtotal: Math.max(1, Math.round(item.price)) * Math.max(1, item.quantity),
    }));

    const itemsTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);

    if (targetAmount < itemsTotal) {
      // Order has a discount (voucher). Tripay requires price >= 1 and rejects negative price items.
      // Proportionally scale item prices down so that every item remains valid and positive.
      let allocated = 0;
      items = items.map((item, idx) => {
        if (idx === items.length - 1) {
          const remaining = Math.max(item.quantity, targetAmount - allocated);
          const unitPrice = Math.max(1, Math.floor(remaining / item.quantity));
          return {
            ...item,
            price: unitPrice,
            subtotal: unitPrice * item.quantity,
          };
        }
        const proportionalSubtotal = Math.max(
          item.quantity,
          Math.floor((item.subtotal / itemsTotal) * targetAmount)
        );
        const unitPrice = Math.max(1, Math.floor(proportionalSubtotal / item.quantity));
        const actualSubtotal = unitPrice * item.quantity;
        allocated += actualSubtotal;
        return {
          ...item,
          price: unitPrice,
          subtotal: actualSubtotal,
        };
      });

      // Adjust last item by exact remainder if integer division produced slight discrepancy
      const newTotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
      const diff = targetAmount - newTotal;
      if (diff !== 0 && items.length > 0) {
        items[items.length - 1].price = Math.max(1, items[items.length - 1].price + diff);
        items[items.length - 1].subtotal = items[items.length - 1].price * items[items.length - 1].quantity;
      }
    } else if (targetAmount > itemsTotal) {
      // Order has extra fee or unique code. Diff > 0 is positive, so Tripay allows ADJUSTMENT item.
      const diff = targetAmount - itemsTotal;
      items.push({
        sku: 'BIAYA-TAMBAHAN',
        name: 'Kode Unik / Penyesuaian Transaksi',
        price: diff,
        quantity: 1,
        subtotal: diff,
      });
    }

    const payload = {
      method: params.method,
      merchant_ref: params.merchantRef,
      amount: Math.round(params.amount),
      customer_name: params.customerName?.trim() || 'Pelanggan Asterra',
      customer_email: params.customerEmail?.trim() || 'customer@asterra.store',
      customer_phone: params.customerPhone?.trim() || '081234567890',
      order_items: items,
      callback_url: callbackUrl,
      return_url: returnUrl,
      expired_time: expiredTime,
      signature: signature,
    };

    try {
      const res = await fetch(`${baseUrl}/transaction/create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      return json;
    } catch (err) {
      console.error('[TripayService] Failed to create transaction:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Koneksi ke gateway Tripay gagal.',
      };
    }
  }

  /**
   * Helper to fetch available Tripay payment channels (QRIS, VA, E-Wallet)
   */
  public static async getPaymentChannels() {
    try {
      const res = await fetch(`${this.getBaseUrl()}/merchant/payment-channel`, {
        headers: {
          Authorization: `Bearer ${this.getApiKey()}`,
        },
      });
      return await res.json();
    } catch (err) {
      console.warn('[TripayService] Failed to fetch Tripay channels:', err);
      return { success: false, data: [] };
    }
  }
}
