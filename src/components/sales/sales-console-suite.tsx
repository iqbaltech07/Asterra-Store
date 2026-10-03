'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Award,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Share2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  Package,
  Layers,
  HelpCircle,
  QrCode,
  DollarSign,
  ChevronRight,
  ShoppingBag,
  Percent,
  Clock,
  ArrowUpRight,
  Lock,
  Send,
  RefreshCw,
  FileText,
  BookOpen,
  MessageSquare,
  ShieldCheck,
  Building,
  CreditCard,
} from 'lucide-react';
import { AdminTab } from '@/components/admin/admin-sidebar';

interface SalesConsoleProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  adminUser: { id?: string; email: string; name?: string; role?: string } | null;
}

interface SalesProfileData {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  tier: string;
  rate: number;
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  unpaidCommission: number;
  paidCommission: number;
  bankName?: string;
  bankAccount?: string;
  status: string;
  joinedAt: string;
  payoutRequests?: Array<{
    id: string;
    amount: number;
    bankName: string;
    bankAccount: string;
    bankAccountName: string;
    status: 'pending' | 'completed' | 'rejected';
    requestedAt: string;
    notes?: string;
  }>;
}

interface ProductItem {
  id: string;
  name: string;
  categoryName: string;
  price: number;
  priceFormatted: string;
  status: string;
  imageUrl?: string;
}

interface SalesOrder {
  id: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  commission: number;
  itemsCount: number;
  productNames: string;
}

export function SalesConsoleSuite({ activeTab, onTabChange, adminUser }: SalesConsoleProps) {
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // 1. Fetch Sales Profile & Live Metrics
  const { data: profileRes, isLoading: isProfileLoading, refetch: refetchProfile } = useQuery<{
    success: boolean;
    data: SalesProfileData;
  }>({
    queryKey: ['sales-me'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/me', { headers });
      if (!res.ok) throw new Error('Gagal memuat profil sales');
      return res.json();
    },
    staleTime: 30000,
  });

  const partner = profileRes?.data;
  const partnerCode = partner?.code || 'AST-SALES';
  const partnerRate = partner?.rate || 10;

  // 2. Fetch Products for Catalog Tab
  const { data: productsRes, isLoading: isProductsLoading } = useQuery<{
    success: boolean;
    data: ProductItem[];
  }>({
    queryKey: ['sales-products'],
    queryFn: async () => {
      const res = await fetch('/api/v1/products');
      if (!res.ok) throw new Error('Gagal memuat katalog');
      return res.json();
    },
    staleTime: 60000,
  });

  // 3. Fetch Sales Orders
  const { data: ordersRes, isLoading: isOrdersLoading, refetch: refetchOrders } = useQuery<{
    success: boolean;
    data: SalesOrder[];
  }>({
    queryKey: ['sales-orders'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/orders', { headers });
      if (!res.ok) throw new Error('Gagal memuat pesanan');
      return res.json();
    },
    staleTime: 30000,
  });

  // Helper copy link
  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') return window.location.origin;
    return 'https://asterrastore.biz.id';
  };

  const referralUrl = `${getBaseUrl()}/?ref=${partnerCode}`;

  // Conversion rate calculation
  const conversionRate = useMemo(() => {
    if (!partner || !partner.totalClicks || partner.totalClicks === 0) return '0.0%';
    const rate = ((partner.totalOrders || 0) / partner.totalClicks) * 100;
    return `${rate.toFixed(1)}%`;
  }, [partner]);

  // Product search & category filters
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    const list = productsRes?.data || [];
    return list.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.categoryName.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.categoryName === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [productsRes?.data, productSearch, selectedCategory]);

  const categories = useMemo(() => {
    const list = productsRes?.data || [];
    const set = new Set<string>();
    list.forEach((p) => set.add(p.categoryName));
    return Array.from(set);
  }, [productsRes?.data]);

  // Link Generator State
  const [selectedProductForLink, setSelectedProductForLink] = useState('');
  const [campaignTag, setCampaignTag] = useState('wa-status');

  const customGeneratedUrl = useMemo(() => {
    const base = getBaseUrl();
    const tagQuery = campaignTag.trim() ? `&utm_campaign=${encodeURIComponent(campaignTag.trim())}` : '';
    if (selectedProductForLink) {
      return `${base}/products/${selectedProductForLink}?ref=${partnerCode}${tagQuery}`;
    }
    return `${base}/?ref=${partnerCode}${tagQuery}`;
  }, [partnerCode, selectedProductForLink, campaignTag]);

  // Payout Form States
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutBank, setPayoutBank] = useState('BCA');
  const [payoutAccount, setPayoutAccount] = useState('');
  const [payoutHolder, setPayoutHolder] = useState(adminUser?.name || '');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null);
  const [payoutErrorMsg, setPayoutErrorMsg] = useState<string | null>(null);

  const payoutMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/v1/sales/payout', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: Number(payoutAmount),
          bankName: payoutBank,
          bankAccount: payoutAccount,
          bankAccountName: payoutHolder,
          notes: payoutNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Gagal mengajukan pencairan dana.');
      }
      return data;
    },
    onSuccess: (data) => {
      setPayoutSuccessMsg(data.message || 'Pengajuan penarikan dana berhasil dikirim.');
      setPayoutErrorMsg(null);
      setPayoutAmount('');
      queryClient.invalidateQueries({ queryKey: ['sales-me'] });
    },
    onError: (err: any) => {
      setPayoutErrorMsg(err.message || 'Terjadi kesalahan sistem.');
      setPayoutSuccessMsg(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. SALES OVERVIEW TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-overview' && (
        <div className="space-y-6">
          {/* Welcome & Referral Banner */}
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success/15 border border-status-success/30 text-status-success text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  <span>Status Mitra: {partner?.tier || 'Standard (10%)'} Aktif</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Halo, {partner?.name || adminUser?.name || 'Mitra Sales'}!
                </h2>
                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Bagikan link referral Anda untuk mendapatkan bagi hasil komisi{' '}
                  <strong className="text-foreground">{partnerRate}%</strong> dari setiap transaksi pembelian produk digital di Asterra Store.
                </p>
              </div>

              {/* Referral Link Box */}
              <div className="bg-surface-raised border border-border p-4 rounded-xl space-y-3 min-w-[320px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted font-medium">Link Referral Anda:</span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary border-primary/30">
                    {partnerCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={referralUrl}
                    className="bg-surface border-border text-xs font-mono h-9 select-all"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(referralUrl, 'ref-banner')}
                    className="h-9 px-3 gap-1.5 shrink-0 text-xs font-semibold"
                  >
                    {copiedLink === 'ref-banner' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-success" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </Button>
                </div>

                <a
                  href={`https://wa.me/?text=Halo!%20Dapatkan%20akun%20premium%20resmi%20bergaransi%20(Canva%20Pro,%20Gemini%20AI,%20Netflix,%20Spotify)%20di%20Asterra%20Store:%20${encodeURIComponent(
                    referralUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Bagikan ke Status WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Saldo Komisi Siap Tarik */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Komisi Siap Tarik</span>
                <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-foreground-muted">Total dicairkan:</span>
                <span className="font-semibold text-foreground">
                  Rp {(partner?.paidCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* 2. Total Pesanan Berhasil */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Pesanan Referral</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {partner?.totalOrders || 0} <span className="text-xs font-normal text-foreground-muted">Order</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-foreground-muted">Omzet dihasilkan:</span>
                <span className="font-semibold text-foreground">
                  Rp {(partner?.totalRevenue || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* 3. Total Kunjungan Link (Clicks) */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Total Klik Referral</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {partner?.totalClicks || 0} <span className="text-xs font-normal text-foreground-muted">Klik</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-foreground-muted">Tingkat konversi:</span>
                <span className="font-semibold text-status-success">{conversionRate}</span>
              </div>
            </div>

            {/* 4. Tier & Skema Komisi */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Skema Komisi Anda</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {partnerRate}% <span className="text-xs font-normal text-foreground-muted">/ Transaksi</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-foreground-muted">Target VIP (15%):</span>
                <span className="font-semibold text-foreground">50 Transaksi</span>
              </div>
            </div>
          </div>

          {/* Fast Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => onTabChange('sales-catalog')}
              className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Katalog Produk & Komisi</h3>
              <p className="text-xs text-foreground-muted">
                Jelajahi produk digital Asterra, hitung komisi Anda, dan salin link promosi per produk.
              </p>
            </div>

            <div
              onClick={() => onTabChange('sales-links')}
              className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Share2 className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Generator Link & Teks Promo</h3>
              <p className="text-xs text-foreground-muted">
                Buat custom link kampanye dan gunakan template copywriting yang siap dibagikan ke medsos.
              </p>
            </div>

            <div
              onClick={() => onTabChange('sales-wallet')}
              className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Dompet & Penarikan Dana</h3>
              <p className="text-xs text-foreground-muted">
                Cairkan komisi Anda langsung ke rekening bank atau e-wallet tanpa biaya admin tersembunyi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALES CATALOG TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-catalog' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Katalog Produk & Estimasi Komisi</h2>
              <p className="text-xs text-foreground-muted">
                Salin link produk langsung dengan kode referral Anda ({partnerCode}) sudah terpasang otomatis.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 text-primary border-primary/30">
                Komisi Anda: {partnerRate}% Per Transaksi
              </Badge>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Cari produk digital (misal: Canva, Netflix, Spotify)..."
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
                className="text-xs h-10 shrink-0"
              >
                Semua Kategori
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="text-xs h-10 shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isProductsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-surface rounded-xl border border-border animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-foreground-muted mx-auto" />
              <h3 className="font-bold text-sm text-foreground">Tidak Ada Produk Ditemukan</h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ubah filter kategori Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const productUrl = `${getBaseUrl()}/products/${p.id}?ref=${partnerCode}`;
                const commissionRp = Math.round((p.price * partnerRate) / 100);

                return (
                  <div
                    key={p.id}
                    className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4 hover:border-border-hover transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">
                          {p.categoryName}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 bg-status-success/5 font-semibold">
                          Komisi: Rp {commissionRp.toLocaleString('id-ID')}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{p.name}</h4>
                      <div className="text-base font-extrabold text-foreground">
                        {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
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
                            <span>Link Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin Link Referral</span>
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
                        className="h-9 px-3 rounded-lg border border-border bg-surface-raised hover:bg-surface-raised/80 text-foreground flex items-center justify-center transition-colors"
                        title="Bagikan ke WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-status-success" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SALES LINKS & PROMO COPY GENERATOR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-links' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Generator Tautan & Materi Promosi</h2>
            <p className="text-xs text-foreground-muted">
              Kustomisasi tautan kampanye khusus dan gunakan template copywriting yang terbukti menghasilkan penjualan.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Link Builder */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Custom Link Generator</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Pilih Halaman Tujuan:</label>
                  <select
                    value={selectedProductForLink}
                    onChange={(e) => setSelectedProductForLink(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground"
                  >
                    <option value="">Beranda Toko (Utama)</option>
                    {(productsRes?.data || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceFormatted}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Tag Sumber Kampanye (UTM):</label>
                  <Input
                    placeholder="Contoh: wa-status, ig-bio, tiktok, teman-kantor"
                    value={campaignTag}
                    onChange={(e) => setCampaignTag(e.target.value)}
                    className="bg-surface-raised border-border text-xs h-10 font-mono"
                  />
                  <span className="text-[11px] text-foreground-muted mt-1 block">
                    Tag ini membantu Anda melacak dari media mana pelanggan datang.
                  </span>
                </div>

                <div className="pt-2 space-y-1.5">
                  <label className="font-semibold text-foreground block">Hasil Tautan Kustom Anda:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={customGeneratedUrl}
                      className="bg-surface-raised border-border text-xs font-mono h-10 select-all"
                    />
                    <Button
                      onClick={() => handleCopy(customGeneratedUrl, 'custom-url')}
                      className="h-10 px-3 text-xs font-semibold shrink-0 gap-1.5"
                    >
                      {copiedLink === 'custom-url' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-status-success" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ready-to-use Copywriting Templates */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-status-success" />
                <span>Template Copywriting Promosi</span>
              </h3>

              <div className="space-y-3">
                {/* Template 1: WhatsApp Status */}
                <div className="bg-surface-raised border border-border rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Template WhatsApp Story / Status</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Halo temen-temen! Butuh akun Canva Pro, Gemini AI, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`,
                          'copy-wa'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2 text-primary"
                    >
                      {copiedLink === 'copy-wa' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-wa' ? 'Tersalin' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px]">
                    "Halo temen-temen! Butuh akun Canva Pro, Gemini AI, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: [Link Referral Anda]"
                  </p>
                </div>

                {/* Template 2: Instagram Bio / DM */}
                <div className="bg-surface-raised border border-border rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Template Caption Instagram / Bio</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨\nCanva Pro, ChatGPT, Gemini, Netflix, Spotify ready kilat ⚡\nOrder sekarang: ${customGeneratedUrl}`,
                          'copy-ig'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2 text-primary"
                    >
                      {copiedLink === 'copy-ig' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-ig' ? 'Tersalin' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px]">
                    "Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨ Canva Pro, Gemini, Netflix, Spotify ready kilat ⚡ Order: [Link Referral]"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SALES ORDERS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-orders' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Pesanan Referral Saya</h2>
              <p className="text-xs text-foreground-muted">
                Daftar transaksi pelanggan yang menggunakan kode referral Anda ({partnerCode}).
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchOrders()}
              className="text-xs h-9 gap-1.5 border-border"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan Data</span>
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            {isOrdersLoading ? (
              <div className="p-8 text-center text-xs text-foreground-muted">Memuat data pesanan referral...</div>
            ) : (ordersRes?.data || []).length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <ShoppingBag className="w-10 h-10 text-foreground-muted mx-auto" />
                <h3 className="font-bold text-sm text-foreground">Belum Ada Pesanan Referral</h3>
                <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                  Belum ada pelanggan yang menyelesaikan transaksi melalui link Anda. Bagikan link referral Anda untuk mulai mengumpulkan komisi!
                </p>
                <Button
                  size="sm"
                  onClick={() => onTabChange('sales-links')}
                  className="text-xs h-9 font-semibold gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Mulai Bagikan Link</span>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                    <tr>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">ID Pesanan</th>
                      <th className="py-3 px-4">Produk</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Total Nilai</th>
                      <th className="py-3 px-4">Komisi Saya</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(ordersRes?.data || []).map((o) => (
                      <tr key={o.id} className="hover:bg-surface-raised/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                          {new Date(o.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-foreground">
                          {o.id.substring(0, 10)}...
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium max-w-[200px] truncate">
                          {o.productNames || 'Produk Digital'}
                        </td>
                        <td className="py-3 px-4 font-mono text-foreground-muted">
                          {o.customerEmail}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          Rp {o.totalAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-status-success">
                          + Rp {o.commission.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              o.status === 'completed'
                                ? 'text-status-success border-status-success/30 bg-status-success/10'
                                : o.status === 'processing'
                                ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                                : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                            }`}
                          >
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SALES WALLET & WITHDRAWAL TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-wallet' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Dompet & Pencairan Komisi</h2>
            <p className="text-xs text-foreground-muted">
              Cairkan saldo komisi yang berhasil Anda kumpulkan ke rekening bank atau e-wallet Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Balance Cards */}
            <div className="space-y-4">
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
                <span className="text-xs font-medium text-foreground-muted">Saldo Tersedia untuk Ditarik</span>
                <div className="text-3xl font-extrabold text-status-success tracking-tight">
                  Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-foreground-muted pt-1">
                  Minimal penarikan: <strong className="text-foreground">Rp 50.000</strong>
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
                <span className="text-xs font-medium text-foreground-muted">Total Komisi Telah Dicairkan</span>
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  Rp {(partner?.paidCommission || 0).toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-foreground-muted pt-1">
                  Semua transaksi transfer diproses oleh tim keuangan Asterra Store.
                </p>
              </div>
            </div>

            {/* Payout Request Form */}
            <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Formulir Pengajuan Penarikan Saldo</span>
              </h3>

              {payoutSuccessMsg && (
                <div className="p-3.5 rounded-lg bg-status-success/15 border border-status-success/30 text-status-success text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{payoutSuccessMsg}</span>
                </div>
              )}

              {payoutErrorMsg && (
                <div className="p-3.5 rounded-lg bg-status-error/15 border border-status-error/30 text-status-error text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutErrorMsg}</span>
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  payoutMutation.mutate();
                }}
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Pilih Bank / E-Wallet:</label>
                    <select
                      value={payoutBank}
                      onChange={(e) => setPayoutBank(e.target.value)}
                      className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground"
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BNI">BNI (Bank Negara Indonesia)</option>
                      <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                      <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                      <option value="DANA">DANA (E-Wallet)</option>
                      <option value="GoPay">GoPay (E-Wallet)</option>
                      <option value="OVO">OVO (E-Wallet)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">Nominal Penarikan (Rp):</label>
                    <Input
                      type="number"
                      required
                      min={50000}
                      max={partner?.unpaidCommission || 0}
                      placeholder="Contoh: 100000"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="bg-surface-raised border-border text-xs h-10 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">Nomor Rekening / No. E-Wallet:</label>
                    <Input
                      type="text"
                      required
                      placeholder="Contoh: 8965123456"
                      value={payoutAccount}
                      onChange={(e) => setPayoutAccount(e.target.value)}
                      className="bg-surface-raised border-border text-xs h-10 font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-foreground block mb-1">Nama Pemilik Rekening:</label>
                    <Input
                      type="text"
                      required
                      placeholder="Contoh: Andi Pratama"
                      value={payoutHolder}
                      onChange={(e) => setPayoutHolder(e.target.value)}
                      className="bg-surface-raised border-border text-xs h-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Catatan Tambahan (Opsional):</label>
                  <Input
                    type="text"
                    placeholder="Catatan untuk bagian finance..."
                    value={payoutNotes}
                    onChange={(e) => setPayoutNotes(e.target.value)}
                    className="bg-surface-raised border-border text-xs h-10"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    payoutMutation.isPending ||
                    !partner ||
                    (partner.unpaidCommission || 0) < 50000 ||
                    !payoutAccount ||
                    !payoutHolder
                  }
                  className="w-full text-xs font-bold h-10 gap-2 shadow-sm"
                >
                  {payoutMutation.isPending ? (
                    <span>Mengirim Pengajuan...</span>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Ajukan Penarikan Dana Sekarang</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Riwayat Pengajuan Penarikan Komisi</h3>
            </div>
            {(partner?.payoutRequests || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-foreground-muted">
                Belum ada histori pengajuan penarikan dana.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                    <tr>
                      <th className="py-3 px-4">Tanggal Pengajuan</th>
                      <th className="py-3 px-4">Tujuan Transfer</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(partner?.payoutRequests || []).map((req) => (
                      <tr key={req.id}>
                        <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                          {new Date(req.requestedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          <span className="font-bold">{req.bankName}</span> ({req.bankAccount} a.n {req.bankAccountName})
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          Rp {req.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              req.status === 'completed'
                                ? 'text-status-success border-status-success/30 bg-status-success/10'
                                : req.status === 'rejected'
                                ? 'text-status-error border-status-error/30 bg-status-error/10'
                                : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                            }`}
                          >
                            {req.status === 'completed'
                              ? 'Selesai Ditransfer'
                              : req.status === 'rejected'
                              ? 'Ditolak'
                              : 'Diproses Tim Finance'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SALES ACADEMY & GUIDELINES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-academy' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Panduan & Edukasi Mitra Sales</h2>
            <p className="text-xs text-foreground-muted">
              Pusat pengetahuan, aturan promosi resmi, dan kontak koordinator tim penjualan Asterra Store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide 1: Etika Promosi */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Etika Promosi & Regulasi Kemitraan</h3>
              <ul className="text-xs text-foreground-muted space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-foreground">Dilarang Spam:</strong> Jangan mengirimkan link secara membabi-buta di grup chat publik atau kolom komentar akun orang lain.
                </li>
                <li>
                  <strong className="text-foreground">Informasi Akurat:</strong> Sampaikan informasi garansi sesuai ketentuan toko (garansi penggantian akun 100%).
                </li>
                <li>
                  <strong className="text-foreground">Keamanan Akun:</strong> Jangan meminta kredensial akun pribadi pembeli selain data yang dibutuhkan saat checkout toko.
                </li>
              </ul>
            </div>

            {/* Guide 2: FAQ Komisi */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Pertanyaan Umum Seputar Komisi (FAQ)</h3>
              <div className="text-xs text-foreground-muted space-y-2 leading-relaxed">
                <div>
                  <p className="font-semibold text-foreground">Kapan komisi masuk ke saldo saya?</p>
                  <p className="text-[11px]">Seketika setelah pembeli menyelesaikan pembayaran melalui payment gateway resmi toko kami.</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Berapa lama proses pencairan dana (payout)?</p>
                  <p className="text-[11px]">Penarikan saldo komisi diverifikasi dan ditransfer maksimal 1x24 jam kerja.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Sales Coordinator */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-status-success" />
                <span>Butuh Bantuan Materi Promosi Khusus?</span>
              </h3>
              <p className="text-xs text-foreground-muted">
                Hubungi Koordinator Mitra Sales Asterra Store untuk mendapatkan banner promo khusus atau konsultasi target penjualan.
              </p>
            </div>
            <a
              href="https://wa.me/6281298765432?text=Halo%20Koordinator%20Sales%20Asterra%20Store,%20saya%20ingin%20konsultasi%20materi%20promosi%20dan%20katalog."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs shrink-0 transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp Koordinator Sales</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
