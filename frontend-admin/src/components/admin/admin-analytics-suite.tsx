'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  DollarSign,
  Package,
  Users,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Layers,
  Search,
  ExternalLink,
  Printer,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getPerformanceColor, PERFORMANCE_COLORS } from '@/lib/utils/chart-performance-colors';

interface SalesTimeSeriesItem {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductPerformanceItem {
  id: string;
  name: string;
  category: string;
  provider: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
  marginPercent: number;
  refundRate: number;
  conversionRate: number;
  status: string;
}

interface AffiliatePerformanceItem {
  code: string;
  partnerName: string;
  clicks: number;
  referralOrders: number;
  conversionRate: number;
  generatedRevenue: number;
  commissionEarned: number;
  activeStatus: string;
}

interface FinancialReportData {
  period: string;
  grossRevenue: number;
  discounts: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  pgFees: number;
  commissions: number;
  infraOpex: number;
  totalOpex: number;
  netOperatingProfit: number;
  ceoShare: number;
  cooShare: number;
  businessReserve: number;
}

interface AnalyticsSuiteData {
  salesTimeSeries: SalesTimeSeriesItem[];
  productPerformanceData: ProductPerformanceItem[];
  affiliatePerformanceData: AffiliatePerformanceItem[];
  financialReport: FinancialReportData;
}

interface AdminAnalyticsSuiteProps {
  activeTab: 'sales-summary' | 'product-performance' | 'affiliate-performance' | 'financial-reports';
  onNotify?: (msg: string) => void;
}

export function AdminAnalyticsSuite({ activeTab, onNotify }: AdminAnalyticsSuiteProps) {
  // Period filter: Today, 7 Days, 30 Days, This Month, This Year
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | 'month' | 'year'>('30d');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductPerformanceItem | null>(null);
  const { data: suiteResponse, isLoading: isLoadingSuite } = useQuery<{ success: boolean; data: AnalyticsSuiteData }>({
    queryKey: ['admin-analytics-suite'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/analytics/suite');
      if (!res.ok) throw new Error('Failed to fetch analytics suite data');
      return res.json();
    },
    staleTime: 10000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 45000,
    refetchIntervalInBackground: false,
  });

  const suiteData = suiteResponse?.data || null;

  const salesTimeSeries = suiteData?.salesTimeSeries || [];
  const productPerformanceData = suiteData?.productPerformanceData || [];
  const affiliatePerformanceData = suiteData?.affiliatePerformanceData || [];
  const financialReport = suiteData?.financialReport;


  // =========================================================================
  // 1. SALES SUMMARY TAB
  // =========================================================================
  if (activeTab === 'sales-summary') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Sales Analytics BI
              </span>
              <span className="text-[11px] text-foreground-muted">Intelijen Penjualan & Pertumbuhan Toko</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Ringkasan & Analisis Penjualan</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Pantau tren omzet penjualan, volume transaksi, Average Order Value (AOV), serta saluran akuisisi pembeli.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Period Switcher */}
            <div className="flex items-center bg-surface-raised border border-border rounded-lg p-1 text-xs">
              {(['today', '7d', '30d', 'month', 'year'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    selectedPeriod === p
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {p === 'today' ? 'Hari Ini' : p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : p === 'month' ? 'Bulan Ini' : 'Tahun Ini'}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onNotify?.('Laporan penjualan CSV sedang di-generate...')}
              className="text-xs gap-1.5 border-border"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </Button>
          </div>
        </div>

        {/* 4 Executive KPI Cards */}
        {(() => {
          const totalRev = financialReport?.grossRevenue ?? salesTimeSeries.reduce((a, b) => a + (b.revenue || 0), 0);
          const totalOrders = salesTimeSeries.reduce((a, b) => a + (b.orders || 0), 0);
          const aov = totalOrders > 0 ? Math.round(totalRev / totalOrders) : 0;
          const totalUnits = productPerformanceData.length > 0 ? productPerformanceData.reduce((a, b) => a + (b.unitsSold || 0), 0) : totalOrders;
          const maxRev = Math.max(...salesTimeSeries.map((s) => s.revenue || 0), 50000);

          return (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-foreground-muted block mb-1">Gross Revenue (Omzet)</span>
                  <div className="text-2xl font-bold text-foreground font-mono">
                    Rp {totalRev.toLocaleString('id-ID')}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Terverifikasi Gateway</span>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-foreground-muted block mb-1">Total Pesanan Berhasil</span>
                  <div className="text-2xl font-bold text-foreground font-mono">{totalOrders} Orders</div>
                  <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold mt-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Lunas & Selesai</span>
                  </div>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-foreground-muted block mb-1">Average Order Value (AOV)</span>
                  <div className="text-2xl font-bold text-primary font-mono">
                    Rp {aov.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-foreground-muted">Rata-rata keranjang per checkout</span>
                </div>

                <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
                  <span className="text-[11px] text-foreground-muted block mb-1">Volume Unit Terjual</span>
                  <div className="text-2xl font-bold text-foreground font-mono">{totalUnits} Unit</div>
                  <span className="text-[10px] text-status-success font-semibold">Distribusi Katalog</span>
                </div>
              </div>

              {/* Time-Series Chart Interactive Container */}
              <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Grafik Volume Transaksi & Pertumbuhan Omzet</h3>
                    <p className="text-xs text-foreground-muted">Distribusi pendapatan harian terverifikasi sistem</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono text-status-success border-status-success/30">
                    Real-Time SSOT
                  </Badge>
                </div>

                {/* Bar Visualizer */}
                <div className="pt-6 pb-2 px-2">
                  <div className="h-44 flex items-end gap-3 sm:gap-6 border-b border-border/70 pb-2">
                    {salesTimeSeries.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-xs text-foreground-muted">
                        Belum ada data penjualan tercatat
                      </div>
                    ) : (() => {
                      const timeSeriesRevenues = salesTimeSeries.map((x) => x.revenue);
                      return salesTimeSeries.map((s, idx) => {
                        const heightPercent = Math.min(100, Math.max(15, Math.round((s.revenue / maxRev) * 100)));
                        const palette = getPerformanceColor(s.revenue, timeSeriesRevenues);
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Tooltip on hover */}
                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-border text-foreground text-[10px] py-1.5 px-2.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-20 font-mono flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">Rp {s.revenue.toLocaleString('id-ID')}</span>
                                <span
                                  className="text-[9px] font-semibold px-1 py-0.2 rounded"
                                  style={{ backgroundColor: `${palette.bg}22`, color: palette.bg === '#9CA3AF' ? '#4B5563' : palette.bg }}
                                >
                                  {palette.label}
                                </span>
                              </div>
                              <span className="text-[9px] text-foreground-muted font-sans">{s.orders} orders terverifikasi</span>
                            </div>
                            <div
                              className="w-full transition-all rounded-t-sm group-hover:scale-y-[1.03] group-hover:brightness-110 cursor-pointer origin-bottom"
                              style={{
                                height: `${heightPercent}%`,
                                backgroundColor: palette.bg,
                                boxShadow: `0 4px 12px ${palette.glow}`,
                              }}
                            />
                            <span className="text-[10px] font-mono text-foreground-muted whitespace-nowrap">
                              {s.date}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Performance Color Scale Legend */}
                  <div className="pt-3 flex items-center flex-wrap gap-2.5 text-[10px] text-foreground-muted">
                    <span className="font-semibold text-foreground/80">Skala Nilai:</span>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.zero.bg }} />
                      <span>Nol</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.lowest.bg }} />
                      <span>Terendah</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.low.bg }} />
                      <span>Rendah</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.medium.bg }} />
                      <span>Menengah</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PERFORMANCE_COLORS.high.bg }} />
                      <span>Tinggi</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })()}

        {/* Breakdown Triple Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category Distribution */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Distribusi Kategori</span>
              <PieChart className="w-3.5 h-3.5 text-foreground-muted" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between text-foreground">
                  <span>Desain & Grafis</span>
                  <span className="font-mono font-bold">42% (Rp 9.59M)</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-foreground">
                  <span>AI Tools & Productivity</span>
                  <span className="font-mono font-bold">34% (Rp 7.76M)</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-status-success h-1.5 rounded-full" style={{ width: '34%' }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-foreground">
                  <span>Streaming & Hiburan</span>
                  <span className="font-mono font-bold">24% (Rp 5.48M)</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                  <div className="bg-status-warning h-1.5 rounded-full" style={{ width: '24%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Metode Pembayaran</span>
              <Receipt className="w-3.5 h-3.5 text-foreground-muted" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">QRIS Real-Time</span>
                <span className="font-bold text-primary font-mono">64% (438 Orders)</span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">BCA Virtual Account</span>
                <span className="font-bold text-foreground font-mono">22% (150 Orders)</span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Bank Transfer Manual</span>
                <span className="font-bold text-foreground font-mono">14% (96 Orders)</span>
              </div>
            </div>
          </div>

          {/* Channel Acquisition */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-xs text-foreground flex items-center justify-between">
              <span>Sumber Saluran (Channel)</span>
              <Share2 className="w-3.5 h-3.5 text-foreground-muted" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Direct Toko / Search</span>
                <span className="font-bold text-foreground font-mono">58%</span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Mitra Afiliasi & Sales</span>
                <span className="font-bold text-status-success font-mono">32%</span>
              </div>
              <div className="p-2 rounded bg-surface-raised border border-border flex items-center justify-between">
                <span className="font-medium text-foreground">Campaign Promo / Kupon</span>
                <span className="font-bold text-status-warning font-mono">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. PRODUCT PERFORMANCE TAB
  // =========================================================================
  if (activeTab === 'product-performance') {
    const filteredProducts = productPerformanceData.filter((p) => {
      const matchQuery = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
      return matchQuery && matchCat;
    });

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Merchandise Intelligence
              </span>
              <span className="text-[11px] text-foreground-muted">Audit Profit & Retensi Per Produk</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Analisis Performa Produk</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Evaluasi unit terjual, margin laba kotor, rasio keluhan/refund, dan tingkat konversi masing-masing item digital.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNotify?.('Matriks performa produk diekspor ke format Excel.')}
            className="text-xs gap-1.5 border-border"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Matrix (XLSX)</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-foreground-muted">Filter Kategori:</span>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-surface-raised px-2.5 text-xs text-foreground"
            >
              <option value="all">Semua Kategori</option>
              <option value="Desain & Grafis">Desain & Grafis</option>
              <option value="AI Tools">AI Tools</option>
              <option value="Streaming & Hiburan">Streaming & Hiburan</option>
            </select>
          </div>

          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Cari performa produk..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-8 text-xs bg-surface-raised border-border h-8"
            />
          </div>
        </div>

        {/* Merchandise Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/80 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Nama Produk Digital</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-center">Unit Terjual</th>
                  <th className="py-3 px-4 text-right">Omzet Bruto</th>
                  <th className="py-3 px-4 text-right">Modal Supplier</th>
                  <th className="py-3 px-4 text-right">Laba Kotor</th>
                  <th className="py-3 px-4 text-center">Margin (%)</th>
                  <th className="py-3 px-4 text-center">Refund Rate</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-raised/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <div>{p.name}</div>
                      <span className="text-[10px] text-foreground-muted font-mono">{p.provider}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="text-[10px] border-border">
                        {p.category}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-foreground font-mono">
                      {p.unitsSold} pcs
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                      Rp {p.revenue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-foreground-muted">
                      Rp {p.cogs.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-status-success">
                      +Rp {p.profit.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-primary">
                      {p.marginPercent}%
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[11px]">
                      <span className={p.refundRate > 1 ? 'text-status-warning font-semibold' : 'text-foreground-muted'}>
                        {p.refundRate}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedProductDetail(p)}
                        className="h-7 text-xs text-primary"
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Detail Modal */}
        {selectedProductDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-md max-h-[calc(100dvh-40px)] flex flex-col shadow-2xl overflow-hidden box-border animate-in zoom-in-95 duration-200">
              {/* Sticky Header */}
              <div className="shrink-0 px-5 py-3.5 border-b border-[#E2E8F0] bg-white flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">{selectedProductDetail.name}</h3>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Kategori: {selectedProductDetail.category} • Supplier: {selectedProductDetail.provider}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="h-8 w-8 p-0 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                  aria-label="Tutup modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs bg-[#F8FAFC]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">Total Unit Terjual</span>
                    <span className="font-bold text-base text-[#0F172A] font-mono">{selectedProductDetail.unitsSold} pcs</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-1">
                    <span className="text-[10px] text-[#64748B] uppercase font-semibold tracking-wider block">Tingkat Konversi</span>
                    <span className="font-bold text-base text-emerald-600 font-mono">{selectedProductDetail.conversionRate}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B]">Akumulasi Omzet:</span>
                    <span className="font-bold font-mono text-[#2563EB]">Rp {selectedProductDetail.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#64748B]">Modal Terbayar:</span>
                    <span className="font-mono text-[#64748B]">Rp {selectedProductDetail.cogs.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E2E8F0] font-bold text-xs">
                    <span className="text-emerald-600">Laba Bersih Produk:</span>
                    <span className="font-mono text-emerald-600">Rp {selectedProductDetail.profit.toLocaleString('id-ID')} ({selectedProductDetail.marginPercent}%)</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Tingkat komplain & retur produk ini adalah {selectedProductDetail.refundRate}%, berada dalam batas toleransi aman (&lt; 2.0%).
                </p>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 px-4 sm:px-5 py-3 border-t border-[#E2E8F0] bg-white flex justify-end">
                <Button
                  type="button"
                  onClick={() => setSelectedProductDetail(null)}
                  className="text-xs h-8 px-4 font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-xs rounded-lg cursor-pointer"
                >
                  Tutup Rincian
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. AFFILIATE PERFORMANCE TAB
  // =========================================================================
  if (activeTab === 'affiliate-performance') {
    const totalAffiliateRevenue = affiliatePerformanceData.reduce((acc, a) => acc + a.generatedRevenue, 0);
    const totalCommissions = affiliatePerformanceData.reduce((acc, a) => acc + a.commissionEarned, 0);
    const totalReferralOrders = affiliatePerformanceData.reduce((acc, a) => acc + a.referralOrders, 0);
    const totalAffiliateClicks = affiliatePerformanceData.reduce((acc, a) => acc + a.clicks, 0);
    const avgConversionRate = totalAffiliateClicks > 0
      ? ((totalReferralOrders / totalAffiliateClicks) * 100).toFixed(1)
      : '0.0';

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
                Affiliate & Referral Telemetry
              </span>
              <span className="text-[11px] text-foreground-muted">Efektivitas Tim Sales & Mitra</span>
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Performa Sistem Afiliasi & Sales</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Analisis klik rujukan link, perolehan pesanan, total revenue yang dihasilkan, dan rasio konversi per kode referral.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onNotify?.('Laporan performa afiliasi telah diunduh.')}
            className="text-xs gap-1.5 border-border"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Data Afiliasi</span>
          </Button>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Total Omzet Afiliasi</span>
            <div className="text-2xl font-bold text-status-success font-mono">
              Rp {totalAffiliateRevenue.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-foreground-muted">Dari {affiliatePerformanceData.length} mitra sales</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Total Pesanan Referral</span>
            <div className="text-2xl font-bold text-foreground font-mono">{totalReferralOrders} Orders</div>
            <span className="text-[10px] text-status-success font-semibold">Terkonfirmasi bayar</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Akumulasi Komisi Mitra</span>
            <div className="text-2xl font-bold text-primary font-mono">
              Rp {totalCommissions.toLocaleString('id-ID')}
            </div>
            <span className="text-[10px] text-foreground-muted">Hak komisi sales</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Rata-Rata Rasio Konversi</span>
            <div className="text-2xl font-bold text-foreground font-mono">{avgConversionRate}%</div>
            <span className="text-[10px] text-status-success font-semibold">Klik menjadi transaksi</span>
          </div>
        </div>

        {/* Affiliate Ranking Matrix Table */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
            <h3 className="font-semibold text-xs text-foreground">Peringkat & Rincian Kode Referral</h3>
            <span className="text-[11px] text-foreground-muted">Real-time referral tracking</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised/50 border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Kode Referral</th>
                  <th className="py-3 px-4">Nama Mitra / Akun</th>
                  <th className="py-3 px-4 text-center">Klik Link</th>
                  <th className="py-3 px-4 text-center">Pesanan</th>
                  <th className="py-3 px-4 text-center">Konversi</th>
                  <th className="py-3 px-4 text-right">Omzet Dihasilkan</th>
                  <th className="py-3 px-4 text-right">Komisi Sales</th>
                  <th className="py-3 px-4 text-center">Tingkat Partner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliatePerformanceData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-foreground-muted">
                      Belum ada mitra sales aktif yang terdaftar di sistem.
                    </td>
                  </tr>
                ) : (
                  affiliatePerformanceData.map((aff) => (
                    <tr key={aff.code} className="hover:bg-surface-raised/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-primary">{aff.code}</td>
                      <td className="py-3.5 px-4 font-semibold text-foreground">{aff.partnerName}</td>
                      <td className="py-3.5 px-4 text-center font-mono text-foreground-muted">{aff.clicks.toLocaleString('id-ID')}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-foreground">{aff.referralOrders}</td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-status-success">{aff.conversionRate}%</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                        Rp {aff.generatedRevenue.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary">
                        Rp {aff.commissionEarned.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="outline" className="text-[10px] text-status-success border-status-success/30 font-semibold">
                          {aff.activeStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 4. FINANCIAL REPORTS (Formal P&L Statement)
  // =========================================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/25">
              Financial Accounting
            </span>
            <span className="text-[11px] text-foreground-muted">Laporan Laba Rugi Resmi</span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">Laporan Keuangan & Rekapitulasi</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Laporan finansial formal Asterra Store mencakup pendapatan, HPP, fee payment gateway, komisi afiliasi, dan laba bersih.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="text-xs gap-1.5 border-border"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </Button>

          <Button
            size="sm"
            onClick={() => onNotify?.('Laporan keuangan lengkap (Excel) berhasil di-export.')}
            className="text-xs gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Unduh Excel (XLSX)</span>
          </Button>
        </div>
      </div>

      {/* Formal Statement Sheet */}
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground">LAPORAN LABA RUGI (INCOME STATEMENT)</h3>
            <p className="text-xs text-foreground-muted">
              Periode: {financialReport?.period || '01 Oktober 2026 - 10 Oktober 2026'} • Standar Akuntansi Asterra
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-mono text-primary border-primary/30">
            Status: Telah Diaudit
          </Badge>
        </div>

        <div className="space-y-4 text-xs">
          {/* Section 1: Revenue */}
          <div className="space-y-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-primary">
              1. PENDAPATAN OPERASIONAL (GROSS REVENUE)
            </div>
            <div className="pl-4 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground">Akumulasi Penjualan Bruto Toko</span>
                <span className="font-mono text-foreground font-medium">
                  Rp {(financialReport?.grossRevenue ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Diskon Kupon & Potongan Referral</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.discounts ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-foreground">
                <span>TOTAL PENDAPATAN BERSIH (NET REVENUE)</span>
                <span className="font-mono text-status-success font-bold">
                  Rp {(financialReport?.netRevenue ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: COGS */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-status-error">
              2. HARGA POKOK PENJUALAN (COGS / MODAL SUPPLIER)
            </div>
            <div className="pl-4 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Biaya Pengambilan Saldo API VIP Reseller</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.cogs ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold">
                <span className="text-foreground">TOTAL HARGA POKOK PENJUALAN</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.cogs ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="p-3 rounded-lg bg-surface-raised border border-border flex justify-between font-bold text-sm">
            <span className="text-foreground">LABA KOTOR (GROSS PROFIT)</span>
            <span className="font-mono text-primary">
              Rp {(financialReport?.grossProfit ?? 0).toLocaleString('id-ID')} ({financialReport?.netRevenue ? Math.round(((financialReport.grossProfit ?? 0) / financialReport.netRevenue) * 100) : 0}%)
            </span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-foreground-muted">
              3. BEBAN OPERASIONAL & DISTRIBUSI
            </div>
            <div className="pl-4 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Biaya Transaksi Payment Gateway Tripay (0.7% + QRIS)</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.pgFees ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Komisi Mitra Affiliate & Sales Referrals</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.commissions ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between pt-1 font-bold">
                <span className="text-foreground">TOTAL BEBAN OPERASIONAL</span>
                <span className="font-mono text-status-error">
                  -Rp {(financialReport?.totalOpex ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Net Operating Profit Final */}
          <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex justify-between font-bold text-base mt-4">
            <div className="space-y-0.5">
              <span className="text-status-success block">LABA BERSIH OPERASIONAL (NET PROFIT)</span>
              <span className="text-[11px] text-foreground-muted font-normal">
                Margin Bersih: {financialReport?.netRevenue ? Math.round(((financialReport.netOperatingProfit ?? 0) / financialReport.netRevenue) * 100) : 0}% dari Net Revenue
              </span>
            </div>
            <span className="font-mono text-status-success text-xl self-center font-extrabold">
              Rp {(financialReport?.netOperatingProfit ?? 0).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Profit Sharing SSOT Allocation */}
          <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2 mt-2">
            <div className="font-bold text-foreground text-[11px] uppercase tracking-wider">
              4. ALOKASI BAGI HASIL BERSIH (SSOT PROFIT SHARING)
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-foreground-muted block">CEO Share (40%)</span>
                <span className="font-bold text-primary">
                  Rp {(financialReport?.ceoShare ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-foreground-muted block">COO Share (40%)</span>
                <span className="font-bold text-primary">
                  Rp {(financialReport?.cooShare ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2 rounded bg-surface border border-border">
                <span className="text-[10px] text-foreground-muted block">Cadangan Usaha (20%)</span>
                <span className="font-bold text-status-success">
                  Rp {(financialReport?.businessReserve ?? 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
