'use client';

import React from 'react';
import { Share2 } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  variant?: 'blue' | 'emerald' | 'purple' | 'outline' | 'icon';
  size?: 'sm' | 'md';
  className?: string;
  label?: string;
  iconOnly?: boolean;
}

export function ShareButton({
  url,
  title,
  text,
  variant = 'blue',
  size = 'sm',
  className = '',
  label = 'Bagikan',
  iconOnly = false,
}: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Fallback directly to WhatsApp
    const shareText = text ? `${text} ${url}` : `${title}: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const reduced = isReducedMotion();

  let variantStyle = '';
  if (variant === 'blue') {
    variantStyle = 'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-xs';
  } else if (variant === 'emerald') {
    variantStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-xs';
  } else if (variant === 'purple') {
    variantStyle = 'bg-purple-600 hover:bg-purple-700 text-white border-transparent shadow-xs';
  } else if (variant === 'outline') {
    variantStyle = 'border-blue-200 bg-blue-50/80 hover:bg-blue-100/80 text-[#2563EB] shadow-xs';
  } else if (variant === 'icon') {
    variantStyle = 'border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs';
  }

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={handleShare}
      title="Bagikan Tautan"
      style={{
        transition: reduced
          ? 'none'
          : `transform ${MOTION_DURATION.press}ms ${MOTION_EASING.editorial}, background-color 200ms ease, border-color 200ms ease`,
      }}
      className={`group relative inline-flex items-center justify-center font-semibold rounded-xl border select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 ${
        iconOnly
          ? isSmall
            ? 'h-9 w-9 p-0'
            : 'h-10 w-10 p-0'
          : isSmall
          ? 'h-9 px-3 gap-1.5 text-xs'
          : 'h-10 px-4 gap-2 text-xs'
      } ${variantStyle} ${className}`}
    >
      <Share2
        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
          reduced ? '' : 'group-hover:rotate-12 group-hover:scale-110'
        }`}
      />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
