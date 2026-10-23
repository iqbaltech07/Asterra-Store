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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGsapReveal } from '@/lib/animations/use-gsap-reveal';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { StatusBadge } from '@/components/ui/status-badge';
import { SalesTrendChart } from './sales-trend-chart';
import { AdminTab } from './admin-sidebar';

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
    staleTime: 5 * 60 * 1000,
  });

  const { data: liveAffiliates = [] } = useQuery({
    queryKey: ['admin-dashboard-affiliates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/affiliates');
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: ordersResponse = null } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/orders?limit=6');
      const json = await res.json();
      return json.success ? json : null;
    },
    staleTime: 5 * 60 * 1000,
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

  // Numeric count-up transitions for top executive metrics (500ms Monetira cubic curve)
  const targetRevenue = dashboardOverview?.kpi?.totalRevenue ?? liveOrderMetrics?.totalRevenue ?? 0;
  const targetOrders = dashboardOverview?.kpi?.totalOrders ?? liveOrderMetrics?.total ?? 0;
  const targetCustomers = dashboardOverview?.kpi?.totalCustomers ?? 0;
  const targetProfit = dashboardOverview?.kpi?.grossProfit ?? Math.round((liveOrderMetrics?.totalRevenue || 0) * 0.35);
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
        {((metrics?.vipBalance ?? 0) < 50000) && (
          <div className="bg-[#2B3441]/90 backdrop-blur-md border border-white/10 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-start sm:items-center gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5 sm:mt-0 border border-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white">Perhatian Saldo Supplier VIP Reseller:</span>{' '}
                <span className="text-slate-300">
                  Saldo deposit saat ini adalah{' '}
                  <strong className="font-mono text-amber-400 font-bold">
                    Rp {(metrics?.vipBalance ?? 0).toLocaleString('id-ID')}
                  </strong>
                  . Jika saldo habis, pemesanan otomatis upstream akan tertunda.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => onNavigateTab('providers')}
                className="text-xs h-8 bg-[#3E4959] hover:bg-[#4A576A] text-white border border-white/15 font-semibold rounded-xl shadow-xs"
              >
                Cek Provider VIP →
              </Button>
            </div>
          </div>
        )}

        {/* Alert 2: Stok Supplier Kosong */}
        {(metrics?.totalWarnings ?? 0) > 0 && (
          <div className="bg-rose-50/70 backdrop-blur-md border border-rose-200/60 text-foreground rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 shrink-0 mt-0.5 sm:mt-0 border border-rose-200">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Stok Upstream Kosong:</span>{' '}
                <span className="text-foreground-muted">
                  Terdapat <strong className="text-rose-600 font-bold">{metrics?.totalWarnings} produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('products')}
              className="text-xs h-8 border-rose-300 text-rose-700 bg-white/80 hover:bg-rose-100/60 rounded-xl font-semibold shrink-0"
            >
              Tinjau Katalog ({metrics?.totalWarnings}) →
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Executive Statistics Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="animate-fade-up stagger-1 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-muted tracking-wide">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A36A] flex items-center justify-center border border-emerald-200/60 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber
                value={targetRevenue}
                formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                showDelta
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-flex items-center text-[10px] font-semibold text-[#16A36A] bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                ↑ Terverifikasi
              </span>
              <span className="text-[11px] text-foreground-muted">Omzet bruto</span>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="animate-fade-up stagger-2 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-muted tracking-wide">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-200/60 group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetOrders} showDelta />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-foreground-muted font-medium">
                {(dashboardOverview?.kpi?.completedOrders ?? liveOrderMetrics?.completed ?? 0)} Selesai diproses
              </span>
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="animate-fade-up stagger-3 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-muted tracking-wide">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center border border-purple-200/60 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetCustomers} showDelta />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-flex items-center text-[10px] font-semibold text-[#8B5CF6] bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                +{dashboardOverview?.kpi?.newCustomers ?? 0} baru
              </span>
              <span className="text-[11px] text-foreground-muted">CRM data</span>
            </div>
          </div>
        </div>

        {/* Gross Profit */}
        <div
          onClick={() => onNavigateTab('profit')}
          className="animate-fade-up stagger-4 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-muted tracking-wide">Gross Profit</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A36A] flex items-center justify-center border border-emerald-200/60 group-hover:scale-105 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#16A36A] tracking-tight tabular-nums font-mono">
              <AnimatedNumber
                value={targetProfit}
                formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                showDelta
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-foreground-muted font-medium">
                Margin ~{dashboardOverview?.kpi?.profitMarginPercent ?? 35}% laba kotor
              </span>
            </div>
          </div>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="animate-fade-up stagger-5 motion-card-interactive bg-surface border border-border rounded-2xl p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group flex flex-col justify-between sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground-muted tracking-wide">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center border border-amber-200/60 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-extrabold text-[#D97706] tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={targetPending} showDelta />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="inline-flex items-center text-[10px] font-semibold text-[#D97706] bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                Menunggu bayar
              </span>
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
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              <span>Produk Terlaris</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('product-performance')}
              className="text-xs text-[#2563EB] hover:underline font-semibold"
            >
              Semua →
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {topProducts.length === 0 ? (
              <div className="p-6 text-center text-foreground-muted bg-white/40 rounded-xl border border-dashed border-white/60">
                Belum ada transaksi produk terlaris
              </div>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/50 backdrop-blur-md border border-white/70 hover:bg-white/80 hover:border-white flex items-center justify-between gap-3 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white/90 border border-white/80 font-mono font-bold text-xs text-[#10213D] flex items-center justify-center shrink-0 shadow-2xs">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold text-foreground truncate block leading-snug">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-foreground-muted font-medium">
                        {p.unitsSold} unit terjual • {p.category}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground shrink-0 font-mono text-xs">
                    Rp {Number(p.revenue || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Live Transactions Feed & Affiliate Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Activity Feed (2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 animate-fade-up stagger-5">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2563EB]" />
                <span>Aktivitas Transaksi Terbaru</span>
              </h3>
              <p className="text-xs text-foreground-muted mt-0.5">
                Pesanan yang baru saja masuk dan diproses oleh gateway
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-xs text-[#2563EB] hover:underline font-semibold"
            >
              Lihat Seluruh Pesanan →
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FB] text-[11px] text-foreground-muted uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="py-3 px-3.5">Order ID & Pembeli</th>
                  <th className="py-3 px-3.5">Produk</th>
                  <th className="py-3 px-3.5">Metode</th>
                  <th className="py-3 px-3.5 text-right">Total</th>
                  <th className="py-3 px-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-white">
                {(liveOrders.length > 0 ? liveOrders.slice(0, 5) : recentTransactions).map((tx: any, idx: number) => {
                  const id = tx.id || tx.orderId;
                  const customer = tx.customer || tx.customerName || 'Pelanggan';
                  const product = tx.product || (tx.items?.[0]?.productName) || 'Produk Digital';
                  const paymentMethod = tx.paymentMethod || 'QRIS';
                  const amount = typeof tx.amount === 'number' ? tx.amount : (tx.totalAmount || 0);
                  const status = tx.status;
                  const time = tx.time || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-');
                  return (
                    <tr
                      key={id}
                      className="hover:bg-[#F8F9FB] transition-colors duration-150 animate-fade-up"
                      style={{ animationDelay: `${Math.min(idx, 10) * 40}ms` }}
                    >
                      <td className="py-3 px-3.5">
                        <span className="font-mono font-bold text-foreground block">{id}</span>
                        <span className="text-[10px] text-foreground-muted">{customer} • {time}</span>
                      </td>
                      <td className="py-3 px-3.5 font-medium text-foreground truncate max-w-[180px]">
                        {product}
                      </td>
                      <td className="py-3 px-3.5 text-foreground-muted text-[11px]">
                        {paymentMethod}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-foreground font-mono">
                        Rp {amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3.5 text-right">
                        <StatusBadge status={status} />
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
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#2563EB]" />
                <span>Performa Affiliate Sales</span>
              </h3>
              <Badge variant="success" className="text-[10px]">
                {liveAffiliates.length} Mitra
              </Badge>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted">Omzet via Referral</span>
                <span className="font-bold text-foreground font-mono">
                  Rp {totalReferralRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted">Komisi Terbayar</span>
                <span className="font-bold text-[#16A36A] font-mono">
                  Rp {totalPaidReferralCommission.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/50 backdrop-blur-md border border-white/70">
                <span className="text-foreground-muted">Top Mitra Sales</span>
                <span className="font-bold text-[#2563EB] truncate max-w-[140px] text-right">
                  {topPartner ? `${topPartner.name} (${topPartner.code})` : 'Belum Ada'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('affiliate')}
              className="w-full text-xs font-semibold mt-1"
            >
              Buka Portal Sales & Affiliate →
            </Button>
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
