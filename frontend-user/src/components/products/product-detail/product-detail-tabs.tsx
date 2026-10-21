'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { VariantDetails } from './types';

interface ProductDetailTabsProps {
  activeTab: 'deskripsi' | 'benefit' | 'garansi';
  setActiveTab: (tab: 'deskripsi' | 'benefit' | 'garansi') => void;
  variantDetails: VariantDetails;
}

export function ProductDetailTabs({
  activeTab,
  setActiveTab,
  variantDetails,
}: ProductDetailTabsProps) {
  return (
    <div data-gsap="product-description" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-8 space-y-5 sm:space-y-6 shadow-card">
      {/* Capsule Tabs */}
      <div data-gsap="product-tabs" className="bg-[#F1F3F5] rounded-full p-1 grid grid-cols-3 sm:inline-flex items-center gap-1 w-full sm:w-auto">
        <button
          type="button"
          data-active={activeTab === 'deskripsi'}
          onClick={() => setActiveTab('deskripsi')}
          className={`rounded-full py-1.5 sm:py-2 px-3 sm:px-6 text-xs transition-all duration-200 cursor-pointer text-center ${
            activeTab === 'deskripsi'
              ? 'bg-white text-[#121A2A] font-bold shadow-xs'
              : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
          }`}
        >
          Deskripsi
        </button>
        <button
          type="button"
          data-active={activeTab === 'benefit'}
          onClick={() => setActiveTab('benefit')}
          className={`rounded-full py-1.5 sm:py-2 px-3 sm:px-6 text-xs transition-all duration-200 cursor-pointer text-center ${
            activeTab === 'benefit'
              ? 'bg-white text-[#121A2A] font-bold shadow-xs'
              : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
          }`}
        >
          Benefit
        </button>
        <button
          type="button"
          data-active={activeTab === 'garansi'}
          onClick={() => setActiveTab('garansi')}
          className={`rounded-full py-1.5 sm:py-2 px-3 sm:px-6 text-xs transition-all duration-200 cursor-pointer text-center ${
            activeTab === 'garansi'
              ? 'bg-white text-[#121A2A] font-bold shadow-xs'
              : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
          }`}
        >
          Garansi
        </button>
      </div>

      {/* Tab Dynamic Content */}
      <div
        key={`${activeTab}-${variantDetails.title}`}
        className="pt-1 min-h-[120px] animate-tab-glide"
      >
        {activeTab === 'deskripsi' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55] mb-2 sm:mb-2.5">
                Deskripsi Layanan
              </h2>
              <p className="text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed whitespace-pre-line">
                {variantDetails.desc}
              </p>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-[rgba(18,26,42,0.08)]">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70 mb-3 sm:mb-3.5">
                Fitur Unggulan Yang Anda Dapatkan
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {variantDetails.features.map((feature, idx) => (
                  <li key={idx} data-gsap="product-feature" className="flex items-start gap-2 text-xs sm:text-sm text-[#121A2A]/85">
                    <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C96F55] shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'benefit' && (
          <div className="space-y-3.5 sm:space-y-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55] mb-1.5 sm:mb-2">
                Keunggulan Khusus Varian Ini
              </h3>
              <p className="text-[11px] sm:text-xs text-[#121A2A]/60 mb-3 sm:mb-4">
                Fitur dan keistimewaan yang Anda dapatkan untuk paket {variantDetails.title}:
              </p>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {variantDetails.features.map((feature, idx) => (
                <li key={idx} data-gsap="product-feature" className="flex items-start gap-2 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed">
                  <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C96F55] shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'garansi' && (
          <div className="space-y-3 sm:space-y-3.5 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed">
            <div className="flex items-center gap-2 text-[#16A34A] font-bold">
              <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Jaminan {variantDetails.guaranteeTitle} (100% Proteksi Penggantian Akun)</span>
            </div>
            <p>{variantDetails.warrantyText}</p>
            <p className="text-[11px] sm:text-xs text-[#121A2A]/60">
              *Klaim garansi mudah dan cepat, cukup konfirmasi nomor Invoice pesanan Anda ke WhatsApp Customer Service Asterra Store.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
