'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, ArrowRight } from 'lucide-react';
import { ProductItem } from '@/lib/products-data';

interface ProductCardProps {
  product: ProductItem & { providerCode?: string };
  isSelected: boolean;
  onAddToCart: (product: ProductItem) => void;
  priorityImage?: boolean;
}

export function ProductCard({
  product,
  isSelected,
  onAddToCart,
  priorityImage = false,
}: ProductCardProps) {
  const isOutOfStock =
    (product.stock !== undefined && product.stock <= 0) ||
    product.providerStatus === 'empty' ||
    product.status === 'out_of_stock';

  return (
    <Card className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl shadow-card hover:shadow-card-hover hover:border-[rgba(18,26,42,0.22)] transition-all duration-200 overflow-hidden flex flex-col justify-between group">
      <div>
        {/* 1. Product Image / Banner with fixed 16/7 aspect ratio */}
        <div className="relative w-full aspect-[16/7] bg-[#121A2A]/5 overflow-hidden border-b border-[rgba(18,26,42,0.06)]">
          <Link href={`/products/${product.id}`} prefetch={true} className="block w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.name}
              loading={priorityImage ? 'eager' : 'lazy'}
              fetchPriority={priorityImage ? 'high' : 'auto'}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
            />
          </Link>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[#121A2A]/75 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[11px] sm:text-xs font-bold text-[#F7F5EF] bg-[#DC2626]/95 px-2.5 sm:px-3 py-1 rounded-md shadow-xs">
                Stok Habis
              </span>
            </div>
          )}
        </div>

        {/* 2. Varied Metadata Treatments (No Excessive Pill Badges) */}
        <div className="p-3 sm:p-4 pb-2 space-y-1.5 sm:space-y-2">
          {/* Category as small uppercase text + Popular dot */}
          <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px]">
            <span className="uppercase tracking-wider font-bold text-[#121A2A]/60 border-b border-[rgba(18,26,42,0.2)] pb-0.5 truncate max-w-[70%]">
              {product.category?.name || 'Digital Service'}
            </span>

            {product.popular && (
              <span className="text-[#C96F55] font-bold inline-flex items-center gap-1 shrink-0">
                <span>Laris</span>
                <span className="text-xs leading-none">·</span>
              </span>
            )}
          </div>

          {/* Product Title */}
          <Link
            href={`/products/${product.id}`}
            prefetch={true}
            className="block font-bold text-xs sm:text-sm md:text-base text-[#121A2A] group-hover:text-[#C96F55] transition-colors line-clamp-1 leading-snug pt-0.5"
            title={product.name}
          >
            {product.name}
          </Link>

          {/* Short Description */}
          <p className="text-[11px] sm:text-xs text-[#121A2A]/65 line-clamp-2 leading-relaxed min-h-[2rem] sm:min-h-[2.25rem]">
            {product.description}
          </p>
        </div>

        {/* 3. Clean Specification Grid: Brand, Code, Status */}
        <div className="mx-3 sm:mx-4 py-2 border-t border-[rgba(18,26,42,0.06)] grid grid-cols-3 gap-1 text-[10px] sm:text-[11px]">
          <div className="truncate">
            <span className="text-[#121A2A]/40 block text-[9px] sm:text-[10px] uppercase font-semibold leading-tight">
              Brand
            </span>
            <span className="font-semibold text-[#121A2A] truncate block mt-0.5">
              {product.brand || product.category?.name || 'Asterra'}
            </span>
          </div>
          <div className="truncate text-center">
            <span className="text-[#121A2A]/40 block text-[9px] sm:text-[10px] uppercase font-semibold leading-tight">
              Kode
            </span>
            <span className="font-mono font-medium text-[#121A2A]/80 truncate block mt-0.5">
              {product.providerCode || product.id.slice(0, 6).toUpperCase()}
            </span>
          </div>
          <div className="truncate text-right">
            <span className="text-[#121A2A]/40 block text-[9px] sm:text-[10px] uppercase font-semibold leading-tight">
              Status
            </span>
            <span
              className={`font-semibold inline-flex items-center gap-1 mt-0.5 ${
                isOutOfStock ? 'text-[#DC2626]' : 'text-[#16A34A]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOutOfStock ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
                }`}
              />
              {isOutOfStock ? 'Kosong' : 'Tersedia'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Price & Compact CTA */}
      <div className="p-2.5 sm:p-3.5 pt-2 border-t border-[rgba(18,26,42,0.08)] bg-[#F8FAFC] flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] sm:text-[10px] text-[#121A2A]/50 uppercase font-semibold tracking-wider leading-none">
            Harga
          </p>
          <span className="text-xs sm:text-base md:text-lg font-black tracking-tight text-[#121A2A] block truncate mt-0.5">
            {product.priceFormatted}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <Button
            size="sm"
            variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
            className={`h-7 sm:h-8.5 px-2 sm:px-3 text-[11px] sm:text-xs font-semibold rounded-lg sm:rounded-xl transition-all active:scale-95 ${
              isSelected
                ? 'bg-[rgba(201,111,85,0.12)] text-[#C96F55] border border-[rgba(201,111,85,0.4)]'
                : isOutOfStock
                ? 'border-[rgba(18,26,42,0.2)] text-[#121A2A]/50'
                : 'bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-xs'
            }`}
            disabled={isOutOfStock}
            onClick={() => !isOutOfStock && onAddToCart(product)}
          >
            {isOutOfStock ? (
              'Habis'
            ) : isSelected ? (
              <>
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C96F55] mr-0.5 sm:mr-1" />
                <span>Dipilih</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5 sm:mr-1" />
                <span>Pilih</span>
              </>
            )}
          </Button>

          <Link href={`/products/${product.id}`} prefetch={true}>
            <button
              type="button"
              className="w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl bg-[#121A2A] text-[#F7F5EF] flex items-center justify-center hover:bg-[#C96F55] transition-colors shadow-xs cursor-pointer active:scale-95"
              aria-label={`Lihat detail ${product.name}`}
            >
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
