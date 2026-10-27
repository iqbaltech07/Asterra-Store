'use client';

import React from 'react';
import { Package, Gamepad2 } from 'lucide-react';

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

  // Game items: jangan di-fetch dulu, gunakan icon Gamepad
  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('pubg')) {
    const containerClass = className || 'w-8 h-8 rounded-full border border-amber-500/20 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-amber-500/10 text-amber-500';
    return (
      <div className={containerClass}>
        <Gamepad2 className="w-4 h-4" />
      </div>
    );
  }

  const resolvedUrl = (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')))
    ? imageUrl
    : resolveBrandLogo(name, imageUrl || '');

  const containerClass = className || 'w-8 h-8 rounded-full border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-white';

  if (resolvedUrl && !hasError) {
    const isTransparentLogo = n.includes('chatgpt') || n.includes('openai') || n.includes('gemini') || n.includes('google') || n.includes('youtube');

    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={name}
          className={`w-full h-full ${isTransparentLogo ? 'object-contain p-1.5' : 'object-cover'}`}
          loading="lazy"
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Package className="w-4 h-4 text-slate-400" />
    </div>
  );
}
