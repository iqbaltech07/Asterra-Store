'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PublicPaymentConfig } from '@/lib/services/payment-config.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faClock,
  faCheck,
  faCopy,
  faQrcode,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

export interface ManualPaymentModalData {
  orderId: string;
  amount: number;
  rawAmount?: number;
  uniqueCode?: number;
  method: string;
  expiresAt?: string;
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

  // Live real-time countdown timer & auto-cancellation
  useEffect(() => {
    if (!data) return;

    const targetTime = data.expiresAt
      ? new Date(data.expiresAt).getTime()
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
  }, [data, paymentConfig?.order_expiry_hours]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl p-6 sm:p-8 z-10 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-foreground-muted block">
              ID Pesanan: {data.orderId}
            </span>
            <h3 className="text-xl font-bold text-foreground mt-1">
              Instruksi Pembayaran Manual
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground p-1"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

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
            <span className="font-mono font-bold text-status-error animate-pulse">
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
              Rp {data.amount.toLocaleString('id-ID')}
            </span>
            <button
              type="button"
              onClick={() => onCopy(String(data.amount), 'amount', 'Nominal transfer tepat')}
              className="px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 text-xs font-semibold flex items-center gap-1"
              title="Salin Nominal Tepat"
            >
              {copiedKey === 'amount' ? <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" /> : <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />}
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
                className="text-xs gap-1.5 h-8 font-semibold"
              >
                {copiedKey === 'bca' ? <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success" /> : <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bca' ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>
          </div>
        )}

        {data.method === 'manual_qris' && (
          <div className="p-4 bg-surface-raised rounded-xl border border-border text-center space-y-3">
            <div className="w-56 h-56 bg-white p-3 rounded-xl mx-auto flex items-center justify-center border border-border shadow-sm overflow-hidden relative">
              {paymentConfig?.qris?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={paymentConfig.qris.image_url}
                  alt={paymentConfig.qris.merchant_name || 'ASTERRA STORE QRIS'}
                  className="w-full h-full object-contain rounded-lg"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full border-2 border-zinc-900 border-dashed rounded-lg flex flex-col items-center justify-center p-2 text-zinc-900 ${
                  paymentConfig?.qris?.image_url ? 'hidden' : 'flex'
                }`}
              >
                <FontAwesomeIcon icon={faQrcode} className="w-14 h-14 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-900">
                  {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-foreground block">
                {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
              </span>
              <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
                Scan barcode di atas menggunakan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile.
              </p>
              {paymentConfig?.qris?.image_url && (
                <a
                  href={paymentConfig.qris.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium pt-1"
                >
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                  <span>Buka Gambar QRIS Penuh</span>
                </a>
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
                className="text-xs gap-1.5 h-8 font-semibold"
              >
                {copiedKey === 'dana' ? <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-status-success" /> : <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5" />}
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
              }\n• Nama Pemesan: ${customerName}\n• Email Aktivasi: ${targetEmail}\n• Total Nominal Ditransfer: Rp ${data.amount.toLocaleString(
                'id-ID'
              )}\n• Metode: ${getMethodName(
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
            className="w-full text-xs text-foreground-muted border-border hover:bg-surface-raised h-10"
            onClick={onClose}
          >
            Lihat Status Pesanan
          </Button>
        </div>
      </div>
    </div>
  );
}
