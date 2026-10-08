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
  Search,
  Package,
  HelpCircle,
  DollarSign,
  ChevronRight,
  ShoppingBag,
  Percent,
  Clock,
  Send,
  RefreshCw,
  FileText,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  Users,
  ExternalLink,
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
  unpaidCommission: number; // Saldo komisi siap tarik (final)
  pendingCommission?: number; // Saldo dalam masa holding garansi 3 hari
  paidCommission: number;
  networkCommission?: number;
  bankName?: string;
  bankAccount?: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive' | string;
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
  category?: { id: string; name: string };
  categoryName?: string;
  price: number;
  priceFormatted: string;
  status: string;
  imageUrl?: string;
  profitMargin?: number;
  profitPercentage?: number;
}

interface SalesOrder {
  id: string;
  createdAt: string;
  customerEmail: string;
  customerName: string;
  totalAmount: number;
  transactionProfit?: number;
  status: string;
  paymentStatus: string;
  commission: number;
  commissionStatus?: 'pending' | 'final' | 'reversed';
  holdingUntil?: string;
  itemsCount: number;
  productNames: string;
}

export interface NetworkMember {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  code: string;
  joinedAt: string;
  totalOrders: number;
  totalRevenue: number;
  status: 'active' | 'pending' | 'suspended' | 'inactive' | string;
  bonusEarnedFromMember: number;
}

export interface NetworkBonusLogItem {
  id: string;
  orderId?: string;
  fromPartnerCode: string;
  fromPartnerName: string;
  orderTotal: number;
  netRevenue?: number;
  costOfGoods?: number;
  transactionProfit?: number;
  marginEstimate?: number;
  bonusAmount: number;
  bonusPercentage: number;
  status: 'pending' | 'final' | 'reversed';
  holdingUntil?: string;
  releasedAt?: string;
  reversalReason?: string;
  createdAt: string;
}

export interface NetworkDataResponse {
  sponsorCode: string;
  totalTeamMembers: number;
  totalTeamOrders: number;
  totalTeamRevenue: number;
  totalNetworkBonus: number;
  pendingNetworkBonus: number;
  finalNetworkBonus: number;
  reversedNetworkBonus: number;
  teamMembers: NetworkMember[];
  bonusLogs: NetworkBonusLogItem[];
}

export function SalesConsoleSuite({ activeTab, onTabChange, adminUser }: SalesConsoleProps) {
  const queryClient = useQueryClient();
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // 1. Fetch Sales Profile & Live Metrics
  const { data: profileRes, isLoading: isProfileLoading } = useQuery<{
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

  // 4. Fetch Sales Network / Downline Team & Bonus
  const { data: networkRes, isLoading: isNetworkLoading, refetch: refetchNetwork } = useQuery<{
    success: boolean;
    data: NetworkDataResponse;
  }>({
    queryKey: ['sales-network'],
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('asterra_admin_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/v1/sales/network', { headers });
      if (!res.ok) throw new Error('Gagal memuat data bonus tim');
      return res.json();
    },
    staleTime: 30000,
  });

  const networkData = networkRes?.data;

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
  const inviteSalesUrl = `${getBaseUrl()}/daftar-sales?ref=${partnerCode}`;

  const inviteWaMessage = encodeURIComponent(
    `Halo! Mau dapat penghasilan tambahan tanpa modal? Yuk gabung jadi Mitra Sales resmi di Asterra Store!\n\n` +
      `✅ Komisi penjualan langsung 10% (naik 15% setelah 50 order) dari Profit Transaksi bersih\n` +
      `✅ Bonus rekrutmen mitra sales 2% dari Profit Transaksi (1-Level resmi)\n` +
      `✅ Produk digital terlaris (Canva Pro, ChatGPT, Gemini, Netflix, Spotify, dll)\n` +
      `✅ Disediakan link affiliate, banner & materi promosi siap pakai\n` +
      `✅ Pencairan komisi mudah & cepat langsung ke rekening bank Anda\n\n` +
      `Daftar gratis sekarang pakai link referral saya:\n${inviteSalesUrl}\n\n` +
      `Kode Referral: ${partnerCode}`
  );

  const [teamSearch, setTeamSearch] = useState('');

  const filteredTeamMembers = useMemo(() => {
    const list = networkData?.teamMembers || [];
    if (!teamSearch.trim()) return list;
    const q = teamSearch.toLowerCase().trim();
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.code.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.whatsapp.includes(q)
    );
  }, [networkData?.teamMembers, teamSearch]);

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
      const catName = p.categoryName || p.category?.name || 'Digital';
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        catName.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = selectedCategory === 'all' || catName === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [productsRes?.data, productSearch, selectedCategory]);

  const categories = useMemo(() => {
    const list = productsRes?.data || [];
    const set = new Set<string>();
    list.forEach((p) => {
      const catName = p.categoryName || p.category?.name;
      if (catName) set.add(catName);
    });
    return Array.from(set);
  }, [productsRes?.data]);

  // Link Generator State (Clean, direct referral URL without campaign tags)
  const [selectedProductForLink, setSelectedProductForLink] = useState('');

  const customGeneratedUrl = useMemo(() => {
    const base = getBaseUrl();
    if (selectedProductForLink) {
      return `${base}/products/${selectedProductForLink}?ref=${partnerCode}`;
    }
    return `${base}/?ref=${partnerCode}`;
  }, [partnerCode, selectedProductForLink]);

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
    onError: (err: Error) => {
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
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                    partner?.status === 'active'
                      ? 'bg-status-success/15 border-status-success/30 text-status-success'
                      : partner?.status === 'suspended'
                      ? 'bg-status-error/15 border-status-error/30 text-status-error'
                      : partner?.status === 'pending'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                      : 'bg-muted border-border text-foreground-muted'
                  }`}
                >
                  <span>
                    Status Akun: {
                      partner?.status === 'active'
                        ? `Mitra Aktif (${partner?.tier || 'Standard 10%'})`
                        : partner?.status === 'suspended'
                        ? 'Ditangguhkan (Suspended)'
                        : partner?.status === 'pending'
                        ? 'Menunggu Verifikasi (Pending Review)'
                        : 'Non-Aktif'
                    }
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Halo, {partner?.name || adminUser?.name || 'Mitra Sales'}!
                </h2>
                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Bagikan link referral Anda untuk mendapatkan bagi hasil komisi{' '}
                  <strong className="text-foreground">{partnerRate}% dari Profit Transaksi</strong> bersih (naik ke 15% setelah 50 transaksi).
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
          {isProfileLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Skeleton Card 1: Saldo Komisi Siap Tarik */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-32 bg-foreground/10 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-foreground/10" />
                </div>
                <div className="h-8 w-36 bg-foreground/15 rounded" />
                <div className="pt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-foreground/10 rounded" />
                    <div className="h-3 w-16 bg-foreground/10 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-24 bg-foreground/10 rounded" />
                    <div className="h-3 w-20 bg-foreground/10 rounded" />
                  </div>
                </div>
              </div>

              {/* Skeleton Card 2: Pesanan Referral */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-28 bg-foreground/10 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-foreground/10" />
                </div>
                <div className="h-8 w-24 bg-foreground/15 rounded" />
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div className="h-3 w-24 bg-foreground/10 rounded" />
                  <div className="h-3 w-20 bg-foreground/10 rounded" />
                </div>
              </div>

              {/* Skeleton Card 3: Total Klik Referral */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-28 bg-foreground/10 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-foreground/10" />
                </div>
                <div className="h-8 w-20 bg-foreground/15 rounded" />
                <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                  <div className="h-3 w-24 bg-foreground/10 rounded" />
                  <div className="h-3 w-14 bg-foreground/10 rounded" />
                </div>
              </div>

              {/* Skeleton Card 4: Skema Komisi Anda */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-3.5 w-32 bg-foreground/10 rounded" />
                  <div className="w-8 h-8 rounded-lg bg-foreground/10" />
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="h-8 w-24 bg-foreground/15 rounded" />
                  <div className="h-5 w-20 bg-foreground/10 rounded-full" />
                </div>
                <div className="pt-1.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-28 bg-foreground/10 rounded" />
                    <div className="h-3 w-16 bg-foreground/10 rounded" />
                  </div>
                  <div className="w-full h-1.5 bg-foreground/10 rounded-full" />
                  <div className="h-2.5 w-44 bg-foreground/10 rounded" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Saldo Komisi Siap Tarik */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">Komisi Siap Tarik (Final)</span>
                  <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-foreground tracking-tight">
                  Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
                </div>
                <div className="pt-2 border-t border-border/60 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>Masa Garansi (3 Hari):</span>
                    </span>
                    <span className="font-semibold text-amber-500">
                      Rp {(partner?.pendingCommission || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Total telah dicairkan:</span>
                    <span className="font-medium text-foreground">
                      Rp {(partner?.paidCommission || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
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
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      partnerRate >= 15 ? 'bg-amber-500/10 text-amber-500' : 'bg-purple-500/10 text-purple-500'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">
                    {partnerRate}% <span className="text-xs font-normal text-foreground-muted">Profit Transaksi</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold ${
                      partnerRate >= 15
                        ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                        : 'text-primary border-primary/30 bg-primary/10'
                    }`}
                  >
                    {partnerRate >= 15 ? 'VIP Sales (15%)' : 'Standard (10%)'}
                  </Badge>
                </div>

                {/* Progress Bar Milestone 50 Orders -> VIP Sales 15% */}
                <div className="pt-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground-muted">
                      {partnerRate >= 15 ? 'Status VIP Aktif:' : 'Target VIP (15% Profit):'}
                    </span>
                    <span className="font-semibold text-foreground font-mono">
                      {partner?.totalOrders || 0} / 50 Order
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden border border-border">
                    <div
                      className={`h-full transition-all duration-500 ${
                        partnerRate >= 15 ? 'bg-amber-500' : 'bg-primary'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(4, (((partner?.totalOrders || 0) / 50) * 100)))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-foreground-muted leading-tight">
                    {partnerRate >= 15
                      ? '🌟 Selamat! Anda telah mencapai 50 order. Komisi 15% dari profit transaksi aktif!'
                      : `${Math.max(0, 50 - (partner?.totalOrders || 0))} order lagi untuk upgrade ke VIP Sales (15% Profit Transaksi).`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ajak Teman Jadi Sales Callout Banner */}
          <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-surface to-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>1-Level Referral Resmi • 100% Hak Teman Utuh</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Ajak Teman Jadi Mitra Sales & Dapatkan Bonus 2% Profit!
                </h4>
                <p className="text-xs text-foreground-muted">
                  Dapatkan bonus 2% dari Profit Transaksi teman langsung Anda tanpa memotong komisi penjualan mereka (teman tetap menerima 10% utuh). Dilengkapi masa garansi 3 hari (bukan MLM).
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(inviteSalesUrl, 'ref-banner-quick')}
                className="text-xs gap-1.5 h-8"
              >
                {copiedLink === 'ref-banner-quick' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
                    <span>Link Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link Ajak</span>
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => onTabChange('sales-network')}
                className="text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <span>Lihat Bonus Tim</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Fast Navigation Grid (4 Modules) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              onClick={() => onTabChange('sales-network')}
              className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground">Bonus Tim & Teman</h3>
                <Badge variant="outline" className="text-[10px] font-semibold text-status-success border-status-success/30">
                  {networkData?.totalTeamMembers || 0} Teman
                </Badge>
              </div>
              <p className="text-xs text-foreground-muted">
                Pantau teman yang diajak & bonus pasif 2% dari setiap transaksi yang mereka hasilkan.
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
                Semua Kategori ({productsRes?.data?.length || 0})
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
          {isProductsLoading ? (
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
                const productUrl = `${getBaseUrl()}/products/${p.id}?ref=${partnerCode}`;
                const catName = p.categoryName || p.category?.name || 'Digital';

                // Profit & Commission Calculation
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
                      {/* Top Badges */}
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

                      {/* Product Title */}
                      <h4 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {p.name}
                      </h4>

                      {/* Price & Profit Box */}
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

                    {/* Action Buttons */}
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
      )}

      {/* ========================================================================= */}
      {/* 3. SALES LINKS & PROMO COPY GENERATOR TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-links' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Generator Tautan & Materi Promosi</h2>
            <p className="text-xs text-foreground-muted">
              Pilih produk tujuan untuk membuat tautan referral langsung dan gunakan template materi promosi siap pakai untuk meningkatkan konversi.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Custom Link Builder */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Generator Tautan Referral</span>
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-1.5">Pilih Halaman Tujuan:</label>
                  <select
                    value={selectedProductForLink}
                    onChange={(e) => setSelectedProductForLink(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg text-xs p-2.5 text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Beranda Toko (Semua Katalog Produk)</option>
                    {(productsRes?.data || []).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceFormatted || `Rp ${p.price.toLocaleString('id-ID')}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Target Preview */}
                {selectedProductForLink ? (
                  <div className="p-3 rounded-lg border border-primary/20 bg-primary/5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-foreground-muted uppercase font-semibold block">Halaman Terpilih</span>
                      <span className="font-bold text-foreground">
                        {productsRes?.data?.find((p) => p.id === selectedProductForLink)?.name || 'Produk Spesifik'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
                      Link Langsung ke Produk
                    </Badge>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg border border-border bg-surface-raised flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-foreground-muted uppercase font-semibold block">Halaman Terpilih</span>
                      <span className="font-bold text-foreground">Beranda Toko Asterra Store</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-semibold text-foreground-muted">
                      Semua Katalog
                    </Badge>
                  </div>
                )}

                {/* Hasil Tautan Referral */}
                <div className="pt-2 space-y-1.5">
                  <label className="font-semibold text-foreground block">Tautan Referral Siap Pakai:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={customGeneratedUrl}
                      className="bg-surface-raised border-border text-xs font-mono h-10 select-all"
                    />
                    <Button
                      onClick={() => handleCopy(customGeneratedUrl, 'custom-url')}
                      className="h-10 px-3.5 text-xs font-semibold shrink-0 gap-1.5"
                    >
                      {copiedLink === 'custom-url' ? (
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
                      href={customGeneratedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 px-3 rounded-lg border border-border bg-surface-raised hover:bg-surface-raised/80 text-foreground-muted hover:text-foreground flex items-center justify-center transition-colors shrink-0"
                      title="Buka Tautan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Info Tracking Card */}
                <div className="pt-3 border-t border-border/70 space-y-1.5 text-[11px] text-foreground-muted">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
                    <span>Garansi Pelacakan Cookie 30 Hari</span>
                  </div>
                  <p className="leading-relaxed">
                    Setiap calon pelanggan yang membuka tautan di atas akan otomatis mengaktifkan kode referral Anda (<code className="font-mono text-primary font-bold">{partnerCode}</code>). Jika mereka membeli dalam kurun 30 hari, komisi {partnerRate}% otomatis masuk ke akun Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Ready-to-use Copywriting Templates */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-status-success" />
                <span>Template Materi Copywriting Promosi</span>
              </h3>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {/* Template 1: WhatsApp Status */}
                <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-status-success" />
                      <span>WhatsApp Story / Status</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`,
                          'copy-wa'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                    >
                      {copiedLink === 'copy-wa' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-wa' ? 'Tersalin!' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                    &ldquo;Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: {customGeneratedUrl}&rdquo;
                  </p>
                  <div className="flex justify-end">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `Halo teman-teman! Lagi butuh akun Canva Pro, Gemini AI, ChatGPT Plus, atau Netflix private bergaransi resmi tanpa takut kena suspend? Langsung order aman lewat link resmi ini ya: ${customGeneratedUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-status-success hover:underline"
                    >
                      <Send className="w-3 h-3" />
                      <span>Bagikan ke Status WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Template 2: Chat Personal / Rekomendasi Teman */}
                <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      <span>Chat Rekomendasi Personal</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Halo kak! Mau infoin nih kalau butuh tools produktivitas & hiburan premium (Canva, ChatGPT, Netflix, dll) yang resmi dan ada garansi ganti baru 100%, rekomendasiku beli di Asterra Store aja kak. Harganya jauh lebih hemat dan prosesnya instan: ${customGeneratedUrl}`,
                          'copy-personal'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                    >
                      {copiedLink === 'copy-personal' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-personal' ? 'Tersalin!' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                    &ldquo;Halo kak! Mau infoin nih kalau butuh tools produktivitas &amp; hiburan premium (Canva, ChatGPT, Netflix, dll) yang resmi dan ada garansi ganti baru 100%, rekomendasiku beli di Asterra Store aja kak. Harganya jauh lebih hemat dan prosesnya instan: {customGeneratedUrl}&rdquo;
                  </p>
                </div>

                {/* Template 3: Caption Instagram / Bio */}
                <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Caption Instagram / Bio Link</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨\n\n✅ Canva Pro, ChatGPT Plus, Netflix, Spotify ready kilat\n✅ Bergaransi penuh & amanah\n✅ Proses 1 - 15 menit selesai\n\nKatalog lengkap & order resmi:\n👉 ${customGeneratedUrl}`,
                          'copy-ig'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                    >
                      {copiedLink === 'copy-ig' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-ig' ? 'Tersalin!' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50 whitespace-pre-line">
                    {`Layanan Akun Digital Premium Resmi & Bergaransi 100% ✨\n\n✅ Canva Pro, ChatGPT Plus, Netflix, Spotify ready kilat\n✅ Bergaransi penuh & amanah\n✅ Proses 1 - 15 menit selesai\n\nKatalog lengkap & order resmi:\n👉 ${customGeneratedUrl}`}
                  </p>
                </div>

                {/* Template 4: Broadcast Grup / Komunitas */}
                <div className="bg-surface-raised border border-border rounded-lg p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-primary" />
                      <span>Broadcast Grup / Komunitas</span>
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        handleCopy(
                          `Selamat siang rekan-rekan! Izin berbagi info bermanfaat untuk kebutuhan tugas, kantor, dan hiburan. Bagi yang butuh akses resmi Canva Pro, AI tools, atau streaming dengan garansi aktif dan harga terjangkau, silakan cek katalog resmi Asterra Store di: ${customGeneratedUrl} 🙏`,
                          'copy-group'
                        )
                      }
                      className="h-7 text-[11px] gap-1 px-2.5 text-primary hover:bg-primary/10"
                    >
                      {copiedLink === 'copy-group' ? <Check className="w-3 h-3 text-status-success" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLink === 'copy-group' ? 'Tersalin!' : 'Salin Teks'}</span>
                    </Button>
                  </div>
                  <p className="text-foreground-muted leading-relaxed text-[11px] bg-surface p-2.5 rounded border border-border/50">
                    &ldquo;Selamat siang rekan-rekan! Izin berbagi info bermanfaat untuk kebutuhan tugas, kantor, dan hiburan. Bagi yang butuh akses resmi Canva Pro, AI tools, atau streaming dengan garansi aktif dan harga terjangkau, silakan cek katalog resmi Asterra Store di: {customGeneratedUrl} 🙏&rdquo;
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
                      <th className="py-3 px-4">Profit Transaksi</th>
                      <th className="py-3 px-4">Komisi Saya ({partnerRate}%)</th>
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
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          Rp {(typeof o.transactionProfit === 'number' ? o.transactionProfit : 0).toLocaleString('id-ID')}
                          {o.transactionProfit === 0 && (
                            <span className="block text-[10px] text-foreground-muted font-normal">
                              (Margin tergerus promo)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-status-success">
                            + Rp {o.commission.toLocaleString('id-ID')}
                          </div>
                          <div className="text-[10px] mt-0.5">
                            {o.commissionStatus === 'final' ? (
                              <span className="text-status-success font-medium inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" /> Siap Tarik
                              </span>
                            ) : o.commissionStatus === 'reversed' ? (
                              <span className="text-status-error font-medium inline-flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" /> Dibatalkan / Refund
                              </span>
                            ) : (
                              <span className="text-amber-500 font-medium inline-flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Masa Garansi (3 Hari)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              o.status === 'completed'
                                ? 'text-status-success border-status-success/30 bg-status-success/10'
                                : o.status === 'processing'
                                ? 'text-blue-500 border-blue-500/30 bg-blue-500/10'
                                : o.status === 'refunded'
                                ? 'text-status-error border-status-error/30 bg-status-error/10'
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
      {/* 5. SALES NETWORK & DOWNLINE TEAM TAB */}
      {/* ========================================================================= */}
      {activeTab === 'sales-network' && (
        <div className="space-y-6">
          {/* Header & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Program Referral Mitra 1-Level Resmi (Single-Tier • Bukan MLM)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                Bonus Teman yang Anda Ajak (1-Level Referral)
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted">
                Ajak teman menjadi mitra sales langsung dengan kode Anda. Nikmati bonus 2% dari subsidi margin Asterra Store tanpa memotong hak komisi teman Anda.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchNetwork()}
              disabled={isNetworkLoading}
              className="gap-2 text-xs self-start sm:self-auto shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isNetworkLoading ? 'animate-spin' : ''}`} />
              <span>Muat Ulang</span>
            </Button>
          </div>

          {/* Invitation Link Box */}
          <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-surface-raised p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Link Khusus Pendaftaran Mitra Sales (1-Level)
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                  Bagikan link pendaftaran resmi ini. Teman yang mendaftar akan langsung terdaftar di bawah kode referral{' '}
                  <strong className="text-primary font-mono">{partnerCode}</strong>.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-foreground-muted">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                    <span>Komisi teman 100% utuh (10% Profit Transaksi)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span>Bonus rekrutmen 2% dari Profit Transaksi (1-Level, bukan MLM)</span>
                  </div>
                </div>
              </div>

              {/* Link Input & Share Actions */}
              <div className="bg-surface border border-border p-4 rounded-xl space-y-3 min-w-[320px] max-w-md w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted font-medium">Link Ajak Jadi Sales:</span>
                  <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary border-primary/30">
                    Ref: {partnerCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={inviteSalesUrl}
                    className="bg-surface-raised border-border text-xs font-mono h-9 select-all"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopy(inviteSalesUrl, 'invite-sales')}
                    className="h-9 px-3 gap-1.5 shrink-0 text-xs font-semibold"
                  >
                    {copiedLink === 'invite-sales' ? (
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
                  href={`https://wa.me/?text=${inviteWaMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ajak Teman via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Total Bonus Komisi Teman */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Total Bonus Teman Sales</span>
                <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                Rp {(networkData?.totalNetworkBonus || 0).toLocaleString('id-ID')}
              </div>
              <div className="pt-2 border-t border-border/60 space-y-1 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-status-success" />
                    <span>Siap Tarik (Final):</span>
                  </span>
                  <span className="font-semibold text-status-success">
                    Rp {(networkData?.finalNetworkBonus || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>Masa Garansi (3 Hari):</span>
                  </span>
                  <span className="font-semibold text-amber-500">
                    Rp {(networkData?.pendingNetworkBonus || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                {(networkData?.reversedNetworkBonus || 0) > 0 && (
                  <div className="flex items-center justify-between text-status-error">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>Dibatalkan / Refund:</span>
                    </span>
                    <span className="font-semibold">
                      - Rp {(networkData?.reversedNetworkBonus || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Total Teman Bergabung */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Mitra 1-Level yang Diajak</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                {networkData?.totalTeamMembers || 0}{' '}
                <span className="text-xs font-normal text-foreground-muted">Mitra Langsung</span>
              </div>
              <div className="pt-2 border-t border-border/60 text-[11px] text-foreground-muted flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Murni tingkat 1 (Tidak ada level 2/3/MLM)</span>
              </div>
            </div>

            {/* Card 3: Total Omset & Transaksi Tim */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Total Penjualan Teman</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-foreground tracking-tight">
                Rp {(networkData?.totalTeamRevenue || 0).toLocaleString('id-ID')}
              </div>
              <div className="pt-2 border-t border-border/60 text-[11px] text-foreground-muted flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Dari {networkData?.totalTeamOrders || 0} order (Model Bagi Hasil Profit SSOT)</span>
              </div>
            </div>
          </div>

          {/* Section: Daftar Teman yang Diajak */}
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Daftar Mitra Teman Langsung 1-Level ({networkData?.totalTeamMembers || 0})</span>
                </h3>
                <p className="text-xs text-foreground-muted">
                  Pantau perkembangan penjualan teman Anda dan bonus komisi yang dihasilkan.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
                <Input
                  placeholder="Cari nama atau kode teman..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="pl-8 text-xs h-9 bg-surface-raised border-border"
                />
              </div>
            </div>

            {isNetworkLoading ? (
              <div className="py-12 text-center text-foreground-muted text-xs space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
                <p>Memuat data jaringan tim sales...</p>
              </div>
            ) : filteredTeamMembers.length === 0 ? (
              <div className="py-12 px-4 rounded-xl border border-dashed border-border text-center space-y-3 bg-surface-raised/40">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="text-sm font-semibold text-foreground">
                    {teamSearch ? 'Teman tidak ditemukan' : 'Belum Ada Teman yang Bergabung'}
                  </h4>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {teamSearch
                      ? `Tidak ada teman dengan pencarian "${teamSearch}". Coba kata kunci lain.`
                      : 'Ajak teman Anda mendaftar sebagai mitra sales Asterra Store dengan membagikan link referral pendaftaran Anda.'}
                  </p>
                </div>
                {!teamSearch && (
                  <Button
                    size="sm"
                    onClick={() => handleCopy(inviteSalesUrl, 'invite-empty')}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    {copiedLink === 'invite-empty' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-status-success" />
                        <span>Link Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Link Pendaftaran Sales</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Nama Teman</th>
                      <th className="py-3 px-4">Kode Referral</th>
                      <th className="py-3 px-4">Bergabung</th>
                      <th className="py-3 px-4">Total Order</th>
                      <th className="py-3 px-4">Omzet Penjualan</th>
                      <th className="py-3 px-4">Bonus Anda (2% Profit)</th>
                      <th className="py-3 px-4">Status Mitra</th>
                      <th className="py-3 px-4 text-right">Kontak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTeamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-surface-raised/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{member.name}</div>
                          <div className="text-[11px] text-foreground-muted">{member.email}</div>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-primary">
                          {member.code}
                        </td>
                        <td className="py-3 px-4 text-foreground-muted">{member.joinedAt}</td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {member.totalOrders} Order
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          Rp {member.totalRevenue.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-bold text-status-success">
                          + Rp {member.bonusEarnedFromMember.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-semibold uppercase ${
                              member.status === 'active'
                                ? 'text-status-success border-status-success/30 bg-status-success/10'
                                : member.status === 'suspended'
                                ? 'text-status-error border-status-error/30 bg-status-error/10'
                                : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                            }`}
                          >
                            {member.status === 'active'
                              ? 'Aktif'
                              : member.status === 'suspended'
                              ? 'Ditangguhkan'
                              : 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {member.whatsapp && member.whatsapp !== '-' ? (
                            <a
                              href={`https://wa.me/${member.whatsapp.replace(/\D/g, '')}?text=Halo%20${encodeURIComponent(
                                member.name
                              )},%20semangat%20jualan%20produk%20digital%20di%20Asterra%20Store!`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-status-success/15 hover:bg-status-success/25 text-status-success text-[11px] font-medium transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              <span>Sapa WA</span>
                            </a>
                          ) : (
                            <span className="text-foreground-muted text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Riwayat Rincian Bonus Komisi Transaksi Teman */}
          <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-status-success" />
                <span>Riwayat Bonus Komisi dari Transaksi Teman</span>
              </h3>
              <p className="text-xs text-foreground-muted">
                Rincian kronologis bonus komisi override 2% (terkait proteksi margin toko & holding garansi 3 hari) dari penjualan teman Anda.
              </p>
            </div>

            {(!networkData?.bonusLogs || networkData.bonusLogs.length === 0) ? (
              <div className="py-10 text-center text-xs text-foreground-muted border border-dashed border-border rounded-xl">
                <Clock className="w-6 h-6 mx-auto mb-2 text-foreground-muted opacity-50" />
                <p>Belum ada transaksi dari teman yang diajak.</p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Setiap transaksi sukses oleh teman akan tercatat otomatis di sini secara real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-raised border-b border-border text-foreground-muted uppercase font-semibold text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Tanggal & Waktu</th>
                      <th className="py-3 px-4">Teman Penjual</th>
                      <th className="py-3 px-4">ID Pesanan</th>
                      <th className="py-3 px-4">Nilai Transaksi</th>
                      <th className="py-3 px-4">Profit Transaksi</th>
                      <th className="py-3 px-4">Bonus Rekrutmen (2%)</th>
                      <th className="py-3 px-4">Status & Garansi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {networkData.bonusLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-raised/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-foreground-muted">
                          {new Date(log.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-foreground">{log.fromPartnerName}</span>
                          <span className="ml-1.5 font-mono text-[10px] text-primary">({log.fromPartnerCode})</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-foreground">
                          {log.orderId ? `${log.orderId.substring(0, 12)}...` : '-'}
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">
                          Rp {log.orderTotal.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          Rp {(typeof log.transactionProfit === 'number' ? log.transactionProfit : 0).toLocaleString('id-ID')}
                          {log.transactionProfit === 0 && (
                            <span className="block text-[10px] text-foreground-muted font-normal">
                              (Margin tergerus promo)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold text-status-success">
                          + Rp {log.bonusAmount.toLocaleString('id-ID')}
                          <span className="text-[10px] text-foreground-muted ml-1">(2% Profit)</span>
                        </td>
                        <td className="py-3 px-4">
                          {log.status === 'pending' ? (
                            <div className="space-y-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold text-amber-500 border-amber-500/30 bg-amber-500/10 flex items-center gap-1 w-fit"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>Masa Garansi (3 Hari)</span>
                              </Badge>
                              {log.holdingUntil && (
                                <p className="text-[9px] text-foreground-muted font-mono">
                                  Rilis: {new Date(log.holdingUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </p>
                              )}
                            </div>
                          ) : log.status === 'reversed' ? (
                            <div className="space-y-0.5">
                              <Badge
                                variant="outline"
                                className="text-[10px] font-semibold text-status-error border-status-error/30 bg-status-error/10 flex items-center gap-1 w-fit"
                              >
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>Dibatalkan / Refund</span>
                              </Badge>
                              {log.reversalReason && (
                                <p className="text-[9px] text-foreground-muted max-w-[140px] truncate" title={log.reversalReason}>
                                  {log.reversalReason}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-status-success border-status-success/30 bg-status-success/10 flex items-center gap-1 w-fit"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Siap Ditarik (Final)</span>
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edukasi & Transparansi Sistem Komisi Teman (Audit Compliance) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>1-Level Murni (Bukan MLM)</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Hanya 1 level langsung. Anda hanya menerima bonus dari mitra yang langsung Anda ajak. Tidak ada sistem piramida bertingkat.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="flex items-center gap-2 text-status-success font-semibold text-xs">
                <Award className="w-4 h-4 shrink-0" />
                <span>100% Hak Teman Utuh</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Bonus 2% disubsidi 100% dari alokasi laba bersih Asterra Store. Komisi teman Anda tidak dipotong sepeser pun (tetap 10%-20%).
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
                <Percent className="w-4 h-4 shrink-0" />
                <span>Terkait Buffer Margin Sehat</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Bonus dikaitkan dengan buffer margin laba toko, mencegah risiko defisit toko pada produk digital dengan margin sangat tipis.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Holding Garansi 3 Hari & Refund</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Dana ditahan dalam masa garansi 3 hari untuk mengantisipasi refund pembeli, lalu otomatis berpindah ke saldo siap ditarik.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SALES WALLET & WITHDRAWAL TAB */}
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">Saldo Siap Ditarik (Final)</span>
                  <div className="w-7 h-7 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-status-success tracking-tight">
                  Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-foreground-muted pt-1">
                  Minimal penarikan: <strong className="text-foreground">Rp 50.000</strong> (Tersedia ditarik sekarang)
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">Saldo Masa Garansi (Holding 3 Hari)</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-500 tracking-tight">
                  Rp {(partner?.pendingCommission || 0).toLocaleString('id-ID')}
                </div>
                <p className="text-[11px] text-foreground-muted pt-1">
                  Dana komisi pesanan baru selama masa garansi pembeli 3 hari. Otomatis cair ke saldo siap tarik.
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground-muted">Total Komisi Telah Dicairkan</span>
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
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
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <span>Formulir Pengajuan Penarikan Saldo</span>
                </h3>
                {partner?.status !== 'active' && (
                  <Badge variant="outline" className="text-status-error border-status-error/30 bg-status-error/10 text-[10px]">
                    Akun Tidak Aktif
                  </Badge>
                )}
              </div>

              {partner?.pendingCommission && partner.pendingCommission > 0 ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-500 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>
                    Terdapat <strong>Rp {partner.pendingCommission.toLocaleString('id-ID')}</strong> dalam masa garansi 3 hari. Saldo tersebut akan otomatis dapat ditarik setelah masa garansi produk berakhir.
                  </span>
                </div>
              ) : null}

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
                    partner.status !== 'active' ||
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
            <h2 className="text-lg font-bold text-foreground">Panduan & Edukasi Kemitraan Sales</h2>
            <p className="text-xs text-foreground-muted">
              Pusat pengetahuan, etika promosi, regulasi perlindungan mitra, dan kepatuhan sistem Asterra Store.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Guide 1: Etika Promosi */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Etika Promosi & Regulasi Anti-Fraud</h3>
              <ul className="text-xs text-foreground-muted space-y-2 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-foreground">Dilarang Self-Referral:</strong> Mitra dilarang menggunakan link referral milik sendiri untuk pesanan pribadi atau membuat akun sirkular. Sistem secara otomatis mendeteksi kecocokan email dan WhatsApp.
                </li>
                <li>
                  <strong className="text-foreground">Kalkulasi Berbasis Profit Transaksi:</strong> Komisi direct sales (10%) dan bonus rekrutmen (2%) selalu dihitung dari Profit Transaksi (Net Revenue dikurangi modal produk & biaya langsung), bukan dari omzet kotor.
                </li>
                <li>
                  <strong className="text-foreground">Dilarang Spam:</strong> Jangan menyebarkan link secara massal di grup publik tanpa izin atau kolom komentar media sosial orang lain.
                </li>
                <li>
                  <strong className="text-foreground">Informasi Garansi Resmi:</strong> Sampaikan informasi garansi sesuai ketentuan toko (garansi penggantian akun 100% selama masa aktif).
                </li>
              </ul>
            </div>

            {/* Guide 2: FAQ Komisi */}
            <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-foreground">Pertanyaan Umum Seputar Komisi (FAQ)</h3>
              <div className="text-xs text-foreground-muted space-y-2.5 leading-relaxed">
                <div>
                  <p className="font-semibold text-foreground">Kapan komisi masuk dan siap ditarik?</p>
                  <p className="text-[11px]">
                    Komisi tercatat seketika saat pembeli membayar dan masuk status <strong>Masa Garansi (Holding 3 Hari)</strong> untuk mengantisipasi klaim garansi/refund. Setelah 3 hari, saldo otomatis pindah ke <strong>Saldo Siap Ditarik</strong>.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Dari mana sumber bonus 2% ajak teman?</p>
                  <p className="text-[11px]">
                    Bonus rekrutmen 2% dihitung dari Profit Transaksi yang dihasilkan oleh teman langsung Anda. Komisi penjualan teman Anda tetap utuh 100% (10% dari Profit Transaksi) tanpa ada potongan.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Apakah ini sistem MLM atau piramida?</p>
                  <p className="text-[11px]">
                    Bukan MLM. Asterra Store menerapkan <strong>1-Level Referral Murni (Single-Tier)</strong>. Anda hanya mendapat bonus dari teman yang langsung mendaftar dengan kode Anda (tidak ada level 2 atau level seterusnya).
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Bagaimana jika ada pesanan teman yang di-refund?</p>
                  <p className="text-[11px]">
                    Jika pesanan dibatalkan atau di-refund sebelum melewati masa garansi, komisi dan bonus terkait akan dibatalkan (reversed) secara otomatis.
                  </p>
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
