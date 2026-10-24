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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <div className="animate-fade-up stagger-1 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium">Total Pesanan</span>
          <div className="w-7 h-7 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-muted">
            <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono tracking-tight">
          <AnimatedNumber value={metrics?.total ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted block pt-1 border-t border-border/60">
          Semua riwayat transaksi
        </span>
      </div>

      <div className="animate-fade-up stagger-2 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium">Menunggu Bayar</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
            <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
          <AnimatedNumber value={metrics?.pending ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted block pt-1 border-t border-border/60">
          Belum diselesaikan
        </span>
      </div>

      <div className="animate-fade-up stagger-3 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium">Sedang Diproses</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center">
            <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-primary font-mono tracking-tight">
          <AnimatedNumber value={metrics?.processing ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted block pt-1 border-t border-border/60">
          Perlu pengiriman
        </span>
      </div>

      <div className="animate-fade-up stagger-4 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium">Pesanan Selesai</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
          <AnimatedNumber value={metrics?.completed ?? 0} showDelta />
        </div>
        <span className="text-[11px] text-foreground-muted block pt-1 border-t border-border/60">
          Berhasil terkirim
        </span>
      </div>

      <div className="animate-fade-up stagger-5 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs col-span-1 sm:col-span-2 md:col-span-1 xl:col-span-1 space-y-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <span className="font-medium">Total Omset</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <FontAwesomeIcon icon={faDollarSign} className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-extrabold text-foreground truncate font-mono tracking-tight">
          <AnimatedNumber
            value={effectiveRevenue}
            formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
            showDelta
          />
        </div>
        <span className="text-[11px] text-emerald-600 font-medium block pt-1 border-t border-border/60">
          Transaksi tervalidasi
        </span>
      </div>
    </div>
  );
}
