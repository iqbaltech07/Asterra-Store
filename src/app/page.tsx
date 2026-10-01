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
    <div className="min-h-screen bg-white text-navy-900 flex flex-col selection:bg-accent/20 selection:text-accent">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-accent/40 text-navy-900 px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Header onNotify={showNotification} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        {/* Hero Section */}
        <section className="mb-12 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-8 space-y-4">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-200 bg-orange-50/80 text-xs font-semibold text-accent shadow-xs">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>Aktivasi Instan & Bergaransi 100%</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-navy-900 leading-[1.15]">
                Solusi Terpercaya Produk &<br />
                <span className="text-accent">Layanan Digital Premium</span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl leading-relaxed">
                Dapatkan akses langganan resmi untuk tool AI, software desain, voucher, dan layanan
                digital lainnya tanpa kartu kredit dengan konfirmasi instan.
              </p>
            </div>

            {/* Right Graphic: Subtle Asterra planet/orbit visual */}
            <div className="hidden lg:flex lg:col-span-4 items-center justify-end relative select-none pointer-events-none">
              <div className="relative w-64 h-60 flex items-center justify-center">
                <Image
                  src="/images/brand/hero-orbit-graphic.png"
                  alt="Asterra Orbit Visual"
                  width={250}
                  height={240}
                  className="w-full h-full object-contain drop-shadow-sm opacity-90 transition-opacity"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Quick Metrics / Trust Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-10 pt-8 border-t border-border">
            <div className="flex items-center gap-3.5 p-2">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-navy-900 text-sm">100% Legal & Bergaransi</p>
                <p className="text-slate-500">Jaminan penggantian penuh</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:border-l sm:border-border sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-navy-900 text-sm">Proses Cepat & Otomatis</p>
                <p className="text-slate-500">Aktivasi hitungan menit</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-2 sm:border-l sm:border-border sm:pl-6">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-accent" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-navy-900 text-sm">Multi-Metode Pembayaran</p>
                <p className="text-slate-500">QRIS, E-Wallet, Virtual Account</p>
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
                  className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-sm ring-1 ring-navy-900'
                      : 'bg-white text-navy-900 hover:text-accent hover:border-slate-300 border border-border shadow-xs'
                  }`}
                >
                  {cat === 'all' ? 'Semua Katalog' : cat}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari produk digital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-border rounded-full pl-10 pr-4 py-2 text-xs text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-xs"
            />
          </div>
        </section>

        {/* Product Catalog Grid */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-border rounded-2xl p-4 sm:p-5 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-20 h-4 bg-slate-100 rounded-full" />
                  <div className="w-3/4 h-5 bg-slate-100 rounded" />
                  <div className="w-full h-32 bg-slate-100 rounded-xl" />
                </div>
                <div className="w-full h-9 bg-slate-100 rounded-xl" />
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
                  className="bg-white border border-border rounded-2xl shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top: Badges */}
                    <div className="p-4 pb-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 truncate">
                        {product.category.name}
                      </span>
                      {product.popular && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-accent border border-orange-200 shrink-0">
                          Populer
                        </span>
                      )}
                    </div>

                    {/* Product Title & Description */}
                    <div className="px-4 pb-2">
                      <Link
                        href={`/products/${product.id}`}
                        prefetch={true}
                        className="block font-bold text-sm sm:text-base text-navy-900 group-hover:text-accent transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    {/* Product Image Banner */}
                    {product.imageUrl && (
                      <div className="relative h-28 sm:h-32 mx-4 my-2 rounded-xl bg-slate-50 border border-border/80 overflow-hidden">
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
                          <div className="absolute inset-0 bg-navy-950/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="text-xs font-bold text-white bg-status-error/90 px-2.5 py-0.5 rounded-full">
                              Stok Habis
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Trust / Features Pills */}
                    <div className="px-4 pt-1 pb-2 flex items-center justify-between text-[10px] text-slate-500 border-t border-border/50 mx-4">
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-slate-400" />
                        <span>Akun Resmi</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent" />
                        <span>Aktivasi Instan</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Award className="w-3 h-3 text-slate-400" />
                        <span>Garansi</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Bottom: Price, Select Button & Circular Arrow */}
                  <div className="p-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider leading-none">
                        Mulai dari
                      </p>
                      <span className="text-base sm:text-lg font-extrabold tracking-tight text-navy-900 block truncate">
                        {product.priceFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
                        className={`h-8 sm:h-9 px-3 text-xs font-semibold rounded-xl ${
                          isSelected ? 'bg-orange-50 text-accent border border-orange-200' : ''
                        }`}
                        disabled={isOutOfStock}
                        onClick={() => !isOutOfStock && handleAddToCart(product)}
                      >
                        {isOutOfStock ? (
                          'Habis'
                        ) : isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-accent mr-1" />
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
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-navy-900 text-white flex items-center justify-center hover:bg-accent transition-colors shadow-sm cursor-pointer"
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
          <div className="bg-white border border-border rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <Package className="w-12 h-12 text-slate-400 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-navy-900">
              {allProducts.length === 0
                ? 'Katalog Produk Sedang Dimuat'
                : 'Tidak Ada Produk Ditemukan'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {allProducts.length === 0
                ? 'Katalog produk sedang dalam sinkronisasi sistem. Silakan klik tombol di bawah untuk memuat ulang.'
                : 'Tidak ada produk yang cocok dengan kata kunci atau kategori yang Anda pilih.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProducts()}
                className="gap-2 rounded-xl"
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
                  className="rounded-xl"
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Section Keunggulan */}
        <section id="keunggulan" className="mt-20 sm:mt-24 pt-12 border-t border-border">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
              Standar Layanan & Komitmen
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
              Mengapa Ribuan Kreator & Profesional Memilih Asterra
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Kami menghadirkan pengalaman berlangganan perangkat digital premium yang transparan,
              legal, dan terlindungi penuh tanpa resiko akun ditutup sepihak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 hover:border-slate-300 hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">
                100% Legal & Private Workspace
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bukan akun bajakan atau akun publik yang dipakai bersama orang asing. Anda mendapatkan
                akses privat ke ruang kerja akun resmi dengan keamanan data terjamin.
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 hover:border-slate-300 hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">
                Aktivasi Instan & Konfirmasi Otomatis
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Didukung sistem payment gateway otomatis via QRIS dan Virtual Account. Tanpa perlu kirim
                bukti struk manual, status pesanan terverifikasi seketika dalam hitungan menit.
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 hover:border-slate-300 hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">
                Garansi Penggantian Penuh 100%
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ketenangan Anda adalah prioritas kami. Jika terjadi kendala akses sebelum masa langganan
                berakhir, tim teknis kami akan memberikan penggantian unit lisensi baru tanpa biaya tambahan.
              </p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 hover:border-slate-300 hover:shadow-card transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-navy-900">
                Dukungan Pelanggan Siap Melayani 24 Jam
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Mengalami kesulitan saat login atau setup akun? Tim customer service profesional kami
                siap memandu Anda langkah demi langkah langsung melalui WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Section Cara Pemesanan */}
        <section id="panduan" className="mt-20 sm:mt-24 pt-12 border-t border-border">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-bold text-accent uppercase tracking-wider block mb-2">
              Panduan Transaksi
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
              4 Langkah Mudah Berlangganan di Asterra Store
            </h2>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Alur pemesanan dirancang sesederhana mungkin agar Anda bisa langsung fokus bekerja dan
              berkarya tanpa prosedur verifikasi yang berbelit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-accent/50 font-mono block mb-3">
                  01
                </span>
                <h3 className="text-sm font-bold text-navy-900 mb-2">
                  Pilih Lisensi Digital
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih produk dari katalog resmi kami dan tentukan paket serta durasi layanan yang Anda inginkan.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-accent/50 font-mono block mb-3">
                  02
                </span>
                <h3 className="text-sm font-bold text-navy-900 mb-2">
                  Lengkapi Data Akun
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Isi formulir checkout dengan email aktif Anda untuk tujuan aktivasi lisensi resmi dan nomor WhatsApp untuk notifikasi kilat.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-accent/50 font-mono block mb-3">
                  03
                </span>
                <h3 className="text-sm font-bold text-navy-900 mb-2">
                  Selesaikan Pembayaran
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pindai QRIS menggunakan e-wallet (GoPay, OVO, Dana) atau m-Banking Anda. Sistem akan memverifikasi pelunasan secara real-time.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white border border-border rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 hover:shadow-card transition-all">
              <div>
                <span className="text-3xl font-extrabold text-accent/50 font-mono block mb-3">
                  04
                </span>
                <h3 className="text-sm font-bold text-navy-900 mb-2">
                  Akses Lisensi Siap Pakai
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Undangan ruang kerja atau kredensial akun langsung aktif. Anda dapat memantau status lisensi di menu Pesanan Saya.
                </p>
              </div>
            </div>
          </div>

          {/* Quick CTA Banner */}
          <div className="mt-10 p-6 sm:p-8 bg-gradient-to-r from-navy-900 to-navy-950 text-white rounded-2xl border border-navy-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white">
                Siap Meningkatkan Produktivitas Anda Hari Ini?
              </h3>
              <p className="text-xs text-slate-300">
                Jelajahi seluruh lisensi aplikasi kerja, AI, dan platform kreatif di katalog kami.
              </p>
            </div>
            <Link href="/products">
              <Button className="gap-2 shrink-0 rounded-xl px-5 h-10 bg-accent hover:bg-accent-hover text-white font-semibold">
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
