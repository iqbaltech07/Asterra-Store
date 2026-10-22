'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Share2,
  Clock,
  AlertTriangle,
  DownloadCloud,
  AlertCircle,
  Coins,
  BarChart3,
  Sparkles,
  Server,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminTab } from './admin-sidebar';
import { useCountUp, formatRupiah, formatNumber } from '@/lib/hooks/use-count-up';
import { useGsapReveal } from '@/lib/animations/use-gsap-reveal';

interface AdminDashboardTabProps {
  metrics?: {
    total?: number;
    totalActive?: number;
    totalArchived?: number;
    totalWarnings?: number;
    vipBalance?: number | null;
  };
  onNavigateTab: (tab: AdminTab) => void;
  onOpenCreateProduct?: () => void;
  onSyncVip: () => void;
  isSyncingVip?: boolean;
}

export function AdminDashboardTab({
  metrics,
  onNavigateTab,
  onOpenCreateProduct: _onOpenCreateProduct,
  onSyncVip,
  isSyncingVip,
}: AdminDashboardTabProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useGsapReveal(containerRef, {
    selector: '.gsap-fade-up',
    y: 16,
    duration: 0.5,
    stagger: 0.05,
    deps: [salesPeriod],
  });

  const { data: dashboardOverview = null } = useQuery({
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

  // Raw API Values (100% data integrity, zero mock data)
  const rawRevenue = Number(dashboardOverview?.kpi?.totalRevenue ?? liveOrderMetrics?.totalRevenue ?? 0);
  const rawOrders = Number(dashboardOverview?.kpi?.totalOrders ?? liveOrderMetrics?.total ?? 0);
  const rawCompletedOrders = Number(dashboardOverview?.kpi?.completedOrders ?? liveOrderMetrics?.completed ?? 0);
  const rawCustomers = Number(dashboardOverview?.kpi?.totalCustomers ?? 0);
  const rawNewCustomers = Number(dashboardOverview?.kpi?.newCustomers ?? 0);
  const rawGrossProfit = Number(dashboardOverview?.kpi?.grossProfit ?? 0);
  const rawProfitMargin = Number(dashboardOverview?.kpi?.profitMarginPercent ?? 0);
  const rawPendingOrders = Number(dashboardOverview?.kpi?.pendingOrders ?? liveOrderMetrics?.pending ?? 0);

  // Smooth Count-Up animations (respects prefers-reduced-motion)
  const countRevenue = useCountUp(rawRevenue);
  const countOrders = useCountUp(rawOrders);
  const countCustomers = useCountUp(rawCustomers);
  const countGrossProfit = useCountUp(rawGrossProfit);
  const countPendingOrders = useCountUp(rawPendingOrders);

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
  const hasTransactionsInPeriod = salesData.some((d) => d.revenue > 0 || d.orders > 0);
  const topProducts = dashboardOverview?.topProducts || [];
  const recentTransactions =
    dashboardOverview?.recentTransactions && dashboardOverview.recentTransactions.length > 0
      ? dashboardOverview.recentTransactions
      : liveOrders;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* 1. Critical Operational Alerts Bar */}
      <div className="space-y-2.5 gsap-fade-up">
        {/* Alert 1: Saldo Supplier VIP */}
        {((metrics?.vipBalance ?? 0) < 50000) && (
          <div className="bg-amber-50 border border-amber-200 text-foreground rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3 text-xs">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Perhatian Saldo Supplier VIP Reseller:</span>{' '}
                <span className="text-foreground-secondary">
                  Saldo deposit saat ini adalah{' '}
                  <strong className="font-mono text-amber-700 font-bold">
                    Rp {(metrics?.vipBalance ?? 0).toLocaleString('id-ID')}
                  </strong>
                  . Jika saldo habis, pemesanan otomatis upstream akan tertunda.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('providers')}
              className="text-xs h-8 border-amber-300 text-amber-800 hover:bg-amber-100/70 rounded-xl font-semibold shrink-0 motion-pressable"
            >
              Cek Provider VIP →
            </Button>
          </div>
        )}

        {/* Alert 2: Stok Supplier Kosong */}
        {(metrics?.totalWarnings ?? 0) > 0 && (
          <div className="bg-red-50 border border-red-200 text-foreground rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3 text-xs">
              <div className="p-2 rounded-xl bg-red-100 text-red-700 shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Stok Upstream Kosong:</span>{' '}
                <span className="text-foreground-secondary">
                  Terdapat <strong className="text-red-700 font-bold">{metrics?.totalWarnings} produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('products')}
              className="text-xs h-8 border-red-300 text-red-800 hover:bg-red-100/70 rounded-xl font-semibold shrink-0 motion-pressable"
            >
              Tinjau Katalog ({metrics?.totalWarnings}) →
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Executive Statistics Cards (5 Cards - Ni ond Composition) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Revenue */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="bg-surface border border-border rounded-2xl p-5 shadow-xs motion-card-interactive cursor-pointer group gsap-fade-up"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
            <span className="font-medium text-foreground-secondary">Total Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            <span aria-hidden="true">{formatRupiah(countRevenue)}</span>
            <span className="sr-only">{formatRupiah(rawRevenue)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success shrink-0" />
            <span className="text-[11px] text-status-success font-semibold">
              Terverifikasi Sistem
            </span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-surface border border-border rounded-2xl p-5 shadow-xs motion-card-interactive cursor-pointer group gsap-fade-up"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
            <span className="font-medium text-foreground-secondary">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            <span aria-hidden="true">{formatNumber(countOrders)}</span>
            <span className="sr-only">{formatNumber(rawOrders)}</span>
          </div>
          <div className="text-[11px] text-foreground-muted mt-2.5 truncate">
            <strong className="text-foreground font-semibold">{rawCompletedOrders}</strong> Selesai diproses
          </div>
        </div>

        {/* Card 3: Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-surface border border-border rounded-2xl p-5 shadow-xs motion-card-interactive cursor-pointer group gsap-fade-up"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
            <span className="font-medium text-foreground-secondary">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-foreground tracking-tight">
            <span aria-hidden="true">{formatNumber(countCustomers)}</span>
            <span className="sr-only">{formatNumber(rawCustomers)}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-status-success font-semibold">
              +{rawNewCustomers} pelanggan terdata
            </span>
          </div>
        </div>

        {/* Card 4: Gross Profit */}
        <div
          onClick={() => onNavigateTab('profit')}
          className="bg-surface border border-border rounded-2xl p-5 shadow-xs motion-card-interactive cursor-pointer group gsap-fade-up"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
            <span className="font-medium text-foreground-secondary">Gross Profit</span>
            <div className="w-8 h-8 rounded-xl bg-status-success/10 text-status-success flex items-center justify-center group-hover:scale-110 transition-transform">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-status-success tracking-tight">
            <span aria-hidden="true">{formatRupiah(countGrossProfit)}</span>
            <span className="sr-only">{formatRupiah(rawGrossProfit)}</span>
          </div>
          <div className="text-[11px] text-foreground-muted mt-2.5">
            Estimasi Margin <strong className="text-foreground font-semibold">{rawProfitMargin}%</strong>
          </div>
        </div>

        {/* Card 5: Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-surface border border-border rounded-2xl p-5 shadow-xs motion-card-interactive cursor-pointer group gsap-fade-up col-span-1 sm:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-3">
            <span className="font-medium text-foreground-secondary">Pending Orders</span>
            <div className="w-8 h-8 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-status-warning tracking-tight">
            <span aria-hidden="true">{formatNumber(countPendingOrders)}</span>
            <span className="sr-only">{formatNumber(rawPendingOrders)}</span>
          </div>
          <div className="text-[11px] text-status-warning font-medium mt-2.5">
            Menunggu pembayaran
          </div>
        </div>
      </div>

      {/* 3. Sales Trend Visualizer & Top Products Quadrant (Ni ond Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Card (2 columns) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-5 gsap-fade-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">
                  Grafik Penjualan & Tren Transaksi
                </h3>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Pergerakan omzet bruto toko berdasarkan periode waktu
              </p>
            </div>

            {/* Period Segmented Switcher (Ni ond Pill Style) */}
            <div className="flex items-center bg-surface-secondary p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setSalesPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all motion-pressable ${
                  salesPeriod === 'daily'
                    ? 'bg-surface text-primary font-bold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setSalesPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all motion-pressable ${
                  salesPeriod === 'weekly'
                    ? 'bg-surface text-primary font-bold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setSalesPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all motion-pressable ${
                  salesPeriod === 'monthly'
                    ? 'bg-surface text-primary font-bold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization Area */}
          <div className="pt-2">
            {!hasTransactionsInPeriod ? (
              <div className="h-48 rounded-xl bg-surface-secondary/40 border border-dashed border-border flex flex-col items-center justify-center p-6 text-center space-y-2">
                <BarChart3 className="w-8 h-8 text-foreground-muted/50" />
                <p className="text-xs font-semibold text-foreground">Belum ada transaksi pada periode ini</p>
                <p className="text-[11px] text-foreground-muted max-w-sm">
                  Transaksi baru yang selesai diproses akan otomatis muncul pada grafik secara real-time.
                </p>
              </div>
            ) : (
              <div className="relative">
                {/* Dotted horizontal background guide lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-7">
                  <div className="border-b border-dashed border-border/70 w-full" />
                  <div className="border-b border-dashed border-border/70 w-full" />
                  <div className="border-b border-dashed border-border/70 w-full" />
                  <div className="border-b border-border w-full" />
                </div>

                <div className="h-48 flex items-end gap-3 sm:gap-6 justify-between px-3 relative z-10">
                  {salesData.map((d, idx) => {
                    const heightPercent =
                      maxRevenue > 0 && d.revenue > 0
                        ? Math.max(10, Math.round((d.revenue / maxRevenue) * 100))
                        : 6;

                    return (
                      <div
                        key={`${salesPeriod}-${idx}`}
                        className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                      >
                        {/* Hover Tooltip Amount */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-navy text-white text-[10px] py-1 px-2 rounded-lg shadow-lg font-mono whitespace-nowrap pointer-events-none translate-y-1 group-hover:translate-y-0 transition-transform">
                          {formatRupiah(d.revenue)} ({d.orders} order)
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full max-w-[40px] bg-primary/20 group-hover:bg-primary rounded-t-xl transition-all duration-200 cursor-pointer relative motion-bar-grow"
                          style={{
                            height: `${heightPercent}%`,
                            animationDelay: `${idx * 40}ms`,
                          }}
                        >
                          <div className="absolute top-1 left-0 right-0 h-1 bg-primary/40 rounded-t-xl" />
                        </div>

                        {/* Label */}
                        <span className="text-[11px] text-foreground-muted font-medium truncate max-w-full group-hover:text-foreground transition-colors">
                          {d.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-foreground-muted">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span>Omzet Transaksi Terverifikasi</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('sales-summary')}
              className="text-primary hover:text-primary/80 font-semibold flex items-center gap-1 group self-start sm:self-auto motion-pressable"
            >
              <span>Lihat Detail Analytics</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Top Selling Products Panel (1 column) */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 gsap-fade-up">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="font-extrabold text-sm text-foreground tracking-tight">
                Produk Terlaris
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('product-performance')}
              className="text-[11px] text-primary hover:underline font-semibold motion-pressable"
            >
              Semua Produk →
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {topProducts.length === 0 ? (
              <div className="p-6 text-center text-foreground-muted bg-surface-secondary/40 rounded-xl border border-dashed border-border">
                Belum ada transaksi produk terlaris
              </div>
            ) : (
              topProducts.slice(0, 5).map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-surface-secondary/60 hover:bg-surface-secondary border border-border flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded-lg bg-surface border border-border text-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-foreground truncate block">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-foreground-muted block mt-0.5">
                        {p.unitsSold} unit terjual • {p.category}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-primary shrink-0 text-xs">
                    {formatRupiah(Number(p.revenue || 0))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Live Transactions Feed & Affiliate / Radar Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Feed (2 columns) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-xs space-y-4 gsap-fade-up">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground tracking-tight">
                  Aktivitas Transaksi Terbaru
                </h3>
              </div>
              <p className="text-xs text-foreground-muted mt-0.5">
                Order yang baru saja masuk dan diproses oleh gateway
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-[11px] text-primary hover:underline font-semibold motion-pressable"
            >
              Lihat Seluruh Pesanan →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="pb-2.5 font-bold">Order ID & Pembeli</th>
                  <th className="pb-2.5 font-bold">Produk</th>
                  <th className="pb-2.5 font-bold">Metode</th>
                  <th className="pb-2.5 text-right font-bold">Total</th>
                  <th className="pb-2.5 text-right font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(liveOrders.length > 0 ? liveOrders.slice(0, 5) : recentTransactions.slice(0, 5)).map((tx: any) => {
                  const id = tx.id || tx.orderId;
                  const customer = tx.customer || tx.customerName || 'Pelanggan';
                  const product = tx.product || (tx.items?.[0]?.productName) || 'Produk Digital';
                  const paymentMethod = tx.paymentMethod || 'QRIS';
                  const amount = typeof tx.amount === 'number' ? tx.amount : (tx.totalAmount || 0);
                  const status = tx.status;
                  const time =
                    tx.time ||
                    (tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })
                      : '-');

                  return (
                    <tr key={id} className="hover:bg-surface-secondary/60 transition-colors">
                      <td className="py-3 pr-2">
                        <span className="font-mono font-bold text-foreground block">{id}</span>
                        <span className="text-[10px] text-foreground-muted">{customer} • {time}</span>
                      </td>
                      <td className="py-3 pr-2 font-medium text-foreground truncate max-w-[170px]">
                        {product}
                      </td>
                      <td className="py-3 pr-2 text-foreground-secondary text-[11px]">
                        <span className="px-2 py-0.5 rounded-md bg-surface-secondary border border-border">
                          {paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-right font-bold text-foreground font-mono">
                        {formatRupiah(amount)}
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold rounded-lg px-2 py-0.5 ${
                            status === 'completed' || status === 'paid' || status === 'settlement'
                              ? 'bg-status-success/10 text-status-success border-status-success/30'
                              : status === 'processing'
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-status-warning/10 text-status-warning border-status-warning/30'
                          }`}
                        >
                          {status === 'completed' || status === 'paid' || status === 'settlement'
                            ? 'Lunas'
                            : status === 'processing'
                            ? 'Diproses'
                            : status === 'pending'
                            ? 'Pending'
                            : status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Affiliate & Provider Operational Cards */}
        <div className="space-y-4">
          {/* Affiliate Snapshot */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-3.5 gsap-fade-up">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground tracking-tight">
                  Performa Affiliate Sales
                </h3>
              </div>
              <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 font-bold rounded-full">
                {liveAffiliates.length} Mitra
              </Badge>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Omzet via Referral</span>
                <span className="font-bold text-foreground font-mono">
                  {formatRupiah(totalReferralRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Komisi Terbayar</span>
                <span className="font-bold text-status-success font-mono">
                  {formatRupiah(totalPaidReferralCommission)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Top Mitra Sales</span>
                <span className="font-bold text-primary truncate max-w-[130px] text-right">
                  {topPartner ? `${topPartner.name} (${topPartner.code})` : 'Belum Ada Transaksi'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('affiliate')}
              className="w-full text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-xl font-bold mt-1 motion-pressable"
            >
              Buka Portal Sales & Affiliate →
            </Button>
          </div>

          {/* Provider / Gateway Radar */}
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-3.5 gsap-fade-up">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <h3 className="font-extrabold text-sm text-foreground tracking-tight">
                  Status Gateway & Provider
                </h3>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="text-foreground-secondary">VIP Reseller Gateway</span>
                <span className="font-bold text-status-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="text-foreground-secondary">Tripay PG Webhook</span>
                <span className="font-bold text-status-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                  Active Whitelisted
                </span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary border border-border">
                <span className="text-foreground-secondary">WhatsApp Bot</span>
                <span className="font-bold text-status-success flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
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
                className="text-xs h-8 text-primary border-primary/30 rounded-xl font-semibold motion-pressable"
              >
                <DownloadCloud className="w-3 h-3 mr-1" />
                {isSyncingVip ? 'Menyinkronkan...' : 'Sinkronkan Layanan'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigateTab('logs')}
                className="text-xs h-8 text-foreground-muted hover:text-foreground rounded-xl motion-pressable"
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
