import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AsterraLogoProps {
  variant?: 'navbar' | 'light-bg' | 'dark-bg' | 'mark-only' | 'app-icon';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBadge?: boolean;
  badgeText?: string;
  showTagline?: boolean;
  className?: string;
  linkToHome?: boolean;
}

export function AsterraLogo({
  variant = 'light-bg',
  size = 'md',
  showBadge = false,
  badgeText = 'Toko Digital Premium',
  className,
  linkToHome = false,
}: AsterraLogoProps) {
  const isDarkBg = variant === 'navbar' || variant === 'dark-bg';

  // Responsive heights that maintain perfect 5:1 logo aspect ratio without distortion
  const heightClass = {
    sm: 'h-6 sm:h-7',
    md: 'h-7 sm:h-8',
    lg: 'h-9 sm:h-10',
    xl: 'h-11 sm:h-12',
    '2xl': 'h-14 sm:h-16',
  }[size];

  const markHeightClass = {
    sm: 'h-6 w-8',
    md: 'h-7 w-10',
    lg: 'h-9 w-12',
    xl: 'h-11 w-16',
    '2xl': 'h-14 w-20',
  }[size];

  // Proportional sizing config for navbar animated planet + wordmark lockup
  const navbarSizeConfig = {
    sm: {
      planet: 'h-7 sm:h-8',
      wordmark: 'h-[13px] sm:h-[15px]',
      overlap: '-mr-1 sm:-mr-2.5',
    },
    md: {
      planet: 'h-8 sm:h-9',
      wordmark: 'h-[15px] sm:h-[18px]',
      overlap: '-mr-1.5 md:-mr-3.5 lg:-mr-4',
    },
    lg: {
      planet: 'h-10 sm:h-12',
      wordmark: 'h-[19px] sm:h-[23px]',
      overlap: '-mr-2 sm:-mr-3.5 md:-mr-4.5',
    },
    xl: {
      planet: 'h-14 sm:h-16 md:h-18',
      wordmark: 'h-[24px] sm:h-[28px] md:h-[32px]',
      overlap: '-mr-2.5 sm:-mr-4 md:-mr-5',
    },
    '2xl': {
      planet: 'h-16 sm:h-20',
      wordmark: 'h-[30px] sm:h-[38px]',
      overlap: '-mr-3.5 sm:-mr-5 md:-mr-6',
    },
  }[size || 'md'];

  const logoSrc = isDarkBg
    ? '/images/brand/logo-light-ntg.png'
    : '/images/brand/asterra-logo-dark-text.png';

  const wordmarkSrc = isDarkBg
    ? '/images/brand/asterra-wordmark-light.png'
    : '/images/brand/asterra-wordmark-dark.png';

  const content = (
    <div className={cn('inline-flex items-center select-none group', variant !== 'navbar' && 'gap-2 sm:gap-2.5', className)}>
      {variant === 'navbar' ? (
        <div className="inline-flex items-center">
          {/* Animated Asterra Planet (152 frames, 20fps, alpha, navbar-optimized) */}
          <div className={cn('relative shrink-0 flex items-center justify-center', navbarSizeConfig.overlap)}>
            <picture className="flex items-center justify-center pointer-events-none select-none">
              <source srcSet="/assets/asterra-planet-navbar.webp" type="image/webp" />
              <img
                src="/assets/asterra-planet-navbar.webp"
                alt="Asterra Planet"
                width={200}
                height={107}
                decoding="async"
                draggable={false}
                className={cn('w-auto object-contain pointer-events-none select-none transition-transform duration-200 group-hover:scale-105', navbarSizeConfig.planet)}
                onError={(e) => {
                  e.currentTarget.src = '/images/brand/asterra-mark.png';
                }}
              />
            </picture>
          </div>
          {/* Brand Wordmark Text (AsterraStore) */}
          <div className="relative shrink-0 flex items-center">
            <Image
              src={wordmarkSrc}
              alt="AsterraStore"
              width={381}
              height={49}
              priority
              className={cn('w-auto object-contain shrink-0', navbarSizeConfig.wordmark)}
            />
          </div>
        </div>
      ) : variant === 'app-icon' ? (
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-xs shrink-0">
          <Image
            src="/images/brand/asterra-app-icon.png"
            alt="Asterra App Icon"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>
      ) : variant === 'mark-only' ? (
        <div className={cn('relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200', markHeightClass)}>
          <Image
            src="/images/brand/asterra-mark.png"
            alt="Asterra Planet Mark"
            width={222}
            height={155}
            className="w-full h-full object-contain"
            priority
          />
        </div>
      ) : (
        <div className={cn('relative shrink-0 flex items-center transition-opacity duration-200', heightClass)}>
          <Image
            src={logoSrc}
            alt="Asterra Store"
            width={536}
            height={107}
            priority
            className="h-full w-auto object-contain shrink-0"
          />
        </div>
      )}

      {showBadge && (
        <span
          className={cn(
            'hidden sm:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded border transition-colors',
            isDarkBg
              ? 'bg-[rgba(201,111,85,0.15)] text-[#F7F5EF] border-[rgba(201,111,85,0.35)]'
              : 'bg-[rgba(201,111,85,0.08)] text-[#C96F55] border-[rgba(201,111,85,0.25)]'
          )}
        >
          {badgeText}
        </span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link
        href="/"
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-lg py-0.5"
      >
        {content}
      </Link>
    );
  }

  return content;
}
