/**
 * Centralized Order Mapper Utility
 * Standardizes transformation of Prisma PostgreSQL order records into domain Order entities.
 * Eliminates redundant code duplication across orders APIs and admin services.
 */

import { Order, OrderItem } from '@/lib/orders-data';

export interface RawDbOrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  targetEmail?: string | null;
  targetPhone?: string | null;
  duration?: string | null;
}

export interface RawDbOrderLog {
  id?: string;
  orderId?: string;
  actor?: string;
  action?: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date | string;
}

export interface RawDbOrder {
  id: string;
  customerName?: string | null;
  customerEmail: string;
  customerWhatsapp?: string | null;
  customerNotes?: string | null;
  totalAmount: number;
  rawAmount?: number | null;
  uniqueCode?: number | null;
  promoCode?: string | null;
  discountAmount?: number | null;
  paymentMode?: string | null;
  status: string;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  paymentStatus?: string | null;
  createdAt?: Date | string;
  paidAt?: Date | string | null;
  expiresAt?: Date | string | null;
  items?: RawDbOrderItem[] | null;
  logs?: RawDbOrderLog[] | null;
}

/**
 * Maps a Prisma Order database record to the domain Order interface
 */
export function mapDbOrderToOrder(d: RawDbOrder): Order {
  const rawObj = d as unknown as Record<string, unknown>;
  const logsList = Array.isArray(d.logs) ? (d.logs as RawDbOrderLog[]) : [];

  // Extract promo code from direct columns, logs metadata, or notes pattern
  const promoLog = logsList.find(
    (l) => l.action === 'promo_applied' || !!l.metadata?.promo_code
  );
  const promoLogMeta = promoLog?.metadata as Record<string, unknown> | undefined;
  const promoLogNotes = typeof promoLog?.notes === 'string' ? promoLog.notes : '';

  const promoCode =
    (typeof rawObj.promoCode === 'string' ? rawObj.promoCode : undefined) ||
    (typeof promoLogMeta?.promo_code === 'string' ? (promoLogMeta.promo_code as string) : undefined) ||
    promoLogNotes.match(/voucher\s+["']?([A-Z0-9_-]+)/i)?.[1] ||
    undefined;

  // Extract referral code from direct columns, logs metadata, or notes pattern [Sales Ref: CODE]
  const referralLog = logsList.find(
    (l) => l.action === 'referral_applied' || !!l.metadata?.referral_code
  );
  const referralLogMeta = referralLog?.metadata as Record<string, unknown> | undefined;
  const referralNotes = typeof d.customerNotes === 'string' ? d.customerNotes : '';
  const referralNotesMatch = referralNotes.match(/\[Sales Ref:\s*([A-Za-z0-9_-]+)\]/i);

  const referralCode =
    (typeof rawObj.referralCode === 'string' ? rawObj.referralCode : undefined) ||
    (typeof rawObj.referral_code === 'string' ? (rawObj.referral_code as string) : undefined) ||
    (typeof referralLogMeta?.referral_code === 'string' ? (referralLogMeta.referral_code as string) : undefined) ||
    referralNotesMatch?.[1] ||
    undefined;

  // Extract discount amount
  const discountAmount =
    typeof rawObj.discountAmount === 'number'
      ? (rawObj.discountAmount as number)
      : typeof promoLogMeta?.discount_amount === 'number'
      ? (promoLogMeta.discount_amount as number)
      : d.rawAmount && d.totalAmount && d.rawAmount > d.totalAmount
      ? d.rawAmount - (d.totalAmount - (d.uniqueCode || 0))
      : undefined;

  // Map order items
  const items: OrderItem[] =
    Array.isArray(d.items) && d.items.length > 0
      ? d.items.map((i) => ({
          id: i.id,
          product_id: i.productId,
          product_name: i.productName,
          unit_price: i.price,
          quantity: i.quantity,
          purchased_details: {
            target_email: i.targetEmail || d.customerEmail,
            phone: i.targetPhone || d.customerWhatsapp || '',
            duration: i.duration || 'standard',
          },
        }))
      : [
          {
            id: `item-${d.id}-1`,
            product_id: 'prod-digital',
            product_name: 'Lisensi Layanan Digital',
            unit_price: d.totalAmount,
            quantity: 1,
            purchased_details: {
              target_email: d.customerEmail,
              phone: d.customerWhatsapp || '',
              duration: 'standard',
            },
          },
        ];

  const orderDate = d.createdAt
    ? typeof d.createdAt === 'string'
      ? d.createdAt
      : d.createdAt.toISOString()
    : new Date().toISOString();

  const paidAt = d.paidAt
    ? typeof d.paidAt === 'string'
      ? d.paidAt
      : d.paidAt.toISOString()
    : undefined;

  const expiresAt = d.expiresAt
    ? typeof d.expiresAt === 'string'
      ? d.expiresAt
      : d.expiresAt.toISOString()
    : undefined;

  const orderStatus = (d.status as Order['order_status']) || 'pending';

  return {
    id: d.id || (rawObj.id as string) || `ORD-${Date.now()}`,
    user_id: 'user-001',
    customer_email: d.customerEmail,
    customer_name: d.customerName || undefined,
    customer_whatsapp: d.customerWhatsapp || undefined,
    customer_notes: d.customerNotes || undefined,
    total_amount: d.totalAmount,
    raw_amount: d.rawAmount || undefined,
    unique_code: d.uniqueCode || undefined,
    promo_code: promoCode,
    referral_code: referralCode,
    discount_amount: discountAmount,
    payment_mode: (d.paymentMode as 'gateway' | 'manual') || 'gateway',
    order_status: orderStatus,
    order_date: orderDate,
    paid_at: paidAt,
    expires_at: expiresAt,
    items,
    logs: logsList.map((l) => ({
      id: l.id || `log-${Math.random()}`,
      order_id: l.orderId || d.id,
      actor: (l.actor as 'customer' | 'admin' | 'tripay_webhook' | 'system') || 'system',
      action: l.action || 'status_updated',
      previous_status: l.previousStatus || undefined,
      new_status: l.newStatus || undefined,
      notes: l.notes || undefined,
      metadata: l.metadata || undefined,
      created_at: l.createdAt
        ? typeof l.createdAt === 'string'
          ? l.createdAt
          : l.createdAt.toISOString()
        : new Date().toISOString(),
    })),
    payment: {
      id: `pay-${d.id}`,
      payment_method: d.paymentMethod || 'qris',
      transaction_id: d.paymentReference || `trx-tripay-${d.id.replace(/\D/g, '')}`,
      payment_status:
        orderStatus === 'completed' || orderStatus === 'processing'
          ? 'success'
          : 'pending',
      amount: d.totalAmount,
    },
  };
}
