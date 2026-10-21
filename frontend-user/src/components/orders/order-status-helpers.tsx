'use client';

import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { Order } from '@/lib/orders-data';

export const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Menunggu Pembayaran' },
  { value: 'processing', label: 'Sedang Diproses' },
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
      className={`text-[10px] font-mono px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
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
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-success/15 text-status-success font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
          <span>Selesai</span>
        </span>
      );
    case 'processing':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-info/15 text-status-info font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
          <span>Di Proses</span>
        </span>
      );
    case 'pending':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-warning/15 text-status-warning font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Menunggu Pembayaran</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-status-error/15 text-status-error font-medium inline-flex items-center gap-1">
          <FontAwesomeIcon icon={faCircleExclamation} className="w-3 h-3" />
          <span>Dibatalkan</span>
        </span>
      );
    default:
      return (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-surface-raised text-foreground-muted font-medium">
          {status}
        </span>
      );
  }
}

export function getTimelineStep(order: Order): number {
  if (order.order_status === 'cancelled') {
    return 1;
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
