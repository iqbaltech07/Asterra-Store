'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  AlertTriangle,
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
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Toast Notification */}
      {activeNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-raised border border-primary/30 text-foreground px-4 py-3 rounded-card shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium">{activeNotification}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Header onNotify={showNotification} />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-surface text-xs font-medium text-foreground-muted mb-4">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Aktivasi Instan & Bergaransi 100%</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Solusi Terpercaya Produk & Layanan Digital Premium
            </h1>
            <p className="text-base sm:text-lg text-foreground-muted leading-relaxed">
              Dapatkan akses langganan resmi untuk tool AI, software desain, voucher, dan layanan
              digital lainnya tanpa kartu kredit dengan konfirmasi instan.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-status-success shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">100% Legal & Bergaransi</p>
                <p className="text-foreground-muted">Jaminan penggantian penuh</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-status-warning shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Proses Cepat & Otomatis</p>
                <p className="text-foreground-muted">Aktivasi hitungan menit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
              <Layers className="w-5 h-5 text-primary shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-foreground">Multi-Metode Pembayaran</p>
                <p className="text-foreground-muted">QRIS, E-Wallet, Virtual Account</p>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <section className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-white'
                    : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-hover border border-border'
                }`}
              >
                {cat === 'all' ? 'Semua Katalog' : cat}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari produk digital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-border rounded-input pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </section>

        {/* Product Catalog Grid */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-3 sm:p-6 h-60 sm:h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-16 sm:w-20 h-4 sm:h-5 bg-surface-raised rounded" />
                  <div className="w-3/4 h-4 sm:h-6 bg-surface-raised rounded" />
                  <div className="w-full h-8 sm:h-10 bg-surface-raised rounded" />
                </div>
                <div className="w-full h-8 sm:h-10 bg-surface-raised rounded" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {filteredProducts.map((product, idx) => {
              const isSelected = cartItems.some((item) => item.id === product.id);
              const isOutOfStock =
                (product.stock !== undefined && product.stock <= 0) ||
                product.providerStatus === 'empty' ||
                product.status === 'out_of_stock';

              return (
                <Card
                  key={product.id}
                  className="flex flex-col justify-between hover:border-primary/40 transition-colors overflow-hidden group"
                >
                  {product.imageUrl ? (
                    <div className="relative h-28 sm:h-44 w-full bg-surface-raised overflow-hidden border-b border-border">
                      <Link href={`/products/${product.id}`} prefetch={true} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading={idx < 3 ? 'eager' : 'lazy'}
                          fetchPriority={idx < 3 ? 'high' : 'auto'}
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-1.5 flex-wrap pointer-events-none">
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-background/85 backdrop-blur-sm border-border py-0 px-1.5 sm:px-2">
                          {product.category.name}
                        </Badge>
                        {product.popular && (
                          <Badge variant="success" className="text-[9px] sm:text-[10px] py-0 px-1.5 sm:px-2">
                            Laris
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-[9px] sm:text-[10px] bg-status-error text-white font-semibold py-0 px-1.5 sm:px-2">
                            Habis
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <CardHeader className={`p-2.5 sm:p-6 pb-1 sm:pb-3 ${product.imageUrl ? 'pt-2.5 sm:pt-4' : ''}`}>
                    <CardTitle className="text-xs sm:text-xl line-clamp-2">
                      <Link
                        href={`/products/${product.id}`}
                        prefetch={true}
                        className="hover:text-primary transition-colors"
                      >
                        {product.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs line-clamp-1 sm:line-clamp-2 mt-1">
                      {product.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-2.5 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm sm:text-2xl font-bold tracking-tight text-foreground">
                        {product.priceFormatted}
                      </span>
                      <span className="text-[10px] sm:text-xs text-foreground-muted">/ bln</span>
                    </div>

                    <ul className="space-y-1.5 pt-2 border-t border-border hidden sm:block">
                      {product.features.slice(0, 3).map((feature, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-center gap-2 text-xs text-foreground-muted"
                        >
                          <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
                          <span className="truncate">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-2.5 sm:p-6 pt-2 flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                    <Button
                      variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
                      className={`w-full sm:flex-1 h-7 sm:h-9 text-[11px] sm:text-xs gap-1 sm:gap-2 ${
                        isOutOfStock
                          ? 'border-status-error/30 text-status-error bg-status-error/5 cursor-not-allowed opacity-80'
                          : ''
                      }`}
                      disabled={isOutOfStock}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                      title={isOutOfStock ? 'Stok produk saat ini habis' : undefined}
                    >
                      {isOutOfStock ? (
                        <>
                          <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-status-error" />
                          <span>Stok Habis</span>
                        </>
                      ) : isSelected ? (
                        <>
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-status-success" />
                          <span>Dipilih</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>Pilih</span>
                        </>
                      )}
                    </Button>
                    <Link href={`/products/${product.id}`} prefetch={true} className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto h-7 sm:h-9 px-2 sm:px-3 text-[11px] sm:text-xs" title="Detail Produk">
                        <span className="sm:hidden">Lihat Detail</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </section>
        ) : (
          <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-4">
            <Package className="w-12 h-12 text-foreground-muted mx-auto opacity-50" />
            <h3 className="text-base font-semibold text-foreground">
              {allProducts.length === 0
                ? 'Katalog Produk Sedang Dimuat'
                : 'Tidak Ada Produk Ditemukan'}
            </h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {allProducts.length === 0
                ? 'Katalog produk sedang dalam sinkronisasi sistem. Silakan klik tombol di bawah untuk memuat ulang.'
                : 'Tidak ada produk yang cocok dengan kata kunci atau kategori yang Anda pilih.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchProducts()}
                className="gap-2"
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
                >
                  Reset Filter
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Section Keunggulan */}
        <section id="keunggulan" className="mt-24 pt-12 border-t border-border">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">
              Standar Layanan & Komitmen
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Mengapa Ribuan Kreator & Profesional Memilih Asterra
            </h2>
            <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
              Kami menghadirkan pengalaman berlangganan perangkat digital premium yang transparan,
              legal, dan terlindungi penuh tanpa resiko akun ditutup sepihak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 hover:border-primary/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                100% Legal & Private Workspace
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Bukan akun bajakan atau akun publik yang dipakai bersama orang asing. Anda mendapatkan
                akses privat ke ruang kerja akun resmi dengan keamanan data terjamin.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 hover:border-primary/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Aktivasi Instan & Konfirmasi Otomatis
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Didukung sistem payment gateway otomatis via QRIS dan Virtual Account. Tanpa perlu kirim
                bukti struk manual, status pesanan terverifikasi seketika dalam hitungan menit.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 hover:border-primary/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Garansi Penggantian Penuh 100%
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Ketenangan Anda adalah prioritas kami. Jika terjadi kendala akses sebelum masa langganan
                berakhir, tim teknis kami akan memberikan penggantian unit lisensi baru tanpa biaya tambahan.
              </p>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 sm:p-7 hover:border-primary/40 transition-colors space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Headphones className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Dukungan Pelanggan Siap Melayani 24 Jam
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Mengalami kesulitan saat login atau setup akun? Tim customer service profesional kami
                siap memandu Anda langkah demi langkah langsung melalui WhatsApp.
              </p>
            </div>
          </div>
        </section>

        {/* Section Cara Pemesanan */}
        <section id="panduan" className="mt-24 pt-12 border-t border-border">
          <div className="max-w-2xl mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-2">
              Panduan Transaksi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              4 Langkah Mudah Berlangganan di Asterra Store
            </h2>
            <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
              Alur pemesanan dirancang sesederhana mungkin agar Anda bisa langsung fokus bekerja dan
              berkarya tanpa prosedur verifikasi yang berbelit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Step 1 */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <span className="text-3xl font-extrabold text-primary/40 font-mono block mb-3">
                  01
                </span>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Pilih Lisensi Digital
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Pilih produk dari katalog resmi kami dan tentukan paket serta durasi layanan yang Anda inginkan.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <span className="text-3xl font-extrabold text-primary/40 font-mono block mb-3">
                  02
                </span>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Lengkapi Data Akun
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Isi formulir checkout dengan email aktif Anda untuk tujuan aktivasi lisensi resmi dan nomor WhatsApp untuk notifikasi kilat.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <span className="text-3xl font-extrabold text-primary/40 font-mono block mb-3">
                  03
                </span>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Selesaikan Pembayaran
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Pindai QRIS menggunakan e-wallet (GoPay, OVO, Dana) atau m-Banking Anda. Sistem akan memverifikasi pelunasan secara real-time.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-between hover:border-primary/40 transition-colors">
              <div>
                <span className="text-3xl font-extrabold text-primary/40 font-mono block mb-3">
                  04
                </span>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Akses Lisensi Siap Pakai
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Undangan ruang kerja atau kredensial akun langsung aktif. Anda dapat memantau status lisensi di menu Pesanan Saya.
                </p>
              </div>
            </div>
          </div>

          {/* Quick CTA Banner */}
          <div className="mt-10 p-6 sm:p-8 bg-surface border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Siap Meningkatkan Produktivitas Anda Hari Ini?
              </h3>
              <p className="text-xs text-foreground-muted">
                Jelajahi seluruh lisensi aplikasi kerja, AI, dan platform kreatif di katalog kami.
              </p>
            </div>
            <Link href="/products">
              <Button className="gap-2 shrink-0">
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
