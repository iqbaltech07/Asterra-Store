'use client';

import { useCartStore } from '@/store/use-cart-store';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faTrashCan,
  faPlus,
  faMinus,
  faArrowRight,
  faBagShopping,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

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
        className="fixed inset-0 bg-[#121A2A]/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white border-l border-[rgba(18,26,42,0.1)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 bg-[#121A2A] border-b border-white/10 text-[#F7F5EF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[rgba(201,111,85,0.15)] flex items-center justify-center text-[#C96F55]">
              <FontAwesomeIcon icon={faBagShopping} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#F7F5EF] leading-tight">Keranjang Pesanan</h2>
              <span className="text-[11px] text-[#F7F5EF]/70">
                {getTotalItems()} item digital terpilih
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#F7F5EF]/70 hover:text-[#F7F5EF] hover:bg-white/10 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-white border border-[rgba(18,26,42,0.08)] flex items-center justify-center text-[#121A2A]/40">
                <FontAwesomeIcon icon={faBagShopping} className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#121A2A]">Keranjang masih kosong</p>
              <p className="text-xs text-[#121A2A]/60 max-w-xs">
                Pilih produk digital dari katalog untuk menambahkannya ke keranjang pesanan.
              </p>
              <Button size="sm" variant="outline" onClick={onClose} className="mt-2 rounded-lg">
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
                  className={`bg-white border rounded-xl p-4 flex flex-col justify-between gap-3 shadow-card ${
                    itemOutOfStock ? 'border-status-error/40 bg-status-error/5' : 'border-[rgba(18,26,42,0.08)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-[#C96F55] font-semibold">{item.category}</span>
                        {itemOutOfStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-status-error text-white font-semibold shadow-xs shrink-0">
                            Stok Habis
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#121A2A] mt-0.5 break-words">{item.name}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-[#121A2A]/40 hover:text-status-error transition-colors p-1 shrink-0"
                      title="Hapus item"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[rgba(18,26,42,0.06)]">
                    <span className="font-bold text-sm text-[#121A2A]">
                      Rp {(item.priceNumeric * item.quantity).toLocaleString('id-ID')}
                    </span>

                    <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[rgba(18,26,42,0.1)] rounded-md px-2 py-0.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-[#121A2A]/60 hover:text-[#121A2A] text-xs"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold px-1 text-[#121A2A]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-[#121A2A]/60 hover:text-[#121A2A] text-xs"
                        disabled={itemOutOfStock}
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
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
          <div className="p-5 border-t border-[rgba(18,26,42,0.08)] bg-white space-y-4">
            {hasOutOfStockItems && (
              <div className="text-[11px] text-status-error bg-status-error/10 border border-status-error/25 p-2.5 rounded-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Terdapat item dengan <strong>stok habis</strong>. Silakan hapus item tersebut untuk melanjutkan checkout.
                </span>
              </div>
            )}

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#121A2A]/60">
                <span>Subtotal ({getTotalItems()} item)</span>
                <span className="font-semibold text-[#121A2A]">Rp {getTotalAmount().toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#121A2A]/60">
                <span>Biaya Layanan & PPN</span>
                <span className="text-status-success font-medium">Gratis (Rp 0)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#121A2A] pt-2.5 border-t border-[rgba(18,26,42,0.08)]">
                <span>Total Pembayaran</span>
                <span className="text-[#C96F55] text-base font-extrabold font-mono">
                  Rp {getTotalAmount().toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-[#121A2A]/70 hover:text-status-error border-[rgba(18,26,42,0.15)] h-10 px-3 rounded-lg"
              >
                Kosongkan
              </Button>
              <Button
                className={`flex-1 gap-2 h-10 font-bold rounded-lg shadow-xs ${
                  hasOutOfStockItems
                    ? 'opacity-50 cursor-not-allowed bg-slate-200 text-slate-500'
                    : 'bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF]'
                }`}
                disabled={hasOutOfStockItems}
                onClick={onCheckout}
                title={hasOutOfStockItems ? 'Hapus item stok habis terlebih dahulu' : undefined}
              >
                <span>{hasOutOfStockItems ? 'Stok Habis' : 'Lanjut ke Checkout'}</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartDrawer;
