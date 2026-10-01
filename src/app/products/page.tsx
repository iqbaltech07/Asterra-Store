'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/store/use-cart-store';
import { ProductItem } from '@/lib/products-data';
import {
  Search,
  SlidersHorizontal,
  ShoppingCart,
  ArrowRight,
  LayoutGrid,
  List,
  RotateCcw,
  Zap,
  Check,
  UserCheck,
  Award,
} from 'lucide-react';

const DEFAULT_CATEGORIES = ['Semua'];

const SORT_OPTIONS = [
  { value: 'popular', label: 'Paling Populer' },
  { value: 'price_asc', label: 'Harga: Terendah' },
  { value: 'price_desc', label: 'Harga: Tertinggi' },
];

export default function ProductsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notification, setNotification] = useState<string | null>(null);

  const { addItem, items: cartItems, removeItem } = useCartStore();

  // Fetch all active products once - search and filters run 100% in-memory without spamming API
  const { data, isLoading, error } = useQuery<{ success: boolean; data: ProductItem[] }>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      if (!res.ok) throw new Error('Gagal mengambil data katalog produk');
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const allProducts = useMemo(() => data?.data || [], [data?.data]);

  // Dynamically extract categories from products
  const categories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    allProducts.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return set.size > 1 ? Array.from(set) : DEFAULT_CATEGORIES;
  }, [allProducts]);

  // Client-Side In-Memory Filtering: 0 network requests on typing or filtering
  const filteredProducts = useMemo(() => {
    let list = [...allProducts];

    if (selectedCategory !== 'Semua') {
      list = list.filter(
        (p) =>
          p.category.name.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category.id.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.features.some((f) => f.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'popular') {
      list.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return list;
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  // Display initial slice, hide remaining items until loaded or searched
  const [visibleCount, setVisibleCount] = useState(12);
  const products = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

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
      showNotification(`Berhasil menambahkan ${product.name} ke keranjang pesanan.`);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-white text-navy-900 flex flex-col font-sans selection:bg-accent/20 selection:text-accent">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-white border border-accent/40 text-navy-900 px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center text-accent">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-navy-900 transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-navy-900 font-semibold">Katalog Produk</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-navy-900">
                Katalog Produk & Lisensi Premium
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Jelajahi seluruh perangkat lunak, AI tools, dan platform kreatif resmi dengan aktivasi instan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full text-accent font-semibold w-fit">
              <Zap className="w-3.5 h-3.5 text-accent" />
              <span>Aktivasi 100% Cepat & Bergaransi</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-white border border-border rounded-2xl p-4 sm:p-5 mb-8 space-y-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari lisensi (misal: Canva, ChatGPT, Gemini, Capcut)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-border rounded-full pl-10 pr-16 py-2 text-xs sm:text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-navy-900 font-medium"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                <SelectTrigger className="h-9 w-[140px] sm:w-[170px] text-xs bg-white border-border rounded-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="hidden sm:inline text-slate-500">Urut:</span>
                    <SelectValue placeholder="Urutan" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="bg-white border border-border shadow-editorial">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-50 border border-border rounded-xl p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-navy-900'
                  }`}
                  aria-label="Tampilan Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-navy-900'
                  }`}
                  aria-label="Tampilan List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">
              Kategori:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                      : 'bg-white text-navy-900 border-border hover:border-slate-300 hover:text-accent'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Count & Active Filter Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6">
          <div>
            Menampilkan <span className="font-bold text-navy-900">{products.length}</span> produk
            {selectedCategory !== 'Semua' && (
              <span> dalam kategori <strong className="text-navy-900">{selectedCategory}</strong></span>
            )}
            {searchQuery && (
              <span> untuk pencarian &quot;<strong className="text-navy-900">{searchQuery}</strong>&quot;</span>
            )}
          </div>
          {(selectedCategory !== 'Semua' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-accent font-semibold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto my-12 shadow-card">
            <p className="text-sm font-bold text-navy-900">Gagal memuat katalog produk</p>
            <p className="text-xs text-slate-500">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => window.location.reload()} className="rounded-xl">
              Muat Ulang
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="bg-white border border-border rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-card">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-accent">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-navy-900">Produk tidak ditemukan</h3>
              <p className="text-xs text-slate-500">
                Tidak ada produk yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="gap-2 rounded-xl">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </Button>
          </div>
        )}

        {/* Products Listing Grid */}
        {!isLoading && !error && products.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product, idx) => {
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
          </div>
        )}

        {/* Products Listing List View */}
        {!isLoading && !error && products.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {products.map((product, idx) => {
              const isSelected = cartItems.some((item) => item.id === product.id);
              const isOutOfStock =
                (product.stock !== undefined && product.stock <= 0) ||
                product.providerStatus === 'empty' ||
                product.status === 'out_of_stock';

              return (
                <div
                  key={product.id}
                  className="bg-white border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-border">
                      <Link href={`/products/${product.id}`} prefetch={true} className="block w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          loading={idx < 4 ? 'eager' : 'lazy'}
                          fetchPriority={idx < 4 ? 'high' : 'auto'}
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-accent">{product.category.name}</span>
                        {product.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-accent font-semibold">
                            Paling Laris
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-error/15 text-status-error font-semibold">
                            Stok Habis
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-navy-900">
                        <Link href={`/products/${product.id}`} prefetch={true} className="hover:text-accent transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xl line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="text-left sm:text-right">
                      <span className="text-base sm:text-lg font-extrabold text-navy-900 block">{product.priceFormatted}</span>
                      <span className="text-[11px] text-slate-400 block">/ akun lisensi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
                        className={`rounded-xl text-xs font-semibold ${
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
                          className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center hover:bg-accent transition-colors shadow-sm cursor-pointer"
                          aria-label={`Detail ${product.name}`}
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More / Hide Remainder section */}
        {!isLoading && filteredProducts.length > visibleCount && (
          <div className="mt-10 p-6 border border-border bg-white rounded-2xl shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-bold text-navy-900">
                Menampilkan {products.length} dari {filteredProducts.length} produk katalog
              </p>
              <p className="text-slate-500 text-[11px]">
                {filteredProducts.length - products.length} produk lainnya disembunyikan. Ketik di pencarian untuk memunculkan instan tanpa muat ulang.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="text-xs rounded-xl"
              >
                Muat 12 Produk Lagi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount(filteredProducts.length)}
                className="text-xs text-accent font-semibold"
              >
                Tampilkan Semua ({filteredProducts.length})
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
