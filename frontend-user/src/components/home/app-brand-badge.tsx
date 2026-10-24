'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faTv,
  faGamepad,
  faBrain,
} from '@fortawesome/free-solid-svg-icons';
import {
  faYoutube,
  faSpotify,
} from '@fortawesome/free-brands-svg-icons';

export function AppBrandBadge({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl && !imageUrl.includes('default-product-banner.png') && imageUrl.length > 5) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  const n = name.toLowerCase();

  if (n.includes('claude')) {
    return (
      <div className="w-full h-full bg-[#D97706]/15 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-[#D97706] text-xs sm:text-sm tracking-tight">Claude</span>
      </div>
    );
  }

  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('diamond')) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faGamepad} className="w-5 h-5 text-white" />
      </div>
    );
  }

  if (n.includes('pubg') || n.includes('uc')) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faGamepad} className="w-5 h-5 text-white" />
      </div>
    );
  }

  if (n.includes('gemini') || n.includes('google ai')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/gemini.png"
          alt="Google Gemini"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('chatgpt')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/chatgpt.png"
          alt="ChatGPT"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('canva')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs">
        <img
          src="/images/apps/canva.png"
          alt="Canva"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('capcut')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/capcut.png?v=20261012b"
          alt="CapCut"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('alight')) {
    return (
      <div className="w-full h-full bg-[#181d2a] rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs overflow-hidden">
        <img
          src="/images/apps/alightmotion.png"
          alt="Alight Motion"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
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

  if (n.includes('spotify')) {
    return (
      <div className="w-full h-full bg-[#1DB954] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <FontAwesomeIcon icon={faSpotify} className="w-5 h-5 sm:w-6 sm:h-6 text-[#121A2A]" />
      </div>
    );
  }

  if (n.includes('netflix')) {
    return (
      <div className="w-full h-full bg-black rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <span className="font-black text-[#E50914] text-xs sm:text-sm tracking-tighter">NETFLIX</span>
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

  if (n.includes('vidio')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/vidio.png"
          alt="Vidio"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('wetv')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/wetv.png"
          alt="WeTV"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('iqiyi')) {
    return (
      <div className="w-full h-full bg-[#00CC4C] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-xs sm:text-sm">iQIYI</span>
      </div>
    );
  }

  if (n.includes('bstation')) {
    return (
      <div className="w-full h-full bg-[#23ADE5] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs">Bstation</span>
      </div>
    );
  }

  if (n.includes('viu')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs">
        <img
          src="/images/apps/viu.png"
          alt="Viu"
          className="w-full h-full object-contain"
          draggable={false}
        />
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
