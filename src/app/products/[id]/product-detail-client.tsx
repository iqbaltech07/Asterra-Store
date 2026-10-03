'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/use-cart-store';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import {
  CheckCircle2,
  ShoppingCart,
  ShieldCheck,
  ArrowRight,
  Check,
  Plus,
  Minus,
  Share2,
  Heart,
  Star,
  Info,
  Lock,
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
  familyImageUrl?: string;
  familySlug?: string;
  rating?: string;
  soldCount?: number;
  variants?: ParsedVariant[];
  selectedVariant?: ParsedVariant;
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
}

interface ProductDetailClientProps {
  id: string;
  initialData?: ProductDetailData | null;
}

export function ProductDetailClient({ id, initialData }: ProductDetailClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();
  const { items: cartItems, addItem } = useCartStore();

  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'benefit' | 'garansi' | 'deskripsi'>('benefit');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Buyer Info (STEP 2)
  const [customerName, setCustomerName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  // Pre-fill buyer info from auth session or localStorage
  useEffect(() => {
    const authUser = session?.user || legacyUser;
    if (authUser) {
      if (authUser.name) setCustomerName(authUser.name);
      if (authUser.email) setTargetEmail(authUser.email);
    } else if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('asterra_buyer_info');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) setCustomerName(parsed.name);
          if (parsed.email) setTargetEmail(parsed.email);
        }
      } catch {}
    }
  }, [session, legacyUser]);

  // Fetch product data via React Query (uses initialData for zero-delay hydration)
  const { data } = useQuery<{ success: boolean; data: ProductDetailData }>({
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
    if (variants.length === 0) return ['Standard'];
    const set = new Set<string>();
    variants.forEach((v) => set.add(v.paket));
    return Array.from(set);
  }, [variants]);

  // Initial selection derived from product.selectedVariant or first available
  const [selectedPaket, setSelectedPaket] = useState<string>(() => {
    return product?.selectedVariant?.paket || availablePakets[0] || 'Standard';
  });

  // When variants load, ensure selectedPaket is valid
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

  // Dynamic price & availability
  const currentPrice = activeVariant ? activeVariant.price : (product?.price || 0);
  const totalPrice = currentPrice * quantity;
  const isOutOfStock = activeVariant
    ? activeVariant.isOutOfStock
    : product
    ? (product.stock !== undefined && product.stock <= 0) || product.status === 'out_of_stock'
    : false;

  // 9. Sync URL with selected Variant SKU without full-page reload
  useEffect(() => {
    if (!activeVariant?.id || typeof window === 'undefined') return;
    const currentSlug = window.location.pathname.split('/').filter(Boolean).pop();
    if (currentSlug && currentSlug !== activeVariant.id) {
      window.history.replaceState(null, '', `/products/${activeVariant.id}`);
    }
  }, [activeVariant?.id]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleAddToCart = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, varian ${activeVariant?.name || product?.name || ''} saat ini habis.`);
      return;
    }

    const itemToAdd = {
      id: activeVariant?.id || product.id,
      name: activeVariant?.name || `${product.name} (${selectedDuration})`,
      category: product.category?.name || 'Digital Service',
      priceFormatted: `Rp ${currentPrice.toLocaleString('id-ID')}`,
      priceNumeric: currentPrice,
      stock: activeVariant?.stock ?? product.stock,
      isOutOfStock: false,
    };

    for (let i = 0; i < quantity; i++) {
      addItem(itemToAdd);
    }
    showNotification(`Berhasil menambahkan ${quantity}x ${itemToAdd.name} ke keranjang.`);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, varian ${activeVariant?.name || product?.name || ''} saat ini habis.`);
      return;
    }

    // Save buyer info to localStorage for Checkout page pre-fill
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'asterra_buyer_info',
          JSON.stringify({
            name: customerName.trim(),
            email: targetEmail.trim(),
          })
        );
      } catch {}
    }

    handleAddToCart();
    router.push('/checkout');
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      showNotification('Tautan varian produk berhasil disalin ke papan klip!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
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

      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 w-full overflow-hidden">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#121A2A]/60 mb-5 sm:mb-7 overflow-hidden">
          <Link href="/" className="hover:text-[#121A2A] transition-colors shrink-0">
            Beranda
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <Link href="/products" className="hover:text-[#121A2A] transition-colors shrink-0">
            Katalog Produk
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <span className="text-[#121A2A] font-semibold truncate max-w-[200px] sm:max-w-md">
            {product?.name || 'Detail Produk'}
          </span>
        </nav>

        {/* Product Container */}
        {product && (
          <div className="space-y-10 sm:space-y-14">
            {/* TOP SECTION: 2 COLUMNS (LEFT: BRAND INFO & TABS, RIGHT: VARIANT SELECTION & BUYER DATA) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-10 items-start">
              {/* ============================================================== */}
              {/* LEFT COLUMN: Logo/Image, Name, Rating, Ready, Garansi, Tabs */}
              {/* ============================================================== */}
              <div className="lg:col-span-5 space-y-4">
                {/* Product Header Card */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
                  {/* Logo + Share/Wishlist Header */}
                  <div className="flex items-start justify-between gap-3">
                    {/* App / Brand Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#121A2A]/5 border border-[rgba(18,26,42,0.08)] flex items-center justify-center p-2 overflow-hidden shrink-0 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.familyImageUrl || product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-lg bg-[#121A2A]/5 hover:bg-[#121A2A]/10 text-[#121A2A]/70 hover:text-[#121A2A] flex items-center justify-center transition-colors cursor-pointer"
                        title="Bagikan Tautan Produk"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWishlisted(!isWishlisted);
                          showNotification(!isWishlisted ? 'Disimpan ke favorit.' : 'Dihapus dari favorit.');
                        }}
                        className={`w-8 h-8 rounded-lg bg-[#121A2A]/5 hover:bg-[#121A2A]/10 flex items-center justify-center transition-colors cursor-pointer ${
                          isWishlisted ? 'text-[#C96F55]' : 'text-[#121A2A]/70 hover:text-[#121A2A]'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#C96F55]' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Product Title */}
                  <div>
                    <span className="text-[11px] font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
                      {product.category?.name || 'Layanan Digital'}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-[#121A2A] tracking-tight leading-snug">
                      {product.name}
                    </h1>
                  </div>

                  {/* Rating + Jumlah Terjual */}
                  <div className="flex items-center gap-2 pt-0.5 pb-1 border-b border-[rgba(18,26,42,0.06)] text-xs text-[#121A2A]/70">
                    <div className="flex items-center gap-1 font-semibold text-[#121A2A]">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{product.rating || '5.0'}</span>
                    </div>
                    <span className="text-[#121A2A]/30">·</span>
                    <span className="font-medium text-[#121A2A]/60">
                      {(product.soldCount || 850).toLocaleString('id-ID')}+ Terjual
                    </span>
                  </div>

                  {/* Status Badges: Ready & Garansi */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>Ready Stock</span>
                    </span>

                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>100% Bergaransi</span>
                    </span>
                  </div>
                </div>

                {/* Tabs: Benefit | Garansi | Deskripsi */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
                  {/* Tab Navigation Buttons */}
                  <div className="grid grid-cols-3 gap-1 bg-[#121A2A]/5 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveTab('benefit')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === 'benefit'
                          ? 'bg-white text-[#121A2A] shadow-xs'
                          : 'text-[#121A2A]/65 hover:text-[#121A2A]'
                      }`}
                    >
                      Benefit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('garansi')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === 'garansi'
                          ? 'bg-white text-[#121A2A] shadow-xs'
                          : 'text-[#121A2A]/65 hover:text-[#121A2A]'
                      }`}
                    >
                      Garansi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('deskripsi')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                        activeTab === 'deskripsi'
                          ? 'bg-white text-[#121A2A] shadow-xs'
                          : 'text-[#121A2A]/65 hover:text-[#121A2A]'
                      }`}
                    >
                      Deskripsi
                    </button>
                  </div>

                  {/* Tab Contents */}
                  <div className="pt-1 min-h-[140px]">
                    {activeTab === 'benefit' && (
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        <ul className="space-y-2">
                          {(product.features && product.features.length > 0
                            ? product.features
                                .map(cleanHtmlContent)
                                .flatMap((f) => f.split('\n'))
                                .map((s) => s.replace(/^[•\-\*]\s*/, '').trim())
                                .filter(Boolean)
                            : [
                                'Akses fitur premium resmi tanpa batasan kuota',
                                'Aktivasi otomatis & cepat (1 - 15 Menit)',
                                'Proteksi garansi penggantian penuh jika terkendala',
                                'Bimbingan dan bantuan customer support via WhatsApp',
                              ]
                          ).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-[#121A2A]/85 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#C96F55] shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === 'garansi' && (
                      <div className="space-y-2.5 text-xs text-[#121A2A]/85 leading-relaxed animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#16A34A] font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Garansi Penggantian Penuh 100%</span>
                        </div>
                        <p>
                          Semua pesanan dilindungi jaminan garansi Asterra Store selama masa durasi paket aktif.
                          Jika akun mengalami kendala teknis atau reset dari pihak penyedia, kami akan memberikan
                          akun pengganti baru atau perbaikan secara gratis.
                        </p>
                        <p className="text-[11px] text-[#121A2A]/60">
                          *Cukup hubungi WhatsApp Customer Service dengan menyertakan Nomor Invoice pesanan Anda.
                        </p>
                      </div>
                    )}

                    {activeTab === 'deskripsi' && (
                      <div className="space-y-2 text-xs text-[#121A2A]/85 leading-relaxed animate-in fade-in duration-200 whitespace-pre-line">
                        <p>{cleanHtmlContent(product.description) || 'Layanan digital resmi terverifikasi dan bergaransi penuh di Asterra Store.'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ============================================================== */}
              {/* RIGHT COLUMN: STEP 1 (Variant Selection) + STEP 2 (Buyer Data) */}
              {/* ============================================================== */}
              <div className="lg:col-span-7 space-y-6">
                {/* STEP 1: Pilih Nominal / Varian */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 shadow-card space-y-5">
                  <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(18,26,42,0.08)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-[rgba(201,111,85,0.12)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-black">
                        1
                      </div>
                      <h2 className="text-sm sm:text-base font-black text-[#121A2A] tracking-tight">
                        Pilih Nominal / Varian
                      </h2>
                    </div>

                    {activeVariant && (
                      <span className="text-[10px] sm:text-[11px] font-mono font-semibold text-[#121A2A]/50 bg-[#121A2A]/5 px-2 py-0.5 rounded">
                        SKU: {activeVariant.id}
                      </span>
                    )}
                  </div>

                  {/* 1. Pilihan Paket / Nominal */}
                  {availablePakets.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                        Paket / Nominal:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {availablePakets.map((pkt) => {
                          const isSelected = selectedPaket === pkt;
                          return (
                            <button
                              key={pkt}
                              type="button"
                              onClick={() => setSelectedPaket(pkt)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#C96F55] bg-[rgba(201,111,85,0.08)] ring-1 ring-[#C96F55] text-[#121A2A]'
                                  : 'border-[rgba(18,26,42,0.1)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75'
                              }`}
                            >
                              <span className="block text-xs font-bold truncate">{pkt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Pilihan Type (Private / Shared / Anggota) */}
                  {availableTypes.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                        Tipe Akun:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableTypes.map((tp) => {
                          const isSelected = selectedType === tp;
                          return (
                            <button
                              key={tp}
                              type="button"
                              onClick={() => setSelectedType(tp)}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#C96F55] bg-[rgba(201,111,85,0.08)] ring-1 ring-[#C96F55] text-[#121A2A]'
                                  : 'border-[rgba(18,26,42,0.1)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75'
                              }`}
                            >
                              {tp}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Pilihan Duration (1 Bulan, 6 Bulan, 1 Tahun, dst) */}
                  {availableDurations.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                        Durasi Masa Aktif:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableDurations.map((dur) => {
                          const isSelected = selectedDuration === dur;
                          return (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => setSelectedDuration(dur)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#C96F55] bg-[rgba(201,111,85,0.08)] ring-1 ring-[#C96F55] text-[#121A2A]'
                                  : 'border-[rgba(18,26,42,0.1)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75'
                              }`}
                            >
                              <span className="block text-xs font-bold">{dur}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. Pilihan Garansi (Garansi 1 Bulan, 6 Bulan, dst) */}
                  {availableWarranties.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                        Proteksi Garansi:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {availableWarranties.map((gar) => {
                          const isSelected = selectedWarranty === gar;
                          return (
                            <button
                              key={gar}
                              type="button"
                              onClick={() => setSelectedWarranty(gar)}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-[#C96F55] bg-[rgba(201,111,85,0.08)] ring-1 ring-[#C96F55] text-[#121A2A]'
                                  : 'border-[rgba(18,26,42,0.1)] bg-white hover:border-[#C96F55]/50 text-[#121A2A]/75'
                              }`}
                            >
                              {gar ? `Garansi ${gar}` : 'Garansi Standar'}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Variant Summary & Price Banner */}
                  <div className="p-3.5 rounded-xl bg-[#F7F5EF] border border-[rgba(18,26,42,0.06)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-[11px] text-[#121A2A]/60 block">Harga Varian Terpilih:</span>
                      <span className="text-xl sm:text-2xl font-black text-[#121A2A] font-mono">
                        Rp {currentPrice.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                        <Check className="w-3 h-3" />
                        <span>Aktivasi Instan</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEP 2: Masukkan Data Pembeli */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-[rgba(18,26,42,0.08)]">
                    <div className="w-6 h-6 rounded-lg bg-[rgba(201,111,85,0.12)] border border-[rgba(201,111,85,0.25)] text-[#C96F55] flex items-center justify-center text-xs font-black">
                      2
                    </div>
                    <h2 className="text-sm sm:text-base font-black text-[#121A2A] tracking-tight">
                      Masukkan Data Pembeli
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Input Nama Lengkap */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#121A2A]">
                        Nama Lengkap <span className="text-[#C96F55]">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="contoh: Budi Santoso"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-xl text-[#121A2A]"
                      />
                    </div>

                    {/* Input Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#121A2A]">
                        Alamat Email Tujuan <span className="text-[#C96F55]">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="contoh: akun_anda@gmail.com"
                        value={targetEmail}
                        onChange={(e) => setTargetEmail(e.target.value)}
                        className="bg-white border-[rgba(18,26,42,0.12)] text-xs sm:text-sm font-medium rounded-xl text-[#121A2A]"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-[#121A2A]/55 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 shrink-0 text-[#C96F55]" />
                    <span>Kredensial dan petunjuk aktivasi otomatis dikirimkan ke email yang Anda masukkan.</span>
                  </p>
                </div>

                {/* Quantity & Order Actions Card */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
                  {/* Quantity selector & total price */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(18,26,42,0.08)]">
                    <div>
                      <span className="text-xs font-bold text-[#121A2A] block">Jumlah Pesanan:</span>
                      <span className="text-[11px] text-[#121A2A]/50">Maks. stok tersedia</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={quantity <= 1 || isOutOfStock}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] cursor-pointer"
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
                        disabled={isOutOfStock}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Amount */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#121A2A]/70 uppercase tracking-wider">
                      Total Pembayaran:
                    </span>
                    <span className="text-2xl font-black text-[#121A2A] font-mono">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* CTAs: Beli Sekarang & Tambah ke Keranjang */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
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
                      className="w-full text-xs sm:text-sm font-semibold border-[rgba(18,26,42,0.18)] hover:bg-[#121A2A]/5 text-[#121A2A] py-3.5 h-auto gap-2 rounded-xl transition-all cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 text-[#C96F55]" />
                      <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
                    </Button>
                  </div>

                  <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-[#121A2A]/50">
                    <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
                    <span>Transaksi terenkripsi aman & aktivasi otomatis via Asterra Gateway</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATION SECTION */}
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

            {/* FAQ SECTION */}
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

            {/* RECOMMENDED PRODUCTS SECTION */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <div className="space-y-5 pt-2">
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
