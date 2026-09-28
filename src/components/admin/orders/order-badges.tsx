import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Order, OrderLog } from '@/lib/orders-data';
import { CheckCircle2, Clock, Ban } from 'lucide-react';

export function OrderStatusBadge({ status }: { status: Order['order_status'] }) {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-success/15 text-status-success border border-status-success/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Selesai</span>
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          <span>Di Proses</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-error/15 text-status-error border border-status-error/30">
          <Ban className="w-3.5 h-3.5" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-status-warning/15 text-status-warning border border-status-warning/30">
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Bayar</span>
        </span>
      );
  }
}

export function OrderActorBadge({ actor }: { actor?: OrderLog['actor'] | string }) {
  switch (actor) {
    case 'admin':
      return (
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
          Admin Manual
        </Badge>
      );
    case 'tripay_webhook':
      return (
        <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/30 text-[10px]">
          Tripay Gateway
        </Badge>
      );
    case 'customer':
      return (
        <Badge variant="outline" className="bg-surface-raised text-foreground-muted border-border text-[10px]">
          Pelanggan
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-surface-raised text-foreground-muted border-border text-[10px]">
          Sistem
        </Badge>
      );
  }
}
