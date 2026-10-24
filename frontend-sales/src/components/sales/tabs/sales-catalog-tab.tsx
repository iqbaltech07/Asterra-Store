'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Package,
  TrendingUp,
  Percent,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Send,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { ProductItem } from '../types';

interface SalesCatalogTabProps {
  partnerCode: string;
  partnerRate: number;
  products: ProductItem[];
  isLoading?: boolean;
  onTabChange: (tab: AdminTab) => void;
}

export function SalesCatalogTab({
  partnerCode,
  partnerRate,
  products,
  isLoading = false,
  onTabChange,
}: SalesCatalogTabProps) {
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const cat = p.categoryName || p.category?.name;
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.categoryName || p.category?.name || '')
          .toLowerCase()
          .includes(productSearch.toLowerCase());
      const catName = p.categoryName || p.category?.name;
      const matchCat = selectedCategory === 'all' || catName === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, selectedCategory]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleShare = async (url: string, title: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">Katalog Produk & Komisi</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Pilih produk, dapatkan link referral otomatis (<span className="font-mono text-primary font-bold">{partnerCode}</span>), dan nikmati komisi langsung dari setiap transaksi yang berhasil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="text-xs font-semibold px-3 py-1 gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Skema: {partnerRate}% dari Profit Transaksi</span>
          </Badge>
        </div>
      </div>

      {/* Transparansi Info Banner */}
      <div className="rounded-2xl border border-blue-200/70 bg-blue-50/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-bold text-foreground">Prinsip Komisi Transparan Asterra Store</h4>
            <p className="text-foreground-muted text-xs leading-relaxed">
              Komisi dihitung berdasarkan <strong>Profit Bersih Transaksi</strong> (margin harga jual dikurangi biaya modal produk upstream), bukan omzet kotor. Dengan skema {partnerRate}%, Anda mendapatkan bagian profit nyata tanpa potongan tersembunyi.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange('sales-links')}
            className="text-xs h-8 bg-white border-blue-200 text-[#2563EB] hover:bg-blue-50 gap-1 font-semibold rounded-xl"
          >
            <span>Materi Promosi</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari produk digital (misal: Canva, Netflix, Spotify, ChatGPT)..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10 bg-white border-border text-xs h-10"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="text-xs h-10 shrink-0 font-medium rounded-xl"
          >
            Semua ({products.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs h-10 shrink-0 font-medium rounded-xl"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-surface rounded-2xl border border-border animate-pulse p-5 space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-14 w-full bg-gray-200 rounded" />
              <div className="h-9 w-full bg-gray-200 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Tidak Ada Produk Ditemukan</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ubah pilihan kategori Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredProducts.map((p) => {
            const productUrl = `${getStoreBaseUrl()}/products/${p.id}?ref=${partnerCode}`;
            const catName = p.categoryName || p.category?.name || 'Digital';

            const estimatedProfit =
              p.profitMargin && p.profitMargin > 0
                ? p.profitMargin
                : Math.max(5000, Math.round(p.price * 0.25));
            const commissionRp = Math.round((estimatedProfit * partnerRate) / 100);

            return (
              <div
                key={p.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#171717]/30 hover:shadow-card-hover transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-[#2563EB] tracking-wider uppercase bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full">
                      {catName}
                    </span>
                    <Badge
                      variant="success"
                      className="text-[10px] font-bold px-2.5 py-0.5"
                    >
                      Komisi: Rp {commissionRp.toLocaleString('id-ID')}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-foreground group-hover:text-[#2563EB] transition-colors line-clamp-2">
                    {p.name}
                  </h4>

                  <div className="bg-[#F8F9FB] border border-border/80 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Harga Pelanggan:</span>
                      <span className="font-bold text-foreground font-mono">
                        {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Estimasi Profit:</span>
                      <span className="font-medium text-foreground-muted font-mono">
                        Rp {estimatedProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="font-semibold text-[#16A36A] text-[11px] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Potensi Jual 10 Unit:</span>
                      </span>
                      <span className="font-bold text-[#16A36A] font-mono">
                        Rp {(commissionRp * 10).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCopy(productUrl, `prod-${p.id}`)}
                    className="flex-1 text-xs h-9 gap-1.5 font-semibold rounded-xl cursor-pointer"
                  >
                    {copiedLink === `prod-${p.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() =>
                      handleShare(
                        productUrl,
                        p.name,
                        `Dapatkan ${p.name} resmi bergaransi hanya ${p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`} di Asterra Store:`
                      )
                    }
                    className="h-9 px-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#2563EB] flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                    title="Bagikan Produk"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`https://wa.me/?text=Dapatkan%20${encodeURIComponent(
                      p.name
                    )}%20resmi%20bergaransi%20hanya%20${encodeURIComponent(
                      p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`
                    )}%20di%20Asterra%20Store:%20${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-white hover:bg-emerald-50 hover:border-emerald-300 text-foreground-muted hover:text-[#16A36A] flex items-center justify-center transition-colors shrink-0 shadow-xs cursor-pointer"
                    title="Bagikan ke WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-white hover:bg-surface-secondary text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors shrink-0 shadow-xs"
                    title="Buka Halaman Produk"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
