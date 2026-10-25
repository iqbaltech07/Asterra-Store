'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faTv,
} from '@fortawesome/free-solid-svg-icons';
import {
  faYoutube,
} from '@fortawesome/free-brands-svg-icons';
import { resolveBrandLogo } from '@/components/ui/product-brand-icon';

export function AppBrandBadge({ name }: { name: string }) {
  const brandLogo = resolveBrandLogo(name);
  const n = (name || '').toLowerCase();

  if (brandLogo) {
    const isDarkLogo = n.includes('spotify') || n.includes('netflix') || n.includes('mobile legend') || n.includes('pubg');
    return (
      <div className={`w-full h-full rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border ${isDarkLogo ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/80'} overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandLogo}
          alt={name}
          className="w-full h-full object-contain"
          draggable={false}
          loading="lazy"
        />
      </div>
    );
  }

  if (n.includes('youtube')) {
    return (
      <div className="w-full h-full bg-[#FF0000] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faYoutube} className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    );
  }

  if (n.includes('claude')) {
    return (
      <div className="w-full h-full bg-[#D97706]/15 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-[#D97706] text-xs sm:text-sm tracking-tight">Claude</span>
      </div>
    );
  }

  if (n.includes('disney')) {
    return (
      <div className="w-full h-full bg-[#113CCF] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs">Disney+</span>
      </div>
    );
  }

  if (n.includes('k-vision') || n.includes('nex') || n.includes('vision') || n.includes('orange tv')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faTv} className="w-5 h-5 text-[#C96F55]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#C96F55]/10 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
      <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5 text-[#C96F55]" />
    </div>
  );
}
