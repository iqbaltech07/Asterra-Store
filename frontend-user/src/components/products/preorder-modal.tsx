'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faDoorClosed,
  faXmark,
  faArrowRight,
  faShieldHalved,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface PreorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  variantTitle?: string;
  priceFormatted: string;
  quantity: number;
  nextOpenDisplay: string | null;
  bannerMessage?: string | null;
}

export function PreorderModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  variantTitle,
  priceFormatted,
  quantity,
  nextOpenDisplay,
  bannerMessage,
}: PreorderModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[rgba(18,26,42,0.12)] overflow-hidden flex flex-col box-border animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[rgba(18,26,42,0.08)] bg-[#121A2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C96F55] text-white flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Layanan Pre-Order Asterra Store
              </h3>
              <p className="text-[10px] sm:text-[11px] text-white/70">
                Pemesanan di luar jam operasional
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs text-[#121A2A]">
          {/* Store Closed Notice Card */}
          <div className="p-3.5 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#C96F55] font-bold text-xs">
              <FontAwesomeIcon icon={faDoorClosed} className="w-3.5 h-3.5" />
              <span>Toko Sedang Tutup</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#121A2A]/80 leading-relaxed font-medium">
              {nextOpenDisplay ? (
                <>Pemesanan normal akan kembali dibuka pada pukul <strong>{nextOpenDisplay}</strong>.</>
              ) : (
                bannerMessage || 'Pemesanan reguler saat ini sedang berada di luar jam operasional.'
              )}
            </p>
          </div>

          {/* Product Summary */}
          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.06)] space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-[#121A2A]/50 tracking-wider block">
              Produk yang Dipesan:
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-bold text-xs text-[#121A2A] block truncate">
                  {variantTitle || productName}
                </span>
                <span className="text-[11px] text-[#121A2A]/60 block">
                  Jumlah: {quantity} akun lisensi
                </span>
              </div>
              <span className="font-bold text-sm text-[#C96F55] shrink-0 font-mono">
                {priceFormatted}
              </span>
            </div>
          </div>

          {/* Explanation bullets */}
          <div className="space-y-2 text-[11px] sm:text-xs text-[#121A2A]/75">
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
              <span>
                Pesanan Pre-Order Anda akan tercatat di sistem kami dan mendapatkan <strong>prioritas pemrosesan</strong> segera saat toko buka.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-[#16A34A] shrink-0 mt-0.5" />
              <span>
                Garansi lisensi resmi dan pengiriman kredensial tetap berlaku penuh 100%.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 pt-3 border-t border-[rgba(18,26,42,0.08)] bg-[#F8FAFC] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs h-9 px-4 border-[rgba(18,26,42,0.15)] text-[#121A2A]/70 hover:text-[#121A2A] cursor-pointer"
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            className="text-xs h-9 px-4.5 bg-[#C96F55] hover:bg-[#B86047] text-white font-bold gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <span>Lanjutkan Pre Order</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

