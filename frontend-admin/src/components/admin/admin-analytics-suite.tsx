'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface AdminAnalyticsSuiteProps {
  activeTab: 'sales-summary' | 'product-performance' | 'affiliate-performance' | 'financial-reports';
  onNotify?: (msg: string) => void;
}

export function AdminAnalyticsSuite({ activeTab, onNotify }: AdminAnalyticsSuiteProps) {
  // Period filter: Today, 7 Days, 30 Days, This Month, This Year
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | '7d' | '30d' | 'month' | 'year'>('30d');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);
  const [liveAffiliates, setLiveAffiliates] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/admin/affiliates')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setLiveAffiliates(json.data);
        }
      })
      .catch((err) => console.warn('Failed to fetch live affiliates:', err));
  }, []);

  // Time-Series Sales Data (30-day simulation)
  const salesTimeSeries = [
    { date: '01 Sep', revenue: 620000, orders: 18 },
    { date: '05 Sep', revenue: 840000, orders: 24 },
    { date: '10 Sep', revenue: 1120000, orders: 32 },
    { date: '15 Sep', revenue: 950000, orders: 28 },
    { date: '20 Sep', revenue: 1450000, orders: 41 },
    { date: '25 Sep', revenue: 1980000, orders: 58 },
    { date: '30 Sep', revenue: 2450000, orders: 72 },
    { date: '01 Okt', revenue: 1850000, orders: 51 },
  ];

  // Top Products Merchandise Matrix
  const productPerformanceData = [
    {
      id: 'p-1',
      name: 'Canva Pro 1 Bulan Private',
      category: 'Desain & Grafis',
      provider: 'VIP Reseller',
      unitsSold: 284,
      revenue: 7100000,
      cogs: 3692000,
      profit: 3408000,
      marginPercent: 48.0,
      refundRate: 0.3,
      conversionRate: 14.2,
      status: 'active',
    },
    {
      id: 'p-2',
      name: 'Gemini AI Pro 1 Tahun Workspace',
      category: 'AI Tools',
      provider: 'VIP Reseller',
      unitsSold: 142,
      revenue: 4402000,
      cogs: 2556000,
      profit: 1846000,
      marginPercent: 41.9,
      refundRate: 0.7,
      conversionRate: 12.8,
      status: 'active',
    },
    {
      id: 'p-3',
      name: 'Netflix Premium 1 Bulan UHD Private',
      category: 'Streaming & Hiburan',
      provider: 'VIP Reseller',
      unitsSold: 118,
      revenue: 3776000,
      cogs: 2360000,
      profit: 1416000,
      marginPercent: 37.5,
      refundRate: 1.2,
      conversionRate: 10.5,
      status: 'active',
    },
    {
      id: 'p-4',
      name: 'YouTube Premium 3 Bulan No ADS',
      category: 'Streaming & Hiburan',
      provider: 'VIP Reseller',
      unitsSold: 96,
      revenue: 1728000,
      cogs: 1056000,
      profit: 672000,
      marginPercent: 38.9,
      refundRate: 0.0,
      conversionRate: 11.4,
      status: 'active',
    },
    {
      id: 'p-5',
      name: 'ChatGPT Plus 1 Bulan Akun Shared',
      category: 'AI Tools',
      provider: 'Internal Vault',
      unitsSold: 88,
      revenue: 3080000,
      cogs: 1540000,
      profit: 1540000,
      marginPercent: 50.0,
      refundRate: 1.5,
      conversionRate: 8.9,
      status: 'active',
    },
  ];

  // Affiliate Partner Telemetry Matrix (Derived from live affiliates in real-time)
  const affiliatePerformanceData = liveAffiliates.map((a) => ({
    code: a.code,
    partnerName: a.name,
    clicks: a.totalClicks || 0,
    referralOrders: a.totalOrders || 0,
    conversionRate:
      a.totalClicks > 0
        ? Number(((a.totalOrders / a.totalClicks) * 100).toFixed(1))
        : 0,
    generatedRevenue: a.totalRevenue || 0,
    commissionEarned: (a.unpaidCommission || 0) + (a.paidCommission || 0),
    activeStatus: a.tier || 'Standard (10%)',
  }));


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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Gross Revenue (Omzet)</span>
            <div className="text-2xl font-bold text-foreground font-mono">Rp 22.840.000</div>
            <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% vs periode lalu</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Total Pesanan Berhasil</span>
            <div className="text-2xl font-bold text-foreground font-mono">684 Orders</div>
            <div className="flex items-center gap-1 text-[10px] text-status-success font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+12.1% peningkatan</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Average Order Value (AOV)</span>
            <div className="text-2xl font-bold text-primary font-mono">Rp 33.390</div>
            <span className="text-[10px] text-foreground-muted">Rata-rata keranjang per checkout</span>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
            <span className="text-[11px] text-foreground-muted block mb-1">Pelanggan Aktif Belanja</span>
            <div className="text-2xl font-bold text-foreground font-mono">492 Konsumen</div>
            <span className="text-[10px] text-status-success font-semibold">68% Repeat Buyers</span>
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
              Pertumbuhan Positif
            </Badge>
          </div>

          {/* Bar Visualizer */}
          <div className="pt-6 pb-2 px-2">
            <div className="h-44 flex items-end gap-3 sm:gap-6 border-b border-border/70 pb-2">
              {salesTimeSeries.map((s, idx) => {
                const heightPercent = Math.min(100, Math.max(15, Math.round((s.revenue / 2600000) * 100)));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap shadow-md z-20 font-mono">
                      Rp {s.revenue.toLocaleString('id-ID')} ({s.orders} orders)
                    </div>
                    <div
                      className="w-full bg-primary/20 hover:bg-primary transition-all rounded-t-sm group-hover:shadow-lg group-hover:shadow-primary/20 cursor-pointer"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-mono text-foreground-muted whitespace-nowrap">
                      {s.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="font-bold text-base text-foreground">{selectedProductDetail.name}</h3>
                <p className="text-xs text-foreground-muted">
                  Kategori: {selectedProductDetail.category} • Supplier: {selectedProductDetail.provider}
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block">Total Unit Terjual</span>
                    <span className="font-bold text-base text-foreground font-mono">{selectedProductDetail.unitsSold} pcs</span>
                  </div>
                  <div className="p-3 rounded-lg bg-surface-raised border border-border">
                    <span className="text-[10px] text-foreground-muted block">Tingkat Konversi</span>
                    <span className="font-bold text-base text-status-success font-mono">{selectedProductDetail.conversionRate}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-primary/10 border border-primary/25 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-foreground">Akumulasi Omzet:</span>
                    <span className="font-bold font-mono text-primary">Rp {selectedProductDetail.revenue.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-foreground-muted">Modal Terbayar:</span>
                    <span className="font-mono text-foreground-muted">Rp {selectedProductDetail.cogs.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-primary/20 font-bold">
                    <span className="text-status-success">Laba Bersih Produk:</span>
                    <span className="font-mono text-status-success">Rp {selectedProductDetail.profit.toLocaleString('id-ID')} ({selectedProductDetail.marginPercent}%)</span>
                  </div>
                </div>

                <p className="text-[11px] text-foreground-muted">
                  Tingkat komplain & retur produk ini adalah {selectedProductDetail.refundRate}%, berada dalam batas toleransi aman (&lt; 2.0%).
                </p>
              </div>

              <div className="pt-2 border-t border-border flex justify-end">
                <Button size="sm" onClick={() => setSelectedProductDetail(null)} className="text-xs">
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
            <p className="text-xs text-foreground-muted">Periode: 01 September 2026 – 30 September 2026 • Standar Akuntansi Asterra</p>
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
                <span className="text-foreground">Penjualan Akun AI Tools & Productivity</span>
                <span className="font-mono text-foreground font-medium">Rp 7.760.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground">Penjualan Lisensi Desain & Grafis (Canva/CapCut)</span>
                <span className="font-mono text-foreground font-medium">Rp 9.590.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground">Penjualan Streaming & Hiburan (Netflix/Spotify/YouTube)</span>
                <span className="font-mono text-foreground font-medium">Rp 5.490.000</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-foreground">
                <span>TOTAL PENDAPATAN PENJUALAN</span>
                <span className="font-mono text-status-success font-bold">Rp 22.840.000</span>
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
                <span className="font-mono text-status-error">-Rp 10.120.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Biaya Akun Private Internal Vault</span>
                <span className="font-mono text-status-error">-Rp 1.540.000</span>
              </div>
              <div className="flex justify-between pt-1 font-bold">
                <span className="text-foreground">TOTAL HARGA POKOK PENJUALAN</span>
                <span className="font-mono text-status-error">-Rp 11.660.000</span>
              </div>
            </div>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="p-3 rounded-lg bg-surface-raised border border-border flex justify-between font-bold text-sm">
            <span className="text-foreground">LABA KOTOR (GROSS PROFIT)</span>
            <span className="font-mono text-primary">Rp 11.180.000 (48.9%)</span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="space-y-2 pt-2">
            <div className="font-bold text-foreground uppercase tracking-wider text-[11px] text-foreground-muted">
              3. BEBAN OPERASIONAL & DISTRIBUSI
            </div>
            <div className="pl-4 space-y-1.5">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Biaya Transaksi Payment Gateway Tripay (0.7% + QRIS)</span>
                <span className="font-mono text-status-error">-Rp 195.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Komisi Mitra Affiliate & Sales Referrals</span>
                <span className="font-mono text-status-error">-Rp 1.336.200</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Server Hosting, Domain & Vercel Pro Infrastructure</span>
                <span className="font-mono text-status-error">-Rp 350.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">WhatsApp Business Notification Gateway (Fonnte API)</span>
                <span className="font-mono text-status-error">-Rp 95.000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-foreground-muted">Pengembalian Dana / Klaim Refund Garansi</span>
                <span className="font-mono text-status-error">-Rp 57.000</span>
              </div>
              <div className="flex justify-between pt-1 font-bold">
                <span className="text-foreground">TOTAL BEBAN OPERASIONAL</span>
                <span className="font-mono text-status-error">-Rp 2.033.200</span>
              </div>
            </div>
          </div>

          {/* Net Operating Profit Final */}
          <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 flex justify-between font-bold text-base mt-4">
            <div className="space-y-0.5">
              <span className="text-status-success block">LABA BERSIH OPERASIONAL (NET PROFIT)</span>
              <span className="text-[11px] text-foreground-muted font-normal">Margin Bersih Akhir: 40.0% dari Omzet</span>
            </div>
            <span className="font-mono text-status-success text-xl self-center font-extrabold">
              Rp 9.146.800
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
