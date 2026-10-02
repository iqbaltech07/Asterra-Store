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
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductItem } from '@/lib/products-data';

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

  // Dynamically group products by Application / Brand
  const applicationGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        slug: string;
        category: string;
        items: ProductItem[];
        sampleImage?: string;
      }
    >();

    allProducts.forEach((p) => {
      const n = p.name.toLowerCase();
      let name = 'Lainnya';
      let slug = 'all';
      let cat = p.category?.name || 'Digital Service';

      if (n.includes('gemini') || n.includes('google ai')) {
        name = 'Google Gemini';
        slug = 'gemini';
        cat = 'AI Assistant & Cloud';
      } else if (n.includes('chatgpt')) {
        name = 'ChatGPT';
        slug = 'chatgpt';
        cat = 'AI Assistant & Writing';
      } else if (n.includes('canva')) {
        name = 'Canva';
        slug = 'canva';
        cat = 'Design & Kreatif';
      } else if (n.includes('capcut')) {
        name = 'CapCut';
        slug = 'capcut';
        cat = 'Video Editing & Content';
      } else if (n.includes('alight motion') || n.includes('alightmotion')) {
        name = 'Alight Motion';
        slug = 'alight';
        cat = 'Motion Graphic & VFX';
      } else if (n.includes('youtube')) {
        name = 'YouTube';
        slug = 'youtube';
        cat = 'Streaming & Video';
      } else if (n.includes('spotify')) {
        name = 'Spotify';
        slug = 'spotify';
        cat = 'Music Streaming';
      } else if (n.includes('netflix')) {
        name = 'Netflix';
        slug = 'netflix';
        cat = 'Movies & Series';
      } else if (n.includes('disney')) {
        name = 'Disney+ Hotstar';
        slug = 'disney';
        cat = 'Entertainment & Movies';
      } else if (n.includes('prime') || n.includes('amazon')) {
        name = 'Prime Video';
        slug = 'prime';
        cat = 'Entertainment & Movies';
      } else if (n.includes('vidi')) {
        name = 'Vidio';
        slug = 'vidio';
        cat = 'Sports & TV Streaming';
      } else if (n.includes('wetv')) {
        name = 'WeTV';
        slug = 'wetv';
        cat = 'Asian Drama & Anime';
      } else if (n.includes('iqiyi')) {
        name = 'iQIYI';
        slug = 'iqiyi';
        cat = 'Drama & Anime Streaming';
      } else if (n.includes('bstation') || n.includes('bilibili')) {
        name = 'Bstation';
        slug = 'bstation';
        cat = 'Anime & Creator Community';
      } else if (n.includes('viu')) {
        name = 'Viu';
        slug = 'viu';
        cat = 'Asian Drama & Variety';
      } else {
        const firstWord = p.name.split(' ')[0];
        name = firstWord;
        slug = firstWord.toLowerCase();
      }

      if (!map.has(name)) {
        map.set(name, {
          name,
          slug,
          category: cat,
          items: [],
          sampleImage: p.imageUrl,
        });
      }
      const entry = map.get(name)!;
      entry.items.push(p);
      if (!entry.sampleImage && p.imageUrl) {
        entry.sampleImage = p.imageUrl;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [allProducts]);

  // Featured 4 applications for asymmetric editorial showcase
  const featuredApps = useMemo(() => {
    const preferredOrder = ['CapCut', 'Google Gemini', 'Canva', 'ChatGPT'];
    const selected = preferredOrder
      .map((name) => applicationGroups.find((app) => app.name.toLowerCase().includes(name.toLowerCase())))
      .filter(Boolean) as typeof applicationGroups;

    // Fill up to 4 if any are missing
    if (selected.length < 4) {
      applicationGroups.forEach((app) => {
        if (!selected.includes(app) && selected.length < 4) {
          selected.push(app);
        }
      });
    }
    return selected;
  }, [applicationGroups]);

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
    <div className="min-h-screen bg-[#F7F5EF] text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121A2A] border border-white/15 text-[#F7F5EF] px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* SECTION 1: Header Navigation */}
      <Header onNotify={showNotification} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full overflow-hidden">
        {/* SECTION 2: Hero Section (with Significantly Larger Planet Visual Anchor) */}
        <section className="mb-14 sm:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Column: Contextual Tag, Headline, Subheadline & CTAs */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Contextual Tag (No Pill Badge) */}
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-[#C96F55]">
                <span>AKTIVASI INSTAN</span>
                <span className="text-sm leading-none">·</span>
                <span>GARANSI RESMI 100%</span>
              </div>

              {/* Editorial Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#121A2A] leading-[1.12]">
                Solusi Terpercaya Produk &<br />
                <span className="text-[#C96F55]">Layanan Digital Premium</span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base lg:text-lg text-[#121A2A]/70 max-w-2xl leading-relaxed">
                Akses layanan digital premium untuk kebutuhan AI, desain, video, produktivitas, dan
                hiburan tanpa kartu kredit dengan konfirmasi pembayaran otomatis dan jaminan garansi penuh.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/products">
                  <Button className="h-11 sm:h-12 px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold shadow-sm gap-2 text-xs sm:text-sm active:scale-95 transition-all">
                    <span>Jelajahi Produk</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <a href="#panduan">
                  <Button
                    variant="outline"
                    className="h-11 sm:h-12 px-5 rounded-xl border-[rgba(18,26,42,0.18)] bg-white/70 hover:bg-white text-[#121A2A] font-semibold text-xs sm:text-sm transition-all"
                  >
                    <span>Lihat Cara Kerja</span>
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: LARGE ASTERRA PLANET (420-520px Desktop Visual Anchor) */}
            <div className="flex justify-center lg:justify-end lg:col-span-5 items-center relative select-none mt-4 lg:mt-0">
              <div className="relative w-[280px] h-[240px] sm:w-[380px] sm:h-[320px] lg:w-[480px] lg:h-[400px] flex items-center justify-center">
                {/* Subtle SVG Orbital Background */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                  viewBox="0 0 500 420"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse
                    cx="250"
                    cy="210"
                    rx="220"
                    ry="110"
                    transform="rotate(-12 250 210)"
                    stroke="rgba(18, 26, 42, 0.09)"
                    strokeWidth="1.5"
                    strokeDasharray="5 7"
                  />
                  <ellipse
                    cx="250"
                    cy="210"
                    rx="170"
                    ry="85"
                    transform="rotate(-12 250 210)"
                    stroke="rgba(201, 111, 85, 0.22)"
                    strokeWidth="1.2"
                  />
                </svg>

                {/* Ambient Soft Glow */}
                <div className="absolute w-56 h-56 sm:w-72 sm:h-72 lg:w-96 lg:h-96 rounded-full bg-[rgba(201,111,85,0.08)] blur-3xl pointer-events-none" />

                {/* Large Asterra Planet Mark Asset */}
                <div className="relative z-10 w-52 sm:w-72 lg:w-[340px] flex items-center justify-center transition-transform hover:scale-104 duration-300">
                  <Image
                    src="/images/brand/asterra-mark.png"
                    alt="Asterra Planet Mark"
                    width={420}
                    height={290}
                    className="w-full h-auto object-contain filter drop-shadow-[0_16px_32px_rgba(18,26,42,0.12)]"
                    priority
                  />
                </div>

                {/* Floating Micro-Badge */}
                <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 z-20 bg-white/95 border border-[rgba(18,26,42,0.1)] px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C96F55] animate-pulse" />
                  <span className="text-[11px] font-bold text-[#121A2A]">Garansi Resmi 100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Trust / Benefits (3 Columns with Vertical Dividers on Desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 mt-10 sm:mt-14 pt-8 border-t border-[rgba(18,26,42,0.1)]">
            {/* Benefit 1 */}
            <div className="flex items-start gap-4 p-2 sm:pr-6">
              <div className="w-11 h-11 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#121A2A] text-sm">100% Legal & Bergaransi</h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Jaminan penggantian lisensi penuh jika terjadi kendala pada masa aktif.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-4 p-2 sm:px-6 sm:border-l sm:border-[rgba(18,26,42,0.1)]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#121A2A] text-sm">Proses Cepat & Otomatis</h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Aktivasi instan tanpa proses berbelit dalam hitungan 1–15 menit.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-4 p-2 sm:pl-6 sm:border-l sm:border-[rgba(18,26,42,0.1)]">
              <div className="w-11 h-11 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="space-y-0.5">
                <h3 className="font-bold text-[#121A2A] text-sm">Pembayaran Mudah & Praktis</h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Dukung QRIS instan, GoPay, OVO, Dana, hingga Virtual Account.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: EXPLORE BY APPLICATION (THE MOST IMPORTANT SECTION) */}
        <section id="aplikasi" className="mb-16 sm:mb-24">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 pb-4 border-b border-[rgba(18,26,42,0.1)]">
            <div>
              <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
                Katalog Aplikasi Digital
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
                Jelajahi Layanan Digital
              </h2>
              <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-1">
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

          {/* Dynamic Application Cards Grid (2 cols mobile, 3-4 cols desktop) */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-5 h-36 animate-pulse flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-[rgba(18,26,42,0.08)] rounded-xl" />
                    <div className="w-24 h-4 bg-[rgba(18,26,42,0.08)] rounded" />
                  </div>
                  <div className="w-16 h-3 bg-[rgba(18,26,42,0.06)] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {applicationGroups.map((app) => (
                <Link
                  key={app.name}
                  href={`/products?search=${encodeURIComponent(app.name)}`}
                  className="group bg-white border border-[rgba(18,26,42,0.08)] hover:border-[#C96F55]/50 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    {/* App Header: Brand / Representative Avatar */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#121A2A]/5 border border-[rgba(18,26,42,0.08)] flex items-center justify-center overflow-hidden">
                        {app.sampleImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={app.sampleImage}
                            alt={app.name}
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                          />
                        ) : (
                          <Layers className="w-5 h-5 text-[#C96F55]" />
                        )}
                      </div>

                      <span className="text-[10px] font-semibold text-[#121A2A]/50 bg-[#F7F5EF] px-2 py-0.5 rounded-md border border-[rgba(18,26,42,0.06)]">
                        {app.items.length} Produk
                      </span>
                    </div>

                    {/* App Name & Category */}
                    <h3 className="font-extrabold text-sm sm:text-base text-[#121A2A] group-hover:text-[#C96F55] transition-colors truncate">
                      {app.name}
                    </h3>
                    <p className="text-[11px] text-[#121A2A]/60 truncate mt-0.5">
                      {app.category}
                    </p>
                  </div>

                  {/* Action Link with Arrow */}
                  <div className="pt-3 mt-3 border-t border-[rgba(18,26,42,0.06)] flex items-center justify-between text-xs font-semibold text-[#121A2A]/80 group-hover:text-[#C96F55] transition-colors">
                    <span className="text-[11px] sm:text-xs">Lihat Produk</span>
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* SECTION 5: FEATURED APPLICATIONS (Editorial Asymmetric Showcase) */}
        {featuredApps.length > 0 && (
          <section className="mb-16 sm:mb-24">
            <div className="mb-6">
              <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
                Paling Diminati Kreator
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
                Aplikasi Unggulan Pilihan
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredApps.map((app, idx) => (
                <div
                  key={app.name}
                  className={`bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all ${
                    idx === 0 ? 'bg-gradient-to-b from-white to-[#F7F5EF]/60' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#C96F55]">
                        0{idx + 1}
                      </span>
                      <span className="text-[10px] text-[#121A2A]/50">
                        {app.items.length} varian paket
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-[#121A2A]">{app.name}</h3>
                    <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                      Layanan premium resmi {app.name} dengan aktivasi instan dan jaminan garansi penuh selama masa aktif.
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-[rgba(18,26,42,0.08)]">
                    <Link
                      href={`/products?search=${encodeURIComponent(app.name)}`}
                      className="text-xs font-bold text-[#121A2A] hover:text-[#C96F55] inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Eksplorasi Varian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 6: WHY ASTERRA (6 Contextual Benefits) */}
        <section id="keunggulan" className="mb-16 sm:mb-24 pt-8 border-t border-[rgba(18,26,42,0.1)]">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Standar Kualitas & Layanan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
              Kenapa Asterra?
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-1 leading-relaxed">
              Enam komitmen utama yang menjadikan Asterra Store pilihan ribuan kreator, mahasiswa,
              dan profesional di seluruh Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Produk Terverifikasi */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Produk Terverifikasi</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Setiap layanan memiliki informasi lisensi, durasi masa aktif, dan ketentuan garansi yang
                tercantum jelas dan transparan.
              </p>
            </div>

            {/* 2. Aktivasi Cepat */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Aktivasi Cepat</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Alur pemrosesan pesanan otomatis terintegrasi. Anda mendapatkan akses kerja siap pakai
                dalam 1 hingga 15 menit.
              </p>
            </div>

            {/* 3. Pilihan Lengkap */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Pilihan Lengkap</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Dari asisten AI, software desain, video editing, hingga hiburan streaming premium
                semuanya tersedia dalam satu platform.
              </p>
            </div>

            {/* 4. Pembayaran Praktis */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Pembayaran Praktis</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Dukungan gateway pembayaran terpadu melalui QRIS real-time, dompet digital e-Wallet,
                serta Virtual Account bank resmi.
              </p>
            </div>

            {/* 5. Garansi Jelas */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Garansi Jelas</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Klaim garansi mudah dan transparan. Jika terjadi kendala akses sebelum masa aktif
                berakhir, kami sediakan penggantian unit 100%.
              </p>
            </div>

            {/* 6. Customer Support */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-2.5 hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#121A2A]">Customer Support</h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Tim bantuan profesional siap merespons kebutuhan dan pertanyaan teknis Anda melalui
                saluran WhatsApp resmi Asterra Store.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 7: HOW IT WORKS (Cara Pemesanan) */}
        <section id="panduan" className="mb-16 sm:mb-24 pt-8 border-t border-[rgba(18,26,42,0.1)]">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Panduan Transaksi
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
              Cara Pemesanan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-1 leading-relaxed">
              Empat langkah praktis untuk mendapatkan lisensi digital premium Anda tanpa ribet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Step 01 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <span className="text-3xl font-black text-[#C96F55]/40 font-mono block mb-2">
                  01
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1.5">
                  Pilih Aplikasi
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Tentukan aplikasi atau tools digital yang ingin Anda gunakan dari katalog Asterra.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <span className="text-3xl font-black text-[#C96F55]/40 font-mono block mb-2">
                  02
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1.5">
                  Pilih Produk
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Pilih paket durasi masa aktif dan jenis lisensi (Private/Sharing) sesuai kebutuhan.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <span className="text-3xl font-black text-[#C96F55]/40 font-mono block mb-2">
                  03
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1.5">
                  Lakukan Pembayaran
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Scan kode QRIS instan atau bayar via Virtual Account tanpa perlu unggah bukti manual.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.2)] transition-all">
              <div>
                <span className="text-3xl font-black text-[#C96F55]/40 font-mono block mb-2">
                  04
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-1.5">
                  Terima Aktivasi
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Kredensial atau tautan ruang kerja dikirimkan ke email Anda dan tercatat di menu pesanan.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FAQ (Pertanyaan yang Sering Ditanyakan) */}
        <section id="faq" className="mb-16 sm:mb-24 pt-8 border-t border-[rgba(18,26,42,0.1)]">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
              Bantuan & Panduan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#121A2A] tracking-tight">
              Pertanyaan yang Sering Ditanyakan
            </h2>
            <p className="text-xs sm:text-sm text-[#121A2A]/65 mt-1 leading-relaxed">
              Jawaban seputar layanan, garansi, proses aktivasi, dan pembayaran di Asterra Store.
            </p>
          </div>

          <div className="space-y-3 max-w-4xl">
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
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                      {faq.q}
                    </span>
                    <span className="w-7 h-7 rounded-lg bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 text-[#C96F55]" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-[#121A2A]/70 leading-relaxed border-t border-[rgba(18,26,42,0.06)]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 9: FINAL CTA */}
        <section className="mb-8 p-6 sm:p-10 bg-[#121A2A] text-[#F7F5EF] rounded-2xl sm:rounded-3xl border border-white/10 shadow-editorial flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h3 className="text-lg sm:text-2xl font-black text-[#F7F5EF] tracking-tight">
              Siap menemukan layanan digital yang kamu butuhkan?
            </h3>
            <p className="text-xs sm:text-sm text-[#F7F5EF]/70 leading-relaxed">
              Jelajahi seluruh katalog Asterra Store dengan konfirmasi otomatis dan garansi penggantian penuh.
            </p>
          </div>

          <Link href="/products">
            <Button className="h-11 sm:h-12 px-6 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-bold text-xs sm:text-sm gap-2 shrink-0 active:scale-95 transition-all">
              <span>Jelajahi Produk</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </section>
      </main>

      {/* SECTION 10: Footer */}
      <Footer onNotify={showNotification} />
    </div>
  );
}
