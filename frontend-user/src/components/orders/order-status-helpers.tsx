'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/lib/orders-data';

export const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'processing', label: 'Pesanan Diproses' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export function OrderCountdownBadge({
  expiresAt,
  onExpired,
}: {
  expiresAt?: string;
  onExpired?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    let hasNotified = false;

    const update = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setTimeLeft('Waktu Habis');
        setIsExpired(true);
        if (!hasNotified) {
          hasNotified = true;
          onExpired?.();
        }
        return;
      }
      const totalSec = Math.floor(diff / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setTimeLeft(`${h}j ${m}m ${s}d`);
      setIsExpired(false);
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, onExpired]);

  if (!expiresAt || !timeLeft) return null;

  return (
    <span
      className={`text-[10px] tabular-nums font-medium px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
        isExpired
          ? 'bg-status-error/10 text-status-error border-status-error/30'
          : 'bg-status-warning/10 text-status-warning border-status-warning/30'
      }`}
      title="Batas Waktu Pembayaran 24 Jam"
    >
      <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
      <span>{timeLeft}</span>
    </span>
  );
}

export function isOrderExpired(order: Order): boolean {
  const status = (
    order.order_status ||
    (order as unknown as { status?: string }).status ||
    ''
  ).toLowerCase();
  if (status === 'cancelled') return true;
  const expiresAt = order.expires_at || (order as unknown as { expiresAt?: string }).expiresAt;
  if (status === 'pending' && expiresAt) {
    return new Date(expiresAt).getTime() < Date.now();
  }
  return false;
}

export function getStatusBadge(status: Order['order_status']) {
  switch (status) {
    case 'completed':
      return (
        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#dcfae5] text-[#04250e] border border-[#bbf7d0] font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] shrink-0" />
          <span>Selesai</span>
        </span>
      );
    case 'processing':
      return (
        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd] font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] shrink-0" />
          <span>Pesanan Diproses</span>
        </span>
      );
    case 'pending':
      return (
        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#fffbeb] text-[#92400e] border border-[#fef3c7] font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] shrink-0" />
          <span>Menunggu Pembayaran</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#ffedea] text-[#831c1e] border border-[#fecdd3] font-medium inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] shrink-0" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-[#f4f4f5] text-[#3f3f46] border border-[#e4e4e7] font-medium">
          {status}
        </span>
      );
  }
}

export function formatFriendlyPaymentMethod(rawMethod?: string): string {
  if (!rawMethod) return 'Pembayaran Instan';
  const m = rawMethod.toLowerCase().trim();
  if (m === 'manual_qris' || m === 'qris_manual') return 'QRIS (Verifikasi Manual)';
  if (m === 'manual_bca') return 'Transfer Bank BCA';
  if (m === 'manual_dana') return 'Transfer DANA';
  if (m.includes('qris')) return 'QRIS Instan';
  if (m.includes('bcava') || m === 'bca_va') return 'BCA Virtual Account';
  if (m.includes('mandiriva') || m === 'mandiri_va') return 'Mandiri Virtual Account';
  if (m.includes('briva') || m === 'bri_va') return 'BRI Virtual Account';
  if (m.includes('bniva') || m === 'bni_va') return 'BNI Virtual Account';
  if (m.includes('dana')) return 'DANA E-Wallet';
  if (m.includes('ovo')) return 'OVO';
  if (m.includes('shopeepay')) return 'ShopeePay';
  if (m.includes('saldo')) return 'Saldo Akun Asterra';
  return rawMethod.replace(/_/g, ' ').toUpperCase();
}

export function getTimelineStep(order: Order): number {
  if (order.order_status === 'cancelled') {
    return 0;
  }
  if (order.order_status === 'completed') {
    return 4;
  }
  if (order.order_status === 'processing') {
    return 3;
  }
  if (
    order.paid_at ||
    order.payment?.payment_status === 'success' ||
    order.payment?.payment_status === 'settlement'
  ) {
    return 2;
  }
  return 1;
}
