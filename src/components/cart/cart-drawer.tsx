'use client';

import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getTotalAmount, getTotalItems, clearCart } =
    useCartStore();

  if (!isOpen) return null;

  const hasOutOfStockItems = items.some(
    (item) => item.isOutOfStock || (item.stock !== undefined && item.stock <= 0)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 bg-navy-900 border-b border-navy-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white leading-tight">Keranjang Pesanan</h2>
              <span className="text-[11px] text-white/70">
                {getTotalItems()} item digital terpilih
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-foreground-muted">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-foreground">Keranjang masih kosong</p>
              <p className="text-xs text-foreground-muted max-w-xs">
                Pilih produk digital dari katalog untuk menambahkannya ke keranjang pesanan.
              </p>
              <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
                Lihat Katalog
              </Button>
            </div>
          ) : (
            items.map((item) => {
              const itemOutOfStock =
                item.isOutOfStock || (item.stock !== undefined && item.stock <= 0);

              return (
                <div
                  key={item.id}
                  className={`bg-surface-raised border rounded-card p-4 flex flex-col justify-between gap-3 ${
                    itemOutOfStock ? 'border-status-error/40 bg-status-error/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-primary font-medium">{item.category}</span>
                        {itemOutOfStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-error text-white font-semibold shadow-xs shrink-0">
                            Stok Habis
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-foreground mt-0.5 break-words">{item.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-foreground-muted hover:text-status-error transition-colors p-1 shrink-0"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="font-bold text-sm text-foreground">
                      Rp {(item.priceNumeric * item.quantity).toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2 bg-surface border border-border rounded-md px-2 py-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-foreground-muted hover:text-foreground text-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-foreground-muted hover:text-foreground text-xs"
                        disabled={itemOutOfStock}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border bg-surface-raised space-y-4">
            {hasOutOfStockItems && (
              <div className="text-[11px] text-status-error bg-status-error/10 border border-status-error/25 p-2.5 rounded-lg flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  Terdapat item dengan <strong>stok habis</strong>. Silakan hapus item tersebut untuk melanjutkan checkout.
                </span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-foreground-muted">
                <span>Subtotal ({getTotalItems()} item)</span>
                <span>Rp {getTotalAmount().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-foreground-muted">
                <span>Biaya Layanan & PPN</span>
                <span className="text-status-success font-medium">Gratis (Rp 0)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2.5 border-t border-border">
                <span>Total Pembayaran</span>
                <span className="text-primary text-base font-extrabold font-mono">
                  Rp {getTotalAmount().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-foreground-muted hover:text-status-error border-border h-10 px-3"
              >
                Kosongkan
              </Button>
              <Button
                className={`flex-1 gap-2 h-10 font-bold shadow-md shadow-primary/20 ${
                  hasOutOfStockItems
                    ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-primary hover:bg-primary-hover text-white'
                }`}
                disabled={hasOutOfStockItems}
                onClick={onCheckout}
                title={hasOutOfStockItems ? 'Hapus item stok habis terlebih dahulu' : undefined}
              >
                <span>{hasOutOfStockItems ? 'Stok Habis' : 'Lanjut ke Checkout'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
