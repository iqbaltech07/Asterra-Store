'use client';

import React from 'react';
import { Package } from 'lucide-react';

export function resolveBrandLogo(name: string = '', fallbackUrl: string = '/images/default-product-banner.png'): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('netflix') || lower.includes('ntflx')) return '/images/brand/Netflix-logo.png';
  if (lower.includes('capcut')) return '/images/brand/Capcut-logo.png';
  if (lower.includes('gemini') || lower.includes('google')) return '/images/brand/Google-logo.png';
  if (lower.includes('alight') || lower.includes('motion')) return '/images/brand/Alightmotion-logo.png';
  if (lower.includes('chatgpt') || lower.includes('openai') || lower.includes('gpt')) return '/images/brand/ChatGPT-logo.png';
  if (lower.includes('spotify') || lower.includes('spy')) return '/images/brand/Spotify-logo.png';
  if (lower.includes('bstation') || lower.includes('bilibili') || lower.includes('bsprem')) return '/images/brand/BStation-logo.png';
  if (lower.includes('iqiyi')) return '/images/brand/iqiyi-logo.png';
  if (lower.includes('mobile legend') || lower.includes('mlbb') || lower.includes('diamond')) return '/images/brand/Mobilelegends-logo.png';
  if (lower.includes('pubg')) return '/images/brand/Pubg-logo.png';
  if (lower.includes('canva')) return '/images/apps/canva.png';
  if (lower.includes('vidio')) return '/images/apps/vidio.png';
  if (lower.includes('viu')) return '/images/apps/viu.png';
  if (lower.includes('wetv')) return '/images/apps/wetv.png';
  return fallbackUrl || '/images/default-product-banner.png';
}

export function ProductBrandIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const lower = (name || '').toLowerCase();
  const baseClass = className || 'w-8 h-8 rounded-full border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-white';
  const darkBaseClass = className || 'w-8 h-8 rounded-full border border-slate-900 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden bg-black';

  // 1. Netflix
  if (lower.includes('netflix') || lower.includes('ntflx')) {
    return (
      <div className={darkBaseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Netflix-logo.png" alt="Netflix" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 2. CapCut
  if (lower.includes('capcut')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Capcut-logo.png" alt="CapCut" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 3. Google / Gemini
  if (lower.includes('gemini') || lower.includes('google')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Google-logo.png" alt="Google" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 4. Alight Motion
  if (lower.includes('alight') || lower.includes('motion')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Alightmotion-logo.png" alt="Alight Motion" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 5. ChatGPT / OpenAI
  if (lower.includes('chatgpt') || lower.includes('openai') || lower.includes('gpt')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/ChatGPT-logo.png" alt="ChatGPT" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 6. Spotify
  if (lower.includes('spotify') || lower.includes('spy')) {
    return (
      <div className={darkBaseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Spotify-logo.png" alt="Spotify" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 7. BStation / Bilibili
  if (lower.includes('bstation') || lower.includes('bilibili') || lower.includes('bsprem')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/BStation-logo.png" alt="BStation" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 8. iQiyi
  if (lower.includes('iqiyi')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/iqiyi-logo.png" alt="iQiyi" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 9. Mobile Legends
  if (lower.includes('mobile legend') || lower.includes('mlbb') || lower.includes('diamond')) {
    return (
      <div className={darkBaseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Mobilelegends-logo.png" alt="Mobile Legends" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 10. PUBG
  if (lower.includes('pubg')) {
    return (
      <div className={darkBaseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/Pubg-logo.png" alt="PUBG" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 11. YouTube
  if (lower.includes('youtube')) {
    return (
      <div className={className || "w-8 h-8 rounded-full bg-[#FF0000] border border-red-600 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden"}>
        <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
          <path d="M21.58 7.19a2.5 2.5 0 00-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 002.42 7.2C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 001.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 001.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
        </svg>
      </div>
    );
  }

  // 12. Canva
  if (lower.includes('canva')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/apps/canva.png" alt="Canva" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 13. Vidio
  if (lower.includes('vidio')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/apps/vidio.png" alt="Vidio" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 14. Viu
  if (lower.includes('viu')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/apps/viu.png" alt="Viu" className="w-full h-full object-cover" />
      </div>
    );
  }

  // 15. WeTV
  if (lower.includes('wetv')) {
    return (
      <div className={baseClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/apps/wetv.png" alt="WeTV" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className={className || "w-8 h-8 rounded-full bg-slate-100 border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-600 shrink-0"}>
      <Package className="w-4 h-4 text-slate-500" />
    </div>
  );
}
