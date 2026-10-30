/**
 * Centralized formatting and utility helpers
 * Single source of truth for Indonesian currency, WhatsApp URLs, dates, and order validation summaries.
 */

import { Order } from '@/lib/orders-data';

/**
 * Format numbers to standard Indonesian Rupiah (Rp XX.XXX)
 */
export function formatRupiah(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`;
}

/**
 * Clean and format Indonesian phone numbers into standard WhatsApp wa.me URLs
 */
export function formatWhatsAppUrl(phone?: string | null, customText?: string): string | null {
  if (!phone) return null;
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62') && clean.length > 0) {
    clean = '62' + clean;
  }
  if (!clean || clean.length < 8) return null;

  const baseUrl = `https://wa.me/${clean}`;
  if (customText) {
    return `${baseUrl}?text=${encodeURIComponent(customText)}`;
  }
  return baseUrl;
}

/**
 * Format dates into localized Indonesian date-time string
 */
export function formatDateTimeIndo(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateInput);
  }
}

/**
 * Generate standard plain-text order validation summary for one-click clipboard copying
 */
export function generateOrderValidationText(order: Order): string {
  const firstItem = order.items?.[0];
  const targetEmail = firstItem?.purchased_details?.target_email || order.customer_email || '-';
  const duration = firstItem?.purchased_details?.duration || 'Standard';

  const voucherInfo =
    order.promo_code || (order.discount_amount && order.discount_amount > 0)
      ? `\nVoucher: ${order.promo_code || 'PROMO'} (-Rp ${(order.discount_amount || 0).toLocaleString('id-ID')})`
      : `\nVoucher: Tanpa Voucher (Rp 0)`;

  const rawSubtotal = order.raw_amount
    ? `\nSubtotal: Rp ${order.raw_amount.toLocaleString('id-ID')}`
    : '';

  const uniqueCodeText = order.unique_code
    ? `\nKode Unik: +Rp ${order.unique_code.toLocaleString('id-ID')}`
    : '';

  return (
    `[ASTERRA STORE — VALIDASI PESANAN]\n` +
    `ID Pesanan: ${order.id}\n` +
    `Tanggal: ${formatDateTimeIndo(order.order_date)}\n` +
    `Nama Customer: ${order.customer_name || 'Pelanggan'}\n` +
    `Email Pemesan: ${order.customer_email || '-'}\n` +
    `Target Akun: ${targetEmail} (${duration})\n` +
    `No WhatsApp: ${order.customer_whatsapp || '-'}` +
    `${rawSubtotal}` +
    `${voucherInfo}` +
    `${uniqueCodeText}\n` +
    `Total Tagihan: Rp ${order.total_amount.toLocaleString('id-ID')}\n` +
    `Status: ${order.order_status.toUpperCase()}\n` +
    `Metode Bayar: ${order.payment?.payment_method?.toUpperCase() || 'QRIS'}`
  );
}
