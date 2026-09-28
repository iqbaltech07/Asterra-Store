'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Order } from '@/lib/orders-data';
import {
  X,
  User,
  Copy,
  Phone,
  ExternalLink,
  ShoppingBag,
  Ticket,
  Edit,
  Clock,
  CheckCircle2,
  Ban,
  ShieldCheck,
  Check,
  Activity,
} from 'lucide-react';
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
  const [newStatus, setNewStatus] = useState<string>('pending');
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [isMutationVerified, setIsMutationVerified] = useState<boolean>(false);

  useEffect(() => {
    if (order) {
      setNewStatus(order.order_status);
      setStatusNotes('');
      setIsMutationVerified(false);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleCopyValidation = () => {
    const summary = generateOrderValidationText(order);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summary);
      onShowNotification('Data validasi pelanggan berhasil disalin!');
    }
  };

  const handleSave = () => {
    if (
      newStatus === 'completed' &&
      (order.payment_mode === 'manual' || !order.payment?.transaction_id?.startsWith('trx-tripay')) &&
      !isMutationVerified
    ) {
      onShowNotification('Harap centang verifikasi mutasi rekening riil terlebih dahulu!');
      return;
    }
    onSaveStatus(newStatus, statusNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur-sm z-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Detail Pesanan {order.id}
              </h3>
              <OrderStatusBadge status={order.order_status} />
            </div>
            <p className="text-xs text-foreground-muted mt-0.5">
              Dibuat pada {new Date(order.order_date).toLocaleString('id-ID')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-5 space-y-6">
          {/* Customer Info & Validation Card */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/70">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Data Validasi Customer & Akun</span>
              </h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyValidation}
                className="h-7 text-[11px] gap-1 px-2 border-border text-foreground-muted hover:text-foreground"
                title="Salin ringkasan data validasi"
              >
                <Copy className="w-3 h-3" />
                <span>Salin Data Validasi</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                <span className="text-foreground-muted block text-[11px]">Nama Lengkap Customer:</span>
                <span className="font-bold text-foreground text-sm">
                  {order.customer_name || 'Pelanggan Toko'}
                </span>
              </div>

              <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                <span className="text-foreground-muted block text-[11px]">Email Pemesan / Notifikasi:</span>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-foreground truncate">
                    {order.customer_email || 'customer@asterra.store'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(order.customer_email || '');
                      onShowNotification('Email disalin!');
                    }}
                    className="text-foreground-muted hover:text-primary p-0.5"
                    title="Salin Email"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                <span className="text-foreground-muted block text-[11px]">WhatsApp Pemesan:</span>
                {order.customer_whatsapp ? (
                  <a
                    href={formatWhatsAppUrl(order.customer_whatsapp) || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-status-success hover:underline font-mono"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{order.customer_whatsapp}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-foreground-muted italic">Tidak dicantumkan</span>
                )}
              </div>

              <div className="p-2.5 bg-surface rounded-lg border border-border/60">
                <span className="text-foreground-muted block text-[11px]">Metode Pembayaran:</span>
                <span className="font-mono font-bold text-foreground uppercase">
                  {order.payment?.payment_method || 'QRIS'}
                </span>
              </div>
            </div>

            {order.customer_notes && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <span className="text-foreground-muted block text-[11px]">Catatan Pelanggan:</span>
                <p className="text-xs text-foreground italic mt-0.5">
                  &ldquo;{order.customer_notes}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Items Breakdown */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              <span>Rincian Item yang Dipesan</span>
            </h4>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 bg-surface rounded-lg border border-border flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-foreground">{item.product_name}</div>
                    <div className="text-[11px] text-foreground-muted mt-1 space-y-0.5">
                      {item.purchased_details?.target_email && (
                        <div>
                          <span>Target Email: </span>
                          <span className="font-medium text-foreground">
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
                  <div className="text-right">
                    <div className="font-bold font-mono text-foreground">
                      Rp {(item.unit_price * item.quantity).toLocaleString('id-ID')}
                    </div>
                    <div className="text-[11px] text-foreground-muted">
                      {item.quantity}x @ Rp {item.unit_price.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              ))}

              {/* Financial Breakdown & Transparent Voucher */}
              <div className="mt-3 pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex justify-between items-center text-foreground-muted">
                  <span>Subtotal Produk</span>
                  <span className="font-mono font-medium text-foreground">
                    Rp {(
                      order.raw_amount ||
                      order.items.reduce((acc, curr) => acc + curr.unit_price * curr.quantity, 0)
                    ).toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-foreground-muted">
                    <Ticket className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Kupon / Voucher</span>
                  </span>
                  {order.promo_code || (order.discount_amount && order.discount_amount > 0) ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      <span>{order.promo_code || 'PROMO'}</span>
                      <span>(-Rp {(order.discount_amount || 0).toLocaleString('id-ID')})</span>
                    </div>
                  ) : (
                    <span className="font-mono text-foreground-muted italic">
                      Tanpa Voucher (Rp 0)
                    </span>
                  )}
                </div>

                {!!order.unique_code && (
                  <div className="flex justify-between items-center text-foreground-muted">
                    <span>Kode Unik Verifikasi</span>
                    <span className="font-mono font-medium text-primary">
                      +Rp {order.unique_code.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                <div className="pt-2.5 flex justify-between items-center text-sm font-bold text-foreground border-t border-border mt-2">
                  <span>Total Tagihan Akhir</span>
                  <span className="text-primary font-mono text-base">
                    Rp {order.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MANUAL STATUS CHANGER & ACTIONS */}
          <div className="bg-surface-raised border border-primary/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 text-primary" />
                <span>Ubah Status Pesanan Manual</span>
              </h4>
              <span className="text-[11px] text-foreground-muted">Hak Akses Admin</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setNewStatus('pending')}
                className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                  newStatus === 'pending'
                    ? 'border-status-warning bg-status-warning/15 text-status-warning font-bold'
                    : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('processing')}
                className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                  newStatus === 'processing'
                    ? 'border-primary bg-primary/15 text-primary font-bold'
                    : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Di Proses</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('completed')}
                className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                  newStatus === 'completed'
                    ? 'border-status-success bg-status-success/15 text-status-success font-bold'
                    : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai</span>
              </button>

              <button
                type="button"
                onClick={() => setNewStatus('cancelled')}
                className={`p-2.5 rounded-lg border text-center transition-colors text-xs font-medium flex flex-col items-center gap-1 ${
                  newStatus === 'cancelled'
                    ? 'border-status-error bg-status-error/15 text-status-error font-bold'
                    : 'border-border bg-surface text-foreground-muted hover:text-foreground'
                }`}
              >
                <Ban className="w-4 h-4" />
                <span>Dibatalkan</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] text-foreground-muted block mb-1">
                Catatan Perubahan (Tercatat di Audit Log):
              </label>
              <Input
                type="text"
                placeholder="Contoh: Kredensial akun dikirim via WhatsApp admin"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="text-xs bg-surface border-border"
              />
            </div>

            {/* Anti-Fraud Verification Checklist Box for Manual Orders */}
            {newStatus === 'completed' &&
              (order.payment_mode === 'manual' ||
                order.payment?.payment_method?.toLowerCase().includes('manual') ||
                order.payment?.payment_method === 'bca' ||
                order.payment?.payment_method === 'dana' ||
                !order.payment?.transaction_id?.startsWith('trx-tripay')) && (
                <div className="p-3 bg-status-warning/10 border border-status-warning/40 rounded-lg space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-status-warning font-semibold">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
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
                  <label className="flex items-start gap-2 cursor-pointer pt-1 bg-surface p-2.5 rounded border border-border">
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

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="text-xs h-8 border-border"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSave}
                disabled={
                  isUpdating ||
                  (newStatus === 'completed' &&
                    (order.payment_mode === 'manual' ||
                      !order.payment?.transaction_id?.startsWith('trx-tripay')) &&
                    !isMutationVerified)
                }
                className="text-xs gap-1.5 h-8 font-semibold"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isUpdating ? 'Menyimpan...' : 'Simpan Status'}</span>
              </Button>
            </div>
          </div>

          {/* TIMELINE AUDIT LOGS */}
          <div className="bg-surface-raised border border-border rounded-xl p-4">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Jejak Riwayat Transaksi (Timeline Logs)</span>
            </h4>

            {order.logs && order.logs.length > 0 ? (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {order.logs.map((log) => (
                  <div key={log.id} className="relative text-xs">
                    {/* Dot indicator */}
                    <div
                      className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                        log.actor === 'tripay_webhook'
                          ? 'bg-status-success'
                          : log.actor === 'admin'
                          ? 'bg-primary'
                          : 'bg-foreground-muted'
                      }`}
                    />
                    <div className="flex items-center gap-2 mb-0.5">
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-border flex justify-end bg-surface">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs border-border"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
