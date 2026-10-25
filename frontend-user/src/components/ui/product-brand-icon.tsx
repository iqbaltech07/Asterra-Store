'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';

/**
 * Brandfetch CDN Logo Registry
 * Fast, official WebP icons sourced directly from Brandfetch API
 */
export const BRAND_ICONS_MAP: Record<string, string> = {
  canva: 'https://cdn.brandfetch.io/id9mVQlyB1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023757220idOZh3WAwyoemyu-QF',
  netflix: 'https://cdn.brandfetch.io/ideQwN5lBE/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023883538idOZh3WAwyFSpMyenO',
  spotify: 'https://cdn.brandfetch.io/id20mQyGeY/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023884469idOZh3WAwyRQr-rkA8',
  chatgpt: 'https://cdn.brandfetch.io/id2UDPob7G/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023885715idOZh3WAwyqSC5YBUT',
  openai: 'https://cdn.brandfetch.io/id2UDPob7G/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023885715idOZh3WAwyqSC5YBUT',
  gemini: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023915010idOZh3WAwygEoT2Yf0',
  google: 'https://cdn.brandfetch.io/id6O2oGzv-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023915010idOZh3WAwygEoT2Yf0',
  alight: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023887626idOZh3WAwy3CpX07LP',
  motion: 'https://cdn.brandfetch.io/idJZOpdSzq/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023887626idOZh3WAwy3CpX07LP',
  capcut: 'https://cdn.brandfetch.io/idUmqKFgE3/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023888576idOZh3WAwyYTjngD9q',
  vidio: 'https://cdn.brandfetch.io/idrL_K873R/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023889506idOZh3WAwyy5Jv6G4F',
  viu: 'https://cdn.brandfetch.io/id44lYk3e5/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023890509idOZh3WAwy1-p3Wl_p',
  wetv: 'https://cdn.brandfetch.io/id3aA4s3yF/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023890987idOZh3WAwyK34e9p7H',
  bstation: 'https://cdn.brandfetch.io/idq8r6-a4-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023891460idOZh3WAwy11R16bW9',
  bilibili: 'https://cdn.brandfetch.io/idq8r6-a4-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023891460idOZh3WAwy11R16bW9',
  iqiyi: 'https://cdn.brandfetch.io/idXgqL9F7Z/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023892429idOZh3WAwyK6Xf6_z7',
  'mobile legend': 'https://cdn.brandfetch.io/id54UaZkL1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023893382idOZh3WAwyG0r_qj8n',
  mlbb: 'https://cdn.brandfetch.io/id54UaZkL1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023893382idOZh3WAwyG0r_qj8n',
  pubg: 'https://cdn.brandfetch.io/idx8U1gQ2V/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023894314idOZh3WAwyW_P9U4QJ',
  youtube: 'https://cdn.brandfetch.io/id7nmgR13k/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023895237idOZh3WAwy62uC6_tC',
  disney: 'https://cdn.brandfetch.io/id_2eQk1nK/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023896172idOZh3WAwyN9t84rQ1',
  claude: 'https://cdn.brandfetch.io/id4u0u-s3d/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023897143idOZh3WAwyB0i2bU7G',
  midjourney: 'https://cdn.brandfetch.io/id3hB8h9V8/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023898124idOZh3WAwy88l-9U3W',
  adobe: 'https://cdn.brandfetch.io/idG9Y4p8k-/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023899120idOZh3WAwyM67eK0eL',
  grammarly: 'https://cdn.brandfetch.io/id2JvQ3mU1/w/128/h/128/fallback/lettermark/icon.webp?c=1ax1793023900135idOZh3WAwy3P7e5s_P',
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
  const [imgError, setImgError] = useState(false);

  const resolvedUrl = (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')))
    ? imageUrl
    : resolveBrandLogo(name, imageUrl || '');

  const containerClass = className || 'w-8 h-8 rounded-full border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-white';

  if (resolvedUrl && !imgError) {
    return (
      <div className={containerClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedUrl}
          alt={name}
          className="w-full h-full object-contain p-0.5"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <FontAwesomeIcon icon={faBox} className="w-3.5 h-3.5 text-slate-400" />
    </div>
  );
}
