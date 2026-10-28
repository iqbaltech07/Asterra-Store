'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorClosed,
  faArrowRight,
  faShieldHalved,
  faCartShopping,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreOperatingHours } from '@/lib/hooks/use-store-operating-hours';

export function StoreClosedBanner() {
  const { isClosed, isLoaded, nextOpenDisplay, bannerMessage, allowPreorder } = useStoreOperatingHours();

  // Don't render until loaded or if store is open
  if (!isLoaded || !isClosed) return null;

  return (
    <div
      data-gsap="hero-banner"
      className="w-full mb-3.5 sm:mb-5 overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl border border-[rgba(201,111,85,0.35)] shadow-[0_8px_30px_rgba(201,111,85,0.12)] bg-[#121A2A] text-white relative"
    >
      {/* Subtle ambient gradient highlight */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#C96F55]/15 via-transparent to-[#121A2A] pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 md:p-9 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C96F55]/20 border border-[#C96F55]/40 text-[#F7F5EF] text-[11px] sm:text-xs font-bold tracking-wide">
            <FontAwesomeIcon icon={faDoorClosed} className="w-3.5 h-3.5 text-[#C96F55]" />
            <span className="uppercase tracking-wider">Jam Operasional Toko</span>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
            TOKO SEDANG TUTUP
          </h2>

          {/* Sleeping Admin Notice */}
          <p className="text-sm sm:text-base text-[#F7F5EF] font-semibold leading-snug">
            Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴
          </p>

          {/* Reopening Message */}
          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
            {nextOpenDisplay
              ? `Pemesanan normal akan dibuka kembali pada ${nextOpenDisplay}.`
              : (bannerMessage || 'Pemesanan reguler saat ini sedang berada di luar jam operasional toko.')}
          </p>

          {/* Pre-order Explanation */}
          {allowPreorder && (
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-white/70 pt-0.5">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-[#C96F55] shrink-0" />
              <span>
                Layanan <strong>Pre Order</strong> tetap aktif. Pesanan Anda akan dijadwalkan dan diproses segera setelah toko buka kembali.
              </span>
            </div>
          )}
        </div>

        {/* CTA Button */}
        <div className="shrink-0 flex items-center gap-3">
          <Link
            href="#katalog"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <FontAwesomeIcon icon={faCartShopping} className="w-3.5 h-3.5" />
            <span>Pilih Produk & Pre Order</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3 ml-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Persistent Top Announcement Bar for Store Closed Status across all storefront pages
 */
export function StoreClosedAnnouncementBar() {
  const { isClosed, isLoaded, nextOpenDisplay } = useStoreOperatingHours();

  if (!isLoaded || !isClosed) return null;

  return (
    <div className="w-full bg-[#121A2A] text-white border-b border-[#C96F55]/30 px-3 sm:px-6 py-2 text-center text-[11px] sm:text-xs font-medium flex items-center justify-center gap-2 select-none shadow-xs">
      <span className="w-2 h-2 rounded-full bg-[#C96F55] animate-pulse shrink-0" />
      <span className="font-bold text-[#C96F55] uppercase tracking-wider">Toko Sedang Tutup:</span>
      <span className="text-white/95">
        Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴 {nextOpenDisplay ? `(Buka kembali ${nextOpenDisplay})` : ''}
      </span>
      <span className="hidden sm:inline-block text-white/60">• Mode Pre-Order Tersedia</span>
    </div>
  );
}
