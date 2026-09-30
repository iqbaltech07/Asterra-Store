'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
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
              <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground truncate block max-w-full">
                    {item.name}
                  </span>
                  {itemOutOfStock && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 bg-status-error text-white font-semibold shrink-0">
                      Stok Habis
                    </Badge>
                  )}
                </div>
                <span className="text-foreground-muted text-[11px] block">
                  {item.quantity}x @ Rp {item.priceNumeric.toLocaleString('id-ID')}
                </span>
              </div>
              <span className="font-mono font-bold text-foreground shrink-0 text-right">
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

      {/* Submit Button with HeroUI AlertDialog Confirmation */}
      {hasOutOfStockItems ? (
        <Button
          type="button"
          disabled
          className="w-full gap-2 text-sm font-bold h-12 opacity-60 cursor-not-allowed bg-muted text-muted-foreground shadow-none"
        >
          <span>Stok Habis (Hapus Item)</span>
        </Button>
      ) : (
        <AlertDialog>
          <Button
            type="button"
            disabled={isSubmitting}
            className="w-full gap-2 text-sm font-bold h-12 shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90 transition-all"
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
              <AlertDialog.Dialog className="w-full max-w-[420px] bg-surface border border-border rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
                <AlertDialog.CloseTrigger className="absolute top-4 right-4 text-foreground-muted hover:text-foreground p-1 rounded-lg" />
                <AlertDialog.Header className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <AlertDialog.Heading className="text-base font-bold text-foreground">
                        Konfirmasi Pembayaran
                      </AlertDialog.Heading>
                      <p className="text-xs text-foreground-muted">
                        Periksa kembali ringkasan pesanan sebelum melanjutkan.
                      </p>
                    </div>
                  </div>
                </AlertDialog.Header>

                <AlertDialog.Body className="text-xs space-y-3 pt-1">
                  <div className="p-3.5 bg-surface-raised rounded-xl border border-border/80 space-y-2">
                    <div className="flex justify-between items-center text-foreground-muted">
                      <span>Jumlah Produk:</span>
                      <span className="font-semibold text-foreground">{totalItems} Layanan Digital</span>
                    </div>
                    <div className="flex justify-between items-center text-foreground-muted">
                      <span>Metode Pembayaran:</span>
                      <span className="font-semibold text-foreground">
                        {isManualMode ? 'Transfer Bank / E-Wallet Manual' : 'Payment Gateway Instan'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-foreground-muted pt-2 border-t border-border/60">
                      <span className="font-medium text-foreground">Total Tagihan:</span>
                      <span className="font-mono font-extrabold text-base text-primary">
                        Rp {finalTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-status-warning/10 border border-status-warning/20 flex items-start gap-2 text-[11px] text-foreground-muted">
                    <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                    <span>Pastikan email penerima lisensi dan nomor WhatsApp Anda telah terisi dengan benar.</span>
                  </div>
                </AlertDialog.Body>

                <AlertDialog.Footer className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <Button
                    slot="close"
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs border-border h-9 px-4"
                  >
                    Batal
                  </Button>
                  <Button
                    slot="close"
                    type="submit"
                    disabled={isSubmitting}
                    className="text-xs font-bold h-9 px-4 gap-2 bg-primary text-white hover:bg-primary/90 shadow-md"
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

      <div className="flex items-center justify-center gap-2 text-[11px] text-foreground-muted text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        <span>Garansi uang kembali 100% jika aktivasi akun gagal.</span>
      </div>
    </div>
  );
}
