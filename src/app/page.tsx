'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShoppingCart,
  Check,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Layers,
  Search,
  RefreshCw,
  Headphones,
  ArrowRight,
  Package,
  UserCheck,
  Award,
} from 'lucide-react';
import { useCartStore } from '@/store/use-cart-store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProductItem } from '@/lib/products-data';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const { items: cartItems, addItem, removeItem } = useCartStore();

  // Dynamic products fetched from VIP Reseller via /api/v1/products (ZERO hardcoded items)
  const {
    data: catalogResponse,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
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

  // Dynamically extract categories from live fetched catalog
  const categories = useMemo(() => {
    const set = new Set<string>(['all']);
    allProducts.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [allProducts]);

  // In-memory filter to prevent spamming requests
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (selectedCategory !== 'all') {
      list = list.filter(
        (p) =>
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category?.id?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.features && p.features.some((f) => f.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [allProducts, selectedCategory, searchQuery]);

  const handleAddToCart = (product: ProductItem) => {
    const isOutOfStock =
      (product.stock !== undefined && product.stock <= 0) ||
      product.providerStatus === 'empty' ||
      product.status === 'out_of_stock';

    if (isOutOfStock) {
      showNotification(`Maaf, stok ${product.name} sedang habis.`);
      return;
    }

    const isAlreadyInCart = cartItems.some((item) => item.id === product.id);
    if (isAlreadyInCart) {
      removeItem(product.id);
      showNotification(`${product.name} dihapus dari keranjang pesanan.`);
    } else {
      addItem({
        id: product.id,
        name: product.name,
        category: product.category.name,
        priceFormatted: product.priceFormatted,
        priceNumeric: product.price,
        stock: product.stock,
        isOutOfStock: false,
      });
      showNotification(`${product.name} berhasil ditambahkan ke keranjang pesanan!`);
    }
  };

  const showNotification = (message: string) => {
    setActiveNotification(message);
    setTimeout(() => {
      setActiveNotification(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#121A2A] flex flex-col selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#121A2A] border border-white/15 text-[#F7F5EF] px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Header onNotify={showNotification} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Hero Section */}
        <section className="mb-14 sm:mb-18">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[rgba(201,111,85,0.25)] bg-[rgba(201,111,85,0.08)] text-xs font-semibold text-[#C96F55]">
                <Zap className="w-3.5 h-3.5 text-[#C96F55]" />
                <span>Aktivasi Instan & Bergaransi 100%</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#121A2A] leading-[1.15]">
                Solusi Terpercaya Produk &<br />
                <span className="text-[#C96F55]">Layanan Digital Premium</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-[#121A2A]/70 max-w-2xl leading-relaxed">
                Dapatkan akses langganan resmi untuk tool AI, software desain, voucher, dan layanan
                digital lainnya tanpa kartu kredit dengan konfirmasi instan.
              </p>
            </div>

            {/* Right Graphic: Elegant Subtle Asterra Planet & Orbit Visual */}
            <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 items-center justify-end relative select-none">
              <div className="relative w-72 h-64 flex items-center justify-center">
                {/* Subtle orbital SVG background rings */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  viewBox="0 0 280 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Outer subtle orbital ring */}
                  <ellipse
                    cx="140"
                    cy="125"
                    rx="125"
                    ry="62"
                    transform="rotate(-15 140 125)"
                    stroke="rgba(18, 26, 42, 0.08)"
                    strokeWidth="1.2"
                    strokeDasharray="4 6"
                  />
                  {/* Inner subtle orbital ring */}
                  <ellipse
                    cx="140"
                    cy="125"
                    rx="95"
                    ry="46"
                    transform="rotate(-15 140 125)"
                    stroke="rgba(201, 111, 85, 0.16)"
                    strokeWidth="1"
                  />
                </svg>

                {/* Soft ambient radial blur */}
                <div className="absolute w-44 h-44 rounded-full bg-[rgba(201,111,85,0.06)] blur-2xl pointer-events-none" />

                {/* Official Asterra Planet Mark Asset */}
                <div className="relative z-10 w-44 h-36 flex items-center justify-center transition-transform hover:scale-105 duration-300">
                  <Image
                    src="/images/brand/asterra-mark.png"
                    alt="Asterra Planet Mark"
                    width={222}
                    height={155}
                    className="w-full h-auto object-contain filter drop-shadow-[0_8px_16px_rgba(18,26,42,0.08)]"
                    priority
                  />
                </div>

                {/* Editorial subtle floating badge */}
                <div className="absolute bottom-2 right-2 z-20 bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.08)] px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C96F55] animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#121A2A]">Garansi Resmi 100%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics / Trust Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 pt-8 border-t border-[rgba(18,26,42,0.1)]">
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#121A2A] text-sm">100% Legal & Bergaransi</p>
                <p className="text-[#121A2A]/60">Jaminan penggantian penuh</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:border-l sm:border-[rgba(18,26,42,0.1)] sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#121A2A] text-sm">Proses Cepat & Otomatis</p>
                <p className="text-[#121A2A]/60">Aktivasi hitungan menit</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:border-l sm:border-[rgba(18,26,42,0.1)] sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-[#C96F55]" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-[#121A2A] text-sm">Multi-Metode Pembayaran</p>
                <p className="text-[#121A2A]/60">QRIS, E-Wallet, Virtual Account</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-[#121A2A] text-[#F7F5EF] shadow-xs'
                      : 'bg-transparent text-[#121A2A] border border-[rgba(18,26,42,0.12)] hover:border-[#121A2A] hover:bg-white/60'
                  }`}
                >
                  {cat === 'all' ? 'Semua Katalog' : cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#121A2A]/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari produk digital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[rgba(18,26,42,0.12)] rounded-lg pl-10 pr-4 py-2 text-xs text-[#121A2A] placeholder:text-[#121A2A]/40 focus:outline-none focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/20 transition-all shadow-xs"
            />
          </div>
        </section>

        {/* Product Catalog Grid */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-20 h-4 bg-[rgba(18,26,42,0.06)] rounded" />
                  <div className="w-3/4 h-5 bg-[rgba(18,26,42,0.06)] rounded" />
                  <div className="w-full h-32 bg-[rgba(18,26,42,0.06)] rounded-xl" />
                </div>
                <div className="w-full h-9 bg-[rgba(18,26,42,0.06)] rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product, idx) => {
              const isSelected = cartItems.some((item) => item.id === product.id);
              const isOutOfStock =
                (product.stock !== undefined && product.stock <= 0) ||
                product.providerStatus === 'empty' ||
                product.status === 'out_of_stock';

              return (
                <Card
                  key={product.id}
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl shadow-card hover:shadow-card-hover hover:border-[rgba(18,26,42,0.18)] transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Badges */}
                    <div className="p-4 pb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F7F5EF] text-[#121A2A]/70 border border-[rgba(18,26,42,0.08)] truncate">
                        {product.category.name}
                      </span>
                      {product.popular && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[rgba(201,111,85,0.08)] text-[#C96F55] border border-[rgba(201,111,85,0.25)] shrink-0">
                          Populer
                        </span>
                      )}
                    </div>

                    {/* Product Title & Description */}
                    <div className="px-4 pb-2">
                      <Link
                        href={`/products/${product.id}`}
                        prefetch={true}
                        className="block font-bold text-sm sm:text-base text-[#121A2A] group-hover:text-[#C96F55] transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-[#121A2A]/65 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Product Image Banner */}
                    {product.imageUrl && (
                      <div className="relative h-28 sm:h-32 mx-4 my-2 rounded-xl bg-[#F7F5EF] border border-[rgba(18,26,42,0.08)] overflow-hidden">
                        <Link href={`/products/${product.id}`} prefetch={true} className="block w-full h-full">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            fetchPriority={idx < 4 ? 'high' : 'auto'}
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-[#121A2A]/70 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#F7F5EF] bg-status-error/90 px-2.5 py-0.5 rounded">
                              Stok Habis
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trust / Features Pills */}
                    <div className="px-4 pt-1 pb-2 flex items-center justify-between text-[10px] text-[#121A2A]/60 border-t border-[rgba(18,26,42,0.06)] mx-4">
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-[#121A2A]/40" />
                        <span>Akun Resmi</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 text-[#C96F55]" />
                        <span>Aktivasi Instan</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3 h-3 text-[#121A2A]/40" />
                        <span>Garansi</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Price, Select Button & Circular Arrow */}
                  <div className="p-4 pt-3 border-t border-[rgba(18,26,42,0.08)] flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[#121A2A]/50 uppercase font-semibold tracking-wider leading-none">
                        Mulai dari
                      </p>
                      <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#121A2A] block truncate">
                        {product.priceFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
                        className={`h-8 sm:h-9 px-3 text-xs font-semibold rounded-lg ${
                          isSelected ? 'bg-[rgba(201,111,85,0.1)] text-[#C96F55] border border-[rgba(201,111,85,0.3)]' : ''
                        }`}
                        disabled={isOutOfStock}
                        onClick={() => !isOutOfStock && handleAddToCart(product)}
                      >
                        {isOutOfStock ? (
                          'Habis'
                        ) : isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#C96F55] mr-1" />
                            <span>Dipilih</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                            <span>Pilih</span>
                          </>
                        )}
                      </Button>

                      <Link href={`/products/${product.id}`} prefetch={true}>
                        <button
                          type="button"
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#121A2A] text-[#F7F5EF] flex items-center justify-center hover:bg-[#C96F55] transition-colors shadow-xs cursor-pointer"
                          aria-label={`Detail ${product.name}`}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>
        ) : (
          <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <Package className="w-12 h-12 text-[#121A2A]/30 mx-auto" />
            <h3 className="text-base font-bold text-[#121A2A]">
              {allProducts.length === 0
                ? 'Katalog Produk Sedang Dimuat'
                : 'Tidak Ada Produk Ditemukan'}
            </h3>
            <p className="text-xs text-[#121A2A]/60 max-w-md mx-auto">
              {allProducts.length === 0
                ? 'Katalog produk sedang dalam sinkronisasi sistem. Silakan klik tombol di bawah untuk memuat ulang.'
                : 'Tidak ada produk yang cocok dengan kata kunci atau kategori yang Anda pilih.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProducts()}
                className="gap-2 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Katalog</span>
              </Button>
              {allProducts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="rounded-lg"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Section Keunggulan */}
        <section id="keunggulan" className="mt-20 sm:mt-24 pt-12 border-t border-[rgba(18,26,42,0.1)]">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-2">
              Standar Layanan & Komitmen
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#121A2A]">
              Mengapa Ribuan Kreator & Profesional Memilih Asterra
            </h2>
            <p className="text-sm text-[#121A2A]/70 mt-2 leading-relaxed">
              Kami menghadirkan pengalaman berlangganan perangkat digital premium yang transparan,
              legal, dan terlindungi penuh tanpa resiko akun ditutup sepihak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#121A2A]">
                100% Legal & Private Workspace
              </h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Bukan akun bajakan atau akun publik yang dipakai bersama orang asing. Anda mendapatkan
                akses privat ke ruang kerja akun resmi dengan keamanan data terjamin.
              </p>
            </div>

            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#121A2A]">
                Aktivasi Instan & Konfirmasi Otomatis
              </h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Didukung sistem payment gateway otomatis via QRIS dan Virtual Account. Tanpa perlu kirim
                bukti struk manual, status pesanan terverifikasi seketika dalam hitungan menit.
              </p>
            </div>

            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#121A2A]">
                Garansi Penggantian Penuh 100%
              </h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Ketenangan Anda adalah prioritas kami. Jika terjadi kendala akses sebelum masa langganan
                berakhir, tim teknis kami akan memberikan penggantian unit lisensi baru tanpa biaya tambahan.
              </p>
            </div>

            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#121A2A]">
                Dukungan Pelanggan Siap Melayani 24 Jam
              </h3>
              <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                Mengalami kesulitan saat login atau setup akun? Tim customer service profesional kami
                siap memandu Anda langkah demi langkah langsung melalui WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Section Cara Pemesanan */}
        <section id="panduan" className="mt-20 sm:mt-24 pt-12 border-t border-[rgba(18,26,42,0.1)]">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-2">
              Panduan Transaksi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#121A2A]">
              4 Langkah Mudah Berlangganan di Asterra Store
            </h2>
            <p className="text-sm text-[#121A2A]/70 mt-2 leading-relaxed">
              Alur pemesanan dirancang sesederhana mungkin agar Anda bisa langsung fokus bekerja dan
              berkarya tanpa prosedur verifikasi yang berbelit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-[#C96F55]/40 font-mono block mb-3">
                  01
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-2">
                  Pilih Lisensi Digital
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Pilih produk dari katalog resmi kami dan tentukan paket serta durasi layanan yang Anda inginkan.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-[#C96F55]/40 font-mono block mb-3">
                  02
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-2">
                  Lengkapi Data Akun
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Isi formulir checkout dengan email aktif Anda untuk tujuan aktivasi lisensi resmi dan nomor WhatsApp untuk notifikasi kilat.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-[#C96F55]/40 font-mono block mb-3">
                  03
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-2">
                  Selesaikan Pembayaran
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Pindai QRIS menggunakan e-wallet (GoPay, OVO, Dana) atau m-Banking Anda. Sistem akan memverifikasi pelunasan secara real-time.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 flex flex-col justify-between hover:border-[rgba(18,26,42,0.18)] hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-[#C96F55]/40 font-mono block mb-3">
                  04
                </span>
                <h3 className="text-sm font-bold text-[#121A2A] mb-2">
                  Akses Lisensi Siap Pakai
                </h3>
                <p className="text-xs text-[#121A2A]/65 leading-relaxed">
                  Undangan ruang kerja atau kredensial akun langsung aktif. Anda dapat memantau status lisensi di menu Pesanan Saya.
                </p>
              </div>
            </div>
          </div>

          {/* Quick CTA Banner */}
          <div className="mt-10 p-6 sm:p-8 bg-[#121A2A] text-[#F7F5EF] rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-editorial">
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-[#F7F5EF]">
                Siap Meningkatkan Produktivitas Anda Hari Ini?
              </h3>
              <p className="text-xs text-[#F7F5EF]/70">
                Jelajahi seluruh lisensi aplikasi kerja, AI, dan platform kreatif di katalog kami.
              </p>
            </div>
            <Link href="/products">
              <Button className="gap-2 shrink-0 rounded-lg px-5 h-10 bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] font-semibold">
                <span>Eksplorasi Katalog Lengkap</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Modular Footer */}
      <Footer onNotify={showNotification} />
    </div>
  );
}
