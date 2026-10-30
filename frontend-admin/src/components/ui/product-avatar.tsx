'use client';

import React from 'react';
import { Package, Gamepad2, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Brandfetch & Official Icon Registry
 * Reliable icons served via internal proxy / cached media storage
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: '/api/v1/media/brand-icons/canva',
  netflix: '/api/v1/media/brand-icons/netflix',
  spotify: '/api/v1/media/brand-icons/spotify',
  chatgpt: '/api/v1/media/brand-icons/chatgpt',
  openai: '/api/v1/media/brand-icons/chatgpt',
  gemini: '/api/v1/media/brand-icons/gemini',
  google: '/api/v1/media/brand-icons/gemini',
  alight: '/api/v1/media/brand-icons/alight',
  motion: '/api/v1/media/brand-icons/alight',
  capcut: '/api/v1/media/brand-icons/capcut',
  vidio: '/api/v1/media/brand-icons/vidio',
  viu: '/api/v1/media/brand-icons/viu',
  wetv: '/api/v1/media/brand-icons/wetv',
  bstation: '/api/v1/media/brand-icons/bstation',
  bilibili: '/api/v1/media/brand-icons/bstation',
  blibli: '/api/v1/media/brand-icons/bstation',
  iqiyi: '/api/v1/media/brand-icons/iqiyi',
  youtube: '/api/v1/media/brand-icons/youtube',
  disney: '/api/v1/media/brand-icons/disney',
  claude: '/api/v1/media/brand-icons/claude',
  midjourney: '/api/v1/media/brand-icons/midjourney',
  adobe: '/api/v1/media/brand-icons/adobe',
  grammarly: '/api/v1/media/brand-icons/grammarly',
  mobilelegends: '/api/v1/media/brand-icons/mobile-legends',
  'mobile legends': '/api/v1/media/brand-icons/mobile-legends',
  pubg: '/api/v1/media/brand-icons/pubg-mobile',
  vision: '/api/v1/media/brand-icons/vision-plus',
  'k-vision': '/api/v1/media/brand-icons/k-vision',
  kvision: '/api/v1/media/brand-icons/k-vision',
  nex: '/api/v1/media/brand-icons/nex-parabola',
  wink: '/api/v1/media/brand-icons/wink',
  meitu: '/api/v1/media/brand-icons/meitu',
};

export function resolveBrandLogo(name: string = '', fallbackUrl: string = ''): string {
  const trimmed = (fallbackUrl || '').trim();

  // If a valid custom logo URL is provided (and not a broken legacy path /images/brand/), ALWAYS prioritize it
  if (trimmed && !trimmed.startsWith('/images/brand/')) {
    return trimmed;
  }

  const lower = (name || '').toLowerCase();

  for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }

  return trimmed && !trimmed.startsWith('/images/brand/') ? trimmed : '';
}

/**
 * Returns true if the logo asset is a standalone glyph on a transparent / white background
 * that needs inner padding so the glyph doesn't touch the circular border.
 * Logos with official solid/gradient backgrounds (Canva, CapCut, iQIYI, Netflix, Spotify, Disney, etc.)
 * return false so they can fill the circular avatar edge-to-edge without exposing square asset corners.
 */
export function isPaddedBrand(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('chatgpt') ||
    n.includes('openai') ||
    n.includes('gemini') ||
    n.includes('google') ||
    n.includes('youtube') ||
    n.includes('vidio') ||
    n.includes('viu') ||
    n.includes('wetv') ||
    n.includes('midjourney') ||
    n.includes('grammarly')
  );
}

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

