'use client';

import React from 'react';
import { Package } from 'lucide-react';

/**
 * Brandfetch CDN Logo Registry
 * Fast, official WebP icons sourced directly from Brandfetch API
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: 'https://cdn.brandfetch.io/id9mVQlyB1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027472318idOZh3WAwy_qfRsVgJ',
  netflix: 'https://cdn.brandfetch.io/ideQwN5lBE/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027472790idOZh3WAwy2y3rJMTs',
  spotify: 'https://cdn.brandfetch.io/id20mQyGeY/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027473639idOZh3WAwyibUeT2DI',
  chatgpt: 'https://cdn.brandfetch.io/id2UDPob7G/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027483031idOZh3WAwyHnFHGiET',
  openai: 'https://cdn.brandfetch.io/idR3duQxYl/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027484133idOZh3WAwyyJc-CdrP',
  gemini: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027484748idOZh3WAwy74DcQgZs',
  google: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027484748idOZh3WAwy74DcQgZs',
  alight: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027485636idOZh3WAwyu2EbUelQ',
  motion: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027485636idOZh3WAwyu2EbUelQ',
  capcut: 'https://cdn.brandfetch.io/idUmqKFgE3/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027486057idOZh3WAwyqchngBlV',
  vidio: 'https://cdn.brandfetch.io/idqasDdtIB/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027468196idOZh3WAwyIFUzAvnO',
  viu: 'https://cdn.brandfetch.io/idgqyDfIeT/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027466816idOZh3WAwyPirrLuuZ',
  wetv: 'https://cdn.brandfetch.io/idp2rkmRV6/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027467285idOZh3WAwyuZrx29rO',
  bstation: 'https://cdn.brandfetch.io/idJarLS8mp/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023891364idOZh3WAwysP5f9nO2',
  bilibili: 'https://cdn.brandfetch.io/idJarLS8mp/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023891364idOZh3WAwysP5f9nO2',
  iqiyi: 'https://cdn.brandfetch.io/idy_RwerrN/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027471879idOZh3WAwyMjmOBsw1',
  'mobile legend': 'https://cdn.brandfetch.io/idD9JU0j92/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027486902idOZh3WAwyJ8ISAiE8',
  mlbb: 'https://cdn.brandfetch.io/idD9JU0j92/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027486902idOZh3WAwyJ8ISAiE8',
  pubg: 'https://cdn.brandfetch.io/idvXXFWwhd/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793027413613idOZh3WAwyiS2JNIjn',
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
  const resolvedUrl = (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')))
    ? imageUrl
    : resolveBrandLogo(name, imageUrl || '');

  const containerClass = className || 'w-8 h-8 rounded-full border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-white';

  if (resolvedUrl && !hasError) {
    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={name}
          className="w-full h-full object-contain p-0.5"
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
