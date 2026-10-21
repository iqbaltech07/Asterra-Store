'use client';

import React from 'react';
import { VariantDetails } from './types';

interface ProductDetailSpecsProps {
  variantDetails: VariantDetails;
}

export function ProductDetailSpecs({ variantDetails }: ProductDetailSpecsProps) {
  return (
    <div data-gsap="product-specification" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-card space-y-3.5 sm:space-y-4">
      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70 pb-2.5 sm:pb-3 border-b border-[rgba(18,26,42,0.08)]">
        Informasi & Spesifikasi Lisensi
      </h3>

      <div key={variantDetails.title} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 sm:gap-y-3 pt-1 animate-text-smooth">
        {variantDetails.specifications.map((spec, idx) => (
          <div
            key={idx}
            data-gsap="product-spec-row"
            className="py-2 flex justify-between items-center text-xs sm:text-sm border-b border-[rgba(18,26,42,0.06)]"
          >
            <span className="text-[#121A2A]/60 font-medium">{spec.label}</span>
            <span className="font-bold text-[#121A2A] text-right truncate max-w-[55%]">{spec.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
