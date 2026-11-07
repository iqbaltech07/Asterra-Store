'use client';

import React from 'react';
import { Package, Gamepad2, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Brand & Official Icon Registry
 * Reliable icons served via local static storage or cached internal proxies
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  // AI Tools
  chatgpt: '/images/apps/chatgpt.png',
  openai: '/images/apps/chatgpt.png',
  gemini: '/images/apps/gemini.png',
  'google ai': '/images/apps/gemini.png',
  'google pro': '/images/apps/gemini.png',
  google: '/images/apps/gemini.png',
  claude: '/api/v1/media/brand-icons/claude',
  midjourney: '/api/v1/media/brand-icons/midjourney',

  // Design & Productivity
  canva: '/images/apps/canva.png',
  capcut: '/images/apps/capcut.png',
  alight: '/images/apps/alightmotion.png',
  motion: '/images/apps/alightmotion.png',
  adobe: '/api/v1/media/brand-icons/adobe',
  grammarly: '/api/v1/media/brand-icons/grammarly',

  // Streaming & Video
  netflix: '/images/apps/netflix.png',
  spotify: '/images/apps/spotify.svg',
  youtube: '/images/apps/youtube.svg',
  vidio: '/images/apps/vidio.png',
  viu: '/images/apps/viu.png',
  wetv: '/images/apps/wetv.png',
  bstation: '/api/v1/media/brand-icons/bstation',
  bilibili: '/api/v1/media/brand-icons/bstation',
  blibli: '/api/v1/media/brand-icons/bstation',
  iqiyi: '/api/v1/media/brand-icons/iqiyi',
  disney: '/images/apps/disney.svg',
  loklok: '/images/apps/loklok.svg',

  // Communication, Utilities & Learning
  duolingo: '/images/apps/duolingo.svg',
  getcontact: '/images/apps/getcontact.svg',
  zoom: '/images/apps/zoom.svg',
  apple: '/images/apps/apple-music.svg',
  'apple music': '/images/apps/apple-music.svg',

  // Games
  mobilelegends: '/images/apps/mobile-legends.webp',
  'mobile legends': '/images/apps/mobile-legends.webp',
  mlbb: '/images/apps/mobile-legends.webp',
  pubg: '/images/apps/pubg-mobile.webp',

  // TV & Satellite
  'k-vision': '/images/apps/k-vision.webp',
  kvision: '/images/apps/k-vision.webp',
  nex: '/images/apps/nex-parabola.webp',
  vision: '/images/apps/vision-plus.webp',
  'orange tv': '/images/apps/orange-tv.webp',

  // Photo & Beauty
  wink: '/images/apps/wink.webp',
  meitu: '/images/apps/meitu.webp',
};

/**
 * Strictly detect whether a given URL is a promotional product banner,
 * wide poster, or broken path rather than an authoritative brand logo.
 */
export function isBannerOrInvalidLogo(url: string = ''): boolean {
  if (!url) return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed.startsWith('/images/brand/') ||
    trimmed.startsWith('/images/banners/') ||
    trimmed.includes('/products/') ||
    trimmed.includes('/media/products/') ||
    trimmed.includes('/banners/') ||
    trimmed.includes('banner') ||
    trimmed.includes('poster') ||
    trimmed.includes('default-product')
  );
}

export function resolveBrandLogo(name: string = '', fallbackUrl: string = ''): string {
  const trimmed = (fallbackUrl || '').trim();
  const isInvalid = isBannerOrInvalidLogo(trimmed);

  // 1. If an authoritative logo URL is explicitly provided (and NOT a product banner), prioritize it
  if (!isInvalid) {
    if (
      trimmed.startsWith('https://cdn.brandfetch.io/') ||
      trimmed.startsWith('/api/v1/media/brand-icons/') ||
      trimmed.startsWith('/images/apps/') ||
      trimmed.startsWith('data:image/') ||
      trimmed.includes('/logos/') ||
      trimmed.includes('logo')
    ) {
      return trimmed;
    }
  }

  // 2. Resolve via keyword matching from BRAND_ICONS_MAP
  const lower = (name || '').toLowerCase();
  for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }

  // 3. If fallbackUrl was not identified as a banner and is safe, return it
  return !isInvalid ? trimmed : '';
}

/**
 * Returns true if the logo asset is a standalone glyph on a transparent / white background
 * that needs inner padding so the glyph doesn't touch the circular border.
 */
export function isPaddedBrand(name: string): boolean {
  const n = (name || '').toLowerCase();
  return (
    n.includes('chatgpt') ||
    n.includes('openai') ||
    n.includes('gemini') ||
    n.includes('google') ||
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
 * Guaranteed never to render product promotional banners inside the avatar.
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

  // Strictly filter out any banner url passed via imageUrl prop
  const safePropUrl = isBannerOrInvalidLogo(imageUrl) ? '' : imageUrl;
  const resolvedUrl = resolveBrandLogo(name, safePropUrl || '');
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

  // Clean initials fallback if no brand icon matched
  const initials = (name || '')
    .trim()
    .replace(/[\[\(].*?[\]\)]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => !/^\d+$/.test(w))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');

  return (
    <div
      className={cn(
        'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-slate-200/80 bg-slate-100 text-slate-600 font-bold shadow-2xs select-none',
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
