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

interface VariantDetails {
  title: string;
  desc: string;
  features: string[];
  guaranteeTitle: string;
  guaranteeDesc: string;
  processTitle: string;
  processDesc: string;
  privacyTitle: string;
  privacyDesc: string;
  specifications: SpecItem[];
  warrantyText: string;
}

function getVariantDetails(
  variant: ParsedVariant | null,
  product: ProductDetailData | undefined
): VariantDetails {
  if (!product) {
    return {
      title: 'Detail Produk',
      desc: '',
      features: [],
      guaranteeTitle: 'Garansi Penuh',
      guaranteeDesc: 'Jaminan ganti akun 100%',
      processTitle: 'Proses Instan',
      processDesc: '1 - 15 menit selesai',
      privacyTitle: 'Akun Private',
      privacyDesc: 'Akses resmi & aman',
      specifications: [],
      warrantyText: 'Garansi resmi Asterra Store.',
    };
  }

  const type = variant?.type || 'Private';
  const duration = variant?.duration || '1 Bulan';
  const warranty = variant?.warranty || '1 Bulan';
  const paket = variant?.paket || product.name.split('[')[0].trim();
  const fullName = variant?.name || product.name;

  const isShared = type.toLowerCase().includes('shared');
  const isInvite = type.toLowerCase().includes('anggota') || type.toLowerCase().includes('invite');
  const isDesigner = type.toLowerCase().includes('desainer') || type.toLowerCase().includes('head');

  // 1. DYNAMIC DESCRIPTION PER VARIANT (TIPE AKUN, DURASI, GARANSI)
  let desc = '';
  if (variant?.description && variant.description.trim().length > 30) {
    desc = cleanHtmlContent(variant.description);
  } else {
    if (isShared) {
      desc = `${fullName} — Solusi berlangganan super hemat dengan akun Shared resmi. Anda mendapatkan 1 profil khusus dengan PIN pengaman pribadi. Akses lancar, kualitas streaming/fitur premium tertinggi tanpa antrean, dan dilarang merubah data email utama demi kestabilan akun. Dilindungi penuh dengan garansi resmi Asterra Store selama ${warranty}.`;
    } else if (isInvite) {
      desc = `${fullName} — Upgrade lisensi resmi via undangan langsung ke akun email pribadi Anda. Tidak perlu login akun baru, seluruh data kerja, template, dan riwayat proyek Anda tersimpan aman 100%. Aktivasi instan 1-15 menit dengan masa aktif ${duration} dan proteksi garansi penggantian resmi ${warranty}.`;
    } else if (isDesigner) {
      desc = `${fullName} — Paket lisensi eksklusif dengan otoritas tertinggi untuk desainer & tim profesional. Termasuk fitur kolaborasi tim penuh, cloud workspace terintegrasi, dan prioritas server. Bergaransi resmi ${warranty} dengan masa aktif ${duration}.`;
    } else {
      desc = `${fullName} — Akun Private eksklusif full akses 100% milik Anda sendiri. Dilengkapi kredensial privat (email & password), bebas digunakan di berbagai perangkat, tanpa sharing dengan pihak ketiga, dan privasi total terjamin. Diproteksi dengan garansi resmi Asterra Store selama ${warranty} dengan masa aktif penuh ${duration}.`;
    }
  }

  // 2. DYNAMIC FEATURES PER VARIANT
  let features: string[] = [];
  if (isShared) {
    features = [
      '1 Profil Khusus dengan PIN Pengaman Pribadi',
      `Masa Aktif: ${duration} Berjalan Penuh Tanpa Jeda`,
      `Proteksi Garansi: ${warranty} Penggantian Akun 100% Resmi`,
      'Kualitas Streaming & Fitur Premium Maksimal (Ultra HD / 4K / Pro)',
      'Aktivasi Otomatis & Bantuan WhatsApp CS Siaga 24 Jam',
    ];
  } else if (isInvite) {
    features = [
      'Undangan Resmi Langsung ke Akun Email Pribadi Anda',
      'Data Proyek, Desain, dan Template Tersimpan Aman di Email Sendiri',
      `Masa Aktif Penuh: ${duration}`,
      `Garansi Resmi: ${warranty} dengan Jaminan Aktif Kembali`,
      'Bebas Akses Seluruh Fitur Pro & Kolaborasi Workspace',
    ];
  } else if (isDesigner) {
    features = [
      'Akses Otoritas Penuh & Fitur Kolaborasi Desainer / Tim',
      'Akses Cloud Storage Besar & Integrasi Brand Kit Lengkap',
      `Masa Aktif: ${duration} Bergaransi Resmi ${warranty}`,
      'Semua Aset Desain, Font, dan Ekspor Resolusi Tertinggi Terbuka',
      'Panduan Aktivasi Instan & Dukungan Prioritas Customer Service',
    ];
  } else {
    // Private
    features = [
      'Akun Private Eksklusif (Email & Password Pribadi Tanpa Sharing)',
      `Masa Aktif: ${duration} Full Coverage`,
      `Garansi Perlindungan: ${warranty} Penggantian Resmi 100%`,
      'Bebas Akses Semua Fitur Premium Tanpa Batas Penggunaan',
      'Dukungan Multi-Device (Web, Android, iOS, Windows, macOS)',
    ];
  }

  // If base product has extra features from database, clean and append
  if (product.features && product.features.length > 0) {
    const cleanedBase = product.features.map(cleanHtmlContent).filter(Boolean);
    cleanedBase.slice(0, 3).forEach((f) => {
      if (!features.some((ef) => ef.toLowerCase().includes(f.toLowerCase().slice(0, 15)))) {
        features.push(f);
      }
    });
  }

  // 3. DYNAMIC WARRANTY TEXT
  const warrantyText = `Seluruh transaksi untuk paket ${fullName} dilindungi garansi penggantian resmi Asterra Store selama ${warranty}. Jika akun mengalami kendala login atau masa aktif terputus sebelum ${warranty}, tim CS kami siap memproses penggantian akun baru 100% gratis dalam hitungan menit.`;

  // 4. DYNAMIC CHIPS
  const guaranteeTitle = `Garansi ${warranty}`;
  const guaranteeDesc = `Jaminan ganti akun 100%`;
  const processTitle = `Proses Instan`;
  const processDesc = `1 - 15 menit selesai`;
  const privacyTitle = `Akun ${type}`;
  const privacyDesc = isShared
    ? '1 Profil PIN aman'
    : isInvite
    ? 'Invite email pribadi aman'
    : 'Ruang kerja aman & personal';

  // 5. DYNAMIC SPECIFICATIONS TABLE
  const specifications: SpecItem[] = [
    { label: 'Paket / Nominal', value: paket },
    { label: 'Tipe Akun', value: `Akun ${type}` },
    { label: 'Durasi Masa Aktif', value: duration },
    { label: 'Proteksi Garansi', value: `Garansi ${warranty}` },
    { label: 'Kode SKU / Layanan', value: variant?.id || product.id },
    {
      label: 'Status Ketersediaan',
      value: variant?.isOutOfStock ? 'Stok Habis' : `Tersedia (${variant?.stock ?? 100} unit)`,
    },
    { label: 'Waktu Pengiriman', value: 'Proses Instan (1 - 15 Menit)' },
    {
      label: 'Metode Pengiriman',
      value: isInvite ? 'Email Pribadi (Undangan Resmi)' : 'Kredensial Email & WhatsApp CS',
    },
    { label: 'Kompatibilitas', value: 'Web Browser, Windows, macOS, Android, iOS' },
  ];

  return {
    title: fullName,
    desc,
    features,
    guaranteeTitle,
    guaranteeDesc,
    processTitle,
    processDesc,
    privacyTitle,
    privacyDesc,
    specifications,
    warrantyText,
  };
}

export function ProductDetailClient({ id, initialData }: ProductDetailClientProps) {
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState<'benefit' | 'garansi' | 'deskripsi'>('deskripsi');

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
      showNotification(`Maaf, stok produk ${variantDetails.title} saat ini habis.`);
      return;
    }
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
    showNotification(`Berhasil menambahkan ${quantity}x ${variantDetails.title} ke keranjang.`);
  };

  const handleBuyNow = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, stok produk ${variantDetails.title} saat ini habis.`);
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full overflow-hidden">
        {/* Breadcrumb Navigation matching Image 1 */}
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
            {variantDetails.title}
          </span>
        </nav>

        {/* Loading State */}
        {isLoading && !product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-7 h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
            <div className="lg:col-span-5 h-96 bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl" />
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
            {/* TOP SECTION: 2 COLUMNS (LEFT: LARGE IMAGE BANNER & BENEFITS & DESC, RIGHT: STICKY ORDER & VARIANTS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* LEFT COLUMN: Large Product Banner + 3 Chips + Description/Tabs (lg:col-span-7) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Large Product Banner Card (Matching user Image 1) */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl overflow-hidden relative shadow-card group">
                  <div className="relative h-64 sm:h-96 w-full bg-[#121A2A]/5 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeVariant?.imageUrl || product.imageUrl}
                      alt={variantDetails.title}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121A2A]/90 via-[#121A2A]/30 to-transparent pointer-events-none" />

                    {/* Top Action Badges */}
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap z-10">
                      <span className="bg-white/95 backdrop-blur-xs text-[#121A2A] text-xs font-semibold px-3 py-1 rounded-lg border border-[rgba(18,26,42,0.08)] shadow-xs">
                        {product.category?.name || 'Apps & Streaming'}
                      </span>
                      <span className="bg-[#C96F55] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs">
                        Paling Populer
                      </span>
                      {isOutOfStock && (
                        <span className="bg-[#DC2626] text-white text-xs font-bold px-3 py-1 rounded-lg shadow-xs">
                          Stok Habis
                        </span>
                      )}
                    </div>

                    {/* Top Action Buttons (Share & Wishlist) */}
                    <div className="absolute top-4 right-4 flex gap-2 z-10">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center text-[#121A2A]/70 hover:text-[#121A2A] transition-colors shadow-xs cursor-pointer"
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
                        className={`w-8 h-8 rounded-lg bg-white/95 backdrop-blur-xs border border-[rgba(18,26,42,0.12)] flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
                          isWishlisted ? 'text-[#C96F55]' : 'text-[#121A2A]/70 hover:text-[#121A2A]'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current text-[#C96F55]' : ''}`} />
                      </button>
                    </div>

                    {/* Banner Title & Category Subtitle (Preserved Verbatim from Previous Design) */}
                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-10">
                      <span className="text-[11px] sm:text-xs font-bold text-[#C96F55] uppercase tracking-wider block mb-1">
                        LISENSI DIGITAL RESMI
                      </span>
                      <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight line-clamp-2 drop-shadow-xs">
                        {variantDetails.title}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* 3 Benefit Highlights (Under Image - Dynamic per variant) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.guaranteeTitle}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {variantDetails.guaranteeDesc}
                    </span>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.processTitle}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {variantDetails.processDesc}
                    </span>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 space-y-1 shadow-2xs">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(201,111,85,0.08)] flex items-center justify-center text-[#C96F55] mb-2">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-[#121A2A] block truncate">
                      {variantDetails.privacyTitle}
                    </span>
                    <span className="text-[11px] text-[#121A2A]/60 block leading-tight">
                      {variantDetails.privacyDesc}
                    </span>
                  </div>
                </div>

                {/* DESKRIPSI LAYANAN & FITUR UNGGULAN CARD (Dynamic per variant + Capsule Tabs) */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
                  {/* Capsule Tabs (Benefit | Garansi | Deskripsi) */}
                  <div className="bg-[#F1F3F5] rounded-full p-1 inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('deskripsi')}
                      className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                        activeTab === 'deskripsi'
                          ? 'bg-white text-[#121A2A] font-bold shadow-xs'
                          : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
                      }`}
                    >
                      Deskripsi
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('benefit')}
                      className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
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
                      className={`rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm transition-all cursor-pointer ${
                        activeTab === 'garansi'
                          ? 'bg-white text-[#121A2A] font-bold shadow-xs'
                          : 'text-[#121A2A]/65 hover:text-[#121A2A] font-medium'
                      }`}
                    >
                      Garansi
                    </button>
                  </div>

                  {/* Tab Dynamic Content */}
                  <div className="pt-1 min-h-[140px]">
                    {activeTab === 'deskripsi' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div>
                          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55] mb-2.5">
                            Deskripsi Layanan
                          </h2>
                          <p className="text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed whitespace-pre-line">
                            {variantDetails.desc}
                          </p>
                        </div>

                        {/* Fitur Unggulan Yang Anda Dapatkan */}
                        <div className="pt-6 border-t border-[rgba(18,26,42,0.08)]">
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70 mb-3.5">
                            Fitur Unggulan Yang Anda Dapatkan
                          </h3>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {variantDetails.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#121A2A]/85">
                                <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {activeTab === 'benefit' && (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#C96F55] mb-2">
                            Keunggulan Khusus Varian Ini
                          </h3>
                          <p className="text-xs text-[#121A2A]/60 mb-4">
                            Fitur dan keistimewaan yang Anda dapatkan untuk paket {variantDetails.title}:
                          </p>
                        </div>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {variantDetails.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed">
                              <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeTab === 'garansi' && (
                      <div className="space-y-3.5 text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 text-[#16A34A] font-bold">
                          <ShieldCheck className="w-5 h-5 shrink-0" />
                          <span>Jaminan {variantDetails.guaranteeTitle} (100% Proteksi Penggantian Akun)</span>
                        </div>
                        <p>
                          {variantDetails.warrantyText}
                        </p>
                        <p className="text-xs text-[#121A2A]/60">
                          *Klaim garansi mudah dan cepat, cukup konfirmasi nomor Invoice pesanan Anda ke WhatsApp Customer Service Asterra Store.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PILIHAN PAKET BERLANGGANAN & VARIAN PILLS (Matching user Image 1 & 2) (lg:col-span-5) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-7 shadow-card space-y-5 sticky top-24">
                  {/* Top Header: PILIHAN PAKET BERLANGGANAN & Stok Badge */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-[rgba(18,26,42,0.08)]">
                    <span className="text-xs font-bold text-[#C96F55] uppercase tracking-wider">
                      PILIHAN PAKET BERLANGGANAN
                    </span>

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        isOutOfStock
                          ? 'bg-[#FEE2E2] text-[#DC2626]'
                          : 'bg-[#DCFCE7] text-[#16A34A]'
                      }`}
                    >
                      {isOutOfStock ? 'Stok Habis' : `Stok Tersedia (${activeVariant?.stock ?? 100})`}
                    </span>
                  </div>

                  {/* Price Header */}
                  <div className="pt-1">
                    <div className="text-3xl sm:text-4xl font-black text-[#121A2A] font-mono tracking-tight">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-[#121A2A]/60 mt-1">
                      Harga nett termasuk panduan aktivasi resmi & garansi pergantian.
                    </p>
                  </div>

                  {/* FEATURE FROM IMAGE 2: (1) PILIH NOMINAL / VARIAN WITH CAPSULE PILLS */}
                  {variants.length > 0 && (
                    <div className="pt-2 border-t border-[rgba(18,26,42,0.08)] space-y-4">
                      {/* Section Title with Circle 1 & SKU Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[rgba(201,111,85,0.15)] text-[#C96F55] flex items-center justify-center text-xs font-black shrink-0">
                            1
                          </div>
                          <h2 className="text-sm font-black text-[#121A2A]">
                            Pilih Nominal / Varian
                          </h2>
                        </div>
                        {activeVariant && (
                          <span className="text-[11px] font-mono font-medium text-[#121A2A]/60 bg-[#121A2A]/5 px-2.5 py-1 rounded-md">
                            SKU: {activeVariant.id}
                          </span>
                        )}
                      </div>

                      {/* 1. PAKET / NOMINAL: */}
                      {availablePakets.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
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
                                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
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
                                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
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
                                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-[#121A2A]/70 uppercase tracking-wider block">
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
                                  className={`px-4 py-1.5 rounded-full text-xs transition-all cursor-pointer ${
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
                        disabled={isOutOfStock || (activeVariant?.stock !== undefined && quantity >= activeVariant.stock)}
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="space-y-2.5 pt-1">
                    <Button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className="w-full text-xs sm:text-sm font-bold py-3.5 h-auto rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] shadow-sm active:scale-98 transition-all gap-2 cursor-pointer"
                    >
                      <span>{isOutOfStock ? 'Stok Habis' : 'Beli Sekarang (Langsung Checkout)'}</span>
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

                  {/* Trust Badges matching Image 1 */}
                  <div className="pt-3 border-t border-[rgba(18,26,42,0.08)] space-y-2 text-xs text-[#121A2A]/70">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Aktivasi otomatis & garansi uang kembali jika terkendala</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                      <span>Dukungan WhatsApp Customer Service ramah & responsif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SPECIFICATION SECTION: INFORMASI & SPESIFIKASI LISENSI (Dynamic per variant) */}
            <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-6 sm:p-8 shadow-card space-y-4">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/70 pb-3 border-b border-[rgba(18,26,42,0.08)]">
                Informasi & Spesifikasi Lisensi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 pt-2">
                {variantDetails.specifications.map((spec, idx) => (
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
