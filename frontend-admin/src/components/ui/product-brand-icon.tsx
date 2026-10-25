'use client';

import React from 'react';
import { Package, Gamepad2 } from 'lucide-react';

/**
 * Brandfetch CDN Logo Registry
 * Fast, official icons sourced directly from Brandfetch API & verified official APK stores
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: 'https://cdn.brandfetch.io/id9mVQlyB1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027472318idOZh3WAwy_qfRsVgJ',
  netflix: 'https://cdn.brandfetch.io/ideQwN5lBE/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027472790idOZh3WAwy2y3rJMTs',
  spotify: 'https://cdn.brandfetch.io/id20mQyGeY/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027473639idOZh3WAwyibUeT2DI',
  chatgpt: 'https://cdn.brandfetch.io/id2UDPob7G/theme/dark/logo.svg?c=1bxmocd44vb0pz4epad9gbumplbwHtoKNnM',
  openai: 'https://cdn.brandfetch.io/id2UDPob7G/theme/dark/logo.svg?c=1bxmocd44vb0pz4epad9gbumplbwHtoKNnM',
  gemini: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027484748idOZh3WAwy74DcQgZs',
  google: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027484748idOZh3WAwy74DcQgZs',
  alight: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027485636idOZh3WAwyu2EbUelQ',
  motion: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027485636idOZh3WAwyu2EbUelQ',
  capcut: 'https://cdn.brandfetch.io/idUmqKFgE3/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027486057idOZh3WAwyqchngBlV',
  vidio: 'https://cdn.brandfetch.io/idqasDdtIB/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027468196idOZh3WAwyIFUzAvnO',
  viu: 'https://cdn.brandfetch.io/idgqyDfIeT/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027466816idOZh3WAwyPirrLuuZ',
  wetv: 'https://cdn.brandfetch.io/idp2rkmRV6/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027467285idOZh3WAwyuZrx29rO',
  bstation: 'https://cdn.brandfetch.io/idvcdOiNaT/w/520/h/520/theme/dark/logo.png?c=1bxmocd44vb0pz4epad9gbumplbwHtoKNnM',
  bilibili: 'https://cdn.brandfetch.io/idvcdOiNaT/w/520/h/520/theme/dark/logo.png?c=1bxmocd44vb0pz4epad9gbumplbwHtoKNnM',
  blibli: 'https://cdn.brandfetch.io/idvcdOiNaT/w/520/h/520/theme/dark/logo.png?c=1bxmocd44vb0pz4epad9gbumplbwHtoKNnM',
  iqiyi: 'https://cdn.brandfetch.io/idy_RwerrN/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027471879idOZh3WAwyMjmOBsw1',
  youtube: 'https://cdn.brandfetch.io/idVfYwcuQz/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027469064idOZh3WAwyVyHXoxNV',
  disney: 'https://cdn.brandfetch.io/idhQlYRiX2/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027488693idOZh3WAwy39dtTIig',
  claude: 'https://cdn.brandfetch.io/idW5s392j1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027489605idOZh3WAwyLrj_K7-I',
  midjourney: 'https://cdn.brandfetch.io/id2zQLfAF7/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027490541idOZh3WAwyB7jq1Kg1',
  adobe: 'https://cdn.brandfetch.io/id_KsyK7J9/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027491416idOZh3WAwyiHBfVrFi',
  grammarly: 'https://cdn.brandfetch.io/iddd_fYAYR/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027492263idOZh3WAwy5VSWQUdD',
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
