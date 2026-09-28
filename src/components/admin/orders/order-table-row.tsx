'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/lib/orders-data';
import { Clock, Mail, Copy, Phone, ExternalLink, Ticket, CreditCard } from 'lucide-react';
import { formatWhatsAppUrl, formatDateTimeIndo } from '@/lib/utils/format';

import { OrderStatusBadge } from './order-badges';

interface OrderTableRowProps {
  order: Order;
  onOpenDetail: (order: Order) => void;
  onCopyEmail: (email: string) => void;
}

export function OrderTableRow({ order, onOpenDetail, onCopyEmail }: OrderTableRowProps) {
  const firstItem = order.items?.[0];
  const extraItemsCount = (order.items?.length || 0) - 1;
  const waUrl = formatWhatsAppUrl(order.customer_whatsapp);

  return (
    <tr className="hover:bg-surface-raised/40 transition-colors border-b border-border/60">
      {/* Order ID & Date */}
      <td className="py-3.5 px-4 align-top">
        <div className="font-mono font-bold text-foreground text-xs flex items-center gap-1.5">
          <span>{order.id}</span>
        </div>
        <div className="text-[11px] text-foreground-muted flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{formatDateTimeIndo(order.order_date)}</span>
        </div>
      </td>

      {/* Customer Contact & Validation Info */}
      <td className="py-3.5 px-4 align-top">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
            {(order.customer_name || order.customer_email || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-xs leading-snug">
              {order.customer_name || 'Pelanggan Toko'}
            </div>
            <div className="text-[11px] text-foreground-muted flex items-center gap-1.5 mt-0.5 group/email">
              <Mail className="w-3 h-3 shrink-0 text-foreground-muted" />
              <a
                href={`mailto:${order.customer_email || firstItem?.purchased_details?.target_email || 'customer@asterra.store'}`}
                className="hover:text-primary hover:underline truncate max-w-[170px]"
                title="Kirim email ke pelanggan"
              >
                {order.customer_email || firstItem?.purchased_details?.target_email || 'customer@asterra.store'}
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyEmail(order.customer_email || firstItem?.purchased_details?.target_email || '');
                }}
                className="opacity-0 group-hover/email:opacity-100 hover:text-foreground transition-opacity"
                title="Salin Email"
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
            </div>
            {order.customer_whatsapp && (
              <div className="mt-1 flex items-center gap-1.5">
                {waUrl ? (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-status-success hover:underline font-mono"
                    title="Chat WhatsApp Pemesan"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{order.customer_whatsapp}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[11px] text-foreground-muted font-mono">
                    {order.customer_whatsapp}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Products */}
      <td className="py-3.5 px-4 align-top">
        {firstItem ? (
          <div>
            <span className="font-medium text-foreground block truncate max-w-[200px]">
              {firstItem.product_name}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-foreground-muted">
              <span>Qty: {firstItem.quantity}x</span>
              {firstItem.purchased_details?.duration && (
                <span className="bg-surface-raised px-1.5 py-0.2 rounded border border-border text-[10px]">
                  {firstItem.purchased_details.duration}
                </span>
              )}
            </div>
            {extraItemsCount > 0 && (
              <span className="inline-block mt-1 text-[10px] text-primary font-medium">
                +{extraItemsCount} item lainnya
              </span>
            )}
          </div>
        ) : (
          <span className="text-foreground-muted italic">Tidak ada item</span>
        )}
      </td>

      {/* Total & Payment Method & Voucher Information */}
      <td className="py-3.5 px-4 align-top">
        <div className="font-bold text-foreground font-mono text-xs flex items-center gap-1">
          <span>Rp {order.total_amount.toLocaleString('id-ID')}</span>
          {order.unique_code && (
            <span className="text-[10px] text-primary font-mono" title={`Kode Unik Verifikasi: +${order.unique_code}`}>
              (+{order.unique_code})
            </span>
          )}
        </div>

        {/* Transparent Voucher Badge */}
        <div className="mt-1">
          {order.promo_code || (order.discount_amount && order.discount_amount > 0) ? (
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-medium"
              title={`Voucher: ${order.promo_code || 'Promo'} - Potongan: Rp ${(order.discount_amount || 0).toLocaleString('id-ID')}`}
            >
              <Ticket className="w-2.5 h-2.5 shrink-0" />
              <span>{order.promo_code || 'PROMO'}</span>
              <span>(-Rp {(order.discount_amount || 0).toLocaleString('id-ID')})</span>
            </div>
          ) : (
            <span className="text-[10px] text-foreground-muted block font-mono">
              Tanpa Voucher
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          <Badge
            variant="outline"
            className="bg-surface-raised border-border text-[10px] uppercase font-mono py-0 px-1.5"
          >
            <CreditCard className="w-2.5 h-2.5 mr-1" />
            {order.payment?.payment_method || 'QRIS'}
          </Badge>
          {order.payment_mode === 'manual' ? (
            <Badge className="bg-status-warning/15 text-status-warning border-status-warning/30 text-[9px] font-mono py-0 px-1">
              Manual
            </Badge>
          ) : (
            <Badge className="bg-status-success/15 text-status-success border-status-success/30 text-[9px] font-mono py-0 px-1">
              Gateway
            </Badge>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="py-3.5 px-4 align-top">
        <OrderStatusBadge status={order.order_status} />
      </td>

      {/* Action */}
      <td className="py-3.5 px-4 align-top text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpenDetail(order)}
          className="h-8 text-xs gap-1.5 border-border hover:bg-surface-raised font-medium"
        >
          <span>Detail & Status</span>
        </Button>
      </td>
    </tr>
  );
}
