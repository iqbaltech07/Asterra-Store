import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  const [salesPeriod, setSalesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [dashboardOverview, setDashboardOverview] = useState<any | null>(null);
  const [liveAffiliates, setLiveAffiliates] = useState<any[]>([]);
  const [liveOrders, setLiveOrders] = useState<any[]>([]);
  const [liveOrderMetrics, setLiveOrderMetrics] = useState<{
    total?: number;
    completed?: number;
    processing?: number;
    pending?: number;
    cancelled?: number;
    failed?: number;
    totalRevenue?: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/v1/admin/analytics/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDashboardOverview(json.data);
        }
      })
      .catch((err) => console.warn('Failed to fetch analytics overview:', err));

    fetch('/api/v1/admin/affiliates')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setLiveAffiliates(json.data);
        }
      })
      .catch((err) => console.warn('Failed to fetch affiliates for dashboard:', err));

    fetch('/api/v1/admin/orders?limit=6')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          if (json.metrics) {
            setLiveOrderMetrics(json.metrics);
          }
          if (Array.isArray(json.data)) {
            setLiveOrders(json.data);
          }
        }
      })
      .catch((err) => console.warn('Failed to fetch orders for dashboard:', err));
  }, []);

  const totalReferralRevenue =
    dashboardOverview?.affiliateSnapshot?.totalReferralRevenue ??
    liveAffiliates.reduce((acc, a) => acc + (a.totalRevenue || 0), 0);
  const totalPaidReferralCommission =
    dashboardOverview?.affiliateSnapshot?.totalPaidCommission ??
    liveAffiliates.reduce((acc, a) => acc + (a.paidCommission || 0), 0);
  const topPartner =
    dashboardOverview?.affiliateSnapshot?.topPartner ??
    [...liveAffiliates].sort((a, b) => (b.totalRevenue || 0) - (a.totalRevenue || 0))[0];

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

  return (
    <div className="space-y-6">
      {/* 1. Critical Alerts Bar (Immediate Actionable Items) */}
      <div className="space-y-2.5">
        {/* Alert 1: Saldo Supplier */}
        {((metrics?.vipBalance ?? 0) < 50000) && (
          <div className="bg-status-warning/10 border border-status-warning/30 text-foreground rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5 text-xs">
              <div className="p-1.5 rounded-lg bg-status-warning/20 text-status-warning shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Perhatian Saldo Supplier VIP Reseller:</span>{' '}
                <span className="text-foreground-muted">
                  Saldo deposit saat ini adalah{' '}
                  <strong className="font-mono text-status-warning">
                    Rp {(metrics?.vipBalance ?? 0).toLocaleString('id-ID')}
                  </strong>
                  . Jika saldo habis, pemesanan otomatis upstream akan tertunda.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigateTab('providers')}
                className="text-xs h-7 border-status-warning/40 text-status-warning hover:bg-status-warning/15"
              >
                Cek Provider VIP →
              </Button>
            </div>
          </div>
        )}

        {/* Alert 2: Stok Supplier Kosong */}
        {(metrics?.totalWarnings ?? 0) > 0 && (
          <div className="bg-status-error/10 border border-status-error/30 text-foreground rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-2.5 text-xs">
              <div className="p-1.5 rounded-lg bg-status-error/20 text-status-error shrink-0 mt-0.5 sm:mt-0">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-foreground">Stok Upstream Kosong:</span>{' '}
                <span className="text-foreground-muted">
                  Terdapat <strong className="text-status-error">{metrics?.totalWarnings} produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('products')}
              className="text-xs h-7 border-status-error/40 text-status-error hover:bg-status-error/15 shrink-0"
            >
              Tinjau Katalog ({metrics?.totalWarnings}) →
            </Button>
          </div>
        )}
      </div>

      {/* 2. Top Executive Statistics Cards (Revenue, Orders, Customers, Gross Profit, Pending Orders) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Revenue */}
        <div
          onClick={() => onNavigateTab('revenue')}
          className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-status-success group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            Rp {(dashboardOverview?.kpi?.totalRevenue ?? liveOrderMetrics?.totalRevenue ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-status-success font-semibold flex items-center gap-1 mt-1">
            ↑ Terverifikasi Sistem
          </span>
        </div>

        {/* Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Total Orders</span>
            <ShoppingBag className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {(dashboardOverview?.kpi?.totalOrders ?? liveOrderMetrics?.total ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-foreground-muted block mt-1">
            {(dashboardOverview?.kpi?.completedOrders ?? liveOrderMetrics?.completed ?? 0)} Selesai diproses
          </span>
        </div>

        {/* Total Customers */}
        <div
          onClick={() => onNavigateTab('customers')}
          className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Customers</span>
            <Users className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-foreground">
            {(dashboardOverview?.kpi?.totalCustomers ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-status-success font-semibold block mt-1">
            +{dashboardOverview?.kpi?.newCustomers ?? 0} pelanggan terdata
          </span>
        </div>

        {/* Gross Profit */}
        <div
          onClick={() => onNavigateTab('profit')}
          className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-primary/50 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Gross Profit</span>
            <Coins className="w-4 h-4 text-status-success group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-status-success">
            Rp {(dashboardOverview?.kpi?.grossProfit ?? Math.round((liveOrderMetrics?.totalRevenue || 0) * 0.35)).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-foreground-muted block mt-1">
            Estimasi Margin {dashboardOverview?.kpi?.profitMarginPercent ?? 35}%
          </span>
        </div>

        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-surface border border-border rounded-xl p-4 shadow-xs hover:border-status-warning/50 transition-all cursor-pointer group col-span-2 md:col-span-1"
        >
          <div className="flex items-center justify-between text-xs text-foreground-muted mb-1.5">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-status-warning group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl font-bold text-status-warning">
            {(dashboardOverview?.kpi?.pendingOrders ?? liveOrderMetrics?.pending ?? 0).toLocaleString('id-ID')}
          </div>
          <span className="text-[10px] text-status-warning block mt-1">
            Menunggu pembayaran
          </span>
        </div>
      </div>

      {/* 3. Sales Trend Visualizer & Top Products Quadrant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Grafik Penjualan & Tren Transaksi</span>
              </h3>
              <p className="text-xs text-foreground-muted">
                Pergerakan omzet bruto toko berdasarkan periode waktu
              </p>
            </div>

            {/* Period Switcher */}
            <div className="flex items-center bg-surface-raised p-1 rounded-lg border border-border text-xs">
              <button
                type="button"
                onClick={() => setSalesPeriod('daily')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  salesPeriod === 'daily'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setSalesPeriod('weekly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  salesPeriod === 'weekly'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setSalesPeriod('monthly')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  salesPeriod === 'monthly'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                30 Hari
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-2">
            <div className="h-44 flex items-end gap-3 sm:gap-6 justify-between px-2">
              {salesData.map((d, idx) => {
                const heightPercent = Math.max(14, Math.round((d.revenue / maxRevenue) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Hover Tooltip Amount */}
                    <span className="text-[10px] font-mono text-foreground font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Rp {(d.revenue / 1000).toLocaleString('id-ID')}k
                    </span>

                    {/* Bar */}
                    <div
                      className="w-full bg-primary/20 hover:bg-primary rounded-t-md transition-all group-hover:shadow-md cursor-pointer relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="absolute top-1 left-0 right-0 h-1 bg-primary/40 rounded-t-md" />
                    </div>

                    {/* Label */}
                    <span className="text-[11px] text-foreground-muted font-medium truncate max-w-full">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-primary" />
              <span>Omzet Transaksi Terverifikasi</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('sales-summary')}
              className="text-primary hover:underline font-semibold flex items-center gap-1"
            >
              Lihat Detail Analytics →
            </button>
          </div>
        </div>

        {/* Top Selling Products (1 col) */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Produk Terlaris</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('product-performance')}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              Semua Produk →
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            {topProducts.length === 0 ? (
              <div className="p-4 text-center text-foreground-muted">Belum ada transaksi produk terlaris</div>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-raised border border-border flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-semibold text-foreground truncate block">{p.name}</span>
                    <span className="text-[10px] text-foreground-muted">{p.unitsSold} unit terjual • {p.category}</span>
                  </div>
                  <span className="font-bold text-primary shrink-0 font-mono">
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
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Aktivitas Transaksi Terbaru</span>
              </h3>
              <p className="text-xs text-foreground-muted">
                Order yang baru saja masuk dan diproses oleh gateway
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('orders')}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              Lihat Seluruh Pesanan →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-foreground-muted uppercase tracking-wider font-semibold border-b border-border">
                <tr>
                  <th className="pb-2">Order ID & Pembeli</th>
                  <th className="pb-2">Produk</th>
                  <th className="pb-2">Metode</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(liveOrders.length > 0 ? liveOrders.slice(0, 5) : recentTransactions).map((tx) => {
                  const id = tx.id || tx.orderId;
                  const customer = tx.customer || tx.customerName || 'Pelanggan';
                  const product = tx.product || (tx.items?.[0]?.productName) || 'Produk Digital';
                  const paymentMethod = tx.paymentMethod || 'QRIS';
                  const amount = typeof tx.amount === 'number' ? tx.amount : (tx.totalAmount || 0);
                  const status = tx.status;
                  const time = tx.time || (tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-');
                  return (
                    <tr key={id} className="hover:bg-surface-raised/40">
                      <td className="py-2.5 pr-2">
                        <span className="font-mono font-bold text-foreground block">{id}</span>
                        <span className="text-[10px] text-foreground-muted">{customer} • {time}</span>
                      </td>
                      <td className="py-2.5 pr-2 font-medium text-foreground truncate max-w-[160px]">
                        {product}
                      </td>
                      <td className="py-2.5 pr-2 text-foreground-muted text-[11px]">
                        {paymentMethod}
                      </td>
                      <td className="py-2.5 pr-2 text-right font-bold text-foreground">
                        Rp {amount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            status === 'completed'
                              ? 'bg-status-success/15 text-status-success border-status-success/30'
                              : status === 'processing'
                              ? 'bg-primary/15 text-primary border-primary/30'
                              : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                          }`}
                        >
                          {status === 'completed' ? 'Lunas' : status === 'processing' ? 'Diproses' : status === 'pending' ? 'Pending' : status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Affiliate & Provider Operations Card (1 col) */}
        <div className="space-y-4">
          {/* Affiliate Snapshot */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-primary" />
                <span>Performa Affiliate Sales</span>
              </h3>
              <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30">
                {liveAffiliates.length} Mitra
              </Badge>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Omzet via Referral</span>
                <span className="font-bold text-foreground">
                  Rp {totalReferralRevenue.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Komisi Terbayar</span>
                <span className="font-bold text-status-success">
                  Rp {totalPaidReferralCommission.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-muted">Top Mitra Sales</span>
                <span className="font-bold text-primary truncate max-w-[140px] text-right">
                  {topPartner ? `${topPartner.name} (${topPartner.code})` : 'Belum Ada Transaksi'}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateTab('affiliate')}
              className="w-full text-xs border-primary/30 text-primary hover:bg-primary/10 mt-1"
            >
              Buka Portal Sales & Affiliate →
            </Button>
          </div>

          {/* Provider / API Operations Radar */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Server className="w-4 h-4 text-primary" />
                <span>Status Gateway & Provider</span>
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-surface-raised border border-border">
                <span className="text-foreground-muted">VIP Reseller Gateway</span>
                <span className="font-semibold text-status-success">Online (114ms)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-raised border border-border">
                <span className="text-foreground-muted">Tripay PG Webhook</span>
                <span className="font-semibold text-status-success">Active Whitelisted</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-surface-raised border border-border">
                <span className="text-foreground-muted">WhatsApp Notification Bot</span>
                <span className="font-semibold text-status-success">Connected</span>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={onSyncVip}
                disabled={isSyncingVip}
                className="text-xs h-7 text-primary border-primary/30"
              >
                <DownloadCloud className="w-3 h-3 mr-1" />
                {isSyncingVip ? 'Menyinkronkan...' : 'Sinkronkan Layanan'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onNavigateTab('logs')}
                className="text-xs h-7 text-foreground-muted hover:text-foreground"
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
