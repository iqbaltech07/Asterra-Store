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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
      <div
        className="card-hover-elevation animate-kpi-reveal bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs space-y-1.5 sm:space-y-2 hover:border-primary/40 cursor-default"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
          <span className="font-medium truncate">Total Pesanan</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-foreground/5 flex items-center justify-center text-foreground-muted shrink-0">
            <FontAwesomeIcon icon={faBagShopping} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-foreground font-mono tracking-tight">
          <AnimatedNumber value={metrics?.total ?? 0} showDelta />
        </div>
        <span className="text-[10px] sm:text-[11px] text-foreground-muted block pt-1 border-t border-border/60 truncate">
          Semua riwayat transaksi
        </span>
      </div>

      <div
        className="card-hover-elevation animate-kpi-reveal bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs space-y-1.5 sm:space-y-2 hover:border-primary/40 cursor-default"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
          <span className="font-medium truncate">Menunggu Bayar</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-600 font-mono tracking-tight">
          <AnimatedNumber value={metrics?.pending ?? 0} showDelta />
        </div>
        <span className="text-[10px] sm:text-[11px] text-foreground-muted block pt-1 border-t border-border/60 truncate">
          Belum diselesaikan
        </span>
      </div>

      <div
        className="card-hover-elevation animate-kpi-reveal bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs space-y-1.5 sm:space-y-2 hover:border-primary/40 cursor-default"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
          <span className="font-medium truncate">Sedang Diproses</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-primary border border-blue-200/60 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-primary font-mono tracking-tight">
          <AnimatedNumber value={metrics?.processing ?? 0} showDelta />
        </div>
        <span className="text-[10px] sm:text-[11px] text-foreground-muted block pt-1 border-t border-border/60 truncate">
          Perlu pengiriman
        </span>
      </div>

      <div
        className="card-hover-elevation animate-kpi-reveal bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs space-y-1.5 sm:space-y-2 hover:border-primary/40 cursor-default"
        style={{ animationDelay: '180ms' }}
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
          <span className="font-medium truncate">Pesanan Selesai</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight">
          <AnimatedNumber value={metrics?.completed ?? 0} showDelta />
        </div>
        <span className="text-[10px] sm:text-[11px] text-foreground-muted block pt-1 border-t border-border/60 truncate">
          Berhasil terkirim
        </span>
      </div>

      <div
        className="card-hover-elevation animate-kpi-reveal bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-4 lg:p-5 shadow-xs col-span-2 md:col-span-1 xl:col-span-1 space-y-1.5 sm:space-y-2 hover:border-primary/40 cursor-default"
        style={{ animationDelay: '240ms' }}
      >
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-foreground-muted">
          <span className="font-medium truncate">Total Omset</span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faDollarSign} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-foreground truncate font-mono tracking-tight">
          <AnimatedNumber
            value={effectiveRevenue}
            formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
            showDelta
          />
        </div>
        <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium block pt-1 border-t border-border/60 truncate">
          Transaksi tervalidasi
        </span>
      </div>
    </div>
  );
}
