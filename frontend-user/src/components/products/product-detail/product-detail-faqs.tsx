'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FaqItem } from './types';

interface ProductDetailFaqsProps {
  faqs: FaqItem[];
  openFaqIndex: number | null;
  setOpenFaqIndex: (index: number | null) => void;
}

export function ProductDetailFaqs({
  faqs,
  openFaqIndex,
  setOpenFaqIndex,
}: ProductDetailFaqsProps) {
  if (!faqs || faqs.length === 0) return null;

  return (
    <div data-gsap="product-faq" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-card space-y-3.5 sm:space-y-4">
      <div className="pb-2.5 sm:pb-3 border-b border-[rgba(18,26,42,0.08)]">
        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55]">
          Pusat Informasi
        </h3>
        <h2 className="text-base sm:text-xl font-black text-[#121A2A] mt-0.5 sm:mt-1">
          Pertanyaan Umum (FAQ)
        </h2>
      </div>

      <div className="space-y-2.5 sm:space-y-3 pt-1">
        {faqs.map((faq, idx) => {
          const isOpen = openFaqIndex === idx;
          return (
            <div
              key={idx}
              data-gsap="product-faq-item"
              className="border border-[rgba(18,26,42,0.08)] rounded-xl overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-[rgba(18,26,42,0.02)] transition-colors cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                  {faq.question}
                </span>
                <span className="w-6 h-6 rounded-lg bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                  {isOpen ? (
                    <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5 text-[#C96F55]" />
                  ) : (
                    <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                  )}
                </span>
              </button>
              {isOpen && (
                <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 text-xs sm:text-sm text-[#121A2A]/70 border-t border-[rgba(18,26,42,0.06)] leading-relaxed animate-faq-open">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
