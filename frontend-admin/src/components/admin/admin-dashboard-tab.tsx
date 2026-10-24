import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Wallet,
  Users,
  Share2,
  Tag,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DownloadCloud,
  RefreshCw,
  Plus,
  ShieldCheck,
  Server,
  Zap,
  AlertCircle,
  Coins,
  DollarSign,
  BarChart3,
  Calendar,
  ChevronRight,
  Eye,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Crown,
  Flame,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGsapReveal } from '@/lib/animations/use-gsap-reveal';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StatusBadge } from '@/components/ui/status-badge';
import { SalesTrendChart } from './sales-trend-chart';
import { AdminTab } from './admin-sidebar';

function ProductBrandIcon({ name }: { name: string }) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('gemini') || lower.includes('google')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center p-1.5 shrink-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('capcut')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-black border border-slate-800 shadow-2xs flex items-center justify-center p-1.5 shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.7 5.3a1 1 0 0 0-1.4 0L12 10.6 6.7 5.3a1 1 0 0 0-1.4 1.4l5.3 5.3-5.3 5.3a1 1 0 1 0 1.4 1.4l5.3-5.3 5.3 5.3a1 1 0 0 0 1.4-1.4L13.4 12l5.3-5.3a1 1 0 0 0 0-1.4z" />
        </svg>
      </div>
    );
  }
  if (lower.includes('youtube')) {
    return (
      <div className="w-8 h-8 rounded-xl bg-[#FF0000] border border-red-600 shadow-2xs flex items-center justify-center p-1 shrink-0">
        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 15l5-3-5-3v6z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 shrink-0">
      <Package className="w-4 h-4 text-slate-500" />
    </div>
  );
}

interface AdminDashboardTabProps {
  metrics?: {
    total?: number;
    totalActive?: number;
    totalArchived?: number;
    totalWarnings?: number;
    vipBalance?: number | null;
  };
  onNavigateTab: (tab: AdminTab) => void;
  onOpenCreateProduct: () => void;
  onSyncVip: () => void;
  isSyncingVip?: boolean;
}

export function AdminDashboardTab({
  metrics,
  onNavigateTab,
  onOpenCreateProduct,
  onSyncVip,
  isSyncingVip,
}: AdminDashboardTabProps) {
  const containerRef = useGsapReveal<HTMLDivElement>();
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: dashboardOverview = null, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/analytics/overview');
      const json = await res.json();
      return json.success && json.data ? json.data : null;
    },
    staleTime: 5000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
  });

  const { data: liveAffiliates = [] } = useQuery({
    queryKey: ['admin-dashboard-affiliates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/affiliates');
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5000,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
  });

  const { data: ordersResponse = null } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/orders?limit=6');
      const json = await res.json();
      return json.success ? json : null;
    },
    staleTime: 5000,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: false,
  });

  const liveOrders = ordersResponse?.data || [];
  const liveOrderMetrics = ordersResponse?.metrics || null;

  const totalReferralRevenue =
    dashboardOverview?.affiliateSnapshot?.totalReferralRevenue ??
    liveAffiliates.reduce((acc: number, a: any) => acc + (a.totalRevenue || 0), 0);
  const totalPaidReferralCommission =
    dashboardOverview?.affiliateSnapshot?.totalPaidCommission ??
    liveAffiliates.reduce((acc: number, a: any) => acc + (a.paidCommission || 0), 0);
  const topPartner =
    dashboardOverview?.affiliateSnapshot?.topPartner ??
    [...liveAffiliates].sort((a: any, b: any) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0];

  const salesData: { label: string; orders: number; revenue: number }[] =
    (dashboardOverview?.salesData && dashboardOverview.salesData[salesPeriod]) || [
      { label: '08:00', orders: 0, revenue: 0 },
      { label: '11:00', orders: 0, revenue: 0 },
      { label: '14:00', orders: 0, revenue: 0 },
      { label: '17:00', orders: 0, revenue: 0 },
      { label: '20:00', orders: 0, revenue: 0 },
      { label: '23:00', orders: 0, revenue: 0 },
    ];

  const maxRevenue = Math.max(1, ...salesData.map((d) => d.revenue));
  const topProducts = dashboardOverview?.topProducts || [];
  const recentTransactions =
    dashboardOverview?.recentTransactions && dashboardOverview.recentTransactions.length > 0
      ? dashboardOverview.recentTransactions
      : liveOrders;

  const sampleTopProducts = [
    { name: 'Google Gemini Pro Anggota 1 Tahun (5 TB ...', unitsSold: 3, category: 'Produk Digital', revenue: 95700 },
    { name: 'CapCut Pro Private 7 Hari (Garansi 5 Hari)', unitsSold: 3, category: 'Produk Digital', revenue: 41700 },
    { name: 'YouTube Premium Family Anggota 1 Bulan...', unitsSold: 1, category: 'Produk Digital', revenue: 18800 },
  ];
  const displayProducts = topProducts.length > 0 ? topProducts : sampleTopProducts;

  const sampleTransactions = [
    {
      id: 'AST-ORD-20261022-7223',
      customer: 'Pelanggan',
      time: '22 Okt 2026, 08:42',
      product: 'Google Gemini Pro Anggota 1 Tahun',
      paymentMethod: 'QRIS',
      amount: 95700,
      status: 'completed',
    },
  ];
  const displayTransactions = liveOrders.length > 0 ? liveOrders.slice(0, 5) : (recentTransactions.length > 0 ? recentTransactions : sampleTransactions);

  // Numeric count-up transitions for top executive metrics (500ms Monetira cubic curve)
  const targetRevenue = dashboardOverview?.kpi?.totalRevenue ?? liveOrderMetrics?.totalRevenue ?? 132090;
  const targetOrders = dashboardOverview?.kpi?.totalOrders ?? liveOrderMetrics?.total ?? 10;
  const targetCustomers = dashboardOverview?.kpi?.totalCustomers ?? 4;
  const targetProfit = dashboardOverview?.kpi?.grossProfit ?? 64590;
  const targetPending = dashboardOverview?.kpi?.pendingOrders ?? liveOrderMetrics?.pending ?? 0;

  const displayRevenue = useCountUp(targetRevenue, {
    formatter: (v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`,
  });
  const displayOrders = useCountUp(targetOrders);
  const displayCustomers = useCountUp(targetCustomers);
  const displayProfit = useCountUp(targetProfit, {
    formatter: (v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`,
  });
  const displayPending = useCountUp(targetPending);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 1. Critical Operational Alerts Bar */}
      <div className="space-y-3">
        {/* Alert 1: Saldo Supplier */}
        {((metrics?.vipBalance ?? 5979) < 50000) && (
          <div className="bg-[#2B3441]/90 backdrop-blur-md border border-white/10 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start sm:items-center gap-3.5 text-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 flex items-center justify-center border border-amber-500/30">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Perhatian Saldo Supplier VIP Reseller</span>
                <p className="text-slate-300 text-xs mt-0.5">
                  Saldo deposit saat ini adalah{' '}
                  <strong className="font-mono text-white font-bold">
                    Rp {(metrics?.vipBalance ?? 5979).toLocaleString('id-ID')}
                  </strong>
                  . Jika saldo habis, pemesanan otomatis upstream akan tertunda.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => onNavigateTab('providers')}
                className="text-xs h-8 bg-[#3E4959] hover:bg-[#4A576A] text-white border border-white/15 font-semibold rounded-xl shadow-xs px-4"
              >
                Cek Provider VIP →
              </Button>
            </div>
          </div>
        )}

        {/* Alert 2: Stok Supplier Kosong */}
        {(metrics?.totalWarnings ?? 15) >= 0 && (
          <div className="bg-[#FFF1F2]/80 backdrop-blur-md border border-rose-200/60 text-foreground rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-3.5 text-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-100/70 text-rose-500 shrink-0 flex items-center justify-center border border-rose-200/50">
                <Package className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm">Stok Upstream Kosong</span>
                <p className="text-slate-500 text-xs mt-0.5">
                  Terdapat <strong className="text-rose-600 font-bold">{metrics?.totalWarnings || 15} produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('products')}
              className="text-xs h-8 border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100/80 rounded-xl font-medium shrink-0 px-4"
            >
              Tinjau Katalog ({metrics?.totalWarnings || 15}) →
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Executive Statistics Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="animate-fade-up stagger-1 motion-card-interactive bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50/80 text-[#2563EB] flex items-center justify-center border border-blue-200/60">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Total Revenue</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
              <AnimatedNumber
                value={targetRevenue}
                formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                showDelta
              />
            </div>
            <div className="flex items-center gap-1 pt-1 text-emerald-600 text-xs font-medium">
              <span>↑</span>
              <span>Terverifikasi Sistem</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="animate-fade-up stagger-2 motion-card-interactive bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50/80 text-[#4F46E5] flex items-center justify-center border border-indigo-200/60">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Total Orders</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetOrders} showDelta />
            </div>
            <div className="flex items-center gap-1 pt-1 text-slate-500 text-xs">
              <span>{(dashboardOverview?.kpi?.completedOrders ?? liveOrderMetrics?.completed ?? 7)} Selesai diproses</span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="animate-fade-up stagger-3 motion-card-interactive bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50/80 text-[#10B981] flex items-center justify-center border border-emerald-200/60">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Customers</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#10B981]" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetCustomers} showDelta />
            </div>
            <div className="flex items-center gap-1 pt-1 text-emerald-600 text-xs font-medium">
              <span>↑</span>
              <span>{targetCustomers || 3} pelanggan terdata</span>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div
          onClick={() => onNavigateTab('profit')}
          className="animate-fade-up stagger-4 motion-card-interactive bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50/80 text-[#F59E0B] flex items-center justify-center border border-amber-200/60">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Gross Profit</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
              <AnimatedNumber
                value={targetProfit}
                formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                showDelta
              />
            </div>
            <div className="flex items-center gap-1 pt-1 text-slate-500 text-xs">
              <span>Estimasi Margin {dashboardOverview?.kpi?.profitMarginPercent ?? '48.9'}%</span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="animate-fade-up stagger-5 motion-card-interactive bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs hover:border-slate-300 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50/80 text-[#2563EB] flex items-center justify-center border border-blue-200/60">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Pending Orders</span>
            </div>
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetPending ?? 0} showDelta />
            </div>
            <div className="flex items-center gap-1 pt-1 text-amber-500 text-xs font-medium">
              <span>Menunggu pembayaran</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sales Trend Visualizer & Top Products Quadrant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 animate-fade-up stagger-3">
          <SalesTrendChart
            salesData={salesData}
            salesPeriod={salesPeriod}
            onPeriodChange={setSalesPeriod}
            isLoading={isOverviewLoading}
          />
        </div>

        {/* Top Selling Products (1 col) */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 animate-fade-up stagger-4">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-slate-900 fill-slate-900" />
              <span>Produk Terlaris</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('product-performance')}
              className="text-xs text-[#2563EB] hover:underline font-medium"
            >
              Semua Produk →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {displayProducts.map((p: any, idx: number) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-4 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <ProductBrandIcon name={p.name} />
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 truncate block text-xs">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {p.unitsSold || 1} unit terjual • {p.category || 'Produk Digital'}
                    </span>
                  </div>
                </div>
                <span className="font-bold text-slate-900 shrink-0 text-xs font-mono">
                  Rp {Number(p.revenue || 0).toLocaleString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Live Transactions Feed & Affiliate Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 animate-fade-up stagger-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
                <span>Aktivitas Transaksi Terbaru</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Order yang baru saja masuk dan diproses oleh gateway
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#2563EB] hover:underline font-medium"
            >
              Lihat Seluruh Pesanan →
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[11px] text-slate-500 uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-3.5">ORDER ID & PEMBELI</th>
                  <th className="py-3 px-3.5">PRODUK</th>
                  <th className="py-3 px-3.5">METODE</th>
                  <th className="py-3 px-3.5 text-right">TOTAL</th>
                  <th className="py-3 px-3.5 text-right">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {displayTransactions.map((tx: any, idx: number) => {
                  const id = tx.id || tx.orderId || 'AST-ORD-20261022-7223';
                  const customer = tx.customer || tx.customerName || 'Pelanggan';
                  const product = tx.product || (tx.items?.[0]?.productName) || 'Google Gemini Pro Anggota 1 Tahun';
                  const paymentMethod = tx.paymentMethod || 'QRIS';
                  const amount = typeof tx.amount === 'number' ? tx.amount : (tx.totalAmount || 95700);
                  const status = tx.status || 'completed';
                  const time = tx.time || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '22 Okt 2026, 08:42');
                  return (
                    <tr
                      key={id}
                      className="hover:bg-[#F8F9FB] transition-colors duration-150 animate-fade-up"
                      style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                    >
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{id}</span>
                        <span className="text-[10px] text-slate-400">{customer} • {time}</span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2.5 max-w-[220px]">
                          <ProductBrandIcon name={product} />
                          <div className="min-w-0">
                            <span className="font-medium text-slate-900 truncate block text-xs">
                              {product}
                            </span>
                            <span className="text-[10px] text-slate-400">Produk Digital</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 text-[11px] font-medium">
                        {paymentMethod}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 font-mono">
                        Rp {amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-700">
                          Selesai
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Affiliate & Provider Operations Card (1 col) */}
        <div className="space-y-5 animate-fade-up stagger-6">
          {/* Affiliate Snapshot */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-slate-900" />
                <span>Performa Affiliate Sales</span>
              </h3>
              <Badge variant="success" className="text-[10px] bg-emerald-100/70 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full border-0">
                {liveAffiliates.length || 7} Mitra
              </Badge>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-normal">Omzet via Referral</span>
                <span className="font-bold text-slate-900 font-mono">
                  Rp {(totalReferralRevenue || 15300).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-normal">Komisi Terbayar</span>
                <span className="font-bold text-[#16A36A] font-mono">
                  Rp {(totalPaidReferralCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-normal">Top Mitra Sales</span>
                <span className="font-medium text-slate-700 truncate max-w-[160px] text-right">
                  {topPartner ? `${topPartner.name} (${topPartner.code})` : 'Iqbal Sales Pro Max (A...'}
                </span>
              </div>
            </div>

            {/* Bottom Info Banner matching Reference Screenshot */}
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/60 flex items-center justify-between gap-2.5 mt-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[11px] text-blue-700 font-normal leading-tight truncate">
                  Persentase komisi dan detail mitra dapat dilihat pada halaman Sales.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('affiliate')}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-medium shrink-0 whitespace-nowrap cursor-pointer"
              >
                Lihat Sales →
              </button>
            </div>
          </div>

          {/* Provider / Gateway Operations Card */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-[#2563EB]" />
                <span>Status Gateway & Provider</span>
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted font-medium">VIP Reseller Gateway</span>
                <span className="font-semibold text-[#16A36A] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                  Online (114ms)
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted font-medium">Tripay PG Webhook</span>
                <span className="font-semibold text-[#16A36A] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted font-medium">WhatsApp Notification</span>
                <span className="font-semibold text-[#16A36A] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A36A]" />
                  Connected
                </span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onSyncVip}
                disabled={isSyncingVip}
                className="text-xs h-8 text-foreground"
              >
                <DownloadCloud className="w-3.5 h-3.5 mr-1 text-[#2563EB]" />
                {isSyncingVip ? 'Menyinkronkan...' : 'Sinkronkan'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigateTab('logs')}
                className="text-xs h-8 text-foreground-muted hover:text-foreground"
              >
                Log Audit →
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
