'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog } from '@/components/ui/heroui-alert-dialog';
import { CreditCard, ShieldCheck, AlertCircle } from 'lucide-react';
import { CheckoutVoucherSection } from './checkout-voucher-section';

export interface CartItemSummary {
  id: string;
  name: string;
  priceNumeric: number;
  quantity: number;
  stock?: number;
  isOutOfStock?: boolean;
}

interface CheckoutCartSummaryProps {
  items: CartItemSummary[];
  totalItems: number;
  subtotal: number;
  appliedPromo: {
    code: string;
    discount: number;
    description?: string;
  } | null;
  discountAmount: number;
  finalTotal: number;
  isManualMode: boolean;
  enableUniqueCode?: boolean;
  isSubmitting: boolean;
  hasOutOfStockItems?: boolean;
  promoCode: string;
  onPromoCodeChange: (val: string) => void;
  onApplyPromo: () => void;
  onRemovePromo?: () => void;
  isCheckingPromo: boolean;
  promoFeedback: {
    type: 'success' | 'error';
    text: string;
  } | null;
  onValidateBeforeCheckout?: () => boolean;
  onConfirmOrder?: () => void;
}

export function CheckoutCartSummary({
  items,
  totalItems,
  subtotal,
  appliedPromo,
  discountAmount,
  finalTotal,
  isManualMode,
  isSubmitting,
  hasOutOfStockItems,
  promoCode,
  onPromoCodeChange,
  onApplyPromo,
  onRemovePromo,
  isCheckingPromo,
  promoFeedback,
  onValidateBeforeCheckout,
  onConfirmOrder,
}: CheckoutCartSummaryProps) {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const handleTriggerClick = () => {
    if (hasOutOfStockItems) return;
    if (onValidateBeforeCheckout) {
      const isValid = onValidateBeforeCheckout();
      if (!isValid) return;
    }
    setIsConfirmOpen(true);
  };

  const handleConfirmPayment = () => {
    setIsConfirmOpen(false);
    if (onConfirmOrder) {
      onConfirmOrder();
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-base font-bold text-navy-900">Ringkasan Pesanan</h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
          {totalItems} Item
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => {
          const itemOutOfStock =
            item.isOutOfStock || (item.stock !== undefined && item.stock <= 0);

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                itemOutOfStock
                  ? 'border-red-200 bg-red-50/50'
                  : 'border-border bg-slate-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-navy-900 block truncate">{item.name}</span>
                <span className="text-[11px] text-slate-500">
                  {item.quantity} x Rp {item.priceNumeric.toLocaleString('id-ID')}
                </span>
                {itemOutOfStock && (
                  <span className="text-[10px] text-status-error font-bold block mt-0.5">
                    Stok habis
                  </span>
                )}
              </div>
              <span className="font-bold text-navy-900 shrink-0">
                Rp {(item.priceNumeric * item.quantity).toLocaleString('id-ID')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Voucher Code Input */}
      <CheckoutVoucherSection
        promoCode={promoCode}
        onPromoCodeChange={onPromoCodeChange}
        onApplyPromo={onApplyPromo}
        onRemovePromo={onRemovePromo}
        appliedPromo={appliedPromo}
        isCheckingPromo={isCheckingPromo}
        promoFeedback={promoFeedback}
      />

      {/* Calculation Breakdown */}
      <div className="space-y-2 pt-2 border-t border-border text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Subtotal:</span>
          <span className="font-semibold text-navy-900">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-status-success font-semibold">
            <span>Diskon Voucher:</span>
            <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-500">
          <span>Biaya Layanan:</span>
          <span className="font-semibold text-status-success">Gratis (Rp 0)</span>
        </div>

        <div className="flex justify-between items-center text-sm pt-3 border-t border-border">
          <span className="font-bold text-navy-900">Total Pembayaran:</span>
          <span className="font-extrabold text-xl text-accent">
            Rp {finalTotal.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Checkout Submit CTA Button */}
      {hasOutOfStockItems ? (
        <Button
          type="button"
          disabled
          className="w-full h-12 text-xs font-bold rounded-xl bg-red-100 text-status-error border border-red-200 cursor-not-allowed opacity-90"
        >
          Sebagian Item Habis
        </Button>
      ) : (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleTriggerClick}
            className="w-full gap-2 text-sm font-bold h-12 rounded-xl bg-accent hover:bg-accent-hover text-white shadow-sm transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Memproses Pesanan...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>{`Bayar Sekarang (Rp ${finalTotal.toLocaleString('id-ID')})`}</span>
              </>
            )}
          </Button>

          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <AlertDialog.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <AlertDialog.Dialog className="w-full max-w-[420px] bg-white border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
                <AlertDialog.CloseTrigger className="absolute top-4 right-4 text-slate-400 hover:text-navy-900 p-1 rounded-lg" />
                <AlertDialog.Header className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-accent shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <AlertDialog.Heading className="text-base font-bold text-navy-900">
                        Konfirmasi Pembayaran
                      </AlertDialog.Heading>
                      <p className="text-xs text-slate-500">
                        Periksa kembali ringkasan pesanan sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </AlertDialog.Header>

                <AlertDialog.Body className="text-xs space-y-3 pt-1">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-border space-y-2">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Jumlah Produk:</span>
                      <span className="font-bold text-navy-900">{totalItems} Layanan Digital</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500">
                      <span>Metode Pembayaran:</span>
                      <span className="font-bold text-navy-900">
                        {isManualMode ? 'Transfer Bank / E-Wallet Manual' : 'Payment Gateway Instan'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 pt-2 border-t border-border/80">
                      <span className="font-bold text-navy-900">Total Tagihan:</span>
                      <span className="font-extrabold text-base text-accent">
                        Rp {finalTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Pastikan email penerima lisensi dan nomor WhatsApp Anda telah terisi dengan benar.</span>
                  </div>
                </AlertDialog.Body>

                <AlertDialog.Footer className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfirmOpen(false)}
                    className="text-xs border-border h-9 px-4 rounded-xl text-navy-900"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmPayment}
                    className="text-xs font-bold h-9 px-4 gap-2 bg-accent hover:bg-accent-hover text-white shadow-sm rounded-xl cursor-pointer"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Bayar'}</span>
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      )}

      <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-accent" />
        <span>Garansi uang kembali 100% jika aktivasi akun gagal.</span>
      </div>
    </div>
  );
}
