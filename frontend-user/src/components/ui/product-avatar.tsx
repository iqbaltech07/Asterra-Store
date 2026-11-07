'use client';

import React from 'react';
import { Package, Gamepad2, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BRAND_ICONS_MAP,
  resolveBrandLogo,
  isPaddedBrand,
} from '@/lib/constants/brand-icons';

export { BRAND_ICONS_MAP, resolveBrandLogo, isPaddedBrand };

export type ProductAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'responsive';

const SIZE_CLASSES: Record<ProductAvatarSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  responsive: 'w-9 h-9 sm:w-11 sm:h-11',
};

export interface ProductAvatarProps {
  name: string;
  imageUrl?: string;
  className?: string;
  size?: ProductAvatarSize;
}

/**
 * Reusable Product Avatar Component
 * Standardizes position, circular masking, background themes, padding, and fallbacks.
 */
export function ProductAvatar({
  name,
  imageUrl,
  className,
  size,
}: ProductAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const n = (name || '').toLowerCase();

  React.useEffect(() => {
    setHasError(false);
  }, [imageUrl, name]);

  const defaultBrandIcon = React.useMemo(() => {
    for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
      if (n.includes(key)) return url;
    }
    return '';
  }, [n]);

  // Strip accidental squircle/corner radius classes to guarantee a circular avatar
  const sanitizedClassName = (className || '')
    .replace(/\brounded-(?:none|xs|sm|md|lg|xl|2xl|3xl)\b/g, '')
    .trim();

  // Determine size classes
  const sizeClass = size
    ? SIZE_CLASSES[size]
    : !sanitizedClassName.includes('w-') && !sanitizedClassName.includes('h-')
    ? 'w-8 h-8'
    : '';

  // Game items: gunakan icon Gamepad
  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('pubg')) {
    const gameClass = cn(
      'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-amber-500/20 shadow-2xs bg-amber-500/10 text-amber-500 select-none',
      sizeClass,
      sanitizedClassName,
      'rounded-full'
    );
    return (
      <div className={gameClass}>
        <Gamepad2 className="w-1/2 h-1/2" />
      </div>
    );
  }

  // TV items: gunakan icon TV
  if (n.includes('k-vision') || n.includes('nex') || n.includes('vision') || n.includes('orange tv')) {
    const tvClass = cn(
      'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-slate-800 shadow-2xs bg-[#121A2A] text-[#C96F55] select-none',
      sizeClass,
      sanitizedClassName,
      'rounded-full'
    );
    return (
      <div className={tvClass}>
        <Tv className="w-1/2 h-1/2" />
      </div>
    );
  }

  const resolvedUrl = resolveBrandLogo(name, imageUrl || '');
  const activeUrl = !hasError ? resolvedUrl : (resolvedUrl !== defaultBrandIcon ? defaultBrandIcon : '');

  const isDark = n.includes('netflix');
  const baseTheme = isDark ? 'bg-black border-slate-800' : 'bg-white border-slate-200/80';

  const containerClass = cn(
    'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border shadow-2xs select-none',
    baseTheme,
    sizeClass,
    sanitizedClassName,
    'rounded-full'
  );

  if (activeUrl) {
    const isPadded = isPaddedBrand(n);

    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeUrl}
          alt={name}
          draggable={false}
          className={cn(
            'w-full h-full block transition-transform',
            isPadded ? 'object-contain p-1.5' : 'object-cover p-0'
          )}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={cn(
        'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-slate-200/80 bg-slate-100 text-slate-500 font-bold shadow-2xs select-none',
        sizeClass,
        sanitizedClassName,
        'rounded-full'
      )}
    >
      {initials ? (
        <span className="text-[11px] font-black tracking-tight select-none">{initials}</span>
      ) : (
        <Package className="w-1/2 h-1/2 text-slate-400" />
      )}
    </div>
  );
}

// Export aliases for backwards compatibility
export const ProductBrandIcon = ProductAvatar;
export default ProductAvatar;
