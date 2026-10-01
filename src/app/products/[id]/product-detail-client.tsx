'use client';

import { useState } from 'react';
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
        priceFormatted: `Rp ${(currentDuration.price).toLocaleString('id-ID')}`,
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 mb-6 overflow-hidden">
          <Link href="/" className="hover:text-navy-900 transition-colors shrink-0">
            Beranda
          </Link>
          <span className="shrink-0 text-slate-300">/</span>
          <Link href="/products" className="hover:text-navy-900 transition-colors shrink-0">
            Katalog Produk
          </Link>
          <span className="shrink-0 text-slate-300">/</span>
          <span className="text-navy-900 font-semibold truncate max-w-[160px] sm:max-w-md">
            {product?.name || 'Detail Produk'}
          </span>
        </nav>

        {/* Loading State */}
        {isLoading && !product && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-7 h-96 bg-slate-50 border border-border rounded-2xl" />
            <div className="lg:col-span-5 h-96 bg-slate-50 border border-border rounded-2xl" />
          </div>
        )}

        {/* Error State */}
        {error && !product && (
          <div className="bg-white border border-red-200 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-12 shadow-card">
            <h3 className="text-lg font-bold text-navy-900">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">
              Lisensi atau produk digital yang Anda cari tidak tersedia atau tautan telah kedaluwarsa.
            </p>
            <Link href="/products">
              <Button size="sm" className="rounded-xl">Kembali ke Katalog</Button>
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
                <div className="bg-white border border-border rounded-2xl overflow-hidden relative group shadow-card">
                  <div className="relative h-64 sm:h-96 w-full bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-transparent to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-navy-900 border border-slate-200 shadow-xs">
                        {product.category.name}
                      </span>
                      {product.popular && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-accent text-white shadow-xs">
                          Paling Populer
                        </span>
                      )}
                      {isOutOfStock && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-status-error text-white shadow-xs">
                          Stok Habis
                        </span>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-navy-900 transition-colors shadow-xs cursor-pointer"
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
                        className={`w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
                          isWishlisted ? 'text-red-500' : 'text-slate-600 hover:text-navy-900'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
                      <span className="text-[11px] sm:text-xs font-bold text-accent uppercase tracking-wider block mb-1">
                        Lisensi Digital Resmi
                      </span>
                      <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight line-clamp-2">
                        {product.name}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Guarantee Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-navy-900 block truncate">
                        {product.guaranteeTitle || 'Garansi Penuh'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.guaranteeDesc || 'Jaminan ganti akun 100%'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-navy-900 block truncate">
                        {product.processTitle || 'Proses Instan'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.processDesc || '1 - 15 menit selesai'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-border rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-accent shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-navy-900 block truncate">
                        {product.privacyTitle || 'Akun Private'}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {product.privacyDesc || 'Ruang kerja aman & personal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description & Features */}
                <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-card">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Deskripsi Layanan
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-5 border-t border-border">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400 mb-3.5">
                      Fitur Unggulan Yang Anda Dapatkan
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Specifications */}
                {product.specifications && product.specifications.length > 0 && (
                  <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-card">
                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-400">
                      Informasi & Spesifikasi Lisensi
                    </h3>
                    <div className="divide-y divide-border/60">
                      {product.specifications.map((spec, idx) => (
                        <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                          <span className="text-slate-500">{spec.label}</span>
                          <span className="font-bold text-navy-900">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Dynamic Pricing & Action Box (5 Cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                <Card className="bg-white border-border shadow-card hover:shadow-card-hover transition-all rounded-2xl">
                  <CardHeader className="p-6 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-accent uppercase tracking-wide">
                        Pilihan Paket Berlangganan
                      </span>
                      {isOutOfStock ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-status-error font-semibold border border-red-200 flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-status-error" />
                          <span>Stok Habis</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Stok Tersedia ({product.stock ?? 100})
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-extrabold text-navy-900 mt-2">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-1">
                      Harga nett termasuk panduan aktivasi resmi & garansi pergantian.
                    </p>
                  </CardHeader>

                  <CardContent className="p-6 pt-0 space-y-5">
                    {/* Duration Options */}
                    {product.durations && product.durations.length > 1 && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-navy-900 block">
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
                                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-accent bg-orange-50/70 text-navy-900 ring-2 ring-accent/30'
                                    : 'border-border bg-white hover:border-slate-300 text-slate-600'
                                }`}
                              >
                                <span className="block text-xs font-bold text-navy-900">
                                  {dur.label}
                                </span>
                                <span className="block text-[11px] text-accent font-semibold mt-0.5">
                                  Rp {dur.price.toLocaleString('id-ID')}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between py-3 border-t border-b border-border">
                      <span className="text-xs font-bold text-navy-900">Jumlah Pesanan:</span>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={quantity <= 1 || isOutOfStock}
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-xl border-border"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="text-sm font-bold font-mono text-navy-900 w-6 text-center">
                          {quantity}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isOutOfStock || (product.stock !== undefined && quantity >= product.stock)}
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 rounded-xl border-border"
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
                        className="w-full text-xs sm:text-sm font-bold py-3 h-auto rounded-xl bg-accent hover:bg-accent-hover text-white shadow-md cursor-pointer"
                      >
                        {isOutOfStock ? 'Stok Habis' : 'Beli Sekarang (Langsung Checkout)'}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className="w-full text-xs font-semibold border-border py-2.5 h-auto gap-2 rounded-xl text-navy-900 hover:text-accent cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4 text-accent" />
                        <span>{isOutOfStock ? 'Stok Habis' : 'Tambah ke Keranjang'}</span>
                      </Button>
                    </div>

                    {/* Trust Badges */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
                        <span>Aktivasi otomatis & garansi uang kembali jika terkendala</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <Check className="w-3.5 h-3.5 text-status-success shrink-0" />
                        <span>Dukungan WhatsApp Customer Service ramah & responsif</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQs */}
            {product.faqs && product.faqs.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-card">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-accent" />
                  <h2 className="text-base sm:text-lg font-bold text-navy-900">Pertanyaan Umum (FAQ)</h2>
                </div>

                <div className="space-y-3">
                  {product.faqs.map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={idx}
                        className="border border-border rounded-xl overflow-hidden bg-white shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="text-xs sm:text-sm font-bold text-navy-900">
                            {faq.question}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-accent shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-border/40 leading-relaxed">
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
                    <h2 className="text-base sm:text-lg font-bold text-navy-900">Rekomendasi Produk Lainnya</h2>
                    <p className="text-xs text-slate-500">Pilihan relevan yang paling sering dibeli bersama produk ini</p>
                  </div>
                  <Link
                    href="/products"
                    className="text-xs text-accent font-semibold hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <span>Lihat Semua Katalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {product.relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      className="bg-white border border-border rounded-2xl p-4 flex flex-col justify-between shadow-card hover:shadow-card-hover hover:border-slate-300 transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="h-32 rounded-xl bg-slate-50 overflow-hidden border border-border relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={rel.imageUrl}
                            alt={rel.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                          {(rel.stock !== undefined && rel.stock <= 0) || rel.providerStatus === 'empty' ? (
                            <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-status-error text-white font-semibold shadow-xs">
                              Stok Habis
                            </span>
                          ) : null}
                        </div>
                        <div>
                          <span className="text-[11px] text-accent font-semibold">{rel.category.name}</span>
                          <h4 className="text-sm font-bold text-navy-900 line-clamp-2">{rel.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                        <span className="text-xs font-bold text-navy-900">{rel.priceFormatted}</span>
                        <Link href={`/products/${rel.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-3 rounded-xl hover:text-accent">
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
