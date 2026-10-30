'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useCatalogProducts } from '@/lib/hooks/use-catalog-products';
import { useActiveCampaigns } from '@/lib/hooks/use-active-campaigns';
import { calculateCampaignPrice } from '@/lib/utils/promo-pricing';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faCheck,
  faRotateLeft,
  faSliders,
  faTableCellsLarge,
  faList,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import { AuthRequiredModal } from '@/components/auth/auth-required-modal';
import { ProductCard } from '@/components/products/product-card';
import { useStoreOperatingHours } from '@/lib/hooks/use-store-operating-hours';
import { useProductCards } from '@/lib/hooks/use-product-cards';
import { FeaturedGridCard, ApplicationGroupItem } from '@/components/home/product-showcase-cards';
import { QuickViewModal, QuickViewProductData } from '@/components/products/quick-view-modal';
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
  const resolveCategoryParam = (cat: string | null): string => {
    if (!cat) return 'Semua';
    const lower = cat.toLowerCase().trim();
    if (lower === 'cat-ai-tools' || lower === 'ai-tools' || lower === 'ai tools' || lower === 'ai') {
      return 'AI Tools';
    }
    if (lower === 'cat-apps-streaming' || lower === 'apps-streaming' || lower === 'apps & streaming' || lower === 'streaming') {
      return 'Apps & Streaming';
    }
    if (lower === 'cat-digital-services' || lower === 'digital' || lower === 'layanan digital') {
      return 'Layanan Digital';
    }
    return cat;
  };

  const initialSearch = searchParams.get('search') || searchParams.get('brand') || '';
  const initialCategory = resolveCategoryParam(searchParams.get('category'));
  const initialViewParam = searchParams.get('display') || searchParams.get('view');

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const { isClosed } = useStoreOperatingHours();
  const [sortBy, setSortBy] = useState<string>('popular');
  const [viewMode, setViewMode] = useState<'grid' | 'group'>(
    initialViewParam === 'group' ? 'group' : 'grid'
  );
  const [notification, setNotification] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // Quick View Modal state
  const [quickViewProduct, setQuickViewProduct] = useState<QuickViewProductData | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('brand');
    const cat = searchParams.get('category');
    const view = searchParams.get('display') || searchParams.get('view');
    if (q !== null) setSearchQuery(q);
    if (cat !== null) setSelectedCategory(resolveCategoryParam(cat));
    if (view === 'group' || view === 'grid') setViewMode(view);
  }, [searchParams]);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();
  const isAuthenticated = Boolean(session?.user || legacyUser);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Fetch real-time products from catalog via shared query cache
  const {
    data: catalogResponse,
    isLoading,
    error,
  } = useCatalogProducts();

  const allProducts = useMemo(
    () => catalogResponse?.data || [],
    [catalogResponse?.data]
  );

  // Fetch active campaigns for real-time promotional pricing (shared query cache)
  const { campaigns: activeCampaigns } = useActiveCampaigns();

  // Fetch real categories from database
  const { data: categoriesResponse } = useQuery<{ success: boolean; data: { id: string; name: string; slug: string }[] }>({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const res = await fetch('/api/v1/categories');
      if (!res.ok) return { success: false, data: [] };
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Extract dynamic categories directly from Database Category table + real products
  const categories = useMemo(() => {
    const list = ['Semua'];
    const seen = new Set<string>(['semua']);

    // 1. Prioritize official categories from DB
    const dbCats = categoriesResponse?.data || [];
    dbCats.forEach((c) => {
      const name = c.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    });

    // 2. Append any categories from active catalog products not yet listed
    allProducts.forEach((p) => {
      const name = p.category?.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    });

    return list;
  }, [categoriesResponse?.data, allProducts]);

  // Fetch active Product Groups from database
  const { data: cardsResponse } = useProductCards();

  // Map Product Groups into rich card items (with real prices, stock, ratings, and promo pricing)
  const groupApps = useMemo(() => {
    const dbCards = cardsResponse?.data || [];
    if (dbCards.length === 0) return [];

    let mapped: ApplicationGroupItem[] = dbCards
      .filter((card) => card.status === 'active')
      .map((card) => {
        // Find connected active catalog products
        const items = allProducts.filter((p) => {
          if (p.status && p.status !== 'active') return false;
          const pCardId = (p.cardId || (p as any).card_id || '').toLowerCase();
          const pCardSlug = (p.cardSlug || (p as any).card_slug || '').toLowerCase();
          if (pCardId === card.id.toLowerCase() || pCardSlug === card.slug.toLowerCase()) return true;
          const text = `${p.name} ${(p as any).id || ''}`.toLowerCase();
          return text.includes(card.slug.replace(/-/g, ' ')) || text.includes(card.name.toLowerCase());
        });

        const activePrices = items.map((p) => p.price).filter((p) => p > 0);
        const minPrice = card.minPrice > 0 ? card.minPrice : (activePrices.length > 0 ? Math.min(...activePrices) : 0);
        const isOutOfStock = card.stockStatus === 'out_of_stock' || minPrice <= 0;

        const catName = card.categoryName || 'Layanan Digital';
        const catLower = catName.toLowerCase();
        const categoryTag: 'ai' | 'design' | 'video' | 'streaming' | 'other' =
          catLower.includes('ai') ? 'ai' :
          catLower.includes('design') ? 'design' :
          catLower.includes('video') ? 'video' :
          catLower.includes('stream') ? 'streaming' : 'other';

        return {
          id: card.id,
          name: card.name,
          slug: card.slug,
          category: catName,
          categoryId: card.categoryId || 'cat-digital',
          categoryTag,
          logoUrl: card.logoUrl,
          imageUrl: card.imageUrl,
          description: card.description,
          soldCount: Math.min(40, Math.max(20, card.soldCount ?? 28)),
          targetMax: Math.min(40, Math.max(20, card.soldCount ?? 28)),
          rating: String(card.rating || '5.0'),
          badgeLabel: card.badgeLabel || (card.sections?.includes('promo') ? '🔥 Promo' : ''),
          isPromo: card.sections?.includes('promo') ?? true,
          isTerlaris: card.sections?.includes('terlaris') ?? false,
          isTerbaru: card.sections?.includes('terbaru') ?? false,
          items,
          minPrice,
          isOutOfStock,
        };
      })
      .filter((app) => app.minPrice > 0);

    // 1. Filter by Category
    if (selectedCategory !== 'Semua') {
      const targetCat = selectedCategory.toLowerCase().trim();
      mapped = mapped.filter((g) => {
        const gCat = (g.category || '').toLowerCase();
        const gCatId = ((g as any).categoryId || '').toLowerCase();
        const cardMatch = gCat === targetCat || gCatId === targetCat || gCat.includes(targetCat);
        const itemMatch = g.items && g.items.some((p) => {
          const pCatName = (p.category?.name || (p as any).categoryName || '').toLowerCase();
          const pCatId = (p.category?.id || (p as any).categoryId || '').toLowerCase();
          return pCatName === targetCat || pCatId === targetCat || pCatName.includes(targetCat);
        });
        return cardMatch || itemMatch;
      });
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      mapped = mapped.filter((g) => {
        const nameMatch = g.name.toLowerCase().includes(q);
        const slugMatch = g.slug.toLowerCase().includes(q);
        const descMatch = (g.description || '').toLowerCase().includes(q);
        const catMatch = (g.category || '').toLowerCase().includes(q);
        const itemMatch = g.items.some((item) => item.name.toLowerCase().includes(q));
        return nameMatch || slugMatch || descMatch || catMatch || itemMatch;
      });
    }

    // 3. Sorting
    mapped.sort((a, b) => {
      if (sortBy === 'price_asc') return a.minPrice - b.minPrice;
      if (sortBy === 'price_desc') return b.minPrice - a.minPrice;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return (b.soldCount || 0) - (a.soldCount || 0);
    });

    return mapped;
  }, [cardsResponse?.data, allProducts, selectedCategory, searchQuery, sortBy]);

  // Client-side filtering & sorting for individual products
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // Note 2: Filter out inactive products or products belonging to inactive product groups
    const inactiveCardIds = new Set(
      (cardsResponse?.data || [])
        .filter((c) => c.status !== 'active')
        .map((c) => c.id.toLowerCase())
    );

    result = result.filter((p) => {
      if (p.status && p.status !== 'active') return false;
      if ((p as any).cardStatus && (p as any).cardStatus !== 'active') return false;
      const pCardId = (p.cardId || (p as any).card_id || '').toLowerCase();
      if (pCardId && inactiveCardIds.has(pCardId)) return false;
      return true;
    });

    // Filter by Category
    if (selectedCategory !== 'Semua') {
      const targetCat = selectedCategory.toLowerCase().trim();
      result = result.filter(
        (p) => {
          const pName = (p.category?.name || (p as any).categoryName || '').toLowerCase();
          const pId = (p.category?.id || (p as any).categoryId || '').toLowerCase();
          return pName === targetCat || pId === targetCat || pName.includes(targetCat);
        }
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
  }, [allProducts, cardsResponse?.data, selectedCategory, searchQuery, sortBy]);

  // Slice visible products for performance
  const products = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount]
  );

  const handleResetFilters = () => {
    setSelectedCategory('Semua');
    setSearchQuery('');
    setSortBy('popular');
  };

  const handleOpenQuickView = (app: ApplicationGroupItem) => {
    const firstItem = app.items && app.items[0];

    setQuickViewProduct({
      id: app.id || app.slug,
      name: app.name,
      slug: app.slug,
      category: app.category || firstItem?.category?.name || 'Layanan Digital',
      price: app.minPrice,
      priceFormatted: `Rp ${app.minPrice.toLocaleString('id-ID')}`,
      rating: app.rating || '5.0',
      soldCount: app.soldCount || 28,
      features: firstItem?.features || [
        'Garansi Penuh Selama Berlangganan',
        'Proses Cepat 1-15 Menit',
        'Akun Resmi & Legal',
      ],
      description:
        app.description ||
        `Layanan resmi dan bergaransi untuk ${app.name} di Asterra Store dengan konfirmasi otomatis dan dukungan CS 24 jam.`,
      brand: app.name,
      isPromo: app.isPromo,
      badgeLabel: app.badgeLabel,
    });
    setIsQuickViewOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[rgba(201,111,85,0.15)] border border-[rgba(201,111,85,0.3)] flex items-center justify-center text-[#C96F55]">
              <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold">{notification}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {/* Page Header */}
        <div className="mb-6 space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#121A2A]/50 font-medium">
            <Link href="/" className="hover:text-[#C96F55] transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <span className="text-[#121A2A]">Katalog Produk</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#121A2A] tracking-tight">
                {viewMode === 'group' ? 'Katalog Product Group' : 'Katalog Produk & Lisensi'}
              </h1>
              <p className="text-xs sm:text-sm text-[#121A2A]/60 mt-0.5">
                {viewMode === 'group'
                  ? 'Pilih grup produk utama untuk melihat ragam paket, tipe akun, dan durasi langganan.'
                  : 'Seluruh akun premium resmi dengan garansi penggantian dan aktivasi instan.'}
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar Controls */}
        <div data-gsap="filter-controls" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 mb-8 space-y-4 shadow-card">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div data-gsap="search-bar" className="relative flex-1">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-[#121A2A]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder={viewMode === 'group' ? 'Cari Product Group (Canva, Netflix, Spotify, Gemini)...' : 'Cari lisensi (misal: Canva, ChatGPT, Gemini, CapCut)...'}
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
                    <FontAwesomeIcon icon={faSliders} className="w-3.5 h-3.5 text-[#C96F55] shrink-0" />
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

              {/* Display Filter Toggle (Katalog Produk Satuan vs Product Group Cards) */}
              <div className="flex items-center bg-[#F8FAFC] border border-[rgba(18,26,42,0.08)] rounded-lg p-1 shrink-0" title="Ganti Tampilan: Katalog Produk / Product Group">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#121A2A] text-white shadow-xs'
                      : 'text-[#121A2A]/60 hover:text-[#121A2A]'
                  }`}
                  aria-label="Tampilan Katalog Semua Produk"
                  title="Tampilan Semua Produk (Katalog Varian)"
                >
                  <FontAwesomeIcon icon={faTableCellsLarge} className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('group')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'group'
                      ? 'bg-[#121A2A] text-[#F7F5EF] shadow-xs'
                      : 'text-[#121A2A]/60 hover:text-[#121A2A]'
                  }`}
                  aria-label="Tampilan Berdasarkan Product Group"
                  title="Tampilan Product Group (Card Brand)"
                >
                  <FontAwesomeIcon icon={faList} className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div data-gsap="category-tabs" className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
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
            Menampilkan{' '}
            <span className="font-bold text-[#121A2A]">
              {viewMode === 'group' ? groupApps.length : products.length}
            </span>{' '}
            {viewMode === 'group' ? 'Product Group' : 'produk katalog'}
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
              <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 h-72 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(18,26,42,0.06)]" />
                  <div className="w-3/4 h-5 bg-[rgba(18,26,42,0.06)] rounded" />
                  <div className="w-1/2 h-3 bg-[rgba(18,26,42,0.06)] rounded" />
                </div>
                <div className="w-full h-8 bg-[rgba(18,26,42,0.06)] rounded-xl" />
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
        {!isLoading && !error && ((viewMode === 'group' && groupApps.length === 0) || (viewMode === 'grid' && products.length === 0)) && (
          <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-card">
            <div className="w-12 h-12 rounded-xl bg-[rgba(201,111,85,0.08)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center mx-auto text-[#C96F55]">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#121A2A]">
                {viewMode === 'group' ? 'Product Group tidak ditemukan' : 'Produk tidak ditemukan'}
              </h3>
              <p className="text-xs text-[#121A2A]/60">
                Tidak ada {viewMode === 'group' ? 'Product Group' : 'produk'} yang cocok dengan kriteria pencarian atau filter yang Anda pilih.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleResetFilters} className="gap-2 rounded-lg">
              <FontAwesomeIcon icon={faRotateLeft} className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </Button>
          </div>
        )}

        {/* Display Mode 1: Product Group Cards */}
        {!isLoading && !error && viewMode === 'group' && groupApps.length > 0 && (
          <div
            data-gsap="product-grid"
            key={`groups-${selectedCategory}-${sortBy}`}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-4.5 animate-tab-glide"
          >
            {groupApps.map((app) => (
              <FeaturedGridCard
                key={app.id || app.slug}
                app={app}
                activeCampaigns={activeCampaigns}
                onQuickView={handleOpenQuickView}
              />
            ))}
          </div>
        )}

        {/* Display Mode 2: Individual Products Grid */}
        {!isLoading && !error && viewMode === 'grid' && products.length > 0 && (
          <div
            data-gsap="product-grid"
            key={`grid-${selectedCategory}-${sortBy}`}
            className="grid grid-cols-2 gap-3.5 sm:gap-4 md:gap-5 lg:grid-cols-3 animate-tab-glide"
          >
            {products.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                priorityImage={idx < 6}
                activeCampaigns={activeCampaigns}
              />
            ))}
          </div>
        )}

        {/* Load More section (for individual products grid) */}
        {!isLoading && viewMode === 'grid' && filteredProducts.length > visibleCount && (
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
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        activeCampaigns={activeCampaigns}
      />

      {/* Guest Authentication Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackUrl="/products"
      />
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
