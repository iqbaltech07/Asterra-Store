'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/lib/orders-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faUser,
  faCopy,
  faPhone,
  faArrowUpRightFromSquare,
  faBagShopping,
  faTicket,
  faPen,
  faClock,
  faCircleCheck,
  faBan,
  faShieldHalved,
  faCheck,
  faClockRotateLeft,
  faRotateLeft,
} from '@fortawesome/free-solid-svg-icons';
import { OrderStatusBadge, OrderActorBadge } from './order-badges';
import { formatWhatsAppUrl, generateOrderValidationText } from '@/lib/utils/format';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveStatus: (status: string, notes: string) => void;
  isUpdating: boolean;
  onShowNotification: (msg: string) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onSaveStatus,
  isUpdating,
  onShowNotification,
}: OrderDetailModalProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>('pending');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isMutationVerified, setIsMutationVerified] = useState<boolean>(false);
  const [isSyncingVip, setIsSyncingVip] = useState<boolean>(false);
  const [isFulfillingVip, setIsFulfillingVip] = useState<boolean>(false);

  // Mount detection for Next.js SSR-safe React Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync internal state when order changes
  useEffect(() => {
    if (order) {
      setNewStatus(order.order_status);
      setStatusNotes('');
      setIsMutationVerified(false);
    }
  }, [order]);

  // Lock background body scroll and listen for Escape key when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSyncVip = async () => {
    if (!order) return;
    setIsSyncingVip(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}/sync-vip`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Status live VIP berhasil disinkronkan: ${data.vip_status || 'OK'}`);
        if (data.order?.status) {
          setNewStatus(data.order.status);
        }
      } else {
        onShowNotification(data.message || 'Gagal menyinkronkan status VIP.');
      }
    } catch (_) {
      onShowNotification('Koneksi ke API VIP gagal.');
    } finally {
      setIsSyncingVip(false);
    }
  };

  const handleFulfillVip = async () => {
    if (!order) return;
    setIsFulfillingVip(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${order.id}/fulfill-vip`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onShowNotification(`Pesanan berhasil dikirim ke VIP Reseller! TRXID: ${data.trxid || ''}`);
        if (data.order?.status) {
          setNewStatus(data.order.status);
        }
      } else {
        onShowNotification(data.message || 'Gagal mengirim order ke VIP Reseller.');
      }
    } catch (_) {
      onShowNotification('Koneksi ke API VIP gagal.');
    } finally {
      setIsFulfillingVip(false);
    }
  };

  const handleCopyValidation = () => {
    if (!order) return;
    const summary = generateOrderValidationText(order);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      onShowNotification('Data validasi pelanggan berhasil disalin!');
    }
  };

  // Anti-fraud verification is required when completing manual/bank transfer/DANA orders
  const isAntiFraudRequired = Boolean(
    order &&
      newStatus === 'completed' &&
      (order.payment_mode === 'manual' ||
        order.payment?.payment_method?.toLowerCase().includes('manual') ||
        order.payment?.payment_method === 'bca' ||
        order.payment?.payment_method === 'dana' ||
        !order.payment?.transaction_id?.startsWith('trx-tripay'))
  );

  const isSaveDisabled = Boolean(
    isUpdating ||
      (isAntiFraudRequired && !isMutationVerified)
  );

  const handleSave = () => {
    if (!order) return;
    if (isAntiFraudRequired && !isMutationVerified) {
      onShowNotification('Harap centang verifikasi mutasi rekening riil terlebih dahulu!');
      return;
    }
    onSaveStatus(newStatus, statusNotes);
  };

  if (!isOpen || !order || !mounted || typeof document === 'undefined') {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-modal-title"
        className="bg-white dark:bg-[#161922] border border-border/80 dark:border-white/10 rounded-2xl w-full max-w-[780px] max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY MODAL HEADER */}
        <div className="shrink-0 px-5 py-3.5 border-b border-border/70 dark:border-white/10 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id="order-detail-modal-title" className="text-base font-bold text-foreground">
                Detail Pesanan #{order.id}
              </h3>
              <OrderStatusBadge status={order.order_status} />
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Dibuat pada{' '}
              {new Date(order.order_date).toLocaleString('id-ID', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
            title="Tutup (Esc)"
            aria-label="Tutup popup"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </Button>
        </div>

        {/* 2. SCROLLABLE MODAL CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
          {/* Section A: Data Validasi Customer & Akun */}
          <div className="bg-surface-raised dark:bg-[#1a1e28] border border-border/70 dark:border-white/10 rounded-xl p-3.5 sm:p-4">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-border/60 dark:border-white/10">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-primary" />
                <span>Data Validasi Customer & Akun</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyValidation}
                className="h-7 text-[11px] gap-1 px-2.5 border-border text-foreground-muted hover:text-foreground hover:bg-surface"
                title="Salin ringkasan data validasi"
              >
                <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                <span>Salin Data Validasi</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Nama Pelanggan */}
              <div className="p-2 sm:p-2.5 bg-surface dark:bg-[#13161f] rounded-lg border border-border/60 dark:border-white/10">
                <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                  Nama Lengkap Customer:
                </span>
                <span className="font-bold text-foreground text-xs sm:text-sm truncate block mt-0.5">
                  {order.customer_name || 'Pelanggan Toko'}
                </span>
              </div>

              {/* Email Pemesan */}
              <div className="p-2 sm:p-2.5 bg-surface dark:bg-[#13161f] rounded-lg border border-border/60 dark:border-white/10">
                <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                  Email Pemesan / Notifikasi:
                </span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="font-semibold text-foreground text-xs truncate">
                    {order.customer_email || 'customer@asterra.store'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(order.customer_email || '');
                      onShowNotification('Email disalin!');
                    }}
                    className="text-foreground-muted hover:text-primary p-0.5 shrink-0"
                    title="Salin Email"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Pemesan */}
              <div className="p-2 sm:p-2.5 bg-surface dark:bg-[#13161f] rounded-lg border border-border/60 dark:border-white/10">
                <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                  WhatsApp Pemesan:
                </span>
                <div className="mt-0.5">
                  {order.customer_whatsapp ? (
                    <a
                      href={formatWhatsAppUrl(order.customer_whatsapp) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-status-success hover:underline font-mono text-xs"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                      <span>{order.customer_whatsapp}</span>
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-foreground-muted italic text-xs">Tidak dicantumkan</span>
                  )}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="p-2 sm:p-2.5 bg-surface dark:bg-[#13161f] rounded-lg border border-border/60 dark:border-white/10">
                <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                  Metode Pembayaran:
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono font-bold text-foreground text-xs uppercase">
                    {order.payment?.payment_method || 'QRIS'}
                  </span>
                  {order.payment?.payment_status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-foreground-muted uppercase font-mono">
                      {order.payment.payment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {order.customer_notes && (
              <div className="mt-2.5 pt-2 border-t border-border/60 dark:border-white/10">
                <span className="text-foreground-muted block text-[10px] uppercase font-semibold">
                  Catatan Pelanggan:
                </span>
                <p className="text-xs text-foreground italic mt-0.5 bg-surface/50 dark:bg-[#13161f]/50 p-2 rounded border border-border/40">
                  &ldquo;{order.customer_notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Section B: Rincian Item yang Dipesan */}
          <div className="bg-surface-raised dark:bg-[#1a1e28] border border-border/70 dark:border-white/10 rounded-xl p-3.5 sm:p-4">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5 text-primary" />
              <span>Rincian Item yang Dipesan</span>
            </h4>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 bg-surface dark:bg-[#13161f] rounded-lg border border-border/60 dark:border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground truncate">{item.product_name}</div>
                    <div className="text-[11px] text-foreground-muted mt-0.5 space-y-0.5">
                      {item.purchased_details?.target_email && (
                        <div>
                          <span>Target Email: </span>
                          <span className="font-medium text-foreground font-mono">
                            {item.purchased_details.target_email}
                          </span>
                        </div>
                      )}
                      {item.purchased_details?.duration && (
                        <div>
                          <span>Durasi Paket: </span>
                          <span className="font-medium text-foreground">
                            {item.purchased_details.duration}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-foreground">
                      Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Financial Breakdown & Vouchers */}
              <div className="mt-2.5 pt-2.5 border-t border-border/60 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-foreground-muted">
                  <span>Subtotal Produk</span>
                  <span className="font-mono font-medium text-foreground">
                    Rp {(
                      order.raw_amount ||
                      order.items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Promo Voucher */}
                {((order.promo_discount || 0) > 0 || !!order.promo_code) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-foreground-muted">
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-emerald-500" />
                      <span>Voucher Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[11px]">
                      <span>{order.promo_code || 'VOUCHER'}</span>
                      <span>(-Rp {(order.promo_discount || order.discount_amount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Referral Discount */}
                {((order.referral_discount || 0) > 0 || !!order.referral_code) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-foreground-muted">
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-primary" />
                      <span>Diskon Referral Sales:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary font-mono font-bold text-[11px]">
                      <span>{order.referral_code || 'REFERRAL'}</span>
                      <span>(-Rp {(order.referral_discount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Campaign Discount */}
                {((order.campaign_discount || 0) > 0 || !!order.campaign_id) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-foreground-muted">
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-amber-500" />
                      <span>Diskon Campaign Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono font-bold text-[11px]">
                      <span>{order.campaign_id || 'CAMPAIGN'}</span>
                      <span>(-Rp {(order.campaign_discount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {!(order.promo_discount || 0) &&
                  !order.promo_code &&
                  !(order.referral_discount || 0) &&
                  !order.referral_code &&
                  !(order.campaign_discount || 0) &&
                  !order.campaign_id &&
                  !(order.discount_amount || 0) && (
                    <div className="flex justify-between items-center text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faTicket} className="w-3 h-3 opacity-40" />
                        <span>Potongan Harga</span>
                      </span>
                      <span className="font-mono italic text-[11px]">Tanpa Diskon (Rp 0)</span>
                    </div>
                  )}

                {!!order.unique_code && (
                  <div className="flex justify-between items-center text-foreground-muted">
                    <span>Kode Unik Verifikasi</span>
                    <span className="font-mono font-medium text-primary">
                      +Rp {order.unique_code.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="pt-2 flex justify-between items-center text-xs font-bold text-foreground border-t border-border/60 dark:border-white/10 mt-1.5">
                  <span>Total Tagihan Akhir</span>
                  <span className="text-primary font-mono text-base font-bold">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Ubah Status Pesanan Manual */}
          <div className="bg-surface-raised dark:bg-[#1a1e28] border-2 border-primary/30 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5 text-primary" />
                <span>Ubah Status Pesanan Manual</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                Hak Akses Admin
              </span>
            </div>

            {/* 4 Status Choice Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus('pending')}
                className={`p-2 sm:p-2.5 rounded-lg border text-center transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer ${
                  newStatus === 'pending'
                    ? 'border-status-warning bg-status-warning/15 text-status-warning font-bold shadow-xs ring-1 ring-status-warning'
                    : 'border-border/70 dark:border-white/10 bg-surface dark:bg-[#13161f] text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                <span>Pending</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('processing')}
                className={`p-2 sm:p-2.5 rounded-lg border text-center transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer ${
                  newStatus === 'processing'
                    ? 'border-primary bg-primary/15 text-primary font-bold shadow-xs ring-1 ring-primary'
                    : 'border-border/70 dark:border-white/10 bg-surface dark:bg-[#13161f] text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5" />
                <span>Di Proses</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('completed')}
                className={`p-2 sm:p-2.5 rounded-lg border text-center transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer ${
                  newStatus === 'completed'
                    ? 'border-status-success bg-status-success/15 text-status-success font-bold shadow-xs ring-1 ring-status-success'
                    : 'border-border/70 dark:border-white/10 bg-surface dark:bg-[#13161f] text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" />
                <span>Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('cancelled')}
                className={`p-2 sm:p-2.5 rounded-lg border text-center transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer ${
                  newStatus === 'cancelled'
                    ? 'border-status-error bg-status-error/15 text-status-error font-bold shadow-xs ring-1 ring-status-error'
                    : 'border-border/70 dark:border-white/10 bg-surface dark:bg-[#13161f] text-foreground-muted hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5" />
                <span>Dibatalkan</span>
              </button>
            </div>

            {/* Status Change Notes */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-foreground-muted block mb-1">
                Catatan Perubahan (Tercatat di Audit Log):
              </label>
              <Input
                type="text"
                placeholder="Contoh: Kredensial akun dikirim via WhatsApp admin"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs bg-surface dark:bg-[#13161f] border-border/70 dark:border-white/10 h-8"
              />
            </div>

            {/* Anti-Fraud Verification Checklist Box for Manual Orders */}
            {isAntiFraudRequired && (
              <div className="p-3 bg-status-warning/10 border border-status-warning/40 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2 text-status-warning font-semibold">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 shrink-0" />
                  <span>Verifikasi Mutasi Rekening Anti-Fraud</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Nominal wajib dicek di mutasi m-Banking/DANA:{' '}
                  <strong className="text-foreground font-mono text-xs">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </strong>
                  {order.unique_code ? (
                    <span className="text-primary font-mono ml-1 font-bold">
                      (Kode Unik: +Rp {order.unique_code})
                    </span>
                  ) : null}
                  .
                </p>
                <label className="flex items-start gap-2 cursor-pointer pt-1 bg-surface dark:bg-[#13161f] p-2.5 rounded border border-border/60">
                  <input
                    type="checkbox"
                    checked={isMutationVerified}
                    onChange={(e) => setIsMutationVerified(e.target.checked)}
                    className="w-4 h-4 accent-primary mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-foreground">
                    Saya menyatakan telah memeriksa mutasi riil di aplikasi m-Banking/DANA, bukan hanya screenshot WhatsApp.
                  </span>
                </label>
              </div>
            )}

            {/* Inline Quick Action Bar inside the status card */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50 dark:border-white/5">
              <div className="text-[11px] text-foreground-muted">
                {newStatus !== order.order_status ? (
                  <span className="text-primary font-medium">
                    Status akan diubah: <span className="font-bold">{order.order_status}</span> ➔{' '}
                    <span className="font-bold">{newStatus}</span>
                  </span>
                ) : (
                  <span>Status aktif: <span className="font-semibold">{order.order_status}</span></span>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={isSaveDisabled}
                className="text-xs gap-1.5 h-8 font-semibold bg-primary hover:bg-primary-hover text-white cursor-pointer"
              >
                <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Menyimpan...' : 'Simpan Status'}</span>
              </Button>
            </div>
          </div>

          {/* Section D: VIP Reseller Live Gateway Integration Card (Conditional) */}
          {order.provider === 'vip-reseller' && (
            <div className="bg-surface-raised dark:bg-[#1a1e28] border border-primary/30 rounded-xl p-3.5 sm:p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/70 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">Integrasi VIP Reseller (Live Gateway)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-primary/15 text-primary font-bold">
                    {order.provider_status || 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingVip}
                    onClick={handleSyncVip}
                    className="h-7 text-[11px] border-border text-foreground hover:bg-surface-hover gap-1"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className={`w-3 h-3 ${isSyncingVip ? 'animate-spin' : ''}`} />
                    <span>{isSyncingVip ? 'Memeriksa...' : 'Cek Status Live'}</span>
                  </Button>
                  {!order.provider_trxid && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isFulfillingVip}
                      onClick={handleFulfillVip}
                      className="h-7 text-[11px] bg-primary text-white hover:bg-primary/90 gap-1 font-semibold"
                    >
                      <span>{isFulfillingVip ? 'Memproses...' : 'Kirim ke VIP'}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-surface dark:bg-[#13161f] rounded border border-border/60 dark:border-white/10">
                  <span className="text-foreground-muted block text-[10px]">TRX ID VIP Reseller:</span>
                  <span className="font-mono font-semibold text-foreground select-all">
                    {order.provider_trxid || 'Belum dibuat (Menunggu diproses)'}
                  </span>
                </div>
                <div className="p-2 bg-surface dark:bg-[#13161f] rounded border border-border/60 dark:border-white/10">
                  <span className="text-foreground-muted block text-[10px]">Status Server Provider:</span>
                  <span className="font-mono font-semibold text-foreground uppercase">
                    {order.provider_status || 'waiting'}
                  </span>
                </div>
              </div>

              {order.provider_note && (
                <div className="p-2.5 bg-surface dark:bg-[#13161f] rounded border border-border/60 dark:border-white/10 space-y-1">
                  <span className="text-foreground-muted block text-[10px]">Catatan / Serial Key Provider:</span>
                  <p className="font-mono text-xs text-foreground bg-surface-raised dark:bg-[#1a1e28] p-2 rounded border border-border/80 dark:border-white/10 break-all select-all">
                    {order.provider_note}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section E: TIMELINE AUDIT LOGS */}
          <div className="bg-surface-raised dark:bg-[#1a1e28] border border-border/70 dark:border-white/10 rounded-xl p-3.5 sm:p-4">
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClockRotateLeft} className="w-3.5 h-3.5 text-primary" />
              <span>Jejak Riwayat Transaksi (Timeline Logs)</span>
            </h4>

            {order.logs && order.logs.length > 0 ? (
              <div className="space-y-2">
                {order.logs.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs p-2.5 rounded-lg bg-surface dark:bg-[#13161f] border border-border/60 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <OrderActorBadge actor={log.actor} />
                      <span className="text-[11px] text-foreground-muted">
                        {new Date(log.created_at).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}{' '}
                        · {new Date(log.created_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-foreground font-medium">{log.notes}</p>
                    {log.previous_status && log.new_status && (
                      <div className="text-[10px] text-foreground-muted mt-0.5 flex items-center gap-1 font-mono">
                        <span>{log.previous_status}</span>
                        <span>➔</span>
                        <span className="font-bold text-foreground">{log.new_status}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-muted italic">
                Belum ada riwayat audit log untuk pesanan ini.
              </p>
            )}
          </div>
        </div>

        {/* 3. STICKY MODAL FOOTER */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-border/70 dark:border-white/10 bg-white/95 dark:bg-[#161922]/95 backdrop-blur-sm flex items-center justify-between gap-3">
          <div className="text-xs text-foreground-muted hidden sm:block truncate">
            {newStatus !== order.order_status ? (
              <span className="text-primary font-medium flex items-center gap-1">
                <span>Perubahan:</span>
                <span className="font-bold uppercase font-mono">{order.order_status}</span>
                <span>➔</span>
                <span className="font-bold uppercase font-mono">{newStatus}</span>
              </span>
            ) : (
              <span>
                Status saat ini: <strong className="uppercase font-mono text-foreground">{order.order_status}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 px-3 border-border hover:bg-surface cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="text-xs gap-1.5 h-8 px-4 font-semibold bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer"
            >
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
              <span>{isUpdating ? 'Menyimpan...' : 'Simpan Status'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
