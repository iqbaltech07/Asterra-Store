'use client';

import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDoorClosed,
  faClock,
  faArrowRight,
  faShieldHalved,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

interface StoreClosedCheckoutNoticeProps {
  nextOpenDisplay?: string | null;
  reopenEstimate?: string | null;
  bannerMessage?: string | null;
  allowPreorder?: boolean;
}

export function StoreClosedCheckoutNotice({
  nextOpenDisplay,
  reopenEstimate,
  bannerMessage,
  allowPreorder = true,
}: StoreClosedCheckoutNoticeProps) {
  const openTimeDisplay = reopenEstimate || nextOpenDisplay || 'sesuai jadwal operasional';

  return (
    <div className="w-full max-w-xl mx-auto py-12 sm:py-20 px-4 text-center">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[rgba(18,26,42,0.12)] p-6 sm:p-10 shadow-xl space-y-6">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[rgba(201,111,85,0.1)] text-[#C96F55] flex items-center justify-center mx-auto text-2xl sm:text-3xl shadow-inner">
          <FontAwesomeIcon icon={faDoorClosed} className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[rgba(201,111,85,0.12)] text-[#C96F55]">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3" />
            <span>Jam Operasional Toko</span>
          </span>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#121A2A] tracking-tight">
            Toko Sedang Tutup
          </h1>

          <p className="text-sm sm:text-base text-[#121A2A] font-semibold">
            Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴
          </p>

          <p className="text-xs sm:text-sm text-[#121A2A]/70 max-w-md mx-auto leading-relaxed">
            {openTimeDisplay ? (
              <>
                Pemesanan reguler saat ini sedang berada di luar jam operasional. Pemesanan normal akan kembali dibuka pada{' '}
                <strong className="text-[#121A2A] font-bold">{openTimeDisplay}</strong>.
              </>
            ) : (
              bannerMessage || 'Pemesanan reguler saat ini sedang berada di luar jam operasional toko.'
            )}
          </p>
        </div>

        {allowPreorder && (
          <div className="p-4 rounded-xl bg-[rgba(201,111,85,0.06)] border border-[rgba(201,111,85,0.2)] text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#121A2A]">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 text-[#C96F55]" />
              <span>Layanan Pre-Order Tersedia</span>
            </div>
            <p className="text-[11px] sm:text-xs text-[#121A2A]/70 leading-relaxed">
              Anda tetap dapat membuat pesanan terlebih dahulu melalui alur Pre-Order. Pesanan Anda akan dicatat dan dapat diselesaikan pembayarannya ketika toko buka kembali.
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto h-11 px-6 text-xs sm:text-sm font-semibold border-[rgba(18,26,42,0.15)] text-[#121A2A]/80 hover:text-[#121A2A] gap-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faHouse} className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </Button>
          </Link>

          {allowPreorder && (
            <Link href="/checkout?mode=preorder" className="w-full sm:w-auto">
              <Button
                type="button"
                className="w-full sm:w-auto h-11 px-6 text-xs sm:text-sm font-bold bg-[#C96F55] hover:bg-[#B86047] text-white gap-2 shadow-md cursor-pointer active:scale-98"
              >
                <span>Lanjutkan sebagai Pre-Order</span>
                <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
