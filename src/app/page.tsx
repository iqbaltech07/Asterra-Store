'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Zap,
  CreditCard,
  Layers,
  Headphones,
  CheckCircle2,
  ArrowRight,
  Plus,
  Minus,
  Sparkles,
  Tv,
  CircleHelp,
  Package,
  LayoutGrid,
  Star,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductItem } from '@/lib/products-data';

// Helper to render crisp, brand-accurate badges for the top digital applications
function AppBrandBadge({ name }: { name: string }) {
  const n = name.toLowerCase();

  if (n.includes('gemini') || n.includes('google ai')) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#1E88E5] via-[#7C4DFF] to-[#00E5FF] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </div>
    );
  }

  if (n.includes('chatgpt')) {
    return (
      <div className="w-full h-full bg-[#10A37F] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current">
          <path d="M22.28 9.53a5.98 5.98 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9 6.07 6.07 0 0 0-4.66-2.1c-2.45 0-4.66 1.48-5.59 3.74a6.04 6.04 0 0 0-4.2 3.03 6.01 6.01 0 0 0 .74 7.15 6 6 0 0 0 .52 4.9 6.06 6.06 0 0 0 6.51 2.91 6.05 6.05 0 0 0 4.66 2.1c2.45 0 4.67-1.48 5.6-3.74a6.04 6.04 0 0 0 4.2-3.03 6 6 0 0 0-.75-7.15zm-8.87 11.96c-.4 0-.8-.06-1.18-.18l-.5-.16v-4.14a.75.75 0 0 0-.37-.65l-3.5-2.02a.75.75 0 0 0-.75 0l-3.5 2.02c-.89.51-1.44 1.47-1.44 2.5 0 1.25.8 2.34 2 2.74l.51.17v-4.14c0-.28.15-.53.4-.67l3.5-2.02a.75.75 0 0 1 .75 0l3.5 2.02c.24.14.39.4.39.68v4.14l.51-.17c1.2-.4 2-1.49 2-2.74 0-1.03-.55-1.99-1.44-2.5l-3.5-2.02a.75.75 0 0 0-.75 0l-3.5 2.02a.75.75 0 0 0-.38.65v4.14l-.5.16c-1.18.39-2.48-.06-3.19-1.07a3.52 3.52 0 0 1-.41-2.96l.16-.51 3.59 2.07c.24.14.54.14.78 0l3.5-2.02c.24-.14.39-.4.39-.68v-4.04l3.5 2.02c.24.14.39.4.39.68v4.04l.51.17c1.19.4 1.95 1.52 1.95 2.78 0 1.63-1.32 2.95-2.95 2.95z"/>
        </svg>
      </div>
    );
  }

  if (n.includes('canva')) {
    return (
      <div className="w-full h-full bg-[#00C4CC] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-xs sm:text-sm tracking-tight italic font-serif">
          Canva
        </span>
      </div>
    );
  }

  if (n.includes('capcut')) {
    return (
      <div className="w-full h-full bg-[#000000] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs tracking-tight">
          CapCut
        </span>
      </div>
    );
  }

  if (n.includes('alight')) {
    return (
      <div className="w-full h-full bg-gradient-to-tr from-[#6A11CB] to-[#2575FC] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <Layers className="w-5 h-5 text-white" />
      </div>
    );
  }

  if (n.includes('youtube')) {
    return (
      <div className="w-full h-full bg-[#FF0000] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-current">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      </div>
    );
  }

  if (n.includes('spotify')) {
    return (
      <div className="w-full h-full bg-[#1DB954] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 text-[#121A2A] fill-current">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
        </svg>
      </div>
    );
  }

  if (n.includes('netflix')) {
    return (
      <div className="w-full h-full bg-[#E50914] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-sm sm:text-base font-serif">N</span>
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
      <div className="w-full h-full bg-[#ED1C24] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-xs sm:text-sm tracking-tight italic">
          Vidio
        </span>
      </div>
    );
  }

  if (n.includes('wetv')) {
    return (
      <div className="w-full h-full bg-gradient-to-r from-[#FF5E00] to-[#0084FF] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-white text-[11px] sm:text-xs">WeTV</span>
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
      <div className="w-full h-full bg-[#FFBC00] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <span className="font-black text-[#121A2A] text-xs sm:text-sm">Viu</span>
      </div>
    );
  }

  if (n.includes('k-vision') || n.includes('nex') || n.includes('vision') || n.includes('orange tv')) {
    return (
      <div className="w-full h-full bg-[#121A2A] rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
        <Tv className="w-5 h-5 text-[#C96F55]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#C96F55]/10 rounded-lg sm:rounded-xl flex items-center justify-center p-1.5 shadow-2xs">
      <Layers className="w-5 h-5 text-[#C96F55]" />
    </div>
  );
}

interface ApplicationGroupItem {
  name: string;
  slug: string;
  category: string;
  categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'other';
  fallbackCount: number;
  fallbackPrice: number;
  soldCount?: number;
  rating?: string;
  items: ProductItem[];
}

function ApplicationCard({
  app,
  isDuplicate = false,
}: {
  app: ApplicationGroupItem;
  isDuplicate?: boolean;
}) {
  const activePrices = app.items.map((p) => p.price).filter((p) => p > 0);
  const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : app.fallbackPrice;

  return (
    <Link
      href={`/products?search=${encodeURIComponent(app.name)}`}
      tabIndex={isDuplicate ? -1 : undefined}
      aria-hidden={isDuplicate ? true : undefined}
      className="group bg-white border border-[rgba(18,26,42,0.08)] hover:border-[#C96F55]/60 hover:shadow-xs hover:-translate-y-0.5 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 transition-all duration-200 flex flex-col justify-between shrink-0 flex-none w-[240px] sm:w-[270px] lg:w-[290px] h-[152px] sm:h-[158px] mr-3 sm:mr-4 select-none"
    >
      <div>
        {/* 1. PRODUCT HEADER: Logo + Product Info (Name & Rating + Terjual) */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          {/* Logo / Brand Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-[#121A2A]/5 border border-[rgba(18,26,42,0.08)] flex items-center justify-center overflow-hidden shrink-0">
            <AppBrandBadge name={app.name} />
          </div>

          {/* Product Info */}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-sm text-[#121A2A] group-hover:text-[#C96F55] transition-colors truncate leading-snug">
              {app.name}
            </h3>

            {/* Rating + Terjual: ⭐ 5.0 (Terjual 620) */}
            <div className="flex items-center gap-1 text-[11px] text-[#121A2A]/75 font-medium mt-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-semibold text-[#121A2A]">{app.rating || '5.0'}</span>
              <span className="text-[#121A2A]/45 truncate">
                (Terjual {app.soldCount ? app.soldCount.toLocaleString('id-ID') : 100 * (app.items.length || app.fallbackCount)})
              </span>
            </div>
          </div>
        </div>

        {/* 2. PRODUCT STATUS / BENEFIT TAGS: [Ready ⓘ] [Garansi ⓘ] [+1] */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-0.5">
          {/* Ready Tag (Blue) */}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 leading-none">
            <span>Ready</span>
            <span className="text-[9px] opacity-75">ⓘ</span>
          </span>

          {/* Garansi Tag (Green) */}
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
            <span>Garansi</span>
            <span className="text-[9px] opacity-75">ⓘ</span>
          </span>

          {/* Extra Tag */}
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#121A2A]/5 text-[#121A2A]/70 border border-[rgba(18,26,42,0.08)] leading-none">
            +{app.items.length > 1 ? app.items.length - 1 : 1}
          </span>
        </div>
      </div>

      {/* 3. PRICE (Strictly normal price, no crossed-out price) */}
      <div className="pt-2 border-t border-[rgba(18,26,42,0.06)] mt-2 flex items-center justify-between">
        <span className="font-black text-sm sm:text-[15px] text-[#121A2A] tracking-tight">
          Rp{minPrice.toLocaleString('id-ID')}
        </span>
        <span className="text-[10px] sm:text-xs font-semibold text-[#C96F55] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
          <span>Pilih</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [activeNotification, setActiveNotification] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Dynamic products fetched from catalog API (active products only)
  const {
    data: catalogResponse,
    isLoading: isLoadingProducts,
  } = useQuery<{ success: boolean; data: ProductItem[]; total: number }>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      if (!res.ok) throw new Error('Gagal memuat produk dari katalog.');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const allProducts = useMemo(
    () => catalogResponse?.data || [],
    [catalogResponse?.data]
  );

  // Strictly 12 priority applications explicitly ordered by user, mapped from real active catalog data
  const marqueeApps = useMemo(() => {
    const targetApps = [
      {
        name: 'Google Gemini',
        match: (t: string) => t.includes('gemini') || t.includes('google ai'),
        cat: 'AI Assistant & Cloud',
        tag: 'ai' as const,
        fallbackCount: 11,
        fallbackPrice: 19000,
        soldCount: 620,
        rating: '5.0',
      },
      {
        name: 'Canva',
        match: (t: string) => t.includes('canva'),
        cat: 'Design & Kreatif',
        tag: 'design' as const,
        fallbackCount: 13,
        fallbackPrice: 4000,
        soldCount: 1420,
        rating: '5.0',
      },
      {
        name: 'CapCut',
        match: (t: string) => t.includes('capcut'),
        cat: 'Video Editing & Content',
        tag: 'video' as const,
        fallbackCount: 11,
        fallbackPrice: 9000,
        soldCount: 980,
        rating: '4.9',
      },
      {
        name: 'ChatGPT',
        match: (t: string) => t.includes('chatgpt') || t.includes('chat gpt') || t.includes('plus plan'),
        cat: 'AI Assistant & Writing',
        tag: 'ai' as const,
        fallbackCount: 20,
        fallbackPrice: 16000,
        soldCount: 850,
        rating: '5.0',
      },
      {
        name: 'Alight Motion',
        match: (t: string) => t.includes('alightmotion') || t.includes('alight motion'),
        cat: 'Motion Graphic & VFX',
        tag: 'video' as const,
        fallbackCount: 1,
        fallbackPrice: 8000,
        soldCount: 340,
        rating: '4.8',
      },
      {
        name: 'YouTube',
        match: (t: string) => t.includes('youtube'),
        cat: 'Streaming & Video',
        tag: 'streaming' as const,
        fallbackCount: 33,
        fallbackPrice: 4000,
        soldCount: 1890,
        rating: '5.0',
      },
      {
        name: 'Netflix',
        match: (t: string) => t.includes('netflix'),
        cat: 'Movies & Series',
        tag: 'streaming' as const,
        fallbackCount: 1,
        fallbackPrice: 74000,
        soldCount: 760,
        rating: '4.9',
      },
      {
        name: 'Vidio',
        match: (t: string) => t.includes('vidio'),
        cat: 'Sports & TV Streaming',
        tag: 'streaming' as const,
        fallbackCount: 37,
        fallbackPrice: 9000,
        soldCount: 1150,
        rating: '4.9',
      },
      {
        name: 'Bstation',
        match: (t: string) => t.includes('bstation') || t.includes('bilibili'),
        cat: 'Anime & Creator Community',
        tag: 'streaming' as const,
        fallbackCount: 6,
        fallbackPrice: 7000,
        soldCount: 480,
        rating: '4.9',
      },
      {
        name: 'iQIYI',
        match: (t: string) => t.includes('iqiyi'),
        cat: 'Drama & Anime Streaming',
        tag: 'streaming' as const,
        fallbackCount: 10,
        fallbackPrice: 10000,
        soldCount: 520,
        rating: '4.9',
      },
      {
        name: 'WeTV',
        match: (t: string) => t.includes('wetv'),
        cat: 'Asian Drama & Anime',
        tag: 'streaming' as const,
        fallbackCount: 6,
        fallbackPrice: 9000,
        soldCount: 460,
        rating: '4.9',
      },
      {
        name: 'Viu',
        match: (t: string) => t.includes('viu'),
        cat: 'Asian Drama & Variety',
        tag: 'streaming' as const,
        fallbackCount: 16,
        fallbackPrice: 5000,
        soldCount: 910,
        rating: '4.9',
      },
    ];

    return targetApps.map((target) => {
      // Find matching items from allProducts (strictly excluding any item containing "lisensi")
      const items = allProducts.filter((p) => {
        const text = `${p.name} ${(p as unknown as { id?: string }).id || ''} ${(p as unknown as { providerCode?: string }).providerCode || ''}`.toLowerCase();
        if (text.includes('lisensi')) return false;
        return target.match(text);
      });

      return {
        name: target.name,
        slug: target.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        category: target.cat,
        categoryTag: target.tag,
        fallbackCount: target.fallbackCount,
        fallbackPrice: target.fallbackPrice,
        soldCount: target.soldCount,
        rating: target.rating,
        items,
      };
    });
  }, [allProducts]);


  const showNotification = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => {
      setActiveNotification(null);
    }, 3500);
  };

  const faqItems = [
    {
      q: 'Bagaimana cara membeli produk di Asterra Store?',
      a: 'Pilih aplikasi atau produk yang Anda inginkan, tentukan durasi masa aktif, isi nama dan email aktif pada halaman checkout, lalu selesaikan pembayaran melalui QRIS otomatis atau transfer bank.',
    },
    {
      q: 'Berapa lama proses aktivasi produk?',
      a: 'Sebagian besar produk diproses secara instan dalam 1 hingga 15 menit setelah pembayaran Anda terverifikasi oleh gateway pembayaran otomatis kami.',
    },
    {
      q: 'Apakah semua produk memiliki garansi resmi?',
      a: 'Ya, seluruh produk aktif di Asterra Store dilengkapi garansi resmi 100% penggantian jika akun mengalami kendala akses selama masa aktif langganan masih berlaku.',
    },
    {
      q: 'Bagaimana jika produk mengalami kendala?',
      a: 'Anda dapat langsung menghubungi tim Customer Service resmi Asterra Store melalui WhatsApp CS 24 Jam dengan melampirkan nomor Invoice pesanan Anda.',
    },
    {
      q: 'Bagaimana cara melihat pesanan saya?',
      a: 'Anda dapat membuka menu "Pesanan Saya" pada navigasi atas atau memasukkan ID invoice pesanan untuk melihat detail aktivasi dan status lisensi Anda.',
    },
    {
      q: 'Metode pembayaran apa saja yang tersedia?',
      a: 'Kami mendukung QRIS (bisa discan dengan seluruh aplikasi m-Banking dan e-Wallet seperti GoPay, OVO, Dana, ShopeePay), serta Virtual Account perbankan terkemuka.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* SECTION 1: Header Navigation */}
      <Header onNotify={showNotification} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 pt-2 sm:pt-3.5 pb-8 sm:pb-12 w-full overflow-hidden">
        {/* SECTION 2 & 3: Hero Banner with Controlled Dimensions, Scaled Planet Anchor & Integrated Benefit Strip */}
        <section className="relative w-full rounded-2xl sm:rounded-3xl bg-[#121A2A] border border-[rgba(255,255,255,0.08)] shadow-md overflow-hidden mb-6 sm:mb-8">
          {/* Controlled Hero Area: compact & clean with reduced height */}
          <div className="relative min-h-[160px] sm:min-h-[190px] lg:h-[220px] xl:h-[235px] flex items-center px-5 sm:px-8 lg:px-12 py-5 sm:py-6 lg:py-0 overflow-hidden">
            {/* Left Column: Headline & Subheadline */}
            <div className="relative z-10 w-full lg:max-w-[62%] xl:max-w-[60%] py-1">
              {/* Editorial Headline */}
              <h1 className="text-xl sm:text-3xl lg:text-[32px] xl:text-[36px] font-black tracking-tight text-white leading-[1.15]">
                Solusi Terpercaya Produk &<br />
                <span className="text-[#E28870]">Layanan Digital Premium</span>
              </h1>

              {/* Subheadline */}
              <p className="mt-2 sm:mt-2.5 text-xs sm:text-[13px] lg:text-sm text-white/75 max-w-xl leading-relaxed">
                Dapatkan akses langganan resmi untuk tool AI, software desain, voucher, dan layanan
                digital lainnya tanpa kartu kredit dengan konfirmasi instan.
              </p>
            </div>

            {/* Right Column: Planet Visual (Gambar 2: White planet with coral star, sized down) */}
            <div className="absolute right-[-20px] sm:right-0 lg:right-2 xl:right-6 top-1/2 -translate-y-1/2 pointer-events-none select-none z-0 opacity-60 sm:opacity-85 lg:opacity-100 transition-opacity">
              <div className="relative w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[260px] lg:h-[260px] flex items-center justify-center">
                {/* Subtle SVG Orbital Background Rings */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
                  viewBox="0 0 500 500"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse
                    cx="250"
                    cy="250"
                    rx="230"
                    ry="115"
                    transform="rotate(-14 250 250)"
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                  />
                  <ellipse
                    cx="250"
                    cy="250"
                    rx="185"
                    ry="92"
                    transform="rotate(-14 250 250)"
                    stroke="rgba(226, 136, 112, 0.35)"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* Ambient Soft Glow */}
                <div className="absolute w-36 h-36 lg:w-48 lg:h-48 rounded-full bg-[rgba(201,111,85,0.18)] blur-2xl pointer-events-none" />

                {/* Scaled Asterra Planet Visual: Animated Video Test with Static Fallback (IMG_3646.MOV) */}
                <div className="relative z-10 w-[150px] sm:w-[180px] lg:w-[220px] xl:w-[240px] flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/images/brand/hero-planet-white.png"
                    className="w-full h-auto object-contain mix-blend-screen pointer-events-none select-none"
                  >
                    <source src="/videos/hero-planet.mp4" type="video/mp4" />
                    <source src="/videos/hero-planet.mov" type="video/quicktime" />
                    {/* Fallback Static Planet Image */}
                    <Image
                      src="/images/brand/hero-planet-white.png"
                      alt="Asterra Planet Illustration"
                      width={360}
                      height={282}
                      unoptimized
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Trust / Benefits Strip (Compact Horizontal Row, 3 Columns) */}
          <div className="border-t border-white/10 bg-[#0E1524] px-4 sm:px-8 lg:px-12 py-3 sm:py-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-6">
              {/* Benefit 1 */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.15)] border border-[rgba(201,111,85,0.25)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#E28870]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white">100% Legal & Bergaransi</h3>
                  <p className="text-[11px] text-white/65">Jaminan penggantian penuh</p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex items-center gap-3 sm:border-l sm:border-white/10 sm:pl-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.15)] border border-[rgba(201,111,85,0.25)] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#E28870]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white">Proses Cepat & Otomatis</h3>
                  <p className="text-[11px] text-white/65">Aktivasi hitungan menit</p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex items-center gap-3 sm:border-l sm:border-white/10 sm:pl-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[rgba(201,111,85,0.15)] border border-[rgba(201,111,85,0.25)] flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-[#E28870]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-xs sm:text-sm text-white">Multi-Metode Pembayaran</h3>
                  <p className="text-[11px] text-white/65">QRIS, E-Wallet, Virtual Account</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: EXPLORE BY APPLICATION (KATALOG APLIKASI DIGITAL - INFINITE MARQUEE) */}
        <section id="aplikasi" className="mb-10 sm:mb-14 overflow-hidden">
          {/* Section Header (Static) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 mb-4 sm:mb-5 pb-2.5 border-b border-[rgba(18,26,42,0.08)]">
            <div>
              <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-0.5">
                Katalog Aplikasi Digital
              </span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
                Jelajahi Layanan Digital
              </h2>
              <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5">
                Pilih aplikasi favorit yang ingin kamu gunakan untuk kebutuhan kerja atau kreatif.
              </p>
            </div>

            <Link
              href="/products"
              className="text-xs sm:text-sm font-bold text-[#C96F55] hover:text-[#B86047] inline-flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <span>Lihat Semua Katalog</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Carousel Viewport: Single Row, No Scrollbar, Infinite Auto Track */}
          <div className="carousel-viewport relative w-full overflow-hidden py-1">
            {/* Subtle edge fades (clean, no large AI masks) */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 sm:w-8 z-10 bg-gradient-to-r from-white to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 sm:w-8 z-10 bg-gradient-to-l from-white to-transparent" />

            {/* Carousel Track: Duplicated sets for seamless -50% loop */}
            <div
              className="carousel-track flex flex-nowrap w-max shrink-0 items-stretch"
              style={{
                display: 'flex',
                width: 'max-content',
                flexShrink: 0,
                willChange: 'transform',
                animation: 'infinite-scroll 45s linear infinite',
              }}
            >
              {/* Original 12 Cards */}
              {marqueeApps.map((app) => (
                <ApplicationCard key={`orig-${app.name}`} app={app} />
              ))}

              {/* Duplicated 12 Cards (aria-hidden for accessibility) */}
              {marqueeApps.map((app) => (
                <ApplicationCard key={`dup-${app.name}`} app={app} isDuplicate />
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 5: WHY ASTERRA (FEATURE / BENEFIT SECTION) */}
        <section id="keunggulan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Standar Kualitas & Layanan
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Kenapa Asterra?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Enam komitmen utama yang menjadikan Asterra Store pilihan ribuan kreator, mahasiswa,
              dan profesional di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5">
            {/* 1. Produk Terverifikasi */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Produk Terverifikasi</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Setiap layanan memiliki informasi lisensi, durasi masa aktif, dan ketentuan garansi yang
                tercantum jelas dan transparan.
              </p>
            </div>

            {/* 2. Aktivasi Cepat */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Aktivasi Cepat</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Alur pemrosesan pesanan otomatis terintegrasi. Anda mendapatkan akses kerja siap pakai
                dalam 1 hingga 15 menit.
              </p>
            </div>

            {/* 3. Pilihan Lengkap */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Pilihan Lengkap</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Dari asisten AI, software desain, video editing, hingga hiburan streaming premium
                semuanya tersedia dalam satu platform.
              </p>
            </div>

            {/* 4. Pembayaran Praktis */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Pembayaran Praktis</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Dukungan gateway pembayaran terpadu melalui QRIS real-time, dompet digital e-Wallet,
                serta Virtual Account bank resmi.
              </p>
            </div>

            {/* 5. Garansi Jelas */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Garansi Jelas</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Klaim garansi mudah dan transparan. Jika terjadi kendala akses sebelum masa aktif
                berakhir, kami sediakan penggantian unit 100%.
              </p>
            </div>

            {/* 6. Customer Support */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-2 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-9 h-9 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Customer Support</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Tim bantuan profesional siap merespons kebutuhan dan pertanyaan teknis Anda melalui
                saluran WhatsApp resmi Asterra Store.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 6: HOW IT WORKS (Cara Pemesanan) */}
        <section id="panduan" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl mb-6">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Panduan Transaksi
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Cara Pemesanan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Empat langkah praktis untuk mendapatkan lisensi digital premium Anda tanpa ribet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4.5">
            {/* Step 01 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    01
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1">
                  Pilih Aplikasi
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Tentukan aplikasi atau tools digital yang ingin Anda gunakan dari katalog Asterra.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    02
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1">
                  Pilih Produk
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Pilih paket durasi masa aktif dan jenis lisensi (Private/Sharing) sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    03
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1">
                  Lakukan Pembayaran
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Scan kode QRIS instan atau bayar via Virtual Account tanpa perlu unggah bukti manual.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#C96F55]/40 font-mono">
                    04
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55]">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1">
                  Terima Aktivasi
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Kredensial atau tautan ruang kerja dikirimkan ke email Anda dan tercatat di menu pesanan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: FAQ (Pertanyaan yang Sering Ditanyakan) */}
        <section id="faq" className="mb-10 sm:mb-14 pt-6 sm:pt-8 border-t border-[rgba(18,26,42,0.08)]">
          <div className="max-w-2xl mb-6">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C96F55] uppercase tracking-wider mb-1">
              <CircleHelp className="w-3.5 h-3.5" />
              <span>Bantuan & Panduan</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#121A2A] tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-0.5 leading-relaxed">
              Jawaban seputar layanan, garansi, proses aktivasi, dan pembayaran di Asterra Store.
            </p>
          </div>

          <div className="space-y-2.5 max-w-4xl">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-3.5 sm:p-4 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                      {faq.q}
                    </span>
                    <span className="w-6 h-6 rounded-md bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-[#C96F55]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-3.5 sm:px-4 pb-4 pt-1 text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed border-t border-[rgba(18,26,42,0.06)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="mb-6 sm:mb-8 p-5 sm:p-8 bg-[#121A2A] text-[#F7F5EF] rounded-2xl border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="space-y-1 max-w-xl">
            <h3 className="text-base sm:text-xl lg:text-2xl font-black text-[#F7F5EF] tracking-tight">
              Siap menemukan layanan digital yang kamu butuhkan?
            </h3>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/70 leading-relaxed">
              Jelajahi seluruh katalog Asterra Store dengan konfirmasi otomatis dan garansi penggantian penuh.
            </p>
          </div>

          <Link href="/products">
            <Button className="h-10 sm:h-11 px-5 sm:px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold text-xs sm:text-sm gap-2 shrink-0 active:scale-95 transition-all">
              <span>Jelajahi Produk</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* SECTION 9: Footer */}
      <Footer onNotify={showNotification} />
    </div>
  );
}
