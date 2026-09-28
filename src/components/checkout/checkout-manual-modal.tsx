'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PublicPaymentConfig } from '@/lib/services/payment-config.service';
import {
  X,
  Clock,
  Check,
  Copy,
  QrCode,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

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
            <div className="flex items-center gap-2">
              <Badge className="text-[10px] bg-status-warning text-black font-semibold">
                Transfer Manual Toko
              </Badge>
              <span className="text-xs font-mono text-foreground-muted">
                ID: {data.orderId}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground mt-2">
              Instruksi Pembayaran Manual
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expiry Warning Box */}
        <div className="bg-surface-raised rounded-lg p-3 flex items-center justify-between text-xs border border-border">
          <div className="flex items-center gap-2 text-foreground-muted">
            <Clock className="w-4 h-4 text-status-warning" />
            <span>Batas Waktu Pembayaran</span>
          </div>
          <span className="font-mono font-bold text-status-warning">
            {paymentConfig?.order_expiry_hours || 24} Jam ke depan
          </span>
        </div>

        {/* Highlighted Amount to Transfer with Unique Code */}
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
              {copiedKey === 'amount' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'amount' ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {data.uniqueCode && (
            <p className="text-[11px] text-foreground-muted font-medium">
              Termasuk 3 digit kode verifikasi mutasi{' '}
              <span className="text-primary font-mono font-bold">
                (+Rp {data.uniqueCode})
              </span>
              . Mohon transfer tepat hingga digit terakhir agar verifikasi otomatis cepat!
            </p>
          )}
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
                {copiedKey === 'bca' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bca' ? 'Tersalin' : 'Salin'}</span>
              </Button>
            </div>
          </div>
        )}

        {data.method === 'manual_qris' && (
          <div className="p-4 bg-surface-raised rounded-xl border border-border text-center space-y-3">
            <div className="w-40 h-40 bg-white p-2 rounded-xl mx-auto flex items-center justify-center border border-border">
              <div className="w-full h-full border-2 border-zinc-900 border-dashed rounded-lg flex flex-col items-center justify-center p-2 text-zinc-900">
                <QrCode className="w-14 h-14 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-900">
                  {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
                </span>
              </div>
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                {paymentConfig?.qris?.merchant_name || 'ASTERRA STORE QRIS'}
              </span>
              <p className="text-[11px] text-foreground-muted max-w-xs mx-auto">
                Scan barcode di atas menggunakan GoPay, OVO, Dana, ShopeePay, atau BCA Mobile.
              </p>
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
                {copiedKey === 'dana' ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
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
            <MessageSquare className="w-4 h-4" />
            <span>Kirim Bukti Pembayaran ke WhatsApp Admin</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <Button
            variant="outline"
            className="w-full text-xs text-foreground-muted border-border hover:bg-surface-raised h-10"
            onClick={onClose}
          >
            Saya Sudah Transfer & Lihat Status Pesanan
          </Button>
        </div>
      </div>
    </div>
  );
}
