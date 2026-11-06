'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Play,
  ArrowRight,
  CheckCircle2,
  Diamond
} from 'lucide-react';

import { AnimatedBeam } from '@/registry/magicui/animated-beam';

export function SalesLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null); // Top Left: Preview Card (Stream Pass)
  const div3Ref = useRef<HTMLDivElement>(null); // Bottom Left: Featured Product Card (ChatGPT Plus)
  const div4Ref = useRef<HTMLDivElement>(null); // Center: Asterra Store Logo
  const div5Ref = useRef<HTMLDivElement>(null); // Top Right: Payout Summary Card (@Rendy.vck)
  const div7Ref = useRef<HTMLDivElement>(null); // Bottom Right: Tier / Category Card (Profesional Clipper)

  return (
    <div className="h-screen max-h-screen w-full bg-[#FAFAF8] text-[#121A2A] selection:bg-[#EA580C] selection:text-white font-sans overflow-hidden relative flex flex-col justify-between">
      
      {/* ---------------- 1. TOP HORIZONTAL NAVBAR ---------------- */}
      <header className="h-16 shrink-0 z-50 w-full bg-[#FAFAF8]/95 backdrop-blur-md border-b border-[#E5E5E0]/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Left: Official Asterra Store Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg tracking-tighter">A</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base text-[#121A2A] tracking-tight leading-none">
                Asterra<span className="text-[#EA580C]">Store</span>
              </span>
              <span className="text-[9px] font-bold tracking-widest text-[#64748B] uppercase mt-0.5">
                Digital Marketplace
              </span>
            </div>
          </Link>

          {/* Right: Navigation Links & CTA */}
          <div className="flex items-center gap-7">
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#64748B]">
              <a href="#products" className="hover:text-[#121A2A] transition-colors">Products</a>
              <a href="#how-it-works" className="hover:text-[#121A2A] transition-colors">How It Works</a>
              <a href="#faq" className="hover:text-[#121A2A] transition-colors">FAQ</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="px-3.5 py-1.5 text-sm font-semibold text-[#121A2A] hover:text-[#EA580C] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/auth/login?tab=register"
                className="px-4 py-2 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>
      </header>

      {/* ---------------- 2. HERO SECTION (EXPANDED & ENLARGED 1-SCREEN COMPOSITION) ---------------- */}
      <section className="relative flex-1 w-full overflow-hidden flex flex-col justify-center items-center py-2 sm:py-3 px-3 sm:px-6">
        
        {/* Subtle Ambient Background Warm Glow */}
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[480px] bg-gradient-to-tr from-orange-200/30 via-amber-100/20 to-transparent blur-3xl pointer-events-none rounded-full" />
        
        {/* Background Dot Matrix Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#121A2A 1.5px, transparent 1.5px)`,
            backgroundSize: `24px 24px`
          }}
        />

        {/* Right Ambient Circular Dot Matrix Cluster (Signature from Konten reference) */}
        <div 
          className="absolute right-[4%] top-[14%] w-64 h-64 rounded-full opacity-[0.14] pointer-events-none hidden sm:block"
          style={{
            backgroundImage: `radial-gradient(#EA580C 2px, transparent 2px)`,
            backgroundSize: `16px 16px`,
            maskImage: `radial-gradient(circle, black 40%, transparent 75%)`,
            WebkitMaskImage: `radial-gradient(circle, black 40%, transparent 75%)`,
          }}
        />

        {/* ========================================================================= */}
        {/* UNIFIED HERO INTERACTIVE CANVAS (CARDS + CENTRAL LOGO + FLANKED HEADLINE) */}
        {/* ========================================================================= */}
        <div
          ref={containerRef}
          className="relative w-full max-w-[1400px] h-full min-h-[500px] max-h-[720px] mx-auto select-none flex flex-col items-center justify-center"
        >
          {/* Background Circuit Schematic Traces */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="absolute left-[2%] top-[32%] w-32 sm:w-48 h-px bg-gradient-to-r from-transparent via-[#E5E5E0] to-[#E5E5E0]" />
            <div className="absolute right-[2%] top-[32%] w-32 sm:w-48 h-px bg-gradient-to-l from-transparent via-[#E5E5E0] to-[#E5E5E0]" />
          </div>

          {/* --- CARD 1 (TOP LEFT): DIGITAL PRODUCT PREVIEW (ENLARGED) --- */}
          <div
            ref={div1Ref}
            className="absolute left-[2.5%] sm:left-[5%] lg:left-[8%] top-[3%] sm:top-[5%] z-10 w-46 sm:w-54 md:w-58 bg-white rounded-2xl p-2.5 sm:p-3 border border-[#E5E5E0] shadow-[0_10px_28px_rgba(18,26,42,0.07)] hover:shadow-[0_14px_32px_rgba(234,88,12,0.14)] transition-all"
          >
            <div className="relative w-full h-18 sm:h-22 rounded-xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#EA580C_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-red-600 flex items-center justify-center text-[7px] font-black text-white">N</div>
                <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-wider">NETFLIX</span>
              </div>
              <div className="absolute bottom-1.5 right-1.5 text-[8px] sm:text-[9px] font-extrabold text-white bg-black/60 px-1.5 py-0.5 rounded">
                4K UHD
              </div>
            </div>

            <div className="mt-2 px-0.5 space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px] font-bold text-[#121A2A]">
                <span className="truncate">Stream Pass</span>
                <span className="text-[#EA580C] font-extrabold shrink-0">Rp2.500</span>
              </div>
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#64748B]">
                <span>43.2K Views</span>
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              </div>
            </div>
          </div>

          {/* --- CARD 2 (BOTTOM LEFT / FLANKING HEADLINE): FEATURED PRODUCT (BIMTEKNAS STYLE) --- */}
          <div
            ref={div3Ref}
            className="hidden lg:block absolute left-[1%] sm:left-[2%] lg:left-[3%] top-[40%] xl:top-[42%] z-10 w-56 sm:w-62 md:w-66 bg-white rounded-2xl p-3 border border-[#E5E5E0] shadow-[0_12px_32px_rgba(18,26,42,0.08)] hover:shadow-[0_16px_36px_rgba(234,88,12,0.15)] transition-all"
          >
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                <Image
                  src="/images/apps/chatgpt.png"
                  alt="ChatGPT Plus"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-orange-50 text-[#EA580C]">
                    AI SUITE
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#121A2A] whitespace-nowrap">ChatGPT Plus & Team</h4>
              </div>
            </div>

            {/* Progress / Stock Bar (Matching Konten reference) */}
            <div className="mt-2.5 space-y-1">
              <div className="flex justify-between items-center text-[9px] sm:text-[10px]">
                <span className="text-[#64748B]">Stok Tersedia</span>
                <span className="font-bold text-emerald-600">88% Ready</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="w-[88%] h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#E5E5E0]/70 flex items-center justify-between">
              <div>
                <span className="text-[8px] sm:text-[9px] text-[#64748B] block leading-none">Harga Resmi</span>
                <span className="text-xs sm:text-[13px] font-black text-[#121A2A]">Rp45.000<span className="text-[10px] font-normal text-[#64748B]">/bln</span></span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-white bg-[#121A2A] hover:bg-[#EA580C] px-2.5 py-1 rounded-lg transition-colors cursor-pointer">
                Order
              </span>
            </div>
          </div>

          {/* --- CARD 3 (TOP RIGHT): PURCHASE SUMMARY / PARTNER PAYOUT --- */}
          <div
            ref={div5Ref}
            className="absolute right-[2.5%] sm:right-[5%] lg:right-[8%] top-[3%] sm:top-[5%] z-10 w-48 sm:w-56 md:w-60 bg-white rounded-2xl p-2.5 sm:p-3 border border-[#E5E5E0] shadow-[0_10px_28px_rgba(18,26,42,0.07)] hover:shadow-[0_14px_32px_rgba(234,88,12,0.14)] transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#EA580C] to-amber-500 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center shadow-xs">
                  RV
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#121A2A] block leading-none">@Rendy.vck</span>
                  <span className="text-[9px] sm:text-[10px] text-[#64748B]">Verified Partner</span>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>

            <div className="space-y-1 pt-1.5 border-t border-[#E5E5E0]/70">
              <div className="flex justify-between items-center text-[10px] sm:text-xs text-[#64748B]">
                <span>Views</span>
                <span className="font-bold text-[#121A2A]">21.4K</span>
              </div>
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                <span className="text-[#64748B]">Est. Payout</span>
                <span className="text-xs sm:text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                  Rp385.000
                </span>
              </div>
            </div>
          </div>

          {/* --- CARD 4 (BOTTOM RIGHT / FLANKING HEADLINE): MEMBERSHIP / CATEGORY BADGE --- */}
          <div
            ref={div7Ref}
            className="hidden lg:block absolute right-[1%] sm:right-[2%] lg:right-[3%] top-[40%] xl:top-[42%] z-10 w-46 sm:w-50 md:w-54 bg-white rounded-2xl p-3 border border-[#E5E5E0] shadow-[0_12px_32px_rgba(18,26,42,0.08)] hover:shadow-[0_16px_36px_rgba(234,88,12,0.15)] transition-all text-center"
          >
            <span className="text-[8px] sm:text-[9px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
              Kemitraan
            </span>
            
            <div className="flex items-center justify-center my-1.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-[#EA580C] p-0.5 shadow-xs">
                <div className="w-full h-full rounded-[10px] bg-white flex items-center justify-center">
                  <Diamond className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 fill-blue-50" />
                </div>
              </div>
            </div>

            <h4 className="font-extrabold text-xs sm:text-sm text-[#121A2A]">Profesional Clipper</h4>
            
            <div className="mt-2 pt-2 border-t border-[#E5E5E0]/70 flex items-center justify-center gap-2">
              <span className="text-[9px] sm:text-[10px] font-extrabold text-[#EA580C] bg-orange-50 px-2 py-0.5 rounded">
                +15% Bonus
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">Tier 4</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CENTRAL COLUMN: LOGO + BADGE + HEADLINE + SUBTITLE + CTAs                 */}
          {/* ========================================================================= */}
          <div className="relative z-20 flex flex-col items-center text-center max-w-xl sm:max-w-2xl px-3 mx-auto">
            
            {/* Center Logo */}
            <div
              ref={div4Ref}
              className="cursor-pointer group relative mb-3 sm:mb-4"
            >
              {/* Ambient Breathing Orange Glow */}
              <div className="absolute -inset-4 sm:-inset-5 bg-gradient-to-r from-[#EA580C] to-[#F97316] rounded-3xl blur-2xl opacity-45 group-hover:opacity-65 transition duration-700 animate-pulse pointer-events-none" />
              
              {/* Premium Rounded Square Container (104-112px) */}
              <div className="relative w-22 h-22 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-[24px] sm:rounded-[28px] bg-gradient-to-br from-[#FB923C] via-[#EA580C] to-[#C2410C] p-0.5 shadow-[0_14px_36px_rgba(234,88,12,0.38),0_4px_14px_rgba(18,26,42,0.15)] transition-transform duration-300 hover:scale-105 flex items-center justify-center border border-white/30">
                <div className="w-full h-full rounded-[22px] sm:rounded-[26px] bg-gradient-to-b from-[#EA580C] to-[#C2410C] flex items-center justify-center p-3.5 sm:p-4">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-15 md:h-15 relative flex items-center justify-center">
                    <Image
                      src="/images/brand/asterra-mark.png"
                      alt="Asterra Store Mark"
                      width={60}
                      height={60}
                      className="object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                      priority
                    />
                  </div>
                </div>
              </div>

              {/* Ping indicator ring */}
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#EA580C] border-2 border-white"></span>
              </span>
            </div>

            {/* Eyebrow Proof Badge (Directly below central logo!) */}
            <div className="mb-2 sm:mb-2.5">
              <div className="inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-[#E5E5E0] shadow-xs text-xs font-semibold text-[#121A2A]">
                <div className="flex -space-x-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#EA580C] text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-white">AS</span>
                  <span className="w-5 h-5 rounded-full bg-[#121A2A] text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-white">DP</span>
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-[8px] font-bold text-white flex items-center justify-center ring-2 ring-white">OP</span>
                </div>
                <span className="font-extrabold tracking-wide text-xs sm:text-[13px] text-[#64748B]">
                  1.000+ Transaksi Sukses Terverifikasi
                </span>
              </div>
            </div>

            {/* Main Headline (Directly below badge, framed by left and right cards!) */}
            <h1 className="text-3xl sm:text-4xl md:text-[46px] lg:text-[50px] font-extrabold tracking-tight text-[#121A2A] leading-[1.14] mb-2 sm:mb-2.5">
              Semua Kebutuhan Digital, <br className="hidden sm:inline" />
              <span className="text-[#EA580C]">Satu Tempat.</span>
            </h1>

            {/* Description */}
            <p className="text-xs sm:text-sm md:text-[15px] text-[#64748B] leading-relaxed max-w-lg mx-auto mb-3.5 sm:mb-4 px-2">
              Temukan berbagai produk digital premium dengan proses pembelian mudah, cepat, dan terpercaya hanya di Asterra Store.
            </p>

            {/* CTAs */}
            <div className="flex flex-row items-center justify-center gap-3 w-full max-w-xs sm:max-w-none mx-auto">
              <Link
                href="/auth/login?tab=register"
                className="px-6 py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35 transition-all flex items-center justify-center gap-2"
              >
                <span>Mulai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#121A2A] text-xs sm:text-sm font-bold border border-[#E5E5E0] shadow-xs transition-all text-center"
              >
                Jelajahi Produk
              </a>
            </div>

          </div>

          {/* --- MAGIC UI ANIMATED BEAMS (4 CLEAN CONNECTING PATHS TO CENTRAL LOGO) --- */}
          {/* Beam 1: Left Top (Preview Card) -> Center Logo */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div4Ref}
            pathType="circuit"
            endYOffset={-14}
            pathColor="#E5E5E0"
            pathWidth={1.5}
            pathOpacity={0.6}
            gradientStartColor="#EA580C"
            gradientStopColor="#F97316"
            duration={3.2}
            delay={0}
          />

          {/* Beam 2: Left Bottom (Featured Product Card) -> Center Logo */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div3Ref}
            toRef={div4Ref}
            pathType="circuit"
            endYOffset={14}
            pathColor="#E5E5E0"
            pathWidth={1.5}
            pathOpacity={0.6}
            gradientStartColor="#EA580C"
            gradientStopColor="#F97316"
            duration={3.5}
            delay={1.2}
          />

          {/* Beam 3: Right Top (Payout Card) -> Center Logo */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div4Ref}
            pathType="circuit"
            endYOffset={-14}
            reverse
            pathColor="#E5E5E0"
            pathWidth={1.5}
            pathOpacity={0.6}
            gradientStartColor="#EA580C"
            gradientStopColor="#F97316"
            duration={3.2}
            delay={0.4}
          />

          {/* Beam 4: Right Bottom (Membership Badge) -> Center Logo */}
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div7Ref}
            toRef={div4Ref}
            pathType="circuit"
            endYOffset={14}
            reverse
            pathColor="#E5E5E0"
            pathWidth={1.5}
            pathOpacity={0.6}
            gradientStartColor="#EA580C"
            gradientStopColor="#F97316"
            duration={3.5}
            delay={1.6}
          />

        </div>
      </section>

      {/* Decorative Bottom Baseline */}
      <div className="w-full h-1 shrink-0 bg-gradient-to-r from-transparent via-[#E5E5E0] to-transparent" />

    </div>
  );
}
