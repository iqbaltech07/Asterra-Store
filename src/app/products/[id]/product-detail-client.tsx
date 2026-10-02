'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { useCartStore } from '@/store/use-cart-store';
import {
  CheckCircle2,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Clock,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Share2,
  Heart,
  Plus,
  Minus,
  AlertTriangle,
} from 'lucide-react';

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

  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem } = useCartStore();

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

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const currentDuration = product?.durations?.[selectedDurationIndex] || {
    id: 'standard',
    label: 'Masa Aktif Penuh',
    price: product?.price || 0,
    multiplier: 1,
  };

  const totalPrice = (currentDuration.price || 0) * quantity;

  const isOutOfStock =
    !product ||
    (product.stock !== undefined && product.stock <= 0) ||
    product.providerStatus === 'empty' ||
    product.status === 'out_of_stock';

  const handleAddToCart = () => {
    if (!product || isOutOfStock) {
      showNotification(`Maaf, stok produk ${product?.name || ''} saat ini habis.`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${product.id}-${currentDuration.id}`,
        name: `${product.name} (${currentDuration.label})`,
        category: product.category.name,
        priceFormatted: `Rp ${currentDuration.price.toLocaleString('id-ID')}`,
        priceNumeric: currentDuration.price,
        stock: product.stock,
        isOutOfStock: false,
      });
    }
    showNotification(`Berhasil menambahkan ${quantity}x ${product.name} ke keranjang.`);
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

  return (
    <div className="min-h-screen bg-[#F7F5EF] text-[#121A2A] flex flex-col font-sans selection:bg-[#C96F55]/20 selection:text-[#C96F55]">
      <Header onNotify={showNotification} />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-white border border-[#C96F55]/40 text-[#121A2A] px-4 py-3 rounded-xl shadow-editorial flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-[rgba(201,111,85,0.15)] flex items-center justify-center text-[#C96F55]">
              <Check className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs font-medium">{notification}</p>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#121A2A]/60 mb-6 overflow-hidden">
          <Link href="/" className="hover:text-[#121A2A] transition-colors shrink-0">
            Beranda
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <Link href="/products" className="hover:text-[#121A2A] transition-colors shrink-0">
            Katalog Produk
          </Link>
          <span className="shrink-0 text-[#121A2A]/30">/</span>
          <span className="text-[#121A2A] font-medium truncate max-w-[140px] sm:max-w-md">
            {product?.name || 'Detail Produk'}
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
          <div className="bg-white border border-[rgba(18,26,42,0.1)] rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-editorial">
            <h3 className="text-lg font-bold text-[#121A2A]">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-[#121A2A]/60">
              Lisensi atau produk digital yang Anda cari tidak tersedia atau tautan telah kedaluwarsa.
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
          <div className="space-y-10 sm:space-y-12">
            {/* Top Grid: Visual Banner + Pricing Action Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Left Column: Image & Feature Highlights (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Product Banner Card */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl overflow-hidden relative group shadow-editorial">
                  <div className="relative h-64 sm:h-96 w-full bg-[#121A2A]/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm border border-[rgba(18,26,42,0.1)] text-[#121A2A] text-xs font-semibold shadow-xs">
                        {product.category.name}
                      </span>
                      {product.popular && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#121A2A] text-[#F7F5EF] text-xs font-semibold shadow-xs">
                          Paling Populer
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#DC2626] text-white text-xs font-semibold shadow-xs">
                          Stok Habis
                        </span>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-[rgba(18,26,42,0.1)] flex items-center justify-center text-[#121A2A]/70 hover:text-[#121A2A] transition-colors shadow-xs"
                        title="Bagikan Tautan Produk"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWishlisted(!isWishlisted);
                          showNotification(
                            !isWishlisted
                              ? 'Produk ditambahkan ke daftar keinginan.'
                              : 'Produk dihapus dari daftar keinginan.'
                          );
                        }}
                        className={`w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm border border-[rgba(18,26,42,0.1)] flex items-center justify-center transition-colors shadow-xs ${
                          isWishlisted ? 'text-[#C96F55]' : 'text-[#121A2A]/70 hover:text-[#121A2A]'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-[#C96F55]' : ''}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                      <span className="text-[11px] sm:text-xs font-semibold text-[#C96F55] uppercase tracking-wider block mb-1">
                        Lisensi Digital Resmi
                      </span>
                      <h1 className="text-xl sm:text-3xl font-extrabold text-[#121A2A] tracking-tight line-clamp-2">
                        {product.name}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Guarantee Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(201,111,85,0.1)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#121A2A] block truncate">
                        {product.guaranteeTitle || 'Garansi Penuh'}
                      </span>
                      <span className="text-[11px] text-[#121A2A]/60 block truncate">
                        {product.guaranteeDesc || 'Jaminan ganti akun 100%'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(201,111,85,0.1)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#121A2A] block truncate">
                        {product.processTitle || 'Proses Instan'}
                      </span>
                      <span className="text-[11px] text-[#121A2A]/60 block truncate">
                        {product.processDesc || '1 - 15 menit selesai'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-xl p-3.5 flex items-center gap-3 shadow-xs">
                    <div className="w-9 h-9 rounded-lg bg-[rgba(201,111,85,0.1)] border border-[rgba(201,111,85,0.2)] flex items-center justify-center text-[#C96F55] shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-[#121A2A] block truncate">
                        {product.privacyTitle || 'Akun Private'}
                      </span>
                      <span className="text-[11px] text-[#121A2A]/60 block truncate">
                        {product.privacyDesc || 'Ruang kerja aman & personal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Features */}
                <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-6 shadow-editorial">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/60 mb-2">
                      Deskripsi Layanan
                    </h3>
                    <p className="text-xs sm:text-sm text-[#121A2A]/85 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[rgba(18,26,42,0.08)]">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/60 mb-3">
                      Fitur Unggulan Yang Anda Dapatkan
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-[#121A2A]/85">
                          <CheckCircle2 className="w-4 h-4 text-[#C96F55] shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Specifications */}
                {product.specifications && product.specifications.length > 0 && (
                  <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-editorial">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#121A2A]/60">
                      Informasi & Spesifikasi Lisensi
                    </h3>
                    <div className="divide-y divide-[rgba(18,26,42,0.06)]">
                      {product.specifications.map((spec, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="text-[#121A2A]/60">{spec.label}</span>
                          <span className="font-semibold text-[#121A2A]">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Pricing & Action Box (5 Cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                <Card className="bg-white border-[rgba(18,26,42,0.08)] shadow-editorial rounded-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#C96F55] uppercase tracking-wide">
                        Pilihan Paket Berlangganan
                      </span>
                      {isOutOfStock ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] font-semibold border border-[#DC2626]/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                          <span>Stok Habis</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] font-medium border border-[#16A34A]/20">
                          Stok Tersedia ({product.stock ?? 100})
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-[#121A2A] mt-2">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </CardTitle>
                    <p className="text-xs text-[#121A2A]/60">
                      Harga nett termasuk panduan aktivasi resmi & garansi pergantian.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Duration Options */}
                    {product.durations && product.durations.length > 1 && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-[#121A2A] block">
                          Pilih Durasi Akses:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {product.durations.map((dur, idx) => {
                            const isSelected = selectedDurationIndex === idx;
                            return (
                              <button
                                key={dur.id}
                                type="button"
                                onClick={() => setSelectedDurationIndex(idx)}
                                className={`p-3 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'border-[#C96F55] bg-[rgba(201,111,85,0.08)] text-[#121A2A] ring-1 ring-[#C96F55]'
                                    : 'border-[rgba(18,26,42,0.1)] bg-white hover:border-[#C96F55]/40 text-[#121A2A]/70'
                                }`}
                              >
                                <span className="block text-xs font-semibold text-[#121A2A]">
                                  {dur.label}
                                </span>
                                <span className="block text-[11px] text-[#C96F55] font-mono mt-0.5">
                                  Rp {dur.price.toLocaleString('id-ID')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between py-2 border-t border-b border-[rgba(18,26,42,0.08)]">
                      <span className="text-xs font-semibold text-[#121A2A]">Jumlah Pesanan:</span>
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

                    {/* Actions */}
                    <div className="space-y-2.5 pt-2">
                      <Button
                        type="button"
                        onClick={handleBuyNow}
                        disabled={isOutOfStock}
                        className="w-full text-xs font-bold py-3 h-auto shadow-sm rounded-xl bg-[#C96F55] hover:bg-[#B86047] text-[#F7F5EF] active:scale-[0.99] transition-transform"
                      >
                        {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang (Langsung Checkout)'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="w-full text-xs border-[rgba(18,26,42,0.2)] hover:bg-[rgba(18,26,42,0.04)] text-[#121A2A] py-3 h-auto gap-2 rounded-xl"
                      >
                        <ShoppingCart className="w-4 h-4 text-[#C96F55]" />
                        <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
                      </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-3 border-t border-[rgba(18,26,42,0.08)] space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-[#121A2A]/70">
                        <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>Aktivasi otomatis & garansi uang kembali jika terkendala</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#121A2A]/70">
                        <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        <span>Dukungan WhatsApp Customer Service ramah & responsif</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQs */}
            {product.faqs && product.faqs.length > 0 && (
              <div className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-5 sm:p-6 space-y-4 shadow-editorial">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#C96F55]" />
                  <h2 className="text-base sm:text-lg font-bold text-[#121A2A]">Pertanyaan Umum (FAQ)</h2>
                </div>

                <div className="space-y-3">
                  {product.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-[rgba(18,26,42,0.08)] rounded-xl overflow-hidden bg-[#F7F5EF]/40"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-[rgba(18,26,42,0.02)] transition-colors"
                        >
                          <span className="text-xs sm:text-sm font-semibold text-[#121A2A]">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-[#C96F55] shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[#121A2A]/50 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-[#121A2A]/70 border-t border-[rgba(18,26,42,0.06)] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Products Recommendation */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-[#121A2A]">Rekomendasi Produk Lainnya</h2>
                    <p className="text-xs text-[#121A2A]/60">Pilihan relevan yang paling sering dibeli bersama produk ini</p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs text-[#C96F55] hover:underline inline-flex items-center gap-1 shrink-0 font-medium"
                  >
                    <span>Lihat Semua Katalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {product.relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      className="bg-white border border-[rgba(18,26,42,0.08)] rounded-2xl p-4 flex flex-col justify-between hover:border-[#C96F55]/50 transition-all duration-200 shadow-editorial"
                    >
                      <div className="space-y-3">
                        <div className="h-32 rounded-xl bg-[#121A2A]/5 overflow-hidden border border-[rgba(18,26,42,0.06)] relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={rel.imageUrl}
                            alt={rel.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          {(rel.stock !== undefined && rel.stock <= 0) || rel.providerStatus === 'empty' ? (
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-[#DC2626] text-white font-semibold shadow-xs">
                              Stok Habis
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <span className="text-[11px] text-[#C96F55] font-medium">{rel.category.name}</span>
                          <h4 className="text-sm font-bold text-[#121A2A] line-clamp-2">{rel.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[rgba(18,26,42,0.08)]">
                        <span className="text-xs font-bold text-[#121A2A] font-mono">{rel.priceFormatted}</span>
                        <Link href={`/products/${rel.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-8 px-3 rounded-lg border-[rgba(18,26,42,0.15)] text-[#121A2A] hover:bg-[rgba(18,26,42,0.05)]">
                            Lihat
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
