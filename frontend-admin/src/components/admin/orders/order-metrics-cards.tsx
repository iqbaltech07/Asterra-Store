'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faClock, faCircleCheck, faDollarSign } from '@fortawesome/free-solid-svg-icons';
import { AnimatedNumber } from '@/components/ui/animated-number';

export interface OrderMetrics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  totalRevenue?: number;
}

interface OrderMetricsCardsProps {
  metrics?: OrderMetrics;
  totalRevenue?: number;
}

export function OrderMetricsCards({ metrics, totalRevenue }: OrderMetricsCardsProps) {
  const effectiveRevenue = totalRevenue ?? metrics?.totalRevenue ?? 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      <div className="animate-fade-up stagger-1 motion-card-interactive bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Total Pesanan</span>
          <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4 text-foreground-muted" />
        </div>
        <div className="text-2xl font-bold text-foreground font-variant-numeric tabular-nums">
          <AnimatedNumber value={metrics?.total ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted">Semua riwayat transaksi</span>
      </div>

      <div className="animate-fade-up stagger-2 motion-card-interactive bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Menunggu Bayar</span>
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-status-warning" />
        </div>
        <div className="text-2xl font-bold text-status-warning font-variant-numeric tabular-nums">
          <AnimatedNumber value={metrics?.pending ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted">Belum diselesaikan</span>
      </div>

      <div className="animate-fade-up stagger-3 motion-card-interactive bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Sedang Diproses</span>
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-primary font-variant-numeric tabular-nums">
          <AnimatedNumber value={metrics?.processing ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted">Perlu pengiriman</span>
      </div>

      <div className="animate-fade-up stagger-4 motion-card-interactive bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Pesanan Selesai</span>
          <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-status-success" />
        </div>
        <div className="text-2xl font-bold text-status-success font-variant-numeric tabular-nums">
          <AnimatedNumber value={metrics?.completed ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted">Berhasil terkirim</span>
      </div>

      <div className="animate-fade-up stagger-5 motion-card-interactive bg-surface border border-border rounded-xl p-4 col-span-2 lg:col-span-1 shadow-xs">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Total Omset</span>
          <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4 text-status-success" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-foreground truncate font-variant-numeric tabular-nums">
          <AnimatedNumber
            value={effectiveRevenue}
            formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
            showDelta
          />
        </div>
        <span className="text-[11px] text-status-success font-medium">Transaksi tervalidasi</span>
      </div>
    </div>
  );
}
