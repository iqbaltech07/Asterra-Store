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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Katalog Produk & Estimasi Komisi</h2>
          <p className="text-xs text-foreground-muted">
            Pilih produk, dapatkan link referral otomatis ({partnerCode}), dan nikmati komisi langsung dari setiap transaksi yang berhasil.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1.5 text-status-success border-status-success/30 bg-status-success/5 gap-1.5">
            <Percent className="w-3.5 h-3.5" />
            <span>Skema Anda: {partnerRate}% dari Profit Transaksi</span>
          </Badge>
        </div>
      </div>

      {/* Transparansi Info Banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <h4 className="font-semibold text-foreground">Prinsip Komisi Transparan Asterra Store</h4>
            <p className="text-foreground-muted text-[11px] leading-relaxed">
              Komisi dihitung berdasarkan <strong>Profit Bersih Transaksi</strong> (margin harga jual dikurangi biaya modal produk), bukan omzet kotor. Dengan skema {partnerRate}%, Anda mendapatkan bagian profit nyata tanpa potongan tersembunyi.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[11px] text-foreground-muted">Butuh copywriting?</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange('sales-links')}
            className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 gap-1 font-semibold"
          >
            <span>Materi Promosi</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari produk digital (misal: Canva, Netflix, Spotify, ChatGPT)..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9 bg-surface border-border text-xs h-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
            className="text-xs h-10 shrink-0 font-medium"
          >
            Semua Kategori ({products.length})
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs h-10 shrink-0 font-medium"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 bg-surface rounded-xl border border-border animate-pulse p-4 space-y-3">
              <div className="h-4 w-24 bg-foreground/10 rounded" />
              <div className="h-6 w-3/4 bg-foreground/15 rounded" />
              <div className="h-14 w-full bg-foreground/10 rounded" />
              <div className="h-9 w-full bg-foreground/10 rounded mt-4" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-bold text-sm text-foreground">Tidak Ada Produk Ditemukan</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ubah pilihan kategori Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4 hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded-md">
                      {catName}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] text-status-success border-status-success/30 bg-status-success/10 font-bold px-2 py-0.5"
                    >
                      Komisi: Rp {commissionRp.toLocaleString('id-ID')}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {p.name}
                  </h4>

                  <div className="bg-surface-raised border border-border/80 rounded-lg p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Harga Pelanggan:</span>
                      <span className="font-bold text-foreground">
                        {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Estimasi Profit Bersih:</span>
                      <span className="font-medium text-foreground-muted font-mono">
                        Rp {estimatedProfit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="pt-1.5 border-t border-border flex items-center justify-between">
                      <span className="font-semibold text-status-success text-[11px] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Potensi Jual 10 Unit:</span>
                      </span>
                      <span className="font-bold text-status-success font-mono">
                        Rp {(commissionRp * 10).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCopy(productUrl, `prod-${p.id}`)}
                    className="flex-1 text-xs h-9 gap-1.5 font-semibold"
                  >
                    {copiedLink === `prod-${p.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-success" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link</span>
                      </>
                    )}
                  </Button>

                  <a
                    href={`https://wa.me/?text=Dapatkan%20${encodeURIComponent(
                      p.name
                    )}%20resmi%20bergaransi%20hanya%20${encodeURIComponent(
                      p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`
                    )}%20di%20Asterra%20Store:%20${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-lg border border-border bg-surface-raised hover:bg-status-success/10 hover:border-status-success/30 text-foreground hover:text-status-success flex items-center justify-center transition-colors shrink-0"
                    title="Bagikan ke WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5 text-status-success" />
                  </a>

                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-lg border border-border bg-surface-raised hover:bg-surface-raised/80 text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors shrink-0"
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
