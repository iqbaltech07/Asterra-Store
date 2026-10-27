'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/use-cart-store';
import { appendReferralParams } from '@/lib/utils/referral';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useSession } from '@/lib/auth-client';
import { useAuthStore } from '@/store/use-auth-store';
import { AuthRequiredModal } from '@/components/auth/auth-required-modal';
import {
  faCircleCheck,
  faBolt,
  faShieldHalved,
  faClock,
  faArrowRight,
  faCheck,
  faPlus,
  faMinus,
  faShareNodes,
  faHeart,
} from '@fortawesome/free-solid-svg-icons';
import { useActiveCampaigns } from '@/lib/hooks/use-active-campaigns';
import { calculateCampaignPrice, getCampaignCountdown } from '@/lib/utils/promo-pricing';
import { isProductOutOfStock } from '@/lib/products-data';
import { ParsedVariant } from '@/lib/services/product-variant-parser';
import { saveRecentlyViewed } from '@/lib/services/recently-viewed';
import { animateProductDetailPage } from '@/lib/animations/gsap-utils';
import type {
  DurationOption,
  SpecItem,
  FaqItem,
  RelatedProduct,
  ProductDetailData,
  ProductDetailClientProps,
  VariantDetails,
} from '@/components/products/product-detail/types';
import { getVariantDetails } from '@/components/products/product-detail/variant-helper';
import { ProductDetailTabs } from '@/components/products/product-detail/product-detail-tabs';
import { ProductDetailSpecs } from '@/components/products/product-detail/product-detail-specs';
import { ProductDetailFaqs } from '@/components/products/product-detail/product-detail-faqs';
import { ProductDetailRelated } from '@/components/products/product-detail/product-detail-related';

export type {
  DurationOption,
  SpecItem,
  FaqItem,
  RelatedProduct,
  ProductDetailData,
  ProductDetailClientProps,
  VariantDetails,
};

export function ProductDetailClient({ id, initialData }: ProductDetailClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefit' | 'garansi' | 'deskripsi'>('deskripsi');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [countdownText, setCountdownText] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
    router.prefetch('/checkout');
  }, [router]);

  const { addItem, clearCart } = useCartStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { data: session } = useSession();
  const { user: legacyUser } = useAuthStore();
  const isAuthenticated = Boolean(session?.user || legacyUser);

  const { data, isLoading, error } = useQuery<{ success: boolean; data: ProductDetailData }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error('Produk tidak ditemukan');
      return res.json();
    },
    initialData: initialData ? { success: true, data: initialData } : undefined,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const product = data?.data;
  const variants = useMemo(() => product?.variants || [], [product?.variants]);

  // Dimension states
  const [selectedPaket, setSelectedPaket] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedWarranty, setSelectedWarranty] = useState<string>('');

  // ONE-TIME INITIALIZATION: Only initialize when product.id changes (prevents rogue resets)
  const initializedProductIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (product && product.id !== initializedProductIdRef.current) {
      initializedProductIdRef.current = product.id;
      const initial = product.selectedVariant || variants[0];
      if (initial) {
        setSelectedPaket(initial.paket);
        setSelectedType(initial.type);
        setSelectedDuration(initial.duration);
        setSelectedWarranty(initial.warranty);
      }
    }
  }, [product, variants]);

  // Persist to Recently Viewed (localStorage)
  useEffect(() => {
    if (product) {
      saveRecentlyViewed({
        id: product.id,
        name: product.name,
        slug: id,
        categoryName: product.category?.name,
        price: product.price,
        priceFormatted: product.priceFormatted,
        imageUrl: product.imageUrl,
        brand: product.brand,
        rating: product.rating,
      });
    }
  }, [product, id]);

  const productContainerRef = useRef<HTMLDivElement>(null);

  // Isomorphic layout effect executes synchronously before paint, eliminating FOUC / flash of content
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

  // Synchronize 15-phase GSAP choreography with React data availability & route changes
  useIsomorphicLayoutEffect(() => {
    if (!product || !productContainerRef.current) return;
    const cleanup = animateProductDetailPage(productContainerRef.current);
    return () => {
      cleanup?.();
    };
  }, [id, product?.id]);

  // All available Pakets across all variants
  const availablePakets = useMemo(() => {
    return Array.from(new Set(variants.map((v) => v.paket)));
  }, [variants]);

  // All available Types for current Paket (or all variants if none)
  const availableTypes = useMemo(() => {
    const matchingPaket = variants.filter((v) => v.paket === selectedPaket);
    const types = Array.from(new Set((matchingPaket.length > 0 ? matchingPaket : variants).map((v) => v.type)));
    return types;
  }, [variants, selectedPaket]);

  // All available Durations for current Paket + Type
  const availableDurations = useMemo(() => {
    const matchingType = variants.filter((v) => v.paket === selectedPaket && v.type === selectedType);
    if (matchingType.length > 0) {
      return Array.from(new Set(matchingType.map((v) => v.duration)));
    }
    const matchingOnlyType = variants.filter((v) => v.type === selectedType);
    if (matchingOnlyType.length > 0) {
      return Array.from(new Set(matchingOnlyType.map((v) => v.duration)));
    }
    return Array.from(new Set(variants.map((v) => v.duration)));
  }, [variants, selectedPaket, selectedType]);

  // All available Warranties for current Paket + Type + Duration
  const availableWarranties = useMemo(() => {
    const matchingDuration = variants.filter(
      (v) => v.paket === selectedPaket && v.type === selectedType && v.duration === selectedDuration
    );
    if (matchingDuration.length > 0) {
      return Array.from(new Set(matchingDuration.map((v) => v.warranty)));
    }
    const matchingType = variants.filter((v) => v.type === selectedType);
    if (matchingType.length > 0) {
      return Array.from(new Set(matchingType.map((v) => v.warranty)));
    }
    return Array.from(new Set(variants.map((v) => v.warranty)));
  }, [variants, selectedPaket, selectedType, selectedDuration]);

  // SELECTION HANDLERS: Deterministic and user-driven
  const handleSelectPaket = (pkt: string) => {
    setSelectedPaket(pkt);
    const match =
      variants.find(
        (v) =>
          v.paket === pkt &&
          v.type === selectedType &&
          v.duration === selectedDuration &&
          v.warranty === selectedWarranty
      ) ||
      variants.find((v) => v.paket === pkt && v.type === selectedType && v.duration === selectedDuration) ||
      variants.find((v) => v.paket === pkt && v.type === selectedType) ||
      variants.find((v) => v.paket === pkt);

    if (match) {
      setSelectedType(match.type);
      setSelectedDuration(match.duration);
      setSelectedWarranty(match.warranty);
    }
  };

  const handleSelectType = (tp: string) => {
    setSelectedType(tp);
    const match =
      variants.find(
        (v) =>
          v.type === tp &&
          v.paket === selectedPaket &&
          v.duration === selectedDuration &&
          v.warranty === selectedWarranty
      ) ||
      variants.find((v) => v.type === tp && v.paket === selectedPaket && v.duration === selectedDuration) ||
      variants.find((v) => v.type === tp && v.paket === selectedPaket) ||
      variants.find((v) => v.type === tp);

    if (match) {
      setSelectedPaket(match.paket);
      setSelectedDuration(match.duration);
      setSelectedWarranty(match.warranty);
    }
  };

  const handleSelectDuration = (dur: string) => {
    setSelectedDuration(dur);
    const match =
      variants.find(
        (v) =>
          v.duration === dur &&
          v.paket === selectedPaket &&
          v.type === selectedType &&
          v.warranty === selectedWarranty
      ) ||
      variants.find((v) => v.duration === dur && v.paket === selectedPaket && v.type === selectedType) ||
      variants.find((v) => v.duration === dur && v.type === selectedType) ||
      variants.find((v) => v.duration === dur);

    if (match) {
      setSelectedPaket(match.paket);
      setSelectedType(match.type);
      setSelectedWarranty(match.warranty);
    }
  };

  const handleSelectWarranty = (war: string) => {
    setSelectedWarranty(war);
    const match =
      variants.find(
        (v) =>
          v.warranty === war &&
          v.paket === selectedPaket &&
          v.type === selectedType &&
          v.duration === selectedDuration
      ) ||
      variants.find((v) => v.warranty === war && v.paket === selectedPaket && v.type === selectedType) ||
      variants.find((v) => v.warranty === war && v.type === selectedType) ||
      variants.find((v) => v.warranty === war);

    if (match) {
      setSelectedPaket(match.paket);
      setSelectedType(match.type);
      setSelectedDuration(match.duration);
    }
  };

  // FINAL RESOLVED ACTIVE VARIANT
  const activeVariant: ParsedVariant | null = useMemo(() => {
    if (variants.length === 0) return null;
    const exact = variants.find(
      (v) =>
        v.paket === selectedPaket &&
        v.type === selectedType &&
        v.duration === selectedDuration &&
        v.warranty === selectedWarranty
    );
    if (exact) return exact;

    const match3 = variants.find(
      (v) => v.paket === selectedPaket && v.type === selectedType && v.duration === selectedDuration
    );
    if (match3) return match3;

    const match2 = variants.find((v) => v.paket === selectedPaket && v.type === selectedType);
    if (match2) return match2;

    const matchType = variants.find((v) => v.type === selectedType);
    if (matchType) return matchType;

    return variants[0];
  }, [variants, selectedPaket, selectedType, selectedDuration, selectedWarranty]);

  // Dynamic details tailored per variant (type, duration, warranty)
  const variantDetails = useMemo(() => {
    return getVariantDetails(activeVariant, product);
  }, [activeVariant, product]);

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

  // Genuine Active Campaigns for live strike-through price and promotional badges (shared query cache)
  const { campaigns: activeCampaigns } = useActiveCampaigns();

  const campaignPrice = useMemo(() => {
    return calculateCampaignPrice(
      totalPrice,
      {
        id: product?.id,
        slug: (product as unknown as { slug?: string })?.slug || id,
        category: product?.category?.name,
        name: product?.name,
      },
      activeCampaigns
    );
  }, [totalPrice, product, id, activeCampaigns]);

  // Real-time promo countdown timer synchronized with campaign expiration
  useEffect(() => {
    if (!campaignPrice.hasPromo || !campaignPrice.endsAt) {
      setCountdownText('');
      return;
    }

    const updateCountdown = () => {
      const cd = getCampaignCountdown(campaignPrice.endsAt, campaignPrice.startsAt);
      if (cd.isExpired) {
        setCountdownText('Promo telah berakhir');
        queryClient.invalidateQueries({ queryKey: ['active-campaigns'] });
      } else {
        setCountdownText(cd.countdownText);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [campaignPrice.hasPromo, campaignPrice.endsAt, campaignPrice.startsAt, queryClient]);

  const isOutOfStock =
    isProductOutOfStock(product) ||
    (activeVariant !== null && activeVariant.isOutOfStock);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };


  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!product || isOutOfStock) {
      showNotification(`Maaf, stok produk ${variantDetails.title} saat ini habis.`);
      return;
    }
    clearCart();
    const finalId = activeVariant ? activeVariant.id : product.id;
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: finalId,
        name: variantDetails.title,
        category: product.category.name,
        priceFormatted: `Rp ${currentPrice.toLocaleString('id-ID')}`,
        priceNumeric: currentPrice,
        stock: activeVariant?.stock ?? product.stock,
        isOutOfStock: false,
      });
    }
    router.push(appendReferralParams('/checkout'));
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      showNotification('Tautan produk berhasil disalin ke papan klip!');
    }
  };

  return (
    <div ref={productContainerRef} className="min-h-screen bg-[#FDFBF7] text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      {/* Floating Toast Notification */}
      {notification && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 max-w-[90vw] sm:max-w-md">
          <div className="bg-[#121A2A] border border-white/15 text-white px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
              <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
            </div>
            <p className="text-xs font-medium leading-tight">{notification}</p>
          </div>
        </div>
      )}

      {/* Main Container - responsive mobile & desktop padding */}
      <main className="flex-1 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 w-full overflow-x-hidden pb-24 sm:pb-12">
        {/* Breadcrumb Navigation - horizontally scrollable on small screens */}
        <nav aria-label="Breadcrumb" data-gsap="product-breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-[#121A2A]/60 mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          <Link href="/" className="hover:text-[#121A2A] transition-colors shrink-0">
            Beranda
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <Link href="/products" className="hover:text-[#121A2A] transition-colors shrink-0">
            Katalog Produk
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <span className="text-[#121A2A] font-semibold truncate max-w-[150px] sm:max-w-md">
            {variantDetails.title}
          </span>
        </nav>

        {/* Loading State */}
        {isLoading && !product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 animate-pulse">
            <div className="lg:col-span-7 h-80 sm:h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
            <div className="lg:col-span-5 h-80 sm:h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {error && !product && (
          <div className="bg-white border border-[rgba(18,26,42,0.1)] rounded-2xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-8 sm:my-12 shadow-card">
            <h3 className="text-base sm:text-lg font-bold text-[#121A2A]">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-[#121A2A]/60">
              Layanan digital yang Anda cari tidak tersedia atau tautan sudah kedaluwarsa.
            </p>
            <Link href="/products">
              <Button size="sm" className="bg-[#121A2A] hover:bg-[#1c273d] text-[#F7F5EF] rounded-xl text-xs">
                Kembali ke Katalog
              </Button>
            </Link>
          </div>
        )}

        {/* Product Details Section */}
        {product && (
          <div className="space-y-8 sm:space-y-12">
            {/* TOP SECTION: 2 COLUMNS (LEFT: LARGE IMAGE BANNER & BENEFITS & DESC, RIGHT: STICKY ORDER & VARIANTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 items-start">
              {/* LEFT COLUMN: Large Product Banner + 3 Chips + Description/Tabs (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6">
                {/* Large Product Banner Card (Matching user Image 1) */}
                <div data-gsap="product-image" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl overflow-hidden relative shadow-card group">
                  <div className="relative h-56 sm:h-72 md:h-96 w-full bg-[#121A2A]/5 overflow-hidden">
                    <Image
                      src={activeVariant?.imageUrl || product.imageUrl}
                      alt={variantDetails.title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 700px"
                      className="object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121A2A]/90 via-[#121A2A]/30 to-transparent pointer-events-none" />

                    {/* Top Action Badges */}
                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex gap-1.5 sm:gap-2 flex-wrap z-10">
                      <span data-gsap="product-category" className="bg-white/95 backdrop-blur-xs text-[#121A2A] text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-[rgba(18,26,42,0.08)] shadow-xs">
                        {product.category?.name || 'Apps & Streaming'}
                      </span>
                      <span className="bg-[#C96F55] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs">
                        Paling Populer
                      </span>
                      {isOutOfStock && (
                        <span className="bg-[#DC2626] text-white text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg shadow-xs">
                          Stok Habis
                        </span>
                      )}
                    </div>

                    {/* Top Action Buttons (Share & Wishlist) */}
                    <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-1.5 sm:gap-2 z-10">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center text-[#121A2A]/70 hover:text-[#121A2A] transition-colors shadow-xs cursor-pointer active:scale-95"
                        title="Bagikan Tautan Produk"
                      >
                        <FontAwesomeIcon icon={faShareNodes} className="w-3.5 h-3.5" />
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
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center transition-colors shadow-xs cursor-pointer active:scale-95 ${
                          isWishlisted ? 'text-[#C96F55]' : 'text-[#121A2A]/70 hover:text-[#121A2A]'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <FontAwesomeIcon icon={faHeart} className={`w-3.5 h-3.5 ${isWishlisted ? 'text-[#C96F55]' : ''}`} />
                      </button>
                    </div>

                    {/* Banner Title & Category Subtitle */}
                    <div className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 right-3 sm:right-6 z-10">
                      <span data-gsap="product-category" className="text-[10px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-0.5 sm:mb-1">
                        LISENSI DIGITAL RESMI
                      </span>
                      <h1
                        key={variantDetails.title}
                        data-gsap="product-title"
                        className="text-base sm:text-2xl lg:text-3xl font-black text-white tracking-tight line-clamp-2 drop-shadow-xs leading-snug animate-text-smooth"
                      >
                        {variantDetails.title}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* 3 Benefit Highlights (Under Image - Responsive for mobile) */}
                <div
                  key={variantDetails.title}
                  className="grid grid-cols-3 gap-2 sm:gap-3 animate-text-smooth"
                >
                  <div data-gsap="product-meta" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1 shadow-2xs">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-1 sm:mb-2">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.guaranteeTitle}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#121A2A]/60 block leading-tight line-clamp-1 sm:line-clamp-2">
                      {variantDetails.guaranteeDesc}
                    </span>
                  </div>

                  <div data-gsap="product-meta" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1 shadow-2xs">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-1 sm:mb-2">
                      <FontAwesomeIcon icon={faClock} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.processTitle}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#121A2A]/60 block leading-tight line-clamp-1 sm:line-clamp-2">
                      {variantDetails.processDesc}
                    </span>
                  </div>

                  <div data-gsap="product-meta" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-2.5 sm:p-3.5 space-y-0.5 sm:space-y-1 shadow-2xs">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-1 sm:mb-2">
                      <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.privacyTitle}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-[#121A2A]/60 block leading-tight line-clamp-1 sm:line-clamp-2">
                      {variantDetails.privacyDesc}
                    </span>
                  </div>
                </div>

                {/* DESKRIPSI LAYANAN & FITUR UNGGULAN CARD (Dynamic per variant + Capsule Tabs) */}
                <ProductDetailTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  variantDetails={variantDetails}
                />
              </div>

              {/* RIGHT COLUMN: PILIHAN PAKET BERLANGGANAN & VARIAN PILLS (Matching user Image 1 & 2) (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-4 sm:space-y-6">
                <div data-gsap="product-order-box" className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl sm:rounded-2xl p-4 sm:p-7 shadow-card space-y-4 sm:space-y-5 lg:sticky lg:top-24">
                  {/* Top Header: PILIHAN PAKET BERLANGGANAN & Stok Badge */}
                  <div className="flex items-center justify-between pb-3 sm:pb-3.5 border-b border-[rgba(18,26,42,0.08)]">
                    <span className="text-[11px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider">
                      PILIHAN PAKET BERLANGGANAN
                    </span>

                    <span
                      className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                        isOutOfStock
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : 'bg-[#DCFCE7] text-[#16A34A]'
                      }`}
                    >
                      {isOutOfStock ? 'Stok Habis' : `Stok Tersedia (${activeVariant?.stock ?? 100})`}
                    </span>
                  </div>

                  {/* Promo Callout Banner for Discounted Products */}
                  {campaignPrice.hasPromo && (
                    <div className="bg-gradient-to-br from-[#FFF5F3] via-[#FEF2F2] to-white border border-[#DC2626]/25 rounded-2xl p-3.5 sm:p-4 mb-3 space-y-2.5 shadow-xs select-none">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg">🔥</span>
                            <span className="text-sm sm:text-base font-black text-[#121A2A] tracking-tight">
                              {campaignPrice.campaignName || 'Promo Spesial Asterra'}
                            </span>
                          </div>
                          <p className="text-[11px] sm:text-xs text-[#121A2A]/70">
                            Diskon khusus <strong className="text-[#DC2626]">{campaignPrice.discountBadge}</strong> berlaku untuk seluruh pesanan yang memenuhi syarat.
                          </p>
                        </div>
                        <span className="text-[10px] sm:text-xs font-black text-white bg-gradient-to-r from-[#DC2626] to-[#C96F55] px-2.5 py-1 rounded-lg shadow-2xs shrink-0">
                          {campaignPrice.discountBadge}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[rgba(220,38,38,0.12)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                        {campaignPrice.periodFormatted && (
                          <div className="flex items-center gap-1.5 text-[#121A2A]/75">
                            <FontAwesomeIcon icon={faClock} className="w-3 h-3 text-[#C96F55]" />
                            <span>Periode promo: <strong className="text-[#121A2A] font-semibold">{campaignPrice.periodFormatted}</strong></span>
                          </div>
                        )}
                        {isMounted && countdownText && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#DC2626]/10 text-[#DC2626] font-semibold text-[11px] border border-[#DC2626]/20">
                            <span className="font-mono font-bold tracking-tight">⏳ {countdownText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Price Header */}
                  <div>
                    {campaignPrice.hasPromo ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm text-[#121A2A]/50 font-medium">
                            Harga normal: <span className="line-through font-semibold text-[#121A2A]/60">{campaignPrice.originalPriceFormatted}</span>
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-black text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/25 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                            {campaignPrice.discountBadge}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-bold text-[#C96F55] bg-[rgba(201,111,85,0.08)] px-2 py-0.5 rounded-md">
                            {campaignPrice.savingsText}
                          </span>
                        </div>
                        <div
                          key={campaignPrice.discountedPrice}
                          data-gsap="product-price"
                          className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#DC2626] sm:text-[#C96F55] font-mono tracking-tight animate-text-smooth flex items-baseline gap-2"
                        >
                          <span>{campaignPrice.discountedPriceFormatted}</span>
                          <span className="text-xs font-sans font-medium text-[#121A2A]/50">/ paket</span>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={totalPrice}
                        data-gsap="product-price"
                        className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#121A2A] font-mono tracking-tight animate-text-smooth"
                      >
                        Rp {totalPrice.toLocaleString('id-ID')}
                      </div>
                    )}
                    <p className="text-[11px] sm:text-xs text-[#121A2A]/60 mt-0.5 sm:mt-1">
                      Harga nett termasuk panduan aktivasi resmi & garansi pergantian.
                    </p>
                  </div>

                  {/* FEATURE FROM IMAGE 2: (1) PILIH NOMINAL / VARIAN WITH CAPSULE PILLS */}
                  {variants.length > 0 && (
                    <div data-gsap="product-variant" className="pt-2 border-t border-[rgba(18,26,42,0.08)] space-y-3.5 sm:space-y-4">
                      {/* Section Title with Circle 1 & SKU Badge */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[rgba(201,111,85,0.15)] text-[#C96F55] flex items-center justify-center text-xs font-black shrink-0">
                            1
                          </div>
                          <h2 className="text-xs sm:text-sm font-black text-[#121A2A]">
                            Pilih Nominal / Varian
                          </h2>
                        </div>
                        {activeVariant && (
                          <span className="text-[10px] sm:text-xs font-mono font-medium text-[#121A2A]/60 bg-[#121A2A]/5 px-2 py-0.5 rounded-md truncate max-w-[180px] sm:max-w-none">
                            SKU: {activeVariant.id}
                          </span>
                        )}
                      </div>

                      {/* 1. PAKET / NOMINAL: */}
                      {availablePakets.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                            PAKET / NOMINAL:
                          </label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {availablePakets.map((pkt) => {
                              const isSelected = selectedPaket === pkt;
                              return (
                                <button
                                  key={pkt}
                                  type="button"
                                  data-gsap="product-variant-btn"
                                  onClick={() => handleSelectPaket(pkt)}
                                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                                    isSelected
                                      ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.08)] text-[#121A2A] font-bold shadow-2xs'
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
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                            TIPE AKUN:
                          </label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {availableTypes.map((tp) => {
                              const isSelected = selectedType === tp;
                              return (
                                <button
                                  key={tp}
                                  type="button"
                                  data-gsap="product-variant-btn"
                                  onClick={() => handleSelectType(tp)}
                                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                                    isSelected
                                      ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.08)] text-[#121A2A] font-bold shadow-2xs'
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
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                            DURASI MASA AKTIF:
                          </label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {availableDurations.map((dur) => {
                              const isSelected = selectedDuration === dur;
                              return (
                                <button
                                  key={dur}
                                  type="button"
                                  data-gsap="product-variant-btn"
                                  onClick={() => handleSelectDuration(dur)}
                                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                                    isSelected
                                      ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.08)] text-[#121A2A] font-bold shadow-2xs'
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
                        <div className="space-y-1.5">
                          <label className="text-[10px] sm:text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
                            PROTEKSI GARANSI:
                          </label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {availableWarranties.map((war) => {
                              const isSelected = selectedWarranty === war;
                              return (
                                <button
                                  key={war}
                                  type="button"
                                  data-gsap="product-variant-btn"
                                  onClick={() => handleSelectWarranty(war)}
                                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs transition-all cursor-pointer select-none active:scale-95 ${
                                    isSelected
                                      ? 'border-1.5 border-[#C96F55] bg-[rgba(201,111,85,0.08)] text-[#121A2A] font-bold shadow-2xs'
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
                  <div data-gsap="product-quantity" className="flex items-center justify-between py-2.5 sm:py-3 border-t border-b border-[rgba(18,26,42,0.08)]">
                    <span className="text-xs font-bold text-[#121A2A]">Jumlah Pesanan:</span>
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={quantity <= 1 || isOutOfStock}
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faMinus} className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-sm font-bold font-mono text-[#121A2A] w-6 sm:w-8 text-center">
                        {quantity}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isOutOfStock || (activeVariant?.stock !== undefined && quantity >= activeVariant.stock)}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div data-gsap="product-cta" className="pt-1">
                    <Button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className="w-full text-xs sm:text-sm font-bold py-3.5 h-auto rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-sm active:scale-98 transition-all gap-2 cursor-pointer"
                    >
                      <span>{isOutOfStock ? 'Stok Habis' : 'Beli Sekarang (Langsung Checkout)'}</span>
                      <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Trust Badges matching Image 1 */}
                  <div data-gsap="product-trust" className="pt-2.5 sm:pt-3 border-t border-[rgba(18,26,42,0.08)] space-y-1.5 sm:space-y-2 text-[11px] sm:text-xs text-[#121A2A]/70">
                    <div data-gsap="product-trust-item" className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Aktivasi otomatis & garansi uang kembali jika terkendala</span>
                    </div>
                    <div data-gsap="product-trust-item" className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Dukungan WhatsApp Customer Service ramah & responsif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATION SECTION: INFORMASI & SPESIFIKASI LISENSI (Dynamic per variant) */}
            <ProductDetailSpecs variantDetails={variantDetails} />

            {/* FAQ SECTION: ACCORDION WITH PLUS/MINUS ICONS */}
            <ProductDetailFaqs
              faqs={product.faqs}
              openFaqIndex={openFaqIndex}
              setOpenFaqIndex={setOpenFaqIndex}
            />

            {/* RECOMMENDED PRODUCTS SECTION */}
            <ProductDetailRelated
              relatedProducts={product.relatedProducts}
              activeCampaigns={activeCampaigns}
            />
          </div>
        )}
      </main>

      {/* MOBILE STICKY FLOATING ACTION BAR (< sm screens) */}
      {product && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[rgba(18,26,42,0.1)] px-4 py-2.5 shadow-editorial flex items-center justify-between gap-3 safe-area-bottom">
          <div className="min-w-0">
            <span className="text-[10px] text-[#121A2A]/60 block leading-tight font-medium uppercase tracking-wider">
              Total Harga:
            </span>
            {campaignPrice.hasPromo ? (
              <>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-[10px] text-[#121A2A]/40 line-through font-medium block">
                    {campaignPrice.originalPriceFormatted}
                  </span>
                  <span className="text-[9px] font-bold text-[#C96F55] bg-[#C96F55]/10 px-1 rounded">
                    {campaignPrice.discountBadge}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-[#C96F55] tracking-tight block">
                  {campaignPrice.discountedPriceFormatted}
                </span>
              </>
            ) : (
              <span className="text-base font-black font-mono text-[#121A2A] tracking-tight block">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="px-5 py-2.5 rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-white text-xs sm:text-sm font-bold active:scale-98 transition-transform cursor-pointer shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <span>{isOutOfStock ? 'Stok Habis' : 'Beli Sekarang'}</span>
              <FontAwesomeIcon icon={faArrowRight} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Guest Authentication Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        callbackUrl={typeof window !== 'undefined' ? window.location.pathname + window.location.search : `/products/${id}`}
      />
    </div>
  );
}
