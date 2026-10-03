'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/use-cart-store';
import {
  CheckCircle2,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Share2,
  Heart,
} from 'lucide-react';
import { ProductCard } from '@/components/products/product-card';
import { ProductItem } from '@/lib/products-data';
import { ParsedVariant, cleanHtmlContent } from '@/lib/services/product-variant-parser';

export interface DurationOption {
  id: string;
  label: string;
  price: number;
  multiplier: number;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RelatedProduct {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  imageUrl: string;
  stock?: number;
  providerStatus?: string;
  brand?: string;
  providerCode?: string;
}

export interface ProductDetailData {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  description: string;
  features: string[];
  status: 'active' | 'out_of_stock' | 'archived';
  providerStatus?: 'available' | 'empty' | 'maintenance' | 'unknown' | string;
  stock?: number;
  imageUrl: string;
  popular?: boolean;
  brand?: string;
  providerCode?: string;
  guaranteeTitle?: string | null;
  guaranteeDesc?: string | null;
  processTitle?: string | null;
  processDesc?: string | null;
  privacyTitle?: string | null;
  privacyDesc?: string | null;
  durations: DurationOption[];
  specifications: SpecItem[];
  faqs: FaqItem[];
  relatedProducts: RelatedProduct[];
  variants?: ParsedVariant[];
  selectedVariant?: ParsedVariant;
  familySlug?: string;
  familyImageUrl?: string;
  rating?: string;
  soldCount?: number;
}

interface ProductDetailClientProps {
  id: string;
  initialData?: ProductDetailData | null;
}

export function ProductDetailClient({ id, initialData }: ProductDetailClientProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefit' | 'garansi' | 'deskripsi'>('benefit');

  const { items: cartItems, addItem } = useCartStore();

  const { data, isLoading, error } = useQuery<{ success: boolean; data: ProductDetailData }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error('Produk tidak ditemukan');
      return res.json();
    },
    initialData: initialData ? { success: true, data: initialData } : undefined,
  });

  const product = data?.data;
  const variants = useMemo(() => product?.variants || [], [product?.variants]);

  // 1. Available Pakets (Data-driven)
  const availablePakets = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.paket));
    return Array.from(set);
  }, [variants]);

  const [selectedPaket, setSelectedPaket] = useState<string>(() => {
    return product?.selectedVariant?.paket || availablePakets[0] || '';
  });

  useEffect(() => {
    if (product?.selectedVariant?.paket) {
      setSelectedPaket(product.selectedVariant.paket);
    } else if (availablePakets.length > 0 && !availablePakets.includes(selectedPaket)) {
      setSelectedPaket(availablePakets[0]);
    }
  }, [product?.selectedVariant?.paket, availablePakets, selectedPaket]);

  // 2. Variants for selected Paket
  const variantsForPaket = useMemo(() => {
    if (variants.length === 0) return [];
    return variants.filter((v) => v.paket === selectedPaket);
  }, [variants, selectedPaket]);

  // 3. Available Types for selected Paket
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    variantsForPaket.forEach((v) => set.add(v.type));
    return Array.from(set);
  }, [variantsForPaket]);

  const [selectedType, setSelectedType] = useState<string>(() => {
    return product?.selectedVariant?.type || availableTypes[0] || 'Private';
  });

  useEffect(() => {
    if (product?.selectedVariant?.type && availableTypes.includes(product.selectedVariant.type)) {
      setSelectedType(product.selectedVariant.type);
    } else if (availableTypes.length > 0 && !availableTypes.includes(selectedType)) {
      setSelectedType(availableTypes[0]);
    }
  }, [availableTypes, product?.selectedVariant?.type, selectedType]);

  // 4. Variants for selected Paket + Type
  const variantsForType = useMemo(() => {
    return variantsForPaket.filter((v) => v.type === selectedType);
  }, [variantsForPaket, selectedType]);

  // 5. Available Durations for selected Paket + Type
  const availableDurations = useMemo(() => {
    const set = new Set<string>();
    variantsForType.forEach((v) => set.add(v.duration));
    return Array.from(set);
  }, [variantsForType]);

  const [selectedDuration, setSelectedDuration] = useState<string>(() => {
    return product?.selectedVariant?.duration || availableDurations[0] || '1 Bulan';
  });

  useEffect(() => {
    if (product?.selectedVariant?.duration && availableDurations.includes(product.selectedVariant.duration)) {
      setSelectedDuration(product.selectedVariant.duration);
    } else if (availableDurations.length > 0 && !availableDurations.includes(selectedDuration)) {
      setSelectedDuration(availableDurations[0]);
    }
  }, [availableDurations, product?.selectedVariant?.duration, selectedDuration]);

  // 6. Variants for selected Paket + Type + Duration
  const variantsForDuration = useMemo(() => {
    return variantsForType.filter((v) => v.duration === selectedDuration);
  }, [variantsForType, selectedDuration]);

  // 7. Available Warranties (Garansi) for selected Paket + Type + Duration
  const availableWarranties = useMemo(() => {
    const set = new Set<string>();
    variantsForDuration.forEach((v) => set.add(v.warranty));
    return Array.from(set);
  }, [variantsForDuration]);

  const [selectedWarranty, setSelectedWarranty] = useState<string>(() => {
    return product?.selectedVariant?.warranty || availableWarranties[0] || '1 Bulan';
  });

  useEffect(() => {
    if (product?.selectedVariant?.warranty && availableWarranties.includes(product.selectedVariant.warranty)) {
      setSelectedWarranty(product.selectedVariant.warranty);
    } else if (availableWarranties.length > 0 && !availableWarranties.includes(selectedWarranty)) {
      setSelectedWarranty(availableWarranties[0]);
    }
  }, [availableWarranties, product?.selectedVariant?.warranty, selectedWarranty]);

  // 8. FINAL RESOLVED VARIANT
  const activeVariant: ParsedVariant | null = useMemo(() => {
    if (variants.length === 0) return null;
    const exact = variantsForDuration.find((v) => v.warranty === selectedWarranty);
    if (exact) return exact;
    return variantsForDuration[0] || variantsForType[0] || variantsForPaket[0] || variants[0];
  }, [variants, variantsForDuration, selectedWarranty, variantsForType, variantsForPaket]);

  // Sync URL to active variant SKU without full-page reload
  useEffect(() => {
    if (!activeVariant || typeof window === 'undefined') return;
    const currentPath = window.location.pathname;
    const targetPath = `/products/${activeVariant.id}`;
    if (currentPath !== targetPath && !currentPath.includes(activeVariant.id)) {
      window.history.replaceState({ ...window.history.state, as: targetPath, url: targetPath }, '', targetPath);
    }
  }, [activeVariant]);

  const currentPrice = activeVariant ? activeVariant.price : (product?.price || 0);
  const totalPrice = currentPrice * quantity;

  const isOutOfStock =
    (product?.stock !== undefined && product.stock <= 0) ||
    product?.providerStatus === 'empty' ||
    product?.status === 'out_of_stock' ||
    (activeVariant !== null && activeVariant.isOutOfStock);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, stok produk ${product?.name || ''} saat ini habis.`);
      return;
    }

    const cartItemId = activeVariant ? activeVariant.id : product.id;
    const cartItemName = activeVariant ? `${product.name} - ${activeVariant.paket} (${activeVariant.duration})` : product.name;

    addItem({
      id: cartItemId,
      name: cartItemName,
      category: product.category?.name || 'Layanan Digital',
      priceFormatted: `Rp ${currentPrice.toLocaleString('id-ID')}`,
      priceNumeric: currentPrice,
      stock: product.stock,
      isOutOfStock: false,
    });

    showNotification(`Berhasil menambahkan ${quantity}x ${cartItemName} ke keranjang.`);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, stok produk ${product?.name || ''} saat ini habis.`);
      return;
    }
    handleAddToCart();
    router.push('/checkout');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      showNotification('Tautan produk berhasil disalin ke papan klip!');
    }
  };

  // Clean features for the Benefit tab (no raw HTML tags)
  const cleanFeatures = useMemo(() => {
    if (!product?.features || product.features.length === 0) {
      return [
        'Akses fitur premium resmi tanpa batasan kuota',
        'Aktivasi otomatis & cepat (1 - 15 Menit)',
        'Proteksi garansi penggantian penuh jika terkendala',
        'Bimbingan dan bantuan customer support via WhatsApp',
      ];
    }
    return product.features
      .map(cleanHtmlContent)
      .flatMap((f) => f.split('\n'))
      .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);
  }, [product?.features]);

  return (
    <div className="min-h-screen bg-white text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55]">
              <Check className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full overflow-hidden">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#121A2A]/60 mb-6 sm:mb-8 overflow-hidden">
          <Link href="/" className="hover:text-[#121A2A] transition-colors shrink-0">
            Beranda
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <Link href="/products" className="hover:text-[#121A2A] transition-colors shrink-0">
            Katalog Produk
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <span className="text-[#121A2A] font-semibold truncate max-w-[160px] sm:max-w-md">
            {product?.name || 'Detail Produk'}
          </span>
        </nav>

        {/* Loading State */}
        {isLoading && !product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-6 h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
            <div className="lg:col-span-6 h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {error && !product && (
          <div className="bg-white border border-[rgba(18,26,42,0.1)] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-card">
            <h3 className="text-lg font-bold text-[#121A2A]">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-[#121A2A]/60">
              Layanan digital yang Anda cari tidak tersedia atau tautan sudah kedaluwarsa.
            </p>
            <Link href="/products">
              <Button size="sm" className="bg-[#121A2A] hover:bg-[#1c273d] text-[#F7F5EF] rounded-xl">
                Kembali ke Katalog
              </Button>
            </Link>
          </div>
        )}

        {/* Product Details Section */}
        {product && (
          <div className="space-y-12 sm:space-y-16">
            {/* TOP SECTION: 2 COLUMNS (LEFT: LARGE IMAGE & BENEFITS, RIGHT: PRODUCT INFO & ORDER ACTION) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* LEFT COLUMN: Large Product Image + Benefit Highlights (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-5">
                {/* Large Product Image Container */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl overflow-hidden relative shadow-card group">
                  <div className="relative aspect-[16/11] w-full bg-[#121A2A]/5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Top Action Buttons (Share & Wishlist) */}
                    <div className="absolute top-3.5 right-3.5 flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center text-[#121A2A]/70 hover:text-[#121A2A] transition-colors shadow-xs"
                        title="Bagikan Tautan Produk"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWishlisted(!isWishlisted);
                          showNotification(
                            !isWishlisted
                              ? 'Produk ditambahkan ke daftar favorit.'
                              : 'Produk dihapus dari daftar favorit.'
                          );
                        }}
                        className={`w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center transition-colors shadow-xs ${
                          isWishlisted ? 'text-[#C96F55]' : 'text-[#121A2A]/70 hover:text-[#121A2A]'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#C96F55]' : ''}`} />
                      </button>
                    </div>

                    {/* Out of Stock Overlay */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-[#121A2A]/75 backdrop-blur-[2px] flex items-center justify-center z-20">
                        <span className="text-xs font-bold text-[#F7F5EF] bg-[#DC2626]/95 px-3 py-1 rounded-lg shadow-xs">
                          Stok Habis
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Benefit Highlights (Under Image) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {product.guaranteeTitle || 'Garansi Penuh'}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {product.guaranteeDesc || 'Jaminan akun aktif 100%'}
                    </span>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {product.processTitle || 'Proses Instan'}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {product.processDesc || '1 - 15 menit selesai'}
                    </span>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {product.privacyTitle || 'Akun Private'}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {product.privacyDesc || 'Akses resmi & aman'}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Product Title, Pricing, Variant Selection, Quantity & Order Actions (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-3 pb-5 border-b border-[rgba(18,26,42,0.08)]">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider border-b border-[#C96F55]/30 pb-0.5">
                      {product.category?.name || 'Digital Service'}
                    </span>

                    <span
                      className={`text-xs font-semibold inline-flex items-center gap-1.5 ${
                        isOutOfStock ? 'text-[#DC2626]' : 'text-[#16A34A]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOutOfStock ? 'bg-[#DC2626]' : 'bg-[#16A34A]'
                        }`}
                      />
                      {isOutOfStock ? 'Stok Habis' : 'Stok Tersedia'}
                    </span>
                  </div>

                  {/* Product Title */}
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#121A2A] tracking-tight leading-snug">
                    {product.name}
                  </h1>

                  {/* Price */}
                  <div className="pt-1">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#121A2A] tracking-tight font-mono">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-[#121A2A]/60 mt-1">
                      Harga nett termasuk panduan aktivasi resmi & garansi penggantian penuh.
                    </p>
                  </div>
                </div>

                {/* ============================================================== */}
                {/* FEATURE 1 (IMAGE 1): PILIH NOMINAL / VARIAN WITH CAPSULE PILLS */}
                {/* ============================================================== */}
                {variants.length > 0 && (
                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
                    {/* Header: Circle 1, Title, SKU Badge */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(18,26,42,0.08)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-[rgba(201,111,85,0.12)] border border-[rgba(201,111,85,0.3)] text-[#C96F55] flex items-center justify-center text-xs font-black shrink-0">
                          1
                        </div>
                        <h2 className="text-sm sm:text-base font-black text-[#121A2A] tracking-tight">
                          Pilih Nominal / Varian
                        </h2>
                      </div>

                      {activeVariant && (
                        <span className="text-[10px] sm:text-xs font-mono font-semibold text-[#121A2A]/60 bg-[#121A2A]/5 px-2.5 py-1 rounded-md">
                          SKU: {activeVariant.id}
                        </span>
                      )}
                    </div>

                    {/* 1. PAKET / NOMINAL: */}
                    {availablePakets.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                          PAKET / NOMINAL:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availablePakets.map((pkt) => {
                            const isSelected = selectedPaket === pkt;
                            return (
                              <button
                                key={pkt}
                                type="button"
                                onClick={() => setSelectedPaket(pkt)}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.06)] text-[#121A2A] font-bold shadow-2xs'
                                    : 'border border-[rgba(18,26,42,0.14)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75 font-medium'
                                }`}
                              >
                                {pkt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 2. TIPE AKUN: */}
                    {availableTypes.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                          TIPE AKUN:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableTypes.map((tp) => {
                            const isSelected = selectedType === tp;
                            return (
                              <button
                                key={tp}
                                type="button"
                                onClick={() => setSelectedType(tp)}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.06)] text-[#121A2A] font-bold shadow-2xs'
                                    : 'border border-[rgba(18,26,42,0.14)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75 font-medium'
                                }`}
                              >
                                {tp}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 3. DURASI MASA AKTIF: */}
                    {availableDurations.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                          DURASI MASA AKTIF:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableDurations.map((dur) => {
                            const isSelected = selectedDuration === dur;
                            return (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => setSelectedDuration(dur)}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.06)] text-[#121A2A] font-bold shadow-2xs'
                                    : 'border border-[rgba(18,26,42,0.14)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75 font-medium'
                                }`}
                              >
                                {dur}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. PROTEKSI GARANSI: */}
                    {availableWarranties.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                          PROTEKSI GARANSI:
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableWarranties.map((war) => {
                            const isSelected = selectedWarranty === war;
                            return (
                              <button
                                key={war}
                                type="button"
                                onClick={() => setSelectedWarranty(war)}
                                className={`px-5 py-2 rounded-full text-xs sm:text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.06)] text-[#121A2A] font-bold shadow-2xs'
                                    : 'border border-[rgba(18,26,42,0.14)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75 font-medium'
                                }`}
                              >
                                {war}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="flex items-center justify-between py-3 border-t border-b border-[rgba(18,26,42,0.08)]">
                  <span className="text-xs font-bold text-[#121A2A]">Jumlah Pesanan:</span>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={quantity <= 1 || isOutOfStock}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </Button>
                    <span className="text-sm font-bold font-mono text-[#121A2A] w-6 text-center">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isOutOfStock || (product.stock !== undefined && quantity >= product.stock)}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* CTAs: Beli Sekarang & Tambah ke Keranjang */}
                <div className="space-y-3 pt-1">
                  <Button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="w-full text-xs sm:text-sm font-bold py-3.5 h-auto rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-sm active:scale-98 transition-all gap-2 cursor-pointer"
                  >
                    <span>{isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full text-xs sm:text-sm font-semibold border-[rgba(18,26,42,0.18)] hover:bg-white text-[#121A2A] py-3.5 h-auto gap-2 rounded-xl transition-all cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#C96F55]" />
                    <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
                  </Button>
                </div>

                {/* Security Trust Note */}
                <div className="pt-2 flex items-center gap-2 text-xs text-[#121A2A]/65">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>Aktivasi instan dan otomatis melalui integrasi sistem resmi Asterra Store.</span>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* FEATURE 2 (IMAGE 2): TABS (BENEFIT | GARANSI | DESKRIPSI)      */}
            {/* ============================================================== */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
              {/* Tab Navigation Pill Track (matching Image 2) */}
              <div className="bg-[#F1F3F5] rounded-full p-1 inline-flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('benefit')}
                  className={`rounded-full px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === 'benefit'
                      ? 'bg-white text-[#121A2A] font-bold shadow-xs'
                      : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
                  }`}
                >
                  Benefit
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('garansi')}
                  className={`rounded-full px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === 'garansi'
                      ? 'bg-white text-[#121A2A] font-bold shadow-xs'
                      : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
                  }`}
                >
                  Garansi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('deskripsi')}
                  className={`rounded-full px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                    activeTab === 'deskripsi'
                      ? 'bg-white text-[#121A2A] font-bold shadow-xs'
                      : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
                  }`}
                >
                  Deskripsi
                </button>
              </div>

              {/* Tab Contents */}
              <div className="pt-1 min-h-[140px]">
                {activeTab === 'benefit' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70">
                      Fitur Unggulan Yang Anda Dapatkan
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cleanFeatures.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'garansi' && (
                  <div className="space-y-3 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-[#16A34A] font-bold">
                      <ShieldCheck className="w-5 h-5" />
                      <span>Garansi Penggantian Penuh 100% Resmi Asterra Store</span>
                    </div>
                    <p>
                      Seluruh transaksi di Asterra Store dilindungi garansi penggantian resmi selama masa aktif paket yang Anda pilih. Jika akun mengalami hambatan atau kendala login, tim kami siap memproses pergantian akun baru dalam hitungan menit.
                    </p>
                    <p className="text-xs text-[#121A2A]/60">
                      *Klaim garansi mudah dan cepat, cukup konfirmasi nomor Invoice ke WhatsApp Admin CS Asterra Store.
                    </p>
                  </div>
                )}

                {activeTab === 'deskripsi' && (
                  <div className="space-y-3 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed animate-in fade-in duration-200 whitespace-pre-line">
                    <p>
                      {cleanHtmlContent(product.description) ||
                        'Layanan digital resmi terverifikasi dan bergaransi penuh di Asterra Store.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SPECIFICATION SECTION: INFORMASI & SPESIFIKASI LISENSI */}
            {product.specifications && product.specifications.length > 0 && (
              <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70 pb-3 border-b border-[rgba(18,26,42,0.08)]">
                  Informasi & Spesifikasi Lisensi
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-2">
                  {product.specifications.map((spec, idx) => (
                    <div
                      key={idx}
                      className="py-2.5 flex justify-between items-center text-xs sm:text-sm border-b border-[rgba(18,26,42,0.06)]"
                    >
                      <span className="text-[#121A2A]/60 font-medium">{spec.label}</span>
                      <span className="font-bold text-[#121A2A] text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ SECTION: ACCORDION WITH PLUS/MINUS ICONS */}
            {product.faqs && product.faqs.length > 0 && (
              <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
                <div className="pb-3 border-b border-[rgba(18,26,42,0.08)]">
                  <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55]">
                    Pusat Informasi
                  </h3>
                  <h2 className="text-base sm:text-xl font-black text-[#121A2A] mt-1">
                    Pertanyaan Umum (FAQ)
                  </h2>
                </div>

                <div className="space-y-3 pt-2">
                  {product.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-[rgba(18,26,42,0.08)] rounded-xl overflow-hidden transition-colors"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-bold text-[#121A2A]">
                            {faq.question}
                          </span>
                          <span className="w-6 h-6 rounded-lg bg-[rgba(18,26,42,0.05)] flex items-center justify-center text-[#121A2A]/70 shrink-0">
                            {isOpen ? (
                              <Minus className="w-3.5 h-3.5 text-[#C96F55]" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-[#121A2A]/70 border-t border-[rgba(18,26,42,0.06)] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECOMMENDED PRODUCTS SECTION (3 DESKTOP, 2 MOBILE) */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <div className="space-y-6 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-3 border-b border-[rgba(18,26,42,0.1)]">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-black text-[#121A2A] tracking-tight">
                      Rekomendasi Produk Lainnya
                    </h2>
                    <p className="text-xs text-[#121A2A]/60 mt-0.5">
                      Pilihan relevan yang paling sering dibeli bersama produk ini
                    </p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs font-bold text-[#C96F55] hover:text-[#B86047] inline-flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span>Lihat Semua Katalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* 3 cards per row desktop, 2 cards per row mobile */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                  {product.relatedProducts.map((rel) => {
                    const isSelected = cartItems.some((item) => item.id === rel.id);
                    const relProductItem: ProductItem = {
                      id: rel.id,
                      name: rel.name,
                      category: rel.category,
                      price: rel.price,
                      priceFormatted: rel.priceFormatted,
                      description: `Layanan digital resmi ${rel.name} bergaransi penuh.`,
                      features: ['Garansi Penggantian', 'Aktivasi Instan'],
                      status: 'active',
                      stock: rel.stock,
                      providerStatus: rel.providerStatus,
                      imageUrl: rel.imageUrl,
                      brand: rel.brand || rel.category?.name || 'Asterra',
                    };

                    return (
                      <ProductCard
                        key={rel.id}
                        product={relProductItem}
                        isSelected={isSelected}
                        onAddToCart={(p) => {
                          addItem({
                            id: p.id,
                            name: p.name,
                            category: p.category.name,
                            priceFormatted: p.priceFormatted,
                            priceNumeric: p.price,
                            stock: p.stock,
                            isOutOfStock: false,
                          });
                          showNotification(`${p.name} ditambahkan ke keranjang.`);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer onNotify={showNotification} />
    </div>
  );
}

export default ProductDetailClient;
