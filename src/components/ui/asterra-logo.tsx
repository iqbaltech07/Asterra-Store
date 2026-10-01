import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface AsterraLogoProps {
  variant?: 'navbar' | 'light-bg' | 'dark-bg' | 'mark-only' | 'app-icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  showTagline = false,
  className,
  linkToHome = false,
}: AsterraLogoProps) {
  // Sizing definitions
  const sizeMap = {
    sm: {
      mark: 'w-7 h-5',
      text: 'text-sm',
      tagline: 'text-[9px]',
      badge: 'text-[10px] px-2 py-0.5',
    },
    md: {
      mark: 'w-8 h-6 sm:w-9 sm:h-7',
      text: 'text-base sm:text-lg',
      tagline: 'text-[10px]',
      badge: 'text-[11px] px-2.5 py-0.5',
    },
    lg: {
      mark: 'w-11 h-8 sm:w-12 sm:h-9',
      text: 'text-xl sm:text-2xl',
      tagline: 'text-xs',
      badge: 'text-xs px-3 py-1',
    },
    xl: {
      mark: 'w-14 h-10 sm:w-16 sm:h-12',
      text: 'text-2xl sm:text-3xl',
      tagline: 'text-sm',
      badge: 'text-xs px-3 py-1',
    },
  }[size];

  const isDarkBg = variant === 'navbar' || variant === 'dark-bg';

  const content = (
    <div className={cn('inline-flex items-center gap-2.5 select-none group', className)}>
      {variant === 'app-icon' ? (
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
          <Image
            src="/images/brand/asterra-app-icon.png"
            alt="Asterra App Icon"
            width={48}
            height={48}
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div className={cn('relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200', sizeMap.mark)}>
          <Image
            src="/images/brand/asterra-mark.png"
            alt="Asterra Planet Mark"
            width={70}
            height={50}
            className={cn(
              'w-full h-full object-contain',
              isDarkBg ? 'brightness-125 contrast-125' : ''
            )}
            priority
          />
        </div>
      )}

      {variant !== 'mark-only' && (
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col">
            <div className="flex items-baseline font-bold tracking-tight leading-none">
              <span className={cn(
                'font-extrabold',
                sizeMap.text,
                isDarkBg ? 'text-white' : 'text-navy-900'
              )}>
                Asterra
              </span>
              <span className={cn(
                'font-semibold ml-0.5',
                sizeMap.text,
                isDarkBg ? 'text-slate-100' : 'text-navy-800'
              )}>
                Store
              </span>
            </div>

            {showTagline && (
              <span className={cn(
                'font-normal leading-tight mt-0.5',
                sizeMap.tagline,
                isDarkBg ? 'text-slate-300' : 'text-foreground-muted'
              )}>
                Good Things, One Place.
              </span>
            )}
          </div>

          {showBadge && (
            <span
              className={cn(
                'rounded-full border font-medium hidden sm:inline-flex items-center',
                sizeMap.badge,
                isDarkBg
                  ? 'bg-navy-800/80 text-slate-200 border-navy-700/80 shadow-inner'
                  : 'bg-surface-secondary text-foreground-muted border-border'
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="inline-flex items-center focus:outline-none focus:ring-2 focus:ring-accent/40 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
