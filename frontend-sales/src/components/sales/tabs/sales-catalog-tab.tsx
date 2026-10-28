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
  ShieldCheck,
  ArrowRight,
  Send,
  ExternalLink,
} from 'lucide-react';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';
import { CopyButton } from '@/components/ui/copy-button';
import { ShareButton } from '@/components/ui/share-button';
import { SlidingPillTabs } from '@/components/ui/sliding-pill-tabs';
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


  const categoryTabs = useMemo(() => {
    return [
      { id: 'all', label: `Semua (${products.length})` },
      ...categories.map((cat) => ({ id: cat, label: cat })),
    ];
  }, [categories, products.length]);

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
            <ShieldCheck className="w-4 h-4" />
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
            className="text-xs h-8 bg-white border-blue-200 text-[#2563EB] hover:bg-blue-50 gap-1 font-semibold rounded-xl active:scale-95"
          >
            <span>Materi Promosi</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Search & Category Filter Bar with Sliding Pill Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari produk digital (misal: Canva, Netflix, Spotify, ChatGPT)..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10 bg-white border-border text-xs h-10 rounded-xl"
          />
        </div>
        <div className="overflow-x-auto pb-1 max-w-full">
          <SlidingPillTabs
            tabs={categoryTabs}
            activeTab={selectedCategory}
            onChange={setSelectedCategory}
            ariaLabel="Kategori Produk"
            pillClassName="bg-primary text-white shadow-xs"
          />
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
        <div
          key={`${selectedCategory}-${productSearch}`}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
        >
          {filteredProducts.map((p, idx) => {
            const productUrl = `${getStoreBaseUrl()}/products/${p.id}?ref=${partnerCode}`;
            const catName = p.categoryName || p.category?.name || 'Digital';

            // Safe commission calculation without exposing store profit margins
            const commissionRp = p.baseCommission
              ? Math.round(p.baseCommission * (partnerRate / 15))
              : (p.profitMargin && p.profitMargin > 0
                  ? Math.round((p.profitMargin * partnerRate) / 100)
                  : Math.max(750, Math.round(p.price * 0.075)));

            return (
              <div
                key={p.id}
                className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 card-hover-elevation animate-fade-up group"
                style={{ animationDelay: `${Math.min(idx, 7) * 40}ms` }}
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

                  <div className="flex items-center gap-3">
                    <ProductBrandIcon name={p.name} className="w-10 h-10 rounded-xl" />
                    <h4 className="font-bold text-sm text-foreground group-hover:text-[#2563EB] transition-colors line-clamp-2">
                      {p.name}
                    </h4>
                  </div>

                  <div className="bg-[#F8F9FB] border border-border/80 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Harga Pelanggan:</span>
                      <span className="font-bold text-foreground font-mono">
                        {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted text-[11px]">Komisi per Unit:</span>
                      <span className="font-bold text-[#16A36A] font-mono">
                        Rp {commissionRp.toLocaleString('id-ID')}
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
                  <CopyButton
                    text={productUrl}
                    label="Salin Link"
                    copiedLabel="Tersalin!"
                    size="sm"
                    className="flex-1"
                  />

                  <ShareButton
                    url={productUrl}
                    title={p.name}
                    text={`Dapatkan ${p.name} resmi bergaransi hanya ${p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`} di Asterra Store:`}
                    variant="outline"
                    size="sm"
                    iconOnly
                  />

                  <a
                    href={`https://wa.me/?text=Dapatkan%20${encodeURIComponent(
                      p.name
                    )}%20resmi%20bergaransi%20hanya%20${encodeURIComponent(
                      p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`
                    )}%20di%20Asterra%20Store:%20${encodeURIComponent(productUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-white hover:bg-emerald-50 hover:border-emerald-300 text-foreground-muted hover:text-[#16A36A] active:scale-95 flex items-center justify-center transition-all shrink-0 shadow-xs cursor-pointer"
                    title="Bagikan ke WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-xl border border-border bg-white hover:bg-surface-secondary text-foreground-muted hover:text-foreground active:scale-95 flex items-center justify-center transition-all shrink-0 shadow-xs"
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
