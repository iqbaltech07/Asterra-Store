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
  faKey,
  faPaperPlane,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { OrdersApi } from '@/lib/api-client';
import { OrderStatusBadge, OrderActorBadge } from './order-badges';
import { formatWhatsAppUrl, generateOrderValidationText } from '@/lib/utils/format';
import { maskCustomerName } from '@/lib/utils/masking';

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

  // Manual Credential Modal states
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState<boolean>(false);
  const [credentialFields, setCredentialFields] = useState<Array<{ label: string; value: string }>>([
    { label: 'Email / Akun', value: '' },
    { label: 'Kata Sandi', value: '' },
  ]);
  const [isCompletingManual, setIsCompletingManual] = useState<boolean>(false);
  const [isResendingEmail, setIsResendingEmail] = useState<boolean>(false);

  const isManual = (order?.fulfillment_mode || order?.fulfillmentMode || 'manual') === 'manual';

  // Parse structured credentials if already saved
  const parsedCredentials = React.useMemo(() => {
    const raw = order?.fulfillment_credentials || order?.fulfillmentCredentials;
    if (raw) {
      try {
        const loaded = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(loaded)) return loaded;
      } catch {
        // fallback
      }
    }
    if (order?.provider_note) {
      const parts = order.provider_note.split('|').map((p) => p.trim()).filter(Boolean);
      return parts.map((p) => {
        if (p.includes(':')) {
          const [k, v] = p.split(':', 2);
          return { label: k.trim(), value: v.trim() };
        }
        return { label: 'Informasi Akun', value: p };
      });
    }
    return [];
  }, [order?.fulfillment_credentials, order?.fulfillmentCredentials, order?.provider_note]);

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
      setIsCredentialModalOpen(false);
      setCredentialFields([
        { label: 'Email / Akun', value: '' },
        { label: 'Kata Sandi', value: '' },
      ]);
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
    const isManual = (order.fulfillment_mode || order.fulfillmentMode || 'manual') === 'manual';
    if (newStatus === 'completed' && order.order_status !== 'completed' && isManual) {
      setIsCredentialModalOpen(true);
      return;
    }
    if (isAntiFraudRequired && !isMutationVerified) {
      onShowNotification('Harap centang verifikasi mutasi rekening riil terlebih dahulu!');
      return;
    }
    onSaveStatus(newStatus, statusNotes);
    onClose();
  };

  const handleConfirmManualCompletion = async () => {
    if (!order) return;
    const validCreds = credentialFields.filter((f) => f.value.trim().length > 0);
    if (validCreds.length === 0) {
      onShowNotification('Harap masukkan setidaknya satu kredensial akun pelanggan (Email/Password)!');
      return;
    }
    if (isAntiFraudRequired && !isMutationVerified) {
      onShowNotification('Harap centang verifikasi mutasi rekening riil terlebih dahulu!');
      return;
    }

    setIsCompletingManual(true);
    try {
      const res = await OrdersApi.completeManual(order.id, {
        credentials: validCreds,
        notes: statusNotes,
      });
      if (res.success) {
        onShowNotification(`Pesanan #${order.id} berhasil diselesaikan dengan kredensial.`);
        if (res.email_status === 'failed') {
          onShowNotification('Catatan: Pengiriman email gagal. Anda dapat mencoba tombol Kirim Ulang Email.');
        }
        setIsCredentialModalOpen(false);
        onSaveStatus('completed', statusNotes);
        onClose();
      } else {
        onShowNotification(res.message || 'Gagal menyelesaikan pesanan.');
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onShowNotification(errorMsg);
    } finally {
      setIsCompletingManual(false);
    }
  };

  const handleResendEmail = async () => {
    if (!order) return;
    setIsResendingEmail(true);
    try {
      const res = await OrdersApi.resendCompletionEmail(order.id);
      if (res.success) {
        onShowNotification('Email kredensial berhasil dikirim ulang ke pelanggan!');
      } else {
        onShowNotification(`Gagal mengirim email: ${res.email_error || res.message}`);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      onShowNotification(`Error: ${errorMsg}`);
    } finally {
      setIsResendingEmail(false);
    }
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
        className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-[780px] max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. STICKY MODAL HEADER - LIGHT MODE */}
        <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 id="order-detail-modal-title" className="text-base font-bold text-[#0F172A]">
                Detail Pesanan #{order.id}
              </h3>
              <OrderStatusBadge status={order.order_status} />
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                  (order.fulfillment_mode || order.fulfillmentMode || 'manual') === 'manual'
                    ? 'bg-amber-500/15 text-amber-700 border border-amber-300'
                    : 'bg-emerald-500/15 text-emerald-700 border border-emerald-300'
                }`}
              >
                Mode {(order.fulfillment_mode || order.fulfillmentMode || 'manual').toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-[11px] text-[#64748B]">
                Dibuat pada{' '}
                {new Date(order.order_date).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
              {order.order_status === 'completed' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#64748B]">Email:</span>
                  {(order.email_delivery_status || order.emailDeliveryStatus) === 'sent' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FontAwesomeIcon icon={faCheck} className="w-2.5 h-2.5" />
                      <span>TERKIRIM</span>
                    </span>
                  ) : (order.email_delivery_status || order.emailDeliveryStatus) === 'failed' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      <FontAwesomeIcon icon={faBan} className="w-2.5 h-2.5" />
                      <span>GAGAL</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      <span>PENDING</span>
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isResendingEmail}
                    onClick={handleResendEmail}
                    className="h-6 text-[10px] px-2 gap-1 border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#2563EB]"
                    title="Kirim ulang email kredensial ke pelanggan"
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className={`w-2.5 h-2.5 ${isResendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isResendingEmail ? 'Mengirim...' : 'Kirim Ulang'}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8.5 w-8.5 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] shrink-0 cursor-pointer"
            title="Tutup (Esc)"
            aria-label="Tutup popup"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </Button>
        </div>

        {/* 2. SCROLLABLE MODAL CONTENT BODY - LIGHT MODE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
          {/* Section A: Data Validasi Customer & Akun */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#E2E8F0]">
              <h4 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faUser} className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Data Validasi Customer & Akun</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyValidation}
                className="h-8.5 text-xs gap-1.5 px-3.5 border-[#CBD5E1] bg-white text-[#475569] hover:text-[#0F172A] hover:bg-[#F8FAFC] cursor-pointer rounded-lg font-medium"
                title="Salin ringkasan data validasi"
              >
                <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                <span>Salin Data Validasi</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Nama Pelanggan */}
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                  Nama Lengkap Customer:
                </span>
                <span className="font-bold text-[#0F172A] text-xs sm:text-sm truncate block mt-0.5">
                  {maskCustomerName(order.customer_name) || 'Pelanggan Toko'}
                </span>
              </div>

              {/* Email Pemesan */}
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
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
                    className="text-[#64748B] hover:text-[#2563EB] p-1 rounded hover:bg-slate-200/50 shrink-0 cursor-pointer"
                    title="Salin Email"
                  >
                    <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Pemesan */}
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                  WhatsApp Pemesan:
                </span>
                <div className="mt-0.5">
                  {order.customer_whatsapp ? (
                    <a
                      href={formatWhatsAppUrl(order.customer_whatsapp) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-semibold text-[#16A34A] hover:underline font-mono text-xs"
                    >
                      <FontAwesomeIcon icon={faPhone} className="w-3 h-3" />
                      <span>{order.customer_whatsapp}</span>
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2.5 h-2.5 opacity-70" />
                    </a>
                  ) : (
                    <span className="text-[#64748B] italic text-xs">Tidak dicantumkan</span>
                  )}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                  Metode Pembayaran:
                </span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[#0F172A] text-xs uppercase">
                    {order.payment?.payment_method || 'QRIS'}
                  </span>
                  {order.payment?.payment_status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/60 text-[#64748B] uppercase font-mono font-semibold">
                      {order.payment.payment_status}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {order.customer_notes && (
              <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]">
                <span className="text-[#64748B] block text-[10px] uppercase font-semibold">
                  Catatan Pelanggan:
                </span>
                <p className="text-xs text-[#0F172A] italic mt-0.5 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                  &ldquo;{order.customer_notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Section B: Rincian Item yang Dipesan */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs">
            <h4 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faBagShopping} className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Rincian Item yang Dipesan</span>
            </h4>

            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-start justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0F172A] truncate text-xs sm:text-sm">{item.product_name}</div>
                    <div className="text-[11px] text-[#64748B] mt-0.5 space-y-0.5">
                      {item.purchased_details?.target_email && (
                        <div>
                          <span>Target Email: </span>
                          <span className="font-medium text-[#0F172A] font-mono">
                            {item.purchased_details.target_email}
                          </span>
                        </div>
                      )}
                      {item.purchased_details?.duration && (
                        <div>
                          <span>Durasi Paket: </span>
                          <span className="font-medium text-[#0F172A]">
                            {item.purchased_details.duration}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono text-[#0F172A] text-xs sm:text-sm">
                      Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Financial Breakdown & Vouchers */}
              <div className="mt-2.5 pt-2.5 border-t border-[#E2E8F0] space-y-1.5 text-xs">
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
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-[#16A34A]" />
                      <span>Voucher Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] font-mono font-bold text-[11px]">
                      <span>{order.promo_code || 'VOUCHER'}</span>
                      <span>(-Rp {(order.promo_discount || order.discount_amount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Referral Discount */}
                {((order.referral_discount || 0) > 0 || !!order.referral_code) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-[#2563EB]" />
                      <span>Diskon Referral Sales:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-mono font-bold text-[11px]">
                      <span>{order.referral_code || 'REFERRAL'}</span>
                      <span>(-Rp {(order.referral_discount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  </div>
                )}

                {/* Campaign Discount */}
                {((order.campaign_discount || 0) > 0 || !!order.campaign_id) && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[#64748B]">
                      <FontAwesomeIcon icon={faTicket} className="w-3 h-3 text-[#D97706]" />
                      <span>Diskon Campaign Promo:</span>
                    </span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-mono font-bold text-[11px]">
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
                        <FontAwesomeIcon icon={faTicket} className="w-3 h-3 opacity-40" />
                        <span>Potongan Harga</span>
                      </span>
                      <span className="font-mono italic text-[11px]">Tanpa Diskon (Rp 0)</span>
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

                <div className="pt-2.5 flex justify-between items-center text-xs font-bold text-[#0F172A] border-t border-[#E2E8F0] mt-1.5">
                  <span>Total Tagihan Akhir</span>
                  <span className="text-[#2563EB] font-mono text-base sm:text-lg font-bold">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Kredensial Pelanggan Tersimpan */}
          {parsedCredentials.length > 0 && (
            <div className="bg-white border border-emerald-300 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                <h4 className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kredensial Akun / Lisensi Pelanggan</span>
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  TERSIMPAN & TERHUBUNG
                </span>
              </div>

              <div className="space-y-1.5">
                {parsedCredentials.map((c: any, cIdx: number) => (
                  <div
                    key={cIdx}
                    className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        {c.label}:
                      </span>
                      <span className="font-mono font-bold text-[#0F172A] text-xs sm:text-sm select-all break-all block mt-0.5">
                        {c.value}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(c.value);
                          onShowNotification(`${c.label} disalin!`);
                        }
                      }}
                      className="h-7 text-[10px] px-2 gap-1 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 shrink-0 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faCopy} className="w-2.5 h-2.5" />
                      <span>Salin</span>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section C: Ubah Status Pesanan Manual - CLEAN LIGHT MODE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <FontAwesomeIcon icon={faPen} className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Ubah Status Pesanan Manual</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-medium">
                Hak Akses Admin
              </span>
            </div>

            {/* Quick action: Selesaikan Pesanan with Credentials for Manual Orders */}
            {isManual && order.order_status !== 'completed' && order.order_status !== 'cancelled' && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-emerald-900 block text-xs">Penuhi Pesanan Manual</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Masukkan akun / kredensial untuk pelanggan dan selesaikan pesanan secara resmi.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsCredentialModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8.5 px-3.5 rounded-lg shrink-0 gap-1.5 cursor-pointer shadow-xs"
                >
                  <FontAwesomeIcon icon={faKey} className="w-3.5 h-3.5" />
                  <span>Selesaikan Pesanan</span>
                </Button>
              </div>
            )}

            {/* 4 Status Choice Buttons - Light Mode Consistent */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Pending (Abu-abu netral) */}
              <button
                type="button"
                onClick={() => setNewStatus('pending')}
                className={`py-3 px-3 rounded-xl border text-center transition-all text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'pending'
                    ? 'border-[#64748B] bg-[#F1F5F9] text-[#0F172A] font-bold ring-2 ring-[#64748B]/30 shadow-xs'
                    : 'border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#F8FAFC] hover:border-[#94A3B8] hover:text-[#0F172A]'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                <span>Pending</span>
              </button>

              {/* 2. Di Proses (Biru) */}
              <button
                type="button"
                onClick={() => setNewStatus('processing')}
                className={`py-3 px-3 rounded-xl border text-center transition-all text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'processing'
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] font-bold ring-2 ring-[#2563EB]/30 shadow-xs'
                    : 'border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#EFF6FF] hover:border-[#93C5FD] hover:text-[#2563EB]'
                }`}
              >
                <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                <span>Di Proses</span>
              </button>

              {/* 3. Selesai (Hijau) */}
              <button
                type="button"
                onClick={() => {
                  setNewStatus('completed');
                  const isManual = (order.fulfillment_mode || order.fulfillmentMode || 'manual') === 'manual';
                  if (isManual && order.order_status !== 'completed') {
                    setIsCredentialModalOpen(true);
                  }
                }}
                className={`py-3 px-3 rounded-xl border text-center transition-all text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'completed'
                    ? 'border-[#16A34A] bg-[#F0FDF4] text-[#16A34A] font-bold ring-2 ring-[#16A34A]/30 shadow-xs'
                    : 'border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#F0FDF4] hover:border-[#86EFAC] hover:text-[#16A34A]'
                }`}
              >
                <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                <span>Selesai</span>
              </button>

              {/* 4. Dibatalkan (Merah) */}
              <button
                type="button"
                onClick={() => setNewStatus('cancelled')}
                className={`py-3 px-3 rounded-xl border text-center transition-all text-xs sm:text-sm font-semibold flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                  newStatus === 'cancelled'
                    ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626] font-bold ring-2 ring-[#DC2626]/30 shadow-xs'
                    : 'border-[#CBD5E1] bg-white text-[#64748B] hover:bg-[#FEF2F2] hover:border-[#FCA5A5] hover:text-[#DC2626]'
                }`}
              >
                <FontAwesomeIcon icon={faBan} className="w-4 h-4" />
                <span>Dibatalkan</span>
              </button>
            </div>

            {/* Status Change Notes */}
            <div>
              <label className="text-[10px] uppercase font-semibold text-[#64748B] block mb-1">
                Catatan Perubahan (Tercatat di Audit Log):
              </label>
              <Input
                type="text"
                placeholder="Contoh: Kredensial akun dikirim via WhatsApp admin"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs sm:text-sm bg-white border border-[#CBD5E1] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] h-9.5 px-3 rounded-lg"
              />
            </div>

            {/* Anti-Fraud Verification Checklist Box for Manual Orders */}
            {isAntiFraudRequired && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[#D97706] font-semibold">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 shrink-0" />
                  <span>Verifikasi Mutasi Rekening Anti-Fraud</span>
                </div>
                <p className="text-[11px] text-[#92400E] leading-relaxed">
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
                <label className="flex items-start gap-2 cursor-pointer pt-1 bg-white p-2.5 rounded-lg border border-[#FDE68A]">
                  <input
                    type="checkbox"
                    checked={isMutationVerified}
                    onChange={(e) => setIsMutationVerified(e.target.checked)}
                    className="w-4 h-4 accent-[#2563EB] mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] font-medium text-[#0F172A]">
                    Saya menyatakan telah memeriksa mutasi riil di aplikasi m-Banking/DANA, bukan hanya screenshot WhatsApp.
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Section D: VIP Reseller Live Gateway Integration Card (Conditional) */}
          {order.provider === 'vip-reseller' && (
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 space-y-3 text-xs shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0F172A] text-xs sm:text-sm">Integrasi VIP Reseller (Live Gateway)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] font-bold">
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
                    className="h-8.5 text-xs border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] gap-1.5 cursor-pointer px-3.5 rounded-lg font-medium"
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
                      className="h-8.5 text-xs bg-[#2563EB] text-white hover:bg-[#1D4ED8] gap-1.5 font-semibold cursor-pointer px-4 rounded-lg"
                    >
                      <span>{isFulfillingVip ? 'Memproses...' : 'Kirim ke VIP'}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[10px]">TRX ID VIP Reseller:</span>
                  <span className="font-mono font-semibold text-[#0F172A] select-all">
                    {order.provider_trxid || 'Belum dibuat (Menunggu diproses)'}
                  </span>
                </div>
                <div className="p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[10px]">Status Server Provider:</span>
                  <span className="font-mono font-semibold text-[#0F172A] uppercase">
                    {order.provider_status || 'waiting'}
                  </span>
                </div>
              </div>

              {order.provider_note && (
                <div className="p-2.5 bg-[#F8FAFC] rounded border border-[#E2E8F0] space-y-1">
                  <span className="text-[#64748B] block text-[10px]">Catatan / Serial Key Provider:</span>
                  <p className="font-mono text-xs text-[#0F172A] bg-white p-2 rounded border border-[#E2E8F0] break-all select-all">
                    {order.provider_note}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Section E: TIMELINE AUDIT LOGS (Riwayat Perubahan Status - Collapsible) */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 sm:p-4 shadow-2xs">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="w-full flex items-center justify-between text-[11px] font-bold text-[#0F172A] uppercase tracking-wider cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faClockRotateLeft} className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Jejak Riwayat Transaksi ({order.logs?.length || 0})</span>
              </span>
              <span className="text-xs text-[#64748B] flex items-center gap-1 font-normal lowercase">
                <span>{showLogs ? 'Tutup riwayat' : 'Lihat riwayat'}</span>
                <FontAwesomeIcon icon={showLogs ? faChevronUp : faChevronDown} className="w-3 h-3" />
              </span>
            </button>

            {showLogs && (
              <div className="mt-2.5 pt-2 border-t border-[#E2E8F0]">
                {order.logs && order.logs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {order.logs.map((log) => (
                      <div
                        key={log.id}
                        className="text-xs p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                      >
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <OrderActorBadge actor={log.actor} />
                          <span className="text-[11px] text-[#64748B]">
                            {new Date(log.created_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}{' '}
                            · {new Date(log.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-[#0F172A] font-medium">{log.notes}</p>
                        {log.previous_status && log.new_status && (
                          <div className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1 font-mono">
                            <span>{log.previous_status}</span>
                            <span>➔</span>
                            <span className="font-bold text-[#0F172A]">{log.new_status}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#64748B] italic">
                    Belum ada riwayat audit log untuk pesanan ini.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. STICKY MODAL FOOTER - LIGHT MODE WITH SINGLE SAVE BUTTON */}
        <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
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

          <div className="flex items-center gap-2.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={onClose}
              className="text-sm h-10 px-5 rounded-xl border-[#CBD5E1] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-semibold cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="default"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="text-sm gap-2 h-10 px-6 rounded-xl font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
              <span>{isUpdating ? 'Menyimpan...' : 'Simpan Status'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* NESTED MODAL: "Silakan masukkan kredensial akun pelanggan" */}
      {isCredentialModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="credential-modal-title"
            className="bg-white rounded-2xl border border-[#CBD5E1] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-start justify-between gap-3 bg-gradient-to-r from-emerald-50 via-white to-blue-50/40">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FontAwesomeIcon icon={faKey} className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="credential-modal-title" className="text-sm sm:text-base font-bold text-[#0F172A] leading-tight">
                    Silakan masukkan kredensial akun pelanggan
                  </h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Pesanan #{order.id} · {maskCustomerName(order.customer_name)} ({order.customer_email || 'Tanpa email'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCredentialModalOpen(false)}
                disabled={isCompletingManual}
                className="text-[#64748B] hover:text-[#0F172A] p-1.5 rounded-lg hover:bg-[#F1F5F9] transition-colors cursor-pointer"
                title="Tutup dialog"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Product Info Reminder */}
              {order.items && order.items.length > 0 && (
                <div className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">Produk Dipesan:</span>
                  <span className="font-semibold text-[#0F172A] truncate max-w-[260px]">
                    {order.items.map((it: any) => `${it.product_name} (${it.quantity}x)`).join(', ')}
                  </span>
                </div>
              )}

              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-blue-900 text-[11px] leading-relaxed">
                <span className="font-bold block mb-0.5">Notifikasi Pelanggan:</span>
                Kredensial berikut akan disimpan terhubung dengan pesanan ini dan otomatis dikirimkan ke email pelanggan (<strong>{order.customer_email || 'email pesanan'}</strong>).
              </div>

              {/* Dynamic Label-Value Rows */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block">
                  Pasangan Label & Nilai Kredensial:
                </label>
                {credentialFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-1/3">
                      <Input
                        type="text"
                        placeholder="Label (e.g. Email / PIN)"
                        value={field.label}
                        onChange={(e) => {
                          const next = [...credentialFields];
                          next[index].label = e.target.value;
                          setCredentialFields(next);
                        }}
                        className="h-9 text-xs bg-[#F8FAFC] border-[#CBD5E1] text-[#0F172A] focus:bg-white"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Nilai Kredensial / Password / Token"
                        value={field.value}
                        onChange={(e) => {
                          const next = [...credentialFields];
                          next[index].value = e.target.value;
                          setCredentialFields(next);
                        }}
                        className="h-9 text-xs bg-white border-[#CBD5E1] font-mono text-[#0F172A]"
                      />
                    </div>
                    {credentialFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCredentialFields(credentialFields.filter((_, i) => i !== index));
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                        title="Hapus baris"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCredentialFields([...credentialFields, { label: 'Catatan / PIN Tambahan', value: '' }]);
                  }}
                  className="mt-1 text-xs border-dashed border-[#CBD5E1] text-[#2563EB] hover:border-[#2563EB] hover:bg-[#EFF6FF] w-full h-8 cursor-pointer font-medium"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3 mr-1.5" />
                  <span>Tambah Baris Kredensial / Catatan</span>
                </Button>
              </div>

              {/* Catatan Status Audit Optional */}
              <div>
                <label className="text-[10px] uppercase font-semibold text-[#64748B] block mb-1">
                  Catatan Admin (Tercatat di Audit Log):
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Kredensial sudah dites login dan aktif"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="text-xs bg-white border-[#CBD5E1] h-8.5 px-3 rounded-lg"
                />
              </div>

              {/* Anti-Fraud Verification Checklist Box */}
              {isAntiFraudRequired && (
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-[#D97706] font-semibold text-[11px]">
                    <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5" />
                    <span>Verifikasi Mutasi Rekening Anti-Fraud</span>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer bg-white p-2.5 rounded-lg border border-[#FDE68A]">
                    <input
                      type="checkbox"
                      checked={isMutationVerified}
                      onChange={(e) => setIsMutationVerified(e.target.checked)}
                      className="w-4 h-4 accent-[#2563EB] mt-0.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-medium text-[#0F172A] leading-snug">
                      Saya telah memeriksa mutasi riil sebesar{' '}
                      <strong className="text-[#2563EB] font-mono">
                        Rp {order.total_amount.toLocaleString('id-ID')}
                      </strong>{' '}
                      di m-Banking/DANA, bukan hanya screenshot WhatsApp.
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCredentialModalOpen(false)}
                disabled={isCompletingManual}
                className="text-xs h-9 px-4 rounded-xl border-[#CBD5E1] text-[#475569] hover:bg-white cursor-pointer font-medium"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleConfirmManualCompletion}
                disabled={isCompletingManual || (isAntiFraudRequired && !isMutationVerified)}
                className="text-xs h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompletingManual ? (
                  <>
                    <FontAwesomeIcon icon={faRotateLeft} className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan & Mengirim Email...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                    <span>Simpan Kredensial & Selesaikan Pesanan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
