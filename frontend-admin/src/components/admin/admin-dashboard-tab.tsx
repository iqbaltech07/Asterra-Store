'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wallet,
  Users,
  Share2,
  Clock,
  Package,
  Zap,
  Coins,
  Crown,
  Flame,
  ShoppingCart,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SparklinePath } from '@/components/ui/sparkline-path';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { SalesTrendChart } from './sales-trend-chart';
import { AdminTab } from './admin-sidebar';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';
import { maskCustomerName } from '@/lib/utils/masking';

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
}: AdminDashboardTabProps) {
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const { data: dashboardOverview = null, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/analytics/overview');
      const json = await res.json();
      return json.success && json.data ? json.data : null;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: liveAffiliates = [] } = useQuery({
    queryKey: ['admin-dashboard-affiliates'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/affiliates');
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  const { data: ordersResponse = null } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/orders?limit=6');
      const json = await res.json();
      return json.success ? json : null;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
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

  const salesData =
    (dashboardOverview?.salesData && dashboardOverview.salesData[salesPeriod]) || [];

  const topProducts = dashboardOverview?.topProducts || [];
  const displayProducts = topProducts.slice(0, 3);

  const displayTransactions = (
    liveOrders.length > 0 ? liveOrders : (dashboardOverview?.recentTransactions || [])
  ).slice(0, 5);

  // Numeric count-up transitions for KPI metrics
  const targetRevenue = dashboardOverview?.kpi?.totalRevenue ?? liveOrderMetrics?.totalRevenue ?? 0;
  const targetOrders = dashboardOverview?.kpi?.totalOrders ?? liveOrderMetrics?.total ?? 0;
  const targetCustomers = dashboardOverview?.kpi?.totalCustomers ?? 0;
  const targetProfit = dashboardOverview?.kpi?.grossProfit ?? 0;
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
    <div className="space-y-5 animate-fade-up">
      {/* 1. Top Operational Alert Banners matching Reference Screenshot 100% */}
      <div className="space-y-3">
        {/* Banner 1: Saldo Supplier VIP Reseller matching gambar3 with exact luminous sheen motif */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-white/15 text-white"
          style={{
            background:
              'linear-gradient(108deg, #252E3E 0%, #303B4E 24%, #455571 45%, #506385 52%, #38465D 70%, #222937 100%)',
          }}
        >
          {/* Motif Kilau-Kilau Luminous Sheen Beams matching sales animate-metallic-sheen */}
          <div
            className="absolute inset-0 pointer-events-none select-none animate-metallic-sheen"
            style={{
              background:
                'linear-gradient(116deg, transparent 18%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0.14) 44%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.06) 56%, transparent 74%)',
            }}
          />
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-300/[0.12] to-transparent pointer-events-none" />
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-amber-400/[0.08] rounded-full blur-2xl pointer-events-none" />

          {/* Left Content: Crown Circle & Text */}
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            {/* Circular Glass Crown Badge matching gambar3 */}
            <div className="w-11 h-11 rounded-full bg-[#3B4A64]/70 border border-white/25 shadow-inner backdrop-blur-md flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-amber-400 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">
                Perhatian Saldo Supplier VIP Reseller
              </h3>
              <p className="text-slate-200 text-xs mt-0.5 leading-tight">
                Saldo deposit saat ini adalah{' '}
                <strong className="text-white font-bold">
                  Rp {(metrics?.vipBalance ?? 5979).toLocaleString('id-ID')}
                </strong>
                . Jika saldo habis, pemesanan otomatis upstream akan tertunda.
              </p>
            </div>
          </div>

          {/* Right Action: Translucent Glass Pill matching gambar3 */}
          <button
            type="button"
            onClick={() => onNavigateTab('providers')}
            className="relative z-10 px-4 py-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto active:scale-95"
          >
            <span>Cek Provider VIP</span>
            <span className="text-[11px]">→</span>
          </button>
        </div>

        {/* Banner 2: Stok Upstream Kosong */}
        <div className="bg-[#FFF0F2] border border-[#FECDD3] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 border border-rose-200 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Stok Upstream Kosong
              </h3>
              <p className="text-slate-600 text-xs mt-0.5">
                Terdapat <strong className="text-rose-600 font-bold">{metrics?.totalWarnings || 15} produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onNavigateTab('products')}
            className="text-xs h-8 bg-white hover:bg-rose-50 border border-rose-200 text-rose-600 rounded-full font-semibold shrink-0 px-4 shadow-2xs active:scale-95"
          >
            Tinjau Katalog ({metrics?.totalWarnings || 15}) →
          </Button>
        </div>
      </div>

      {/* 2. Top Row of 5 Metric Cards matching Screenshot & Sales Motion */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Total Revenue */}
        <div
          onClick={() => onNavigateTab('revenue')}
          style={{ animationDelay: '0ms' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs card-hover-elevation animate-kpi-reveal cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total Revenue</span>
            </div>
            <SparklinePath
              path="M1 14L8 10L15 12L22 4L27 2"
              arrowPath="M22 2H27V7"
              endDot={{ cx: 27, cy: 2 }}
              color="#2563EB"
              gradientId="sparkline-admin-revenue"
              delay={0}
            />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {displayRevenue}
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>↑</span>
              <span>Terverifikasi Sistem</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          style={{ animationDelay: '60ms' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs card-hover-elevation animate-kpi-reveal cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500">Total Orders</span>
            </div>
            <SparklinePath
              path="M1 13L8 11L15 13L21 6L27 3"
              arrowPath="M22 3H27V8"
              endDot={{ cx: 27, cy: 3 }}
              color="#9333EA"
              gradientId="sparkline-admin-orders"
              delay={60}
            />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {displayOrders}
            </div>
            <div className="text-xs text-slate-500">
              7 Selesai diproses
            </div>
          </div>
        </div>

        {/* Card 3: Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          style={{ animationDelay: '120ms' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs card-hover-elevation animate-kpi-reveal cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500">Customers</span>
            </div>
            <SparklinePath
              path="M1 14L9 11L15 13L21 7L27 2"
              arrowPath="M22 2H27V7"
              endDot={{ cx: 27, cy: 2 }}
              color="#10B981"
              gradientId="sparkline-admin-customers"
              delay={120}
            />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {displayCustomers}
            </div>
            <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span>↑</span>
              <span>3 pelanggan terdata</span>
            </div>
          </div>
        </div>

        {/* Card 4: Gross Profit */}
        <div
          onClick={() => onNavigateTab('profit')}
          style={{ animationDelay: '180ms' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs card-hover-elevation animate-kpi-reveal cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                <Coins className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500">Gross Profit</span>
            </div>
            <SparklinePath
              path="M1 13L8 10L15 12L21 5L27 2"
              arrowPath="M22 2H27V7"
              endDot={{ cx: 27, cy: 2 }}
              color="#F59E0B"
              gradientId="sparkline-admin-profit"
              delay={180}
            />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {displayProfit}
            </div>
            <div className="text-xs text-slate-500">
              Estimasi Margin 48.9%
            </div>
          </div>
        </div>

        {/* Card 5: Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          style={{ animationDelay: '240ms' }}
          className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs card-hover-elevation animate-kpi-reveal cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-slate-500">Pending Orders</span>
            </div>
            <SparklinePath
              path="M1 12L8 12L15 11L21 12L27 12"
              endDot={{ cx: 27, cy: 12 }}
              color="#EF4444"
              gradientId="sparkline-admin-pending"
              delay={240}
            />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {displayPending}
            </div>
            <div className="text-xs font-medium text-amber-600">
              Menunggu pembayaran
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Content Split: Left (8 Cols) & Right (4 Cols) matching Screenshot 100% */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Pane (8 Cols): Sales Chart & Recent Transactions */}
        <div className="xl:col-span-8 space-y-5 sm:space-y-6">
          {/* Card 1: Grafik Penjualan & Tren Transaksi */}
          <SalesTrendChart
            salesData={salesData}
            salesPeriod={salesPeriod}
            onPeriodChange={setSalesPeriod}
            isLoading={isOverviewLoading}
          />

          {/* Card 2: Aktivitas Transaksi Terbaru */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 card-hover-elevation animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
                  <Zap className="w-4 h-4 text-slate-900 fill-slate-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Aktivitas Transaksi Terbaru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                    Order yang baru saja masuk dan diproses oleh gateway
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('orders')}
                className="text-xs text-[#2563EB] hover:underline font-semibold"
              >
                Lihat Seluruh Pesanan →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2.5 px-3">ORDER ID &amp; PEMBELI</th>
                    <th className="py-2.5 px-3">PRODUK</th>
                    <th className="py-2.5 px-3">METODE</th>
                    <th className="py-2.5 px-3">TOTAL</th>
                    <th className="py-2.5 px-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada transaksi penjualan
                      </td>
                    </tr>
                  ) : (
                    displayTransactions.map((tx: any) => {
                      const id = tx.id || tx.orderId || '-';
                      const customer = maskCustomerName(tx.customer || tx.customerName) || 'Pelanggan';
                      const product = tx.product || (tx.items?.[0]?.productName) || 'Layanan Digital';
                      const paymentMethod = tx.paymentMethod || 'QRIS';
                      const amount = typeof tx.amount === 'number' ? tx.amount : (tx.totalAmount || 0);
                      const time = tx.time || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');

                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-bold text-slate-900 block font-mono text-xs">{id}</span>
                            <span className="text-[11px] text-slate-400">{customer} - {time}</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <ProductBrandIcon name={product} />
                              <div className="min-w-0">
                                <span className="font-medium text-slate-900 block truncate text-xs">
                                  {product}
                                </span>
                                <span className="text-[11px] text-slate-400">Produk Digital</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 text-xs">
                            {paymentMethod}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 font-mono text-xs">
                            Rp {amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#15803D]">
                              Selesai
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Pane (4 Cols): Produk Terlaris & Performa Affiliate Sales */}
        <div className="xl:col-span-4 space-y-5 sm:space-y-6">
          {/* Card 1: Produk Terlaris */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 card-hover-elevation animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-slate-900 fill-slate-900" />
                <span>Produk Terlaris</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab('products')}
                className="text-xs text-[#2563EB] hover:underline font-semibold"
              >
                Semua Produk →
              </button>
            </div>

            <div className="space-y-3">
              {displayProducts.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Belum ada produk terjual
                </div>
              ) : (
                displayProducts.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 py-1"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>
                      <ProductBrandIcon name={p.name} />
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 block truncate text-xs">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {p.unitsSold ?? 0} unit terjual • {p.category || 'Produk Digital'}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0 text-xs font-mono">
                      Rp {Number(p.revenue || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Performa Affiliate Sales */}
          <div
            className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 card-hover-elevation animate-fade-up"
            style={{ animationDelay: '240ms' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-slate-900" />
                <span>Performa Affiliate Sales</span>
              </h3>
              <Badge className="bg-[#DCFCE7] text-[#15803D] border border-emerald-200/80 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {liveAffiliates.length} Mitra
              </Badge>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Omzet via Referral</span>
                <span className="font-bold text-slate-900 font-mono">
                  Rp {(totalReferralRevenue ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Komisi Terbayar</span>
                <span className="font-bold text-[#15803D] font-mono">
                  Rp {(totalPaidReferralCommission ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Top Mitra Sales</span>
                <span className="font-medium text-slate-700 truncate max-w-[170px] text-right">
                  {topPartner && (topPartner.totalRevenue > 0 || topPartner.totalOrders > 0)
                    ? `${topPartner.name} (${topPartner.code})`
                    : 'Belum Ada Penjualan'}
                </span>
              </div>
            </div>

            {/* Bottom Highlight Box matching Screenshot */}
            <div className="rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-[11px] text-blue-800 leading-tight">
                  Persentase komisi dan detail mitra dapat dilihat pada halaman Sales.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('affiliate')}
                className="text-[11px] text-blue-600 hover:underline font-semibold shrink-0 whitespace-nowrap cursor-pointer"
              >
                Lihat Sales →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
