'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface DurationOption {
  id: string;
  label: string;
  price: number;
  multiplier: number;
}

interface SpecItem {
  label: string;
  value: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface RelatedProduct {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  imageUrl: string;
  stock?: number;
  providerStatus?: string;
}

interface ProductDetailResponse {
  id: string;
  name: string;
  category: { id: string; name: string };
  price: number;
  priceFormatted: string;
  description: string;
  features: string[];
  status: 'active' | 'out_of_stock';
  providerStatus?: 'available' | 'empty';
  stock?: number;
  imageUrl: string;
  popular?: boolean;
  durations: DurationOption[];
  specifications: SpecItem[];
  faqs: FaqItem[];
  relatedProducts: RelatedProduct[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [selectedDurationIndex, setSelectedDurationIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [notification, setNotification] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem } = useCartStore();

  const { data, isLoading, error } = useQuery<{ success: boolean; data: ProductDetailResponse }>({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/products/${id}`);
      if (!res.ok) throw new Error('Produk tidak ditemukan');
      return res.json();
    },
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

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-foreground-muted mb-6">
          <Link href="/" className="hover:text-foreground transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">
            Katalog Produk
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{product?.name || 'Detail Produk'}</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
            <div className="lg:col-span-7 h-96 bg-surface border border-border rounded-xl" />
            <div className="lg:col-span-5 h-96 bg-surface border border-border rounded-xl" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-surface-raised border border-status-error/40 rounded-xl p-12 text-center space-y-4 max-w-md mx-auto my-12">
            <h3 className="text-lg font-bold text-foreground">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-foreground-muted">
              Lisensi atau produk digital yang Anda cari tidak tersedia atau tautan telah kedaluwarsa.
            </p>
            <Link href="/products">
              <Button size="sm">Kembali ke Katalog</Button>
            </Link>
          </div>
        )}

        {/* Product Details Section */}
        {product && (
          <div className="space-y-12">
            {/* Top Grid: Visual Banner + Pricing Action Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Image & Feature Highlights (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Product Banner Card */}
                <div className="bg-surface border border-border rounded-xl overflow-hidden relative group">
                  <div className="relative h-72 sm:h-96 w-full bg-surface-raised">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-border text-xs">
                        {product.category.name}
                      </Badge>
                      {product.popular && (
                        <Badge className="bg-primary text-white text-xs">
                          Paling Populer
                        </Badge>
                      )}
                      {isOutOfStock && (
                        <Badge variant="destructive" className="bg-status-error text-white text-xs font-semibold shadow-xs">
                          Stok Habis
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2">
                      <button
                        type="button"
                        onClick={handleShare}
                        className="w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground-muted hover:text-foreground transition-colors"
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
                        className={`w-8 h-8 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center transition-colors ${
                          isWishlisted ? 'text-status-error' : 'text-foreground-muted hover:text-foreground'
                        }`}
                        title="Simpan ke Favorit"
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider block mb-1">
                        Lisensi Digital Resmi
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                        {product.name}
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Guarantee Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Garansi Penuh</span>
                      <span className="text-[11px] text-foreground-muted">Jaminan ganti akun 100%</span>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Proses Instan</span>
                      <span className="text-[11px] text-foreground-muted">1 - 15 menit selesai</span>
                    </div>
                  </div>

                  <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">Akun Private</span>
                      <span className="text-[11px] text-foreground-muted">Ruang kerja aman & personal</span>
                    </div>
                  </div>
                </div>

                {/* Description & Features */}
                <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-2">
                      Deskripsi Layanan
                    </h3>
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted mb-3">
                      Fitur Unggulan Yang Anda Dapatkan
                    </h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
                    Informasi & Spesifikasi Lisensi
                  </h3>
                  <div className="divide-y divide-border/60">
                    {product.specifications.map((spec, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                        <span className="text-foreground-muted">{spec.label}</span>
                        <span className="font-semibold text-foreground">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic Pricing & Action Box (5 Cols) */}
              <div className="lg:col-span-5 sticky top-24 space-y-6">
                <Card className="bg-surface border-border shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        Pilihan Paket Berlangganan
                      </span>
                      {isOutOfStock ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-status-error/15 text-status-error font-semibold border border-status-error/30 flex items-center gap-1 shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-status-error" />
                          <span>Stok Habis</span>
                        </span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-status-success/10 text-status-success font-medium border border-status-success/20">
                          Stok Tersedia ({product.stock ?? 100})
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground mt-2">
                      Rp {totalPrice.toLocaleString('id-ID')}
                    </CardTitle>
                    <p className="text-xs text-foreground-muted">
                      Harga nett termasuk panduan aktivasi resmi & garansi pergantian.
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* Out of Stock Warning Banner */}
                    {isOutOfStock && (
                      <div className="p-3 bg-status-error/10 border border-status-error/30 rounded-lg flex items-center gap-2.5 text-xs text-status-error">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>Perhatian:</strong> Stok lisensi produk ini saat ini sedang habis. Pemesanan sementara tidak dapat diproses.
                        </span>
                      </div>
                    )}

                    {/* Duration Selection Radios / Single Package Display */}
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-foreground-muted block">
                        {product.durations && product.durations.length > 1
                          ? 'Pilih Durasi Masa Aktif:'
                          : 'Paket & Durasi Layanan:'}
                      </span>
                      <div className="space-y-2">
                        {product.durations.map((dur, idx) => {
                          const isSelected = selectedDurationIndex === idx;
                          return (
                            <button
                              key={dur.id}
                              type="button"
                              onClick={() => setSelectedDurationIndex(idx)}
                              className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                                isSelected
                                  ? 'bg-surface-raised border-primary shadow-sm ring-1 ring-primary'
                                  : 'bg-surface border-border hover:border-foreground-muted/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-primary text-white'
                                      : 'bg-surface-hover'
                                  }`}
                                >
                                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </span>
                                <span className="text-xs font-medium text-foreground">
                                  {dur.label}
                                </span>
                              </div>
                              <span className="text-xs font-bold text-foreground">
                                Rp {dur.price.toLocaleString('id-ID')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex items-center justify-between p-3 bg-surface-raised rounded-lg">
                      <span className="text-xs font-medium text-foreground-muted">
                        Jumlah Lisensi:
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-md bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground text-xs"
                          disabled={quantity <= 1 || isOutOfStock}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-7 h-7 rounded-md bg-surface flex items-center justify-center text-foreground-muted hover:text-foreground text-xs"
                          disabled={isOutOfStock}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Order Total Breakdown */}
                    <div className="p-3 bg-surface-raised rounded-lg space-y-1.5 text-xs">
                      <div className="flex justify-between text-foreground-muted">
                        <span>Paket:</span>
                        <span className="text-foreground">{currentDuration.label}</span>
                      </div>
                      <div className="flex justify-between text-foreground-muted">
                        <span>Biaya Transaksi:</span>
                        <span className="text-status-success font-medium">Rp 0 (Gratis)</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground pt-1.5 border-t border-border">
                        <span>Total Tagihan:</span>
                        <span className="text-primary text-sm">
                          Rp {totalPrice.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2.5">
                      <Button
                        className={`w-full gap-2 text-sm font-semibold h-11 ${
                          isOutOfStock
                            ? 'bg-surface-raised text-status-error border border-status-error/30 cursor-not-allowed opacity-80 hover:bg-surface-raised'
                            : ''
                        }`}
                        disabled={isOutOfStock}
                        onClick={handleBuyNow}
                        title={isOutOfStock ? 'Stok produk saat ini habis' : undefined}
                      >
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-status-error" />
                            <span>Stok Habis (Tidak Tersedia)</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>Beli Sekarang (Instan)</span>
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className={`w-full gap-2 text-xs border-border h-10 ${
                          isOutOfStock
                            ? 'opacity-60 cursor-not-allowed text-status-error border-status-error/20'
                            : 'hover:border-primary/50'
                        }`}
                        disabled={isOutOfStock}
                        onClick={handleAddToCart}
                        title={isOutOfStock ? 'Stok produk saat ini habis' : undefined}
                      >
                        {isOutOfStock ? (
                          <>
                            <AlertTriangle className="w-4 h-4 text-status-error" />
                            <span>Stok Habis</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 text-primary" />
                            <span>Tambah ke Keranjang</span>
                          </>
                        )}
                      </Button>
                    </div>

                    <p className="text-[11px] text-center text-foreground-muted leading-tight">
                      Pembayaran aman melalui QRIS, GoPay, dan Transfer Virtual Account bank terkemuka.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Pertanyaan Umum (FAQ)</h2>
              </div>

              <div className="space-y-3">
                {product.faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-border rounded-lg overflow-hidden bg-surface-raised"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-surface-hover transition-colors"
                      >
                        <span className="text-xs sm:text-sm font-semibold text-foreground">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-foreground-muted shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-xs text-foreground-muted border-t border-border/40">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Related Products Recommendation */}
            {product.relatedProducts && product.relatedProducts.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground">Rekomendasi Produk Lainnya</h2>
                  <Link
                    href="/products"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Lihat Semua Katalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {product.relatedProducts.map((rel) => (
                    <div
                      key={rel.id}
                      className="bg-surface border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/50 transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="h-32 rounded-lg bg-surface-raised overflow-hidden border border-border relative">
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
                          <span className="text-[11px] text-primary font-medium">{rel.category.name}</span>
                          <h4 className="text-sm font-bold text-foreground">{rel.name}</h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                        <span className="text-xs font-bold text-foreground">{rel.priceFormatted}</span>
                        <Link href={`/products/${rel.id}`}>
                          <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
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
