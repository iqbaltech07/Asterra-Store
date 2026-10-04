'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faClock, faCircleCheck, faDollarSign } from '@fortawesome/free-solid-svg-icons';

export interface OrderMetrics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
}

interface OrderMetricsCardsProps {
  metrics?: OrderMetrics;
  totalRevenue?: number;
}

export function OrderMetricsCards({ metrics, totalRevenue }: OrderMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Total Pesanan</span>
          <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4 text-foreground-muted" />
        </div>
        <div className="text-2xl font-bold text-foreground">{metrics?.total ?? 0}</div>
        <span className="text-[11px] text-foreground-muted">Semua riwayat transaksi</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Menunggu Bayar</span>
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-status-warning" />
        </div>
        <div className="text-2xl font-bold text-status-warning">{metrics?.pending ?? 0}</div>
        <span className="text-[11px] text-foreground-muted">Belum diselesaikan</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Sedang Diproses</span>
          <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-primary" />
        </div>
        <div className="text-2xl font-bold text-primary">{metrics?.processing ?? 0}</div>
        <span className="text-[11px] text-foreground-muted">Perlu pengiriman</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Pesanan Selesai</span>
          <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-status-success" />
        </div>
        <div className="text-2xl font-bold text-status-success">{metrics?.completed ?? 0}</div>
        <span className="text-[11px] text-foreground-muted">Berhasil terkirim</span>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
          <span>Total Omset</span>
          <FontAwesomeIcon icon={faDollarSign} className="w-4 h-4 text-status-success" />
        </div>
        <div className="text-xl sm:text-2xl font-bold text-foreground truncate">
          Rp {(totalRevenue ?? 0).toLocaleString('id-ID')}
        </div>
        <span className="text-[11px] text-status-success font-medium">Transaksi tervalidasi</span>
      </div>
    </div>
  );
}
