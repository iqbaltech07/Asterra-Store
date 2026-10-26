'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PublicPaymentConfig } from '@/types/payment';
import { notificationSound } from '@/lib/utils/notification-sound';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faClock,
  faCheck,
  faCircleCheck,
  faCopy,
  faQrcode,
  faArrowUpRightFromSquare,
  faArrowRight,
  faReceipt,
  faExpand,
  faDownload,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export interface ManualPaymentModalData {
  orderId: string;
  amount?: number;
  totalAmount?: number;
  total_amount?: number;
  rawAmount?: number;
  raw_amount?: number;
  uniqueCode?: number;
  unique_code?: number;
  method: string;
  expiresAt?: string;
  expires_at?: string;
}

interface CheckoutManualModalProps {
  data: ManualPaymentModalData | null;
  paymentConfig: PublicPaymentConfig | null;
  customerName: string;
  targetEmail: string;
  onClose: () => void;
  onCopy: (text: string, key: string, label: string) => void;
  copiedKey: string | null;
  getMethodName: (methodId: string) => string;
}

export function CheckoutManualModal({
  data,
  paymentConfig,
  customerName,
  targetEmail,
  onClose,
  onCopy,
  copiedKey,
  getMethodName,
}: CheckoutManualModalProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    hours: paymentConfig?.order_expiry_hours || 24,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [paidStatusLabel, setPaidStatusLabel] = useState('Sedang Diproses');
  const [isQrisExpanded, setIsQrisExpanded] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  // Close expanded QRIS lightbox on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isQrisExpanded) {
        setIsQrisExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQrisExpanded]);

  // Handle seamless redirect to personal order tracking page (/order)
  const handleRedirectToOrder = useCallback(() => {
    if (!data?.orderId) return;

    if (typeof window !== 'undefined' && targetEmail?.trim()) {
      try {
        localStorage.setItem('asterra_customer_email', targetEmail.trim());
        localStorage.setItem('asterra_last_order_id', data.orderId);
      } catch {}
    }

    const emailQuery = targetEmail?.trim() ? `&email=${encodeURIComponent(targetEmail.trim())}` : '';

    if (pathname === '/order') {
      onClose();
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', `/order?id=${data.orderId}${emailQuery}`);
      }
    } else {
      router.push(`/order?id=${data.orderId}${emailQuery}`);
    }
  }, [data?.orderId, targetEmail, pathname, onClose, router]);

  // Reset states when modal order changes
  useEffect(() => {
    setIsPaidSuccess(false);
    setRedirectCountdown(3);
    setPaidStatusLabel('Sedang Diproses');
  }, [data?.orderId]);

  // Live real-time countdown timer & auto-cancellation
  useEffect(() => {
    if (!data || isPaidSuccess) return;

    const expiryStr = data.expiresAt || data.expires_at;
    const targetTime = expiryStr
      ? new Date(expiryStr).getTime()
      : Date.now() + (paymentConfig?.order_expiry_hours || 24) * 3600 * 1000;

    let hasTriggeredCancel = false;

    const updateCountdown = () => {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (!hasTriggeredCancel) {
          hasTriggeredCancel = true;
          // Notify backend that order expired and cancel it
          fetch(`/api/v1/orders/${data.orderId}/cancel`, { method: 'POST' }).catch(() => {});
        }
        return;
      }

      const totalSeconds = Math.floor(diff / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [data, paymentConfig?.order_expiry_hours, isPaidSuccess]);

  // Real-Time Polling for Order Status: Detects payment completion immediately
  useEffect(() => {
    if (!data?.orderId || isPaidSuccess) return;

    let isSubscribed = true;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/v1/orders/${data.orderId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!isSubscribed || !json?.data) return;

        const order = json.data;
        const status = String(order.order_status || order.status || '').toLowerCase();
        const paymentStatus = String(
          order.payment_status || order.payment?.payment_status || ''
        ).toLowerCase();

        const isOrderPaid =
          ['completed', 'processing', 'paid', 'settlement', 'success'].includes(status) ||
          ['completed', 'processing', 'paid', 'settlement', 'success'].includes(paymentStatus) ||
          Boolean(order.paid_at);

        if (isOrderPaid) {
          setIsPaidSuccess(true);
          setPaidStatusLabel(status === 'completed' ? 'Selesai' : 'Sedang Diproses');
          if (status === 'completed' || status === 'selesai') {
            notificationSound.play('selesai', {
              orderId: data.orderId,
              eventId: `${data.orderId}:completed`,
            });
          }
        }
      } catch {
        // Silently catch polling errors to prevent UI interruptions
      }
    };

    // Immediate check + interval every 2.5 seconds
    checkOrderStatus();
    const pollInterval = setInterval(checkOrderStatus, 2500);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
    };
  }, [data?.orderId, isPaidSuccess]);

  // Redirect Countdown Timer once payment is confirmed
  useEffect(() => {
    if (!isPaidSuccess || !data?.orderId) return;

    if (redirectCountdown <= 0) {
      handleRedirectToOrder();
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isPaidSuccess, redirectCountdown, data?.orderId, handleRedirectToOrder]);

  if (!data) return null;

  const amountNumber =
    typeof data.amount === 'number' && !isNaN(data.amount)
      ? data.amount
      : typeof data.totalAmount === 'number' && !isNaN(data.totalAmount)
      ? data.totalAmount
      : typeof data.total_amount === 'number' && !isNaN(data.total_amount)
      ? data.total_amount
      : typeof data.rawAmount === 'number' && !isNaN(data.rawAmount)
      ? data.rawAmount
      : typeof data.raw_amount === 'number' && !isNaN(data.raw_amount)
      ? data.raw_amount
      : Number(data.amount || data.totalAmount || data.total_amount || 0) || 0;

  const formattedAmount = amountNumber.toLocaleString('id-ID');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
        onClick={() => {
          if (isPaidSuccess) {
            handleRedirectToOrder();
          } else {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 sm:p-8 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-foreground-muted block">
              ID Pesanan: {data.orderId}
            </span>
            <h3 className="text-xl font-bold text-foreground mt-1">
              {isPaidSuccess ? 'Pembayaran Berhasil!' : 'Instruksi Pembayaran Manual'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isPaidSuccess) {
                handleRedirectToOrder();
              } else {
                onClose();
              }
            }}
            className="text-foreground-muted hover:text-foreground p-1 cursor-pointer"
            title="Tutup"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* SUCCESS VIEW: Triggered automatically when order is paid */}
        {/* ========================================================= */}
        {isPaidSuccess ? (
          <div className="py-2 text-center space-y-5 animate-in zoom-in-95 duration-200">
            {/* Animated Celebration Icon */}
            <div className="relative mx-auto w-20 h-20 flex items-center justify-center my-2">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                <FontAwesomeIcon icon={faCircleCheck} className="w-10 h-10 animate-in zoom-in duration-300" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                <span>Pembayaran Berhasil Diverifikasi!</span>
              </div>
              <h4 className="text-lg font-bold text-foreground">
                Terima Kasih, Pesanan Anda Sedang Diproses
              </h4>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto leading-relaxed">
                Pembayaran untuk pesanan <strong className="text-foreground font-mono">{data.orderId}</strong> telah berhasil kami terima. Detail dan lisensi akun akan segera aktif di halaman akun Anda.
              </p>
            </div>

            {/* Order Brief Summary Card */}
            <div className="bg-surface-raised border border-border rounded-xl p-4 text-xs space-y-2 text-left shadow-xs">
              <div className="flex justify-between items-center text-foreground-muted pb-2 border-b border-border">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faReceipt} className="w-3 h-3 text-primary" />
                  <span>No. Pesanan:</span>
                </span>
                <span className="font-mono font-bold text-foreground">{data.orderId}</span>
              </div>
              <div className="flex justify-between items-center text-foreground-muted">
                <span>Total Nominal:</span>
                <span className="font-mono font-bold text-emerald-600 text-sm">
                  Rp {formattedAmount} (Lunas)
                </span>
              </div>
              {targetEmail && (
                <div className="flex justify-between items-center text-foreground-muted">
                  <span>Email Aktivasi:</span>
                  <span className="font-semibold text-foreground">{targetEmail}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-foreground-muted">
                <span>Status Pesanan:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 text-[11px] font-bold">
                  {paidStatusLabel}
                </span>
              </div>
            </div>

            {/* Auto Redirect Countdown Box */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs flex items-center justify-between text-foreground">
              <div className="flex items-center gap-2 text-foreground-muted">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span>Mengarahkan ke halaman pelacakan pesanan Anda...</span>
              </div>
              <span className="font-mono font-bold text-primary px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                {redirectCountdown}s
              </span>
            </div>

            {/* Action Button: Instant Redirect */}
            <div className="pt-2">
              <Button
                type="button"
                onClick={handleRedirectToOrder}
                className="w-full py-3.5 h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md cursor-pointer transition-all"
              >
                <span>Lihat / Lacak Status Pesanan Sekarang</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* PENDING PAYMENT VIEW: Manual Transfer Instructions        */
          /* ========================================================= */
          <>
            {/* Live Expiry Countdown Box */}
            <div
              className={`rounded-lg p-3 flex items-center justify-between text-xs border ${
                timeLeft.isExpired
                  ? 'bg-status-error/10 border-status-error/30 text-status-error'
                  : 'bg-surface-raised border-border text-foreground'
              }`}
            >
              <div className="flex items-center gap-2 text-foreground-muted">
                <FontAwesomeIcon
                  icon={faClock}
                  className={`w-4 h-4 ${
                    timeLeft.isExpired ? 'text-status-error' : 'text-status-warning'
                  }`}
                />
                <span>Batas Waktu Pembayaran</span>
              </div>

              {timeLeft.isExpired ? (
                <span className="font-mono font-bold text-status-error">
                  Waktu Habis (Pesanan Dibatalkan)
                </span>
              ) : (
                <div className="flex items-center gap-1 font-mono font-bold text-status-warning text-xs sm:text-sm">
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </span>
                  <span>:</span>
                  <span className="px-1.5 py-0.5 rounded bg-surface border border-border">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Highlighted Amount to Transfer */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl text-center space-y-2">
              <span className="text-xs text-foreground-muted block font-medium">
                Total Nominal Wajib Ditransfer:
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-primary font-mono">
                  Rp {formattedAmount}
                </span>
                <button
                  type="button"
                  onClick={() => onCopy(String(amountNumber), 'amount', 'Nominal transfer tepat')}
                  className="px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Salin Nominal Tepat"
                >
                  {copiedKey === 'amount' ? (
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  ) : (
                    <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'amount' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Method Details: Bank BCA / QRIS / DANA */}
            {data.method === 'manual_bca' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Rekening Tujuan Transfer:</span>
                  <span className="text-foreground-muted text-[11px]">{paymentConfig?.bank?.name}</span>
                </div>
                <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                  <div>
                    <span className="font-mono font-bold text-lg text-foreground tracking-wider block">
                      {paymentConfig?.bank?.account_number || '8965123456'}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      a.n {paymentConfig?.bank?.account_name || 'Asterra Store Official'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onCopy(
                        paymentConfig?.bank?.account_number || '8965123456',
                        'bca',
                        'Nomor rekening'
                      )
                    }
                    className="text-xs gap-1.5 h-8 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'bca' ? (
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'bca' ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>
            )}

            {data.method === 'manual_qris' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border text-center space-y-3">
                <div
                  onClick={() => setIsQrisExpanded(true)}
                  className="w-64 h-64 sm:w-72 sm:h-72 bg-white p-3.5 rounded-2xl mx-auto flex items-center justify-center border border-border shadow-md overflow-hidden relative cursor-zoom-in group transition-all duration-200 hover:shadow-xl hover:border-primary/40 select-none"
                  title="Klik untuk membuka & memperbesar barcode QRIS"
                >
                  {paymentConfig?.qris?.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={paymentConfig.qris.image_url}
                      alt={paymentConfig.qris.merchant_name || 'ASTERRA STORE QRIS'}
                      className="w-full h-full object-contain rounded-xl group-hover:scale-[1.02] transition-transform duration-200"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full border-2 border-zinc-900 border-dashed rounded-xl flex flex-col items-center justify-center p-2 text-zinc-900 ${
                      paymentConfig?.qris?.image_url ? 'hidden' : 'flex'
                    }`}
                  >
                    <FontAwesomeIcon icon={faQrcode} className="w-14 h-14 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-900">
                      {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                    </span>
                  </div>

                  {/* Hover Overlay Badge */}
                  {paymentConfig?.qris?.image_url && (
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white backdrop-blur-[2px] rounded-2xl">
                      <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white shadow-sm">
                        <FontAwesomeIcon icon={faExpand} className="w-4 h-4" />
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/60 text-white shadow-sm">
                        Klik untuk Perbesar Barcode
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-foreground block">
                    {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                  </span>
                  <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
                    Scan barcode di atas menggunakan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile.
                  </p>

                  {paymentConfig?.qris?.image_url && (
                    <div className="pt-1.5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsQrisExpanded(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <FontAwesomeIcon icon={faExpand} className="w-3.5 h-3.5" />
                        <span>Perbesar Barcode (Layar Lebar)</span>
                      </button>

                      <a
                        href={paymentConfig.qris.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-raised text-foreground-muted hover:text-foreground border border-border text-xs transition-colors"
                        title="Buka file gambar di tab baru"
                      >
                        <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                        <span>Tab Baru</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {data.method === 'manual_dana' && (
              <div className="p-4 bg-surface-raised rounded-xl border border-border space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">Nomor Akun E-Wallet DANA:</span>
                  <span className="text-foreground-muted text-[11px]">DANA Indonesia</span>
                </div>
                <div className="flex items-center justify-between bg-surface p-3 rounded-lg border border-border">
                  <div>
                    <span className="font-mono font-bold text-lg text-foreground tracking-wider block">
                      {paymentConfig?.dana?.number || '081234567890'}
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      a.n {paymentConfig?.dana?.account_name || 'Asterra Store'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onCopy(
                        paymentConfig?.dana?.number || '081234567890',
                        'dana',
                        'Nomor DANA'
                      )
                    }
                    className="text-xs gap-1.5 h-8 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'dana' ? (
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success" />
                    ) : (
                      <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'dana' ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Direct WhatsApp Confirmation Button */}
            <div className="space-y-2.5 pt-1">
              <a
                href={`https://wa.me/${paymentConfig?.confirmation_whatsapp || '6281234567890'}?text=${encodeURIComponent(
                  `Halo Admin Asterra Store, saya sudah melakukan transfer pembayaran manual untuk pesanan:\n\n• No. Pesanan: ${
                    data.orderId
                  }\n• Nama Pemesan: ${customerName}\n• Email Aktivasi: ${targetEmail}\n• Total Nominal Ditransfer: Rp ${formattedAmount}\n• Metode: ${getMethodName(
                    data.method
                  )}\n\nBerikut saya lampirkan bukti transfernya untuk divalidasi. Terima kasih!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faWhatsapp} className="w-4 h-4" />
                <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="outline"
                className="w-full text-xs text-foreground-muted border-border hover:bg-surface-raised h-10 cursor-pointer"
                onClick={handleRedirectToOrder}
              >
                <FontAwesomeIcon icon={faReceipt} className="w-3.5 h-3.5 mr-1 text-primary" />
                <span>Lihat Status Pesanan</span>
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ========================================================= */}
      {/* EXPANDED QRIS LIGHTBOX (Full screen wide barcode view)    */}
      {/* ========================================================= */}
      {isQrisExpanded && paymentConfig?.qris?.image_url && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tampilan Barcode QRIS Layar Penuh"
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsQrisExpanded(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-surface border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface-raised/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <FontAwesomeIcon icon={faQrcode} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    Barcode QRIS Resmi Toko
                  </h4>
                  <span className="text-[11px] text-foreground-muted block">
                    {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrisExpanded(false)}
                className="w-8 h-8 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface flex items-center justify-center transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
            </div>

            {/* Lightbox Body with Transfer Amount Bar */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 flex flex-col items-center">
              {/* Transfer amount reminder box */}
              <div className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                <div>
                  <span className="text-[11px] text-foreground-muted block">
                    Total Nominal Wajib Ditransfer:
                  </span>
                  <span className="text-lg font-extrabold text-primary font-mono">
                    Rp {formattedAmount}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(String(amountNumber), 'amount', 'Nominal transfer tepat')}
                  className="px-2.5 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedKey === 'amount' ? (
                    <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
                  ) : (
                    <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'amount' ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {/* The Big High-Res QRIS Canvas Card */}
              <div
                onClick={() => setIsZoomedIn(!isZoomedIn)}
                className={`w-full bg-white p-4 sm:p-6 rounded-2xl border border-zinc-200 shadow-md flex items-center justify-center overflow-auto transition-all ${
                  isZoomedIn ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                title={isZoomedIn ? "Klik untuk memperkecil" : "Klik untuk memperbesar lebih lanjut"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={paymentConfig.qris.image_url}
                  alt={paymentConfig.qris.merchant_name || 'ASTERRA STORE QRIS'}
                  className={`w-auto object-contain rounded-lg transition-transform duration-200 select-none ${
                    isZoomedIn ? 'scale-125 max-h-[75vh]' : 'max-h-[55vh] max-w-full'
                  }`}
                />
              </div>

              <p className="text-[11px] text-foreground-muted text-center max-w-sm">
                Arahkan kamera aplikasi bank/e-wallet Anda ke barcode di atas atau simpan gambar ke galeri untuk scan dari aplikasi pembayaran.
              </p>
            </div>

            {/* Lightbox Footer Actions */}
            <div className="p-3 sm:p-4 border-t border-border bg-surface-raised flex flex-col sm:flex-row items-center gap-2">
              <button
                type="button"
                onClick={() => setIsZoomedIn(!isZoomedIn)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-raised text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FontAwesomeIcon
                  icon={isZoomedIn ? faMagnifyingGlassMinus : faMagnifyingGlassPlus}
                  className="w-3.5 h-3.5 text-primary"
                />
                <span>{isZoomedIn ? 'Zoom Normal' : 'Perbesar Zoom'}</span>
              </button>

              <a
                href={paymentConfig.qris.image_url}
                download={`QRIS-${data.orderId}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-surface hover:bg-surface-raised text-foreground border border-border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <FontAwesomeIcon icon={faDownload} className="w-3.5 h-3.5 text-primary" />
                <span>Simpan Gambar</span>
              </a>

              <Button
                type="button"
                onClick={() => setIsQrisExpanded(false)}
                className="w-full sm:flex-1 py-2.5 h-10 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                <span>Selesai & Kembali</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
