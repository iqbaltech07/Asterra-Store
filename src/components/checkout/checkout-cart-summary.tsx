'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog } from '@/components/ui/heroui-alert-dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCreditCard,
  faShieldHalved,
  faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
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
    <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(18,26,42,0.08)]">
        <h3 className="text-base font-bold text-[#121A2A]">Ringkasan Pesanan</h3>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#F8FAFC] text-[#121A2A]/80 border border-[rgba(18,26,42,0.08)]">
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
                  : 'border-[rgba(18,26,42,0.08)] bg-[#F8FAFC]'
              }`}
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-[#121A2A] block truncate">{item.name}</span>
                <span className="text-[11px] text-[#121A2A]/60">
                  {item.quantity} x Rp {item.priceNumeric.toLocaleString('id-ID')}
                </span>
                {itemOutOfStock && (
                  <span className="text-[10px] text-status-error font-bold block mt-0.5">
                    Stok habis
                  </span>
                )}
              </div>
              <span className="font-bold text-[#121A2A] shrink-0">
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
      <div className="space-y-2 pt-2 border-t border-[rgba(18,26,42,0.08)] text-xs">
        <div className="flex justify-between text-[#121A2A]/60">
          <span>Subtotal:</span>
          <span className="font-semibold text-[#121A2A]">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex justify-between text-status-success font-semibold">
            <span>Diskon Voucher:</span>
            <span>-Rp {discountAmount.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="flex justify-between text-[#121A2A]/60">
          <span>Biaya Layanan:</span>
          <span className="font-semibold text-status-success">Gratis (Rp 0)</span>
        </div>

        <div className="flex justify-between items-center text-sm pt-3 border-t border-[rgba(18,26,42,0.08)]">
          <span className="font-bold text-[#121A2A]">Total Pembayaran:</span>
          <span className="font-extrabold text-xl text-[#C96F55]">
            Rp {finalTotal.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Checkout Submit CTA Button */}
      {hasOutOfStockItems ? (
        <Button
          type="button"
          disabled
          className="w-full h-12 text-xs font-bold rounded-lg bg-red-100 text-status-error border border-red-200 cursor-not-allowed opacity-90"
        >
          Sebagian Item Habis
        </Button>
      ) : (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleTriggerClick}
            className="w-full gap-2 text-sm font-bold h-12 rounded-lg bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-xs transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Memproses Pesanan...</span>
            ) : (
              <>
                <FontAwesomeIcon icon={faCreditCard} className="w-4 h-4" />
                <span>{`Bayar Sekarang (Rp ${finalTotal.toLocaleString('id-ID')})`}</span>
              </>
            )}
          </Button>

          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-[#121A2A]/60 backdrop-blur-xs animate-in fade-in">
            <AlertDialog.Container className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <AlertDialog.Dialog className="w-full max-w-[420px] bg-white border border-[rgba(18,26,42,0.1)] rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
                <AlertDialog.CloseTrigger className="absolute top-4 right-4 text-[#121A2A]/50 hover:text-[#121A2A] p-1 rounded-lg" />
                <AlertDialog.Header className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] flex items-center justify-center text-[#C96F55] shrink-0">
                      <FontAwesomeIcon icon={faCreditCard} className="w-5 h-5" />
                    </div>
                    <div>
                      <AlertDialog.Heading className="text-base font-bold text-[#121A2A]">
                        Konfirmasi Pembayaran
                      </AlertDialog.Heading>
                      <p className="text-xs text-[#121A2A]/60">
                        Periksa kembali ringkasan pesanan sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </AlertDialog.Header>

                <AlertDialog.Body className="text-xs space-y-3 pt-1">
                  <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[rgba(18,26,42,0.08)] space-y-2">
                    <div className="flex justify-between items-center text-[#121A2A]/60">
                      <span>Jumlah Produk:</span>
                      <span className="font-bold text-[#121A2A]">{totalItems} Layanan Digital</span>
                    </div>
                    <div className="flex justify-between items-center text-[#121A2A]/60">
                      <span>Metode Pembayaran:</span>
                      <span className="font-bold text-[#121A2A]">
                        {isManualMode ? 'Transfer Bank / E-Wallet Manual' : 'Payment Gateway Instan'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[#121A2A]/60 pt-2 border-t border-[rgba(18,26,42,0.08)]">
                      <span className="font-bold text-[#121A2A]">Total Tagihan:</span>
                      <span className="font-extrabold text-base text-[#C96F55]">
                        Rp {finalTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] flex items-start gap-2 text-[11px] text-[#121A2A]">
                    <FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4 text-[#C96F55] shrink-0 mt-0.5" />
                    <span>Pastikan email penerima lisensi dan nomor WhatsApp Anda telah terisi dengan benar.</span>
                  </div>
                </AlertDialog.Body>

                <AlertDialog.Footer className="flex items-center justify-end gap-2.5 pt-3 border-t border-[rgba(18,26,42,0.08)]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfirmOpen(false)}
                    className="rounded-lg text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleConfirmPayment}
                    className="rounded-lg text-xs font-bold bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF]"
                  >
                    {isSubmitting ? 'Memproses...' : 'Ya, Lanjutkan Pembayaran'}
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      )}

      {/* Security Guarantee Bar */}
      <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[rgba(18,26,42,0.08)] space-y-2 text-[11px] text-[#121A2A]/70">
        <div className="flex items-center gap-2 text-[#121A2A] font-semibold">
          <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-[#C96F55]" />
          <span>Jaminan Transaksi Terpercaya & Terenkripsi</span>
        </div>
        <p className="leading-relaxed">
          Kredensial aktivasi diproses secara langsung ke email tujuan. Seluruh data transaksi dilindungi standar keamanan perbankan resmi.
        </p>
      </div>
    </div>
  );
}
