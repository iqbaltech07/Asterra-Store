'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: 'primary' | 'outline' | 'pill' | 'whiteGlass' | 'ghost' | 'icon';
  size?: 'sm' | 'md';
  className?: string;
  minWidth?: string;
  onCopied?: () => void;
  title?: string;
}

export function CopyButton({
  text,
  label = 'Salin',
  copiedLabel = 'Tersalin!',
  variant = 'primary',
  size = 'sm',
  className = '',
  minWidth,
  onCopied,
  title = 'Salin ke Clipboard',
}: CopyButtonProps) {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      if (onCopied) onCopied();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsCopied(false);
      }, MOTION_DURATION.copyFeedback);
    }
  };

  const reduced = isReducedMotion();

  // Variant styling
  let baseVariantStyle = '';
  if (variant === 'primary') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
      : 'bg-primary hover:bg-primary-hover text-white border-transparent';
  } else if (variant === 'outline') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200';
  } else if (variant === 'pill') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 backdrop-blur-md'
      : 'bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md';
  } else if (variant === 'whiteGlass') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/90 shadow-2xs';
  } else if (variant === 'ghost') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-50 text-emerald-600'
      : 'hover:bg-slate-100 text-slate-600';
  } else if (variant === 'icon') {
    baseVariantStyle = isCopied
      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
      : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200';
  }

  const isSmall = size === 'sm';
  const defaultMinWidth = variant === 'icon' ? 'auto' : isSmall ? '88px' : '98px';
  const appliedMinWidth = minWidth || defaultMinWidth;

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={isCopied ? copiedLabel : title}
      style={{
        minWidth: appliedMinWidth,
        transition: reduced
          ? 'none'
          : `transform ${MOTION_DURATION.press}ms ${MOTION_EASING.editorial}, background-color 200ms ease, border-color 200ms ease, color 200ms ease`,
      }}
      className={`relative inline-flex items-center justify-center font-semibold rounded-xl border select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 ${
        isSmall ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-xs'
      } ${baseVariantStyle} ${className}`}
    >
      <span className="sr-only" aria-live="polite">
        {isCopied ? copiedLabel : label}
      </span>

      <span className="flex items-center justify-center gap-1.5 pointer-events-none">
        {/* Animated Icon with Morphing scale-pop */}
        <span className="relative w-3.5 h-3.5 flex items-center justify-center shrink-0">
          <Copy
            className={`w-3.5 h-3.5 absolute inset-0 m-auto transition-all duration-200 ${
              isCopied
                ? 'opacity-0 scale-75 rotate-45 pointer-events-none'
                : 'opacity-100 scale-100 rotate-0'
            }`}
          />
          <Check
            className={`w-3.5 h-3.5 absolute inset-0 m-auto text-current transition-all duration-200 ${
              isCopied
                ? 'opacity-100 scale-100 rotate-0'
                : 'opacity-0 scale-75 -rotate-45 pointer-events-none'
            }`}
          />
        </span>

        {/* Text Label with subtle cross-fade */}
        {variant !== 'icon' && (
          <span
            className={`transition-all duration-150 whitespace-nowrap text-center ${
              isCopied ? 'font-bold' : 'font-semibold'
            }`}
          >
            {isCopied ? copiedLabel : label}
          </span>
        )}
      </span>
    </button>
  );
}
