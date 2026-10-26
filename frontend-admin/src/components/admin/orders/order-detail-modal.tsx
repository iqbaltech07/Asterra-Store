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
  faChevronDown,
  faChevronUp,
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
  const [showLogs, setShowLogs] = useState<boolean>(false);

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
      setShowLogs(false);
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
    onClose();
  };

  if (!isOpen || !order || !mounted || typeof document === 'undefined') {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-modal-backdrop"
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
        className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-[800px] max-h-[calc(100dvh-32px)] flex flex-col shadow-2xl overflow-hidden box-border animate-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY MODAL HEADER - LIGHT MODE */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id="order-detail-modal-title" className="text-sm sm:text-base font-bold text-[#0F172A]">
                Detail Pesanan #{order.id}
              </h3>
              <OrderStatusBadge status={order.order_status} />
            </div>
            <p className="text-[10.5px] text-[#64748B] mt-0.5">
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
            className="h-7 w-7 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] shrink-0 cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup popup"
          >
            <FontAwesomeIcon icon={faXmark} className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* 2. SCROLLABLE MODAL CONTENT BODY - LIGHT MODE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2 text-xs bg-[#F8FAFC]">
          {/* Section A: Data Validasi Customer & Akun */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 sm:p-2.5 shadow-2xs">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#E2E8F0]">
              <h4 className="text-[10.5px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-[#2563EB]" />
                <span>Data Validasi Customer & Akun</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyValidation}
                className="h-6 text-[10px] gap-1 px-2 border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer"
                title="Salin ringkasan data validasi"
              >
                <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5" />
                <span>Salin Data Validasi</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
              {/* Nama Pelanggan */}
              <div className="py-1 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[9.5px] uppercase font-semibold">
                  Nama Lengkap Customer:
                </span>
                <span className="font-bold text-[#0F172A] text-xs truncate block mt-0.5">
                  {order.customer_name || 'Pelanggan Toko'}
                </span>
              </div>

              {/* Email Pemesan */}
              <div className="py-1 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[9.5px] uppercase font-semibold">
                  Email Pemesan / Notifikasi:
                </span>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="font-semibold text-[#0F172A] text-xs truncate">
                    {order.customer_email || 'customer@asterra.store'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(order.customer_email || '');
                      onShowNotification('Email disalin!');
                    }}
                    className="text-[#64748B] hover:text-[#2563EB] p-0.5 shrink-0 cursor-pointer"
                    title="Salin Email"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Pemesan */}
              <div className="py-1 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[9.5px] uppercase font-semibold">
                  WhatsApp Pemesan:
                </span>
                <div className="mt-0.5">
                  {order.customer_whatsapp ? (
                    <a
                      href={formatWhatsAppUrl(order.customer_whatsapp) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#16A34A] hover:underline font-mono text-xs"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-2.5 h-2.5" />
                      <span>{order.customer_whatsapp}</span>
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2 h-2 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-[#64748B] italic text-xs">Tidak dicantumkan</span>
                  )}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="py-1 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[9.5px] uppercase font-semibold">
                  Metode Pembayaran:
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#0F172A] text-xs uppercase">
                    {order.payment?.payment_method || 'QRIS'}
                  </span>
                  {order.payment?.payment_status && (
                    <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-slate-200/60 text-[#64748B] uppercase font-mono font-semibold">
                      {order.payment.payment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {order.customer_notes && (
              <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[9.5px] uppercase font-semibold">
                  Catatan Pelanggan:
                </span>
                <p className="text-[11px] text-[#0F172A] italic mt-0.5 bg-[#F8FAFC] py-1 px-2 rounded-md border border-[#E2E8F0]">
                  &ldquo;{order.customer_notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Section B: Rincian Item yang Dipesan */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 sm:p-2.5 shadow-2xs">
            <h4 className="text-[10.5px] font-bold text-[#0F172A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBagShopping} className="w-3 h-3 text-[#2563EB]" />
              <span>Rincian Item yang Dipesan</span>
            </h4>

            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="py-1.5 px-2 bg-[#F8FAFC] rounded-md border border-[#E2E8F0] flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0F172A] truncate text-xs">{item.product_name}</div>
                    <div className="text-[10.5px] text-[#64748B] flex items-center gap-2 flex-wrap">
                      {item.purchased_details?.target_email && (
                        <span>
                          Target: <span className="font-medium text-[#0F172A] font-mono">{item.purchased_details.target_email}</span>
                        </span>
                      )}
                      {item.purchased_details?.duration && (
                        <span>
                          Durasi: <span className="font-medium text-[#0F172A]">{item.purchased_details.duration}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-[#0F172A] text-xs">
                      Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Financial Breakdown & Vouchers */}
              <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0] space-y-1 text-[11px]">
                <div className="flex justify-between items-center text-[#64748B]">
                  <span>Subtotal Produk</span>
                  <span className="font-mono font-medium text-[#0F172A]">
                    Rp {(
                      order.raw_amount ||
                      order.items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Promo Voucher */}
                {((order.promo_discount || 0) > 0 || !!order.promo_code) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <FontAwesomeIcon icon={faTicket} className="w-2.5 h-2.5 text-[#16A34A]" />
                      <span>Voucher Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-mono font-bold text-[10px]">
                      <span>{order.promo_code || 'VOUCHER'}</span>
                      <span>(-Rp {(order.promo_discount || order.discount_amount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Referral Discount */}
                {((order.referral_discount || 0) > 0 || !!order.referral_code) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <FontAwesomeIcon icon={faTicket} className="w-2.5 h-2.5 text-[#2563EB]" />
                      <span>Diskon Referral Sales:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-mono font-bold text-[10px]">
                      <span>{order.referral_code || 'REFERRAL'}</span>
                      <span>(-Rp {(order.referral_discount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Campaign Discount */}
                {((order.campaign_discount || 0) > 0 || !!order.campaign_id) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <FontAwesomeIcon icon={faTicket} className="w-2.5 h-2.5 text-[#D97706]" />
                      <span>Diskon Campaign Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-mono font-bold text-[10px]">
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
                    <div className="flex justify-between items-center text-[#64748B]">
                      <span className="flex items-center gap-1">
                        <FontAwesomeIcon icon={faTicket} className="w-2.5 h-2.5 opacity-40" />
                        <span>Potongan Harga</span>
                      </span>
                      <span className="font-mono italic text-[10px]">Tanpa Diskon (Rp 0)</span>
                    </div>
                  )}

                {!!order.unique_code && (
                  <div className="flex justify-between items-center text-[#64748B]">
                    <span>Kode Unik Verifikasi</span>
                    <span className="font-mono font-medium text-[#2563EB]">
                      +Rp {order.unique_code.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="pt-1.5 flex justify-between items-center text-xs font-bold text-[#0F172A] border-t border-[#E2E8F0] mt-1">
                  <span>Total Tagihan Akhir</span>
                  <span className="text-[#2563EB] font-mono text-sm sm:text-base font-bold">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section C: Ubah Status Pesanan Manual - CLEAN LIGHT MODE */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 sm:p-2.5 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10.5px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPen} className="w-3 h-3 text-[#2563EB]" />
                <span>Ubah Status Pesanan Manual</span>
              </h4>
              <span className="text-[9.5px] px-1.5 py-0.2 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-medium">
                Hak Akses Admin
              </span>
            </div>

            {/* 4 Status Choice Buttons - Light Mode Consistent */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {/* 1. Pending (Abu-abu netral) */}
              <button
                type="button"
                onClick={() => setNewStatus('pending')}
                className={`h-7.5 px-2 rounded-md border text-center transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'pending'
                    ? 'border-[#64748B] bg-[#F8FAFC] text-[#0F172A] font-bold ring-2 ring-[#64748B]/30 shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:text-[#0F172A]'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 shrink-0" />
                <span>Pending</span>
              </button>

              {/* 2. Di Proses (Biru) */}
              <button
                type="button"
                onClick={() => setNewStatus('processing')}
                className={`h-7.5 px-2 rounded-md border text-center transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'processing'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold ring-2 ring-[#2563EB]/30 shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#EFF6FF] hover:border-[#BFDBFE] hover:text-[#2563EB]'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-3 h-3 shrink-0" />
                <span>Di Proses</span>
              </button>

              {/* 3. Selesai (Hijau) */}
              <button
                type="button"
                onClick={() => setNewStatus('completed')}
                className={`h-7.5 px-2 rounded-md border text-center transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'completed'
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#16A34A] font-bold ring-2 ring-[#16A34A]/30 shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F0FDF4] hover:border-[#BBF7D0] hover:text-[#16A34A]'
                }`}
              >
                <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3 shrink-0" />
                <span>Selesai</span>
              </button>

              {/* 4. Dibatalkan (Merah) */}
              <button
                type="button"
                onClick={() => setNewStatus('cancelled')}
                className={`h-7.5 px-2 rounded-md border text-center transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'cancelled'
                    ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626] font-bold ring-2 ring-[#DC2626]/30 shadow-xs'
                    : 'border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#FEF2F2] hover:border-[#FECACA] hover:text-[#DC2626]'
                }`}
              >
                <FontAwesomeIcon icon={faBan} className="w-3 h-3 shrink-0" />
                <span>Dibatalkan</span>
              </button>
            </div>

            {/* Status Change Notes */}
            <div>
              <Input
                type="text"
                placeholder="Catatan perubahan audit log (opsional)..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs bg-white border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] h-7 px-2.5 rounded-md"
              />
            </div>

            {/* Anti-Fraud Verification Checklist Box for Manual Orders */}
            {isAntiFraudRequired && (
              <div className="p-2 bg-[#FFFBEB] border border-[#FDE68A] rounded-md space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[#D97706] font-semibold text-[11px]">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 shrink-0" />
                  <span>Verifikasi Mutasi Rekening Anti-Fraud</span>
                </div>
                <p className="text-[10.5px] text-[#92400E] leading-tight">
                  Nominal wajib dicek di mutasi m-Banking/DANA:{' '}
                  <strong className="text-[#0F172A] font-mono text-xs">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </strong>
                  {order.unique_code ? (
                    <span className="text-[#2563EB] font-mono ml-1 font-bold">
                      (Kode Unik: +Rp {order.unique_code})
                    </span>
                  ) : null}
                  .
                </p>
                <label className="flex items-center gap-2 cursor-pointer pt-0.5 bg-white p-1.5 rounded border border-[#FDE68A]">
                  <input
                    type="checkbox"
                    checked={isMutationVerified}
                    onChange={(e) => setIsMutationVerified(e.target.checked)}
                    className="w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                  />
                  <span className="text-[10.5px] font-medium text-[#0F172A]">
                    Saya telah memeriksa mutasi riil di m-Banking/DANA, bukan hanya screenshot.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Section D: VIP Reseller Live Gateway Integration Card (Conditional) */}
          {order.provider === 'vip-reseller' && (
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 sm:p-2.5 space-y-2 text-xs shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#0F172A] text-xs">VIP Reseller Gateway</span>
                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold">
                    {order.provider_status || 'Waiting'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSyncingVip}
                    onClick={handleSyncVip}
                    className="h-6 text-[10px] border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] gap-1 cursor-pointer px-2"
                  >
                    <FontAwesomeIcon icon={faRotateLeft} className={`w-2.5 h-2.5 ${isSyncingVip ? 'animate-spin' : ''}`} />
                    <span>{isSyncingVip ? 'Memeriksa...' : 'Cek Status'}</span>
                  </Button>
                  {!order.provider_trxid && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isFulfillingVip}
                      onClick={handleFulfillVip}
                      className="h-6 text-[10px] bg-[#2563EB] text-white hover:bg-[#1D4ED8] gap-1 font-semibold cursor-pointer px-2"
                    >
                      <span>{isFulfillingVip ? 'Memproses...' : 'Kirim VIP'}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px]">
                <div className="p-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[9.5px]">TRX ID VIP:</span>
                  <span className="font-mono font-semibold text-[#0F172A] select-all truncate block">
                    {order.provider_trxid || 'Belum dibuat'}
                  </span>
                </div>
                <div className="p-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[9.5px]">Status Provider:</span>
                  <span className="font-mono font-semibold text-[#0F172A] uppercase">
                    {order.provider_status || 'waiting'}
                  </span>
                </div>
              </div>

              {order.provider_note && (
                <div className="p-1.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-0.5">
                  <span className="text-[#64748B] block text-[9.5px]">Catatan / Serial Key:</span>
                  <p className="font-mono text-[11px] text-[#0F172A] bg-white p-1.5 rounded border border-[#E2E8F0] break-all select-all">
                    {order.provider_note}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section E: TIMELINE AUDIT LOGS (Riwayat Perubahan Status - Collapsible) */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-2 sm:p-2.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between text-[10.5px] font-bold text-[#0F172A] uppercase tracking-wider cursor-pointer py-0.5"
            >
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClockRotateLeft} className="w-3 h-3 text-[#2563EB]" />
                <span>Jejak Riwayat Transaksi ({order.logs?.length || 0})</span>
              </span>
              <span className="text-[10px] text-[#64748B] flex items-center gap-1 font-normal lowercase">
                <span>{showLogs ? 'Tutup riwayat' : 'Lihat riwayat'}</span>
                <FontAwesomeIcon icon={showLogs ? faChevronUp : faChevronDown} className="w-2.5 h-2.5" />
              </span>
            </button>

            {showLogs && (
              <div className="mt-2 pt-1.5 border-t border-[#E2E8F0]">
                {order.logs && order.logs.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.logs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs p-2 rounded-md bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <OrderActorBadge actor={log.actor} />
                          <span className="text-[10px] text-[#64748B]">
                            {new Date(log.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            · {new Date(log.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#0F172A] font-medium">{log.notes}</p>
                        {log.previous_status && log.new_status && (
                          <div className="text-[9.5px] text-[#64748B] mt-0.5 flex items-center gap-1 font-mono">
                            <span>{log.previous_status}</span>
                            <span>➔</span>
                            <span className="font-bold text-[#0F172A]">{log.new_status}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#64748B] italic">
                    Belum ada riwayat audit log untuk pesanan ini.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. STICKY MODAL FOOTER - LIGHT MODE WITH SINGLE SAVE BUTTON */}
        <div className="shrink-0 px-4 sm:px-5 py-2.5 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
          <div className="text-xs text-[#64748B] hidden sm:block truncate">
            {newStatus !== order.order_status ? (
              <span className="text-[#2563EB] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
                <span>Perubahan:</span>
                <span className="font-bold uppercase font-mono text-[#0F172A]">{order.order_status}</span>
                <span>➔</span>
                <span className="font-bold uppercase font-mono text-[#2563EB]">{newStatus}</span>
              </span>
            ) : (
              <span>
                Status saat ini: <strong className="uppercase font-mono text-[#0F172A]">{order.order_status}</strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs h-7.5 px-3 border-[#E2E8F0] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="text-xs gap-1.5 h-7.5 px-3.5 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
              <span>{isUpdating ? 'Menyimpan...' : 'Simpan Status'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
