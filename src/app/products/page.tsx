'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import {
  Search,
  ShoppingCart,
  Check,
  Zap,
  RotateCcw,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowRight,
} from 'lucide-react';
import { useCartStore } from '@/store/use-cart-store';
import { ProductItem } from '@/lib/products-data';
import { ProductCard } from '@/components/products/product-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Paling Populer' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'name_asc', label: 'Nama A - Z' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('brand') || '';
  const initialCategory = searchParams.get('category') || 'Semua';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [notification, setNotification] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('brand');
    const cat = searchParams.get('category');
    if (q !== null) setSearchQuery(q);
    if (cat !== null) setSelectedCategory(cat);
  }, [searchParams]);

  const { items: cartItems, addItem, removeItem } = useCartStore();

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Fetch real-time products from VIP Reseller via internal API
  const {
    data: catalogResponse,
    isLoading,
    error,
  } = useQuery<{ success: boolean; data: ProductItem[]; total: number }>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      if (!res.ok) throw new Error('Gagal memuat produk dari VIP Reseller');
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const allProducts = useMemo(
    () => catalogResponse?.data || [],
    [catalogResponse?.data]
  );

  // Extract dynamic categories from real products
  const categories = useMemo(() => {
    const set = new Set<string>(['Semua']);
    allProducts.forEach((p) => {
      if (p.category?.name) set.add(p.category.name);
    });
    return Array.from(set);
  }, [allProducts]);

  // Client-side filtering & sorting
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Filter by Category
    if (selectedCategory !== 'Semua') {
      result = result.filter(
        (p) =>
          p.category?.name?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.category?.id?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q) ||
          (p.features && p.features.some((f) => f.toLowerCase().includes(q)))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
    });

    return result;
  }, [allProducts, selectedCategory, searchQuery, sortBy]);

  // Slice visible products for performance
  const products = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

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
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[rgba(201,111,85,0.15)] border border-[rgba(201,111,85,0.3)] flex items-center justify-center text-[#C96F55]">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-semibold">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full overflow-hidden">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-[#121A2A]/60 mb-2">
            <Link href="/" className="hover:text-[#121A2A] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-[#121A2A] font-semibold">Katalog Produk</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#121A2A]">
                Katalog Produk & Lisensi Premium
              </h1>
              <p className="text-xs sm:text-sm text-[#121A2A]/70 mt-1">
                Jelajahi seluruh perangkat lunak, AI tools, dan platform kreatif resmi dengan aktivasi instan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] px-3 py-1.5 rounded-md text-[#C96F55] font-semibold w-fit">
              <Zap className="w-3.5 h-3.5 text-[#C96F55]" />
              <span>Aktivasi 100% Cepat & Bergaransi</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 mb-8 space-y-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#121A2A]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari lisensi (misal: Canva, ChatGPT, Gemini, Capcut)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[rgba(18,26,42,0.12)] rounded-lg pl-10 pr-16 py-2 text-xs sm:text-sm text-[#121A2A] placeholder:text-[#121A2A]/40 focus:outline-none focus:border-[#C96F55] focus:ring-2 focus:ring-[#C96F55]/20 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#121A2A]/50 hover:text-[#121A2A] font-medium"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                <SelectTrigger className="h-9 w-[140px] sm:w-[170px] text-xs bg-white border-[rgba(18,26,42,0.12)] rounded-lg text-[#121A2A]">
                  <div className="flex items-center gap-1.5 truncate">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C96F55] shrink-0" />
                    <span className="hidden sm:inline text-[#121A2A]/60">Urut:</span>
                    <SelectValue placeholder="Urutan" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="bg-white border border-[rgba(18,26,42,0.1)] text-[#121A2A] shadow-editorial">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] rounded-lg p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#121A2A] text-white shadow-xs'
                      : 'text-[#121A2A]/60 hover:text-[#121A2A]'
                  }`}
                  aria-label="Tampilan Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-[#121A2A] text-[#F7F5EF] shadow-xs'
                      : 'text-[#121A2A]/60 hover:text-[#121A2A]'
                  }`}
                  aria-label="Tampilan List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <span className="text-xs font-semibold text-[#121A2A]/60 shrink-0 mr-1">
              Kategori:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#121A2A] text-[#F7F5EF] border-[#121A2A] shadow-xs'
                      : 'bg-transparent text-[#121A2A] border-[rgba(18,26,42,0.12)] hover:border-[#121A2A]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Count & Active Filter Indicator */}
        <div className="flex items-center justify-between text-xs text-[#121A2A]/60 mb-6">
          <div>
            Menampilkan <span className="font-bold text-[#121A2A]">{products.length}</span> produk
            {selectedCategory !== 'Semua' && (
              <span> dalam kategori <strong className="text-[#121A2A]">{selectedCategory}</strong></span>
            )}
            {searchQuery && (
              <span> untuk pencarian &quot;<strong className="text-[#121A2A]">{searchQuery}</strong>&quot;</span>
            )}
          </div>
          {(selectedCategory !== 'Semua' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[#C96F55] font-semibold hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-20 h-4 bg-[rgba(18,26,42,0.06)] rounded" />
                  <div className="w-3/4 h-5 bg-[rgba(18,26,42,0.06)] rounded" />
                  <div className="w-full aspect-[16/10] bg-[rgba(18,26,42,0.06)] rounded-xl" />
                </div>
                <div className="w-full h-9 bg-[rgba(18,26,42,0.06)] rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3 max-w-md mx-auto my-12 shadow-card">
            <p className="text-sm font-bold text-[#121A2A]">Gagal memuat katalog produk</p>
            <p className="text-xs text-[#121A2A]/60">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => window.location.reload()} className="rounded-lg">
              Muat Ulang
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center mx-auto text-[#C96F55]">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#121A2A]">Produk tidak ditemukan</h3>
              <p className="text-xs text-[#121A2A]/60">
                Tidak ada produk yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="gap-2 rounded-lg">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </Button>
          </div>
        )}

        {/* Products Listing Grid */}
        {!isLoading && !error && products.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
            {products.map((product, idx) => {
              const isSelected = cartItems.some((item) => item.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={isSelected}
                  onAddToCart={handleAddToCart}
                  priorityImage={idx < 6}
                />
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
                  className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card hover:shadow-card-hover hover:border-[rgba(18,26,42,0.18)] transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-[#F8FAFC] shrink-0 border border-[rgba(18,26,42,0.08)]">
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
                        <span className="text-xs font-semibold text-[#C96F55]">{product.category.name}</span>
                        {product.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] font-semibold">
                            Populer
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-status-error/15 text-status-error font-semibold">
                            Stok Habis
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#121A2A]">
                        <Link href={`/products/${product.id}`} prefetch={true} className="hover:text-[#C96F55] transition-colors">
                          {product.name}
                        </Link>
                      </h3>
                      <p className="text-xs text-[#121A2A]/65 max-w-xl line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[rgba(18,26,42,0.08)]">
                    <div className="text-left sm:text-right">
                      <span className="text-base sm:text-lg font-extrabold text-[#121A2A] block">{product.priceFormatted}</span>
                      <span className="text-[11px] text-[#121A2A]/50 block">/ akun lisensi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={isOutOfStock ? 'outline' : isSelected ? 'secondary' : 'default'}
                        className={`rounded-lg text-xs font-semibold ${
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
                          className="w-8 h-8 rounded-lg bg-[#121A2A] text-[#F7F5EF] flex items-center justify-center hover:bg-[#C96F55] transition-colors shadow-xs cursor-pointer"
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
          <div className="mt-10 p-6 border border-[rgba(18,26,42,0.08)] bg-white rounded-2xl shadow-card flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-bold text-[#121A2A]">
                Menampilkan {products.length} dari {filteredProducts.length} produk katalog
              </p>
              <p className="text-[#121A2A]/60 text-[11px]">
                {filteredProducts.length - products.length} produk lainnya disembunyikan. Ketik di pencarian untuk memunculkan instan tanpa muat ulang.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="text-xs rounded-lg"
              >
                Muat 12 Produk Lagi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount(filteredProducts.length)}
                className="text-xs text-[#C96F55] font-semibold"
              >
                Tampilkan Semua ({filteredProducts.length})
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer onNotify={showNotification} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#C96F55] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
