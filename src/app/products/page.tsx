'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
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
  CheckCircle2,
  ShoppingCart,
  ArrowRight,
  LayoutGrid,
  List,
  RotateCcw,
  Zap,
  Check,
  AlertTriangle,
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

  const { addItem } = useCartStore();

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

  // "Hide sisanya": Display initial slice, hide remaining items until loaded or searched
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
  };

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-surface-raised border border-primary/40 text-foreground px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-2">
            <Link href="/" className="hover:text-foreground transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-foreground">Katalog Produk</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Katalog Produk & Lisensi Premium
              </h1>
              <p className="text-xs sm:text-sm text-foreground-muted mt-1">
                Jelajahi seluruh perangkat lunak, AI tools, dan platform kreatif resmi dengan aktivasi instan.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-surface-raised border border-border px-3 py-1.5 rounded-lg text-foreground-muted w-fit">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Aktivasi 100% Cepat & Bergaransi</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari lisensi (misal: Canva, ChatGPT, Gemini, Capcut)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm bg-surface-raised border-border"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground-muted hover:text-foreground"
                >
                  Hapus
                </button>
              )}
            </div>

            {/* Sort & View Mode Controls */}
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                <SelectTrigger className="h-9 w-[130px] sm:w-[170px] text-xs bg-surface-raised border-border">
                  <div className="flex items-center gap-1.5 truncate">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="hidden sm:inline text-foreground-muted">Urut:</span>
                    <SelectValue placeholder="Urutan" />
                  </div>
                </SelectTrigger>
                <SelectContent align="end">
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* View Toggle */}
              <div className="flex items-center bg-surface-raised border border-border rounded-lg p-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary text-white'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                  aria-label="Tampilan Grid"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-white'
                      : 'text-foreground-muted hover:text-foreground'
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
            <span className="text-xs font-medium text-foreground-muted shrink-0 mr-1">
              Kategori:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-raised text-foreground-muted border-border hover:border-foreground-muted/40 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Count & Active Filter Indicator */}
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-4">
          <div>
            Menampilkan <span className="font-semibold text-foreground">{products.length}</span> produk
            {selectedCategory !== 'Semua' && (
              <span> dalam kategori <strong className="text-foreground">{selectedCategory}</strong></span>
            )}
            {searchQuery && (
              <span> untuk pencarian &quot;<strong className="text-foreground">{searchQuery}</strong>&quot;</span>
            )}
          </div>
          {(selectedCategory !== 'Semua' || searchQuery) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-surface border border-border rounded-xl p-3 sm:p-6 space-y-3 sm:space-y-4 animate-pulse"
              >
                <div className="w-full h-40 bg-surface-raised rounded-lg" />
                <div className="w-24 h-4 bg-surface-raised rounded" />
                <div className="w-3/4 h-6 bg-surface-raised rounded" />
                <div className="w-full h-12 bg-surface-raised rounded" />
                <div className="w-1/2 h-6 bg-surface-raised rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-surface-raised border border-status-error/40 rounded-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground">Gagal memuat katalog produk</p>
            <p className="text-xs text-foreground-muted">Silakan coba beberapa saat lagi.</p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Muat Ulang
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mx-auto text-foreground-muted">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Produk tidak ditemukan</h3>
              <p className="text-xs text-foreground-muted">
                Tidak ada produk yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="gap-2">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </Button>
          </div>
        )}

        {/* Products Listing Grid */}
        {!isLoading && !error && products.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {products.map((product, idx) => {
              const isOutOfStock =
                (product.stock !== undefined && product.stock <= 0) ||
                product.providerStatus === 'empty' ||
                product.status === 'out_of_stock';

              return (
                <Card
                  key={product.id}
                  className="bg-surface border-border flex flex-col justify-between hover:border-primary/50 transition-all duration-200 group overflow-hidden"
                >
                  <div>
                    {/* Image & Badges */}
                    <div className="relative h-28 sm:h-44 w-full bg-surface-raised overflow-hidden border-b border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        fetchPriority={idx < 3 ? 'high' : 'auto'}
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1 sm:gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-background/90 backdrop-blur-sm border-border py-0 px-1.5 sm:px-2">
                          {product.category.name}
                        </Badge>
                        {product.popular && (
                          <Badge variant="default" className="text-[9px] sm:text-[10px] bg-primary text-white py-0 px-1.5 sm:px-2">
                            Laris
                          </Badge>
                        )}
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-[9px] sm:text-[10px] bg-status-error text-white font-semibold shadow-xs py-0 px-1.5 sm:px-2">
                            Habis
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader className="p-2.5 sm:p-5 pb-1 sm:pb-3 pt-2.5 sm:pt-5">
                      <CardTitle className="text-xs sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {product.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs text-foreground-muted line-clamp-1 sm:line-clamp-2 mt-1">
                        {product.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-2.5 sm:p-5 pt-0 sm:pt-0 pb-2 sm:pb-4 hidden sm:block">
                      <div className="space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                          Fitur Unggulan:
                        </span>
                        <ul className="space-y-1.5">
                          {product.features.slice(0, 3).map((feat, fIdx) => (
                            <li key={fIdx} className="flex items-start gap-2 text-xs text-foreground-muted">
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="p-2.5 sm:p-5 pt-2 sm:pt-3 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 bg-surface-raised/40">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-foreground-muted block">Mulai dari</span>
                      <span className="text-xs sm:text-base font-bold text-foreground">
                        {product.priceFormatted}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className={`border-border h-7 sm:h-9 text-xs px-2 sm:px-2.5 ${
                          isOutOfStock
                            ? 'opacity-50 cursor-not-allowed border-status-error/30 text-status-error hover:bg-transparent'
                            : 'hover:border-primary/50'
                        }`}
                        title={isOutOfStock ? 'Stok produk habis' : 'Tambah ke Keranjang'}
                      >
                        {isOutOfStock ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-status-error" />
                        ) : (
                          <ShoppingCart className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Link href={`/products/${product.id}`} className="flex-1 sm:flex-initial">
                        <Button size="sm" className="w-full sm:w-auto h-7 sm:h-9 text-[11px] sm:text-xs px-2 sm:px-3 gap-1">
                          <span>Detail</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Products Listing List View */}
        {!isLoading && !error && products.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {products.map((product, idx) => {
              const isOutOfStock =
                (product.stock !== undefined && product.stock <= 0) ||
                product.providerStatus === 'empty' ||
                product.status === 'out_of_stock';

              return (
                <div
                  key={product.id}
                  className="bg-surface border border-border rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-primary/50 transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-raised shrink-0 border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading={idx < 3 ? 'eager' : 'lazy'}
                        fetchPriority={idx < 3 ? 'high' : 'auto'}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-primary">{product.category.name}</span>
                        {product.popular && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                            Paling Laris
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-status-error/15 text-status-error font-semibold">
                            Stok Habis
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-foreground">{product.name}</h3>
                      <p className="text-xs text-foreground-muted max-w-xl line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                    <div className="text-left sm:text-right">
                      <span className="text-base font-bold text-foreground">{product.priceFormatted}</span>
                      <span className="text-[11px] text-foreground-muted block">/ bulan</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isOutOfStock}
                        onClick={() => handleAddToCart(product)}
                        className={`text-xs ${
                          isOutOfStock ? 'opacity-50 cursor-not-allowed text-status-error' : ''
                        }`}
                        title={isOutOfStock ? 'Stok produk habis' : 'Tambah ke Keranjang'}
                      >
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-status-error" />
                            <span>Stok Habis</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                            <span>Keranjang</span>
                          </>
                        )}
                      </Button>
                      <Link href={`/products/${product.id}`}>
                        <Button size="sm" className="text-xs gap-1">
                          <span>Detail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
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
          <div className="mt-10 p-6 border border-border bg-surface rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-foreground">
                Menampilkan {products.length} dari {filteredProducts.length} produk katalog
              </p>
              <p className="text-foreground-muted text-[11px]">
                {filteredProducts.length - products.length} produk lainnya disembunyikan. Ketik di pencarian untuk memunculkan instan tanpa muat ulang.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + 12)}
                className="text-xs border-border"
              >
                Muat 12 Produk Lagi
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVisibleCount(filteredProducts.length)}
                className="text-xs text-primary"
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
