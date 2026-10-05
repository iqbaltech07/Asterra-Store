'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faXmark,
  faArrowRight,
  faStar,
  faShieldHalved,
  faBolt,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';

export interface QuickViewProductData {
  id: string;
  name: string;
  slug?: string;
  category?: string;
  price: number;
  priceFormatted?: string;
  rating?: string;
  soldCount?: number;
  features?: string[];
  description?: string;
  guaranteeTitle?: string;
  processTitle?: string;
  privacyTitle?: string;
  brand?: string;
}

interface QuickViewModalProps {
  product: QuickViewProductData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !product) return null;

  const productUrl = `/products/${product.slug || product.id}`;
  const priceDisplay =
    product.priceFormatted ||
    `Rp ${product.price.toLocaleString('id-ID')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl border border-[rgba(18,26,42,0.12)] shadow-2xl p-5 sm:p-6 text-[#121A2A] animate-in zoom-in-95 duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Tampilan Cepat"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[rgba(18,26,42,0.06)] hover:bg-[rgba(18,26,42,0.12)] text-[#121A2A]/70 hover:text-[#121A2A] flex items-center justify-center transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
        </button>

        {/* Category & Rating */}
        <div className="flex items-center gap-2 mb-2 pr-8">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C96F55] bg-[#C96F55]/10 px-2 py-0.5 rounded-md">
            {product.category || 'Digital Account'}
          </span>
          <div className="flex items-center gap-1 text-xs text-[#121A2A]/80 font-medium">
            <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-500" />
            <span className="font-bold">{product.rating || '5.0'}</span>
            {product.soldCount && (
              <span className="text-[#121A2A]/50 text-[11px]">
                ({product.soldCount.toLocaleString('id-ID')} terjual)
              </span>
            )}
          </div>
        </div>

        {/* Product Title */}
        <h2
          id="quick-view-title"
          className="text-lg sm:text-xl font-black text-[#121A2A] tracking-tight leading-snug mb-2"
        >
          {product.name}
        </h2>

        {/* Price Tag */}
        <div className="pb-3.5 mb-3.5 border-b border-[rgba(18,26,42,0.08)] flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-[#121A2A] tracking-tight">
            {priceDisplay}
          </span>
          <span className="text-[11px] text-[#121A2A]/50 font-medium">
            / paket langganan
          </span>
        </div>

        {/* Key Product Features (Specs) */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-[#121A2A]/85">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} className="w-3 h-3" />
            </div>
            <span className="font-semibold">
              {product.guaranteeTitle || 'Garansi Penuh 100% Penggantian'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-[#121A2A]/85">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faBolt} className="w-3 h-3" />
            </div>
            <span className="font-semibold">
              {product.processTitle || 'Aktivasi Otomatis 1 - 15 Menit'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs sm:text-[13px] text-[#121A2A]/85">
            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faLock} className="w-3 h-3" />
            </div>
            <span className="font-semibold">
              {product.privacyTitle || 'Akun Private / Sharing Workspace Resmi'}
            </span>
          </div>
        </div>

        {/* Description or Features List if available */}
        {product.description && (
          <p className="text-xs text-[#121A2A]/70 leading-relaxed mb-5 bg-[rgba(18,26,42,0.03)] p-3 rounded-xl border border-[rgba(18,26,42,0.06)] line-clamp-2">
            {product.description}
          </p>
        )}

        {/* Action: STRICTLY [Lihat Detail] only. NO [Beli Sekarang] */}
        <div className="pt-2">
          <Link href={productUrl} onClick={onClose} className="block w-full">
            <Button className="w-full h-11 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold text-sm gap-2 shadow-xs transition-transform active:scale-98">
              <span>Lihat Detail</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
