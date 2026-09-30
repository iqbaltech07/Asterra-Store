'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck } from 'lucide-react';
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
}: CheckoutCartSummaryProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <h3 className="text-base font-bold text-foreground">Ringkasan Pesanan</h3>
        <Badge variant="outline" className="text-xs border-border">
          {totalItems} Item
        </Badge>
      </div>

      {/* Items List */}
      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => {
          const itemOutOfStock =
            item.isOutOfStock || (item.stock !== undefined && item.stock <= 0);

          return (
            <div
              key={item.id}
              className={`flex items-center justify-between text-xs py-2 px-2.5 rounded-lg border-b border-border/40 last:border-0 ${
                itemOutOfStock ? 'bg-status-error/10 border-status-error/30' : ''
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  {itemOutOfStock && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 bg-status-error text-white font-semibold">
                      Stok Habis
                    </Badge>
                  )}
                </div>
                <span className="text-foreground-muted text-[11px] block">
                  {item.quantity}x @ Rp {item.priceNumeric.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="font-mono font-bold text-foreground">
                Rp {(item.priceNumeric * item.quantity).toLocaleString('id-ID')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Out of stock warning banner */}
      {hasOutOfStockItems && (
        <div className="p-3 bg-status-error/15 border border-status-error/30 rounded-lg text-xs text-status-error font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>Ada item dengan stok habis. Hapus item tersebut sebelum melanjutkan checkout.</span>
        </div>
      )}

      {/* Promo Code Input & Feedback */}
      <CheckoutVoucherSection
        promoCode={promoCode}
        onPromoCodeChange={onPromoCodeChange}
        onApplyPromo={onApplyPromo}
        onRemovePromo={onRemovePromo}
        appliedPromo={appliedPromo}
        isCheckingPromo={isCheckingPromo}
        promoFeedback={promoFeedback}
      />

      {/* Pricing Breakdown */}
      <div className="pt-2 border-t border-border space-y-2 text-xs">
        <div className="flex justify-between text-foreground-muted">
          <span>Subtotal Belanja</span>
          <span className="font-mono">Rp {subtotal.toLocaleString('id-ID')}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-status-success">
            <span>Diskon Voucher ({appliedPromo.code})</span>
            <span className="font-mono">- Rp {discountAmount.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="pt-3 border-t border-border flex justify-between items-baseline">
          <span className="text-sm font-bold text-foreground">Total Tagihan</span>
          <div className="text-right">
            <span className="text-xl font-extrabold text-primary font-mono block">
              Rp {finalTotal.toLocaleString('id-ID')}
            </span>
            <span className="text-[10px] text-foreground-muted">Termasuk PPN & Biaya Layanan</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSubmitting || hasOutOfStockItems}
        className={`w-full gap-2 text-sm font-bold h-12 shadow-lg shadow-primary/20 ${
          hasOutOfStockItems
            ? 'opacity-60 cursor-not-allowed bg-muted text-muted-foreground shadow-none'
            : ''
        }`}
      >
        {isSubmitting ? (
          <span>Memproses Pesanan...</span>
        ) : hasOutOfStockItems ? (
          <span>Stok Habis (Hapus Item)</span>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>
              {isManualMode
                ? 'Lanjut ke Transfer Manual'
                : `Bayar Sekarang (Rp ${finalTotal.toLocaleString('id-ID')})`}
            </span>
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>Garansi uang kembali 100% jika aktivasi akun gagal.</span>
      </div>
    </div>
  );
}
