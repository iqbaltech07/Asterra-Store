'use client';

import React from 'react';
import { Package, Gamepad2, Tv } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Brandfetch CDN Logo Registry
 * Fast, official icons sourced directly from Brandfetch API & verified official APK stores
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: 'https://asterrastore.biz.id/api/v1/media/brand-icons/canva.webp',
  netflix: 'https://asterrastore.biz.id/api/v1/media/brand-icons/netflix.webp',
  spotify: 'https://asterrastore.biz.id/api/v1/media/brand-icons/spotify.webp',
  chatgpt: 'https://asterrastore.biz.id/api/v1/media/brand-icons/chatgpt.svg',
  openai: 'https://asterrastore.biz.id/api/v1/media/brand-icons/openai.svg',
  gemini: 'https://asterrastore.biz.id/api/v1/media/brand-icons/gemini.webp',
  google: 'https://asterrastore.biz.id/api/v1/media/brand-icons/google.webp',
  alight: 'https://asterrastore.biz.id/api/v1/media/brand-icons/alight.webp',
  motion: 'https://asterrastore.biz.id/api/v1/media/brand-icons/motion.webp',
  capcut: 'https://asterrastore.biz.id/api/v1/media/brand-icons/capcut.webp',
  vidio: 'https://asterrastore.biz.id/api/v1/media/brand-icons/vidio.webp',
  viu: 'https://asterrastore.biz.id/api/v1/media/brand-icons/viu.webp',
  wetv: 'https://asterrastore.biz.id/api/v1/media/brand-icons/wetv.webp',
  bstation: 'https://asterrastore.biz.id/api/v1/media/brand-icons/bstation.png',
  bilibili: 'https://asterrastore.biz.id/api/v1/media/brand-icons/bilibili.png',
  blibli: 'https://asterrastore.biz.id/api/v1/media/brand-icons/blibli.png',
  iqiyi: 'https://asterrastore.biz.id/api/v1/media/brand-icons/iqiyi.webp',
  youtube: 'https://asterrastore.biz.id/api/v1/media/brand-icons/youtube.webp',
  disney: 'https://asterrastore.biz.id/api/v1/media/brand-icons/disney.webp',
  claude: 'https://asterrastore.biz.id/api/v1/media/brand-icons/claude.webp',
  midjourney: 'https://asterrastore.biz.id/api/v1/media/brand-icons/midjourney.webp',
  adobe: 'https://asterrastore.biz.id/api/v1/media/brand-icons/adobe.webp',
  grammarly: 'https://asterrastore.biz.id/api/v1/media/brand-icons/grammarly.webp',
};

export function resolveBrandLogo(name: string = '', fallbackUrl: string = ''): string {
  if (fallbackUrl && (fallbackUrl.startsWith('http://') || fallbackUrl.startsWith('https://'))) {
    return fallbackUrl;
  }
  const lower = (name || '').toLowerCase();

  // Game items: jangan di-fetch dulu
  if (lower.includes('mobile legend') || lower.includes('mlbb') || lower.includes('pubg')) {
    return '';
  }

  for (const [key, url] of Object.entries(BRAND_ICONS_MAP)) {
    if (lower.includes(key)) {
      return url;
    }
  }
  return fallbackUrl || '';
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

export function ProductBrandIcon({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string;
  className?: string;
}) {
  const [hasError, setHasError] = React.useState(false);
  const n = (name || '').toLowerCase();

  // Strip accidental squircle/corner radius classes to guarantee a circular avatar
  const sanitizedClassName = (className || '')
    .replace(/\brounded-(?:none|xs|sm|md|lg|xl|2xl|3xl)\b/g, '')
    .trim();

  // Game items: gunakan icon Gamepad
  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('pubg')) {
    const gameClass = cn(
      'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border border-amber-500/20 shadow-2xs bg-amber-500/10 text-amber-500 select-none',
      !sanitizedClassName.includes('w-') && 'w-8 h-8',
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
      !sanitizedClassName.includes('w-') && 'w-8 h-8',
      sanitizedClassName,
      'rounded-full'
    );
    return (
      <div className={tvClass}>
        <Tv className="w-1/2 h-1/2" />
      </div>
    );
  }

  const resolvedUrl =
    imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))
      ? imageUrl
      : resolveBrandLogo(name, imageUrl || '');

  const isDark = n.includes('netflix');
  const baseTheme = isDark ? 'bg-black border-slate-800' : 'bg-white border-slate-200/80';

  const containerClass = cn(
    'relative aspect-square shrink-0 rounded-full overflow-hidden flex items-center justify-center border shadow-2xs select-none',
    !sanitizedClassName.includes('w-') && 'w-8 h-8',
    baseTheme,
    sanitizedClassName,
    'rounded-full'
  );

  if (resolvedUrl && !hasError) {
    const isPadded = isPaddedBrand(n);

    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
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
        !sanitizedClassName.includes('w-') && 'w-8 h-8',
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
