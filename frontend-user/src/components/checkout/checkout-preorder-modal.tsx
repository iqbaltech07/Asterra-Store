'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faCheck,
  faCopy,
  faArrowRight,
  faHouse,
  faClipboardList,
} from '@fortawesome/free-solid-svg-icons';

export interface PreorderSuccessModalData {
  orderId: string;
  totalAmount: number;
  customerName: string;
  customerWhatsapp: string;
  customerEmail?: string;
  itemsCount: number;
  itemsSummary: string;
}

interface CheckoutPreorderModalProps {
  data: PreorderSuccessModalData | null;
  nextOpenDisplay?: string | null;
  reopenEstimate?: string | null;
  onClose: () => void;
}

export function CheckoutPreorderModal({
  data,
  nextOpenDisplay,
  reopenEstimate,
  onClose,
}: CheckoutPreorderModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    if (!data.orderId) return;
    navigator.clipboard.writeText(data.orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToOrder = () => {
    onClose();
    const emailParam = data.customerEmail ? `&email=${encodeURIComponent(data.customerEmail)}` : '';
    router.push(`/order?id=${data.orderId}${emailParam}`);
  };

  const handleGoHome = () => {
    onClose();
    router.push('/');
  };

  const openTimeDisplay = reopenEstimate || nextOpenDisplay || 'sesuai jadwal operasional';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-[rgba(18,26,42,0.12)] overflow-hidden flex flex-col box-border animate-in zoom-in-95 duration-200 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-[#121A2A] text-white border-b border-[rgba(201,111,85,0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C96F55] text-white flex items-center justify-center shrink-0 shadow-md">
              <FontAwesomeIcon icon={faClipboardList} className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C96F55] block">
                Pre-Order Berhasil Dicatat
              </span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Pesanan Masuk ke Antrean Pre-Order! 📋
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-[#121A2A]">
          {/* Unambiguous Primary Status Alert */}
          <div className="p-4 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.3)] space-y-2">
            <div className="flex items-start gap-2.5">
              <span className="text-lg leading-none shrink-0 mt-0.5">😴</span>
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-bold text-[#121A2A] leading-snug">
                  Pesanan telah masuk ke antrean pre-order. Cek kembali ketika toko buka untuk melanjutkan ke pembayaran.
                </p>
                <p className="text-[11px] sm:text-xs text-[#C96F55] font-semibold">
                  Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(201,111,85,0.2)] flex items-center justify-between text-[11px] text-[#121A2A]/80">
              <span className="flex items-center gap-1.5 font-medium">
                <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Estimasi Toko Buka:</span>
              </span>
              <span className="font-bold text-[#121A2A]">{openTimeDisplay}</span>
            </div>
          </div>

          {/* Order Snapshot Card */}
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#121A2A]/60 font-medium">Nomor Pesanan:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-[#121A2A] tracking-wider">
                  {data.orderId}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2 py-1 rounded-md text-[11px] font-semibold bg-white border border-[rgba(18,26,42,0.15)] text-[#121A2A] hover:bg-[#F1F5F9] transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Salin Nomor Pesanan"
                >
                  <FontAwesomeIcon icon={copied ? faCheck : faCopy} className={`w-3 h-3 ${copied ? 'text-green-600' : 'text-[#121A2A]/70'}`} />
                  <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[rgba(18,26,42,0.06)]">
              <span className="text-[#121A2A]/60">Total Estimasi:</span>
              <span className="font-mono font-bold text-xs text-[#C96F55]">
                Rp {data.totalAmount.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#121A2A]/60">Ringkasan Produk:</span>
              <span className="font-medium text-[#121A2A] text-right truncate max-w-[200px]" title={data.itemsSummary}>
                {data.itemsSummary || `${data.itemsCount} item lisensi`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#121A2A]/60">Status Pesanan:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                Menunggu Toko Buka
              </span>
            </div>
          </div>

          {/* Simple Step Guide */}
          <div className="p-3 rounded-xl bg-white border border-[rgba(18,26,42,0.06)] space-y-1.5 text-[11px] text-[#121A2A]/70">
            <span className="font-bold text-[11px] text-[#121A2A] block">
              Apa yang perlu dilakukan selanjutnya?
            </span>
            <ul className="space-y-1 list-disc pl-4 leading-relaxed">
              <li>
                Nomor pesanan Anda telah tersimpan. Anda tidak perlu mengulang proses pemesanan.
              </li>
              <li>
                Ketika jam operasional toko telah buka, buka menu <strong>Cek Pesanan</strong> dan masukkan nomor pesanan untuk melanjutkan pembayaran.
              </li>
              <li>
                Setelah pembayaran diverifikasi, admin akan langsung memproses akun lisensi Anda dengan prioritas antrean pre-order.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 pt-3 border-t border-[rgba(18,26,42,0.08)] bg-[#F8FAFC] flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGoHome}
            className="w-full sm:w-auto text-xs h-9 px-4 border-[rgba(18,26,42,0.15)] text-[#121A2A]/70 hover:text-[#121A2A] cursor-pointer gap-2"
          >
            <FontAwesomeIcon icon={faHouse} className="w-3 h-3" />
            <span>Kembali ke Beranda</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGoToOrder}
            className="w-full sm:w-auto text-xs h-9 px-5 bg-[#C96F55] hover:bg-[#B86047] text-white font-bold gap-2 shadow-xs cursor-pointer active:scale-98"
          >
            <span>Cek Status Pesanan</span>
            <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
