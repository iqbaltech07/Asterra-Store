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

export function AppBrandBadge({ name }: { name: string }) {
  const n = name.toLowerCase();

  if (n.includes('mobile legend') || n.includes('mlbb') || n.includes('diamond')) {
    return (
      <div className="w-full h-full bg-slate-950 rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs overflow-hidden border border-slate-800">
        <img
          src="/images/brand/Mobilelegends-logo.png"
          alt="Mobile Legends"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('pubg') || n.includes('uc')) {
    return (
      <div className="w-full h-full bg-slate-950 rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs overflow-hidden border border-slate-800">
        <img
          src="/images/brand/Pubg-logo.png"
          alt="PUBG"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('gemini') || n.includes('google ai') || n.includes('google pro')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/Google-logo.png"
          alt="Google Gemini"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('chatgpt') || n.includes('openai')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/ChatGPT-logo.png"
          alt="ChatGPT"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('capcut')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/Capcut-logo.png"
          alt="CapCut"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('alight')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/Alightmotion-logo.png"
          alt="Alight Motion"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('spotify')) {
    return (
      <div className="w-full h-full bg-black rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs border border-slate-800">
        <img
          src="/images/brand/Spotify-logo.png"
          alt="Spotify"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('netflix') || n.includes('ntflx')) {
    return (
      <div className="w-full h-full bg-black rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs border border-slate-800">
        <img
          src="/images/brand/Netflix-logo.png"
          alt="Netflix"
          className="w-full h-full object-cover rounded-md"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('iqiyi')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/iqiyi-logo.png"
          alt="iQIYI"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('bstation') || n.includes('bilibili')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/brand/BStation-logo.png"
          alt="Bstation"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('canva')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-0.5 shadow-2xs border border-slate-200/80">
        <img
          src="/images/apps/canva.png"
          alt="Canva"
          className="w-full h-full object-contain"
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

  if (n.includes('vidio')) {
    return (
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
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
      <div className="w-full h-full bg-white rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-200/80">
        <img
          src="/images/apps/wetv.png"
          alt="WeTV"
          className="w-full h-full object-contain"
          draggable={false}
        />
      </div>
    );
  }

  if (n.includes('viu')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1 shadow-2xs border border-slate-800">
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
