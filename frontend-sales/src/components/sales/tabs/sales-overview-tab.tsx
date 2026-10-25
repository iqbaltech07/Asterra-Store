'use client';

import React, { useMemo } from 'react';
import {
  Wallet,
  ShoppingBag,
  Users,
  Coins,
  Clock,
  Zap,
  Flame,
  Share2,
  Award,
  Package,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { SalesTrendChart } from '../sales-trend-chart';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';
import type { SalesProfileData, NetworkDataResponse, SalesOrder, ProductItem } from '../types';

export interface CampaignTeaserItem {
  id: string;
  name: string;
  boosterCommissionRate: number;
}

export interface SalesOverviewTabProps {
  partner: SalesProfileData | null | undefined;
  partnerCode: string;
  partnerRate: number;
  userName?: string;
  copiedLink: string | null;
  handleCopy: (text: string, id: string) => void;
  onTabChange?: (tab: AdminTab) => void;
  networkData?: NetworkDataResponse | null;
  isProfileLoading?: boolean;
  inviteSalesUrl: string;
  campaigns?: CampaignTeaserItem[];
  orders?: SalesOrder[];
  products?: ProductItem[];
}

export function SalesOverviewTab({
  partner,
  partnerCode,
  partnerRate,
  copiedLink,
  handleCopy,
  onTabChange,
  networkData,
  inviteSalesUrl,
  orders = [],
  products = [],
}: SalesOverviewTabProps) {
  const referralUrl = `${getStoreBaseUrl()}/?ref=${partnerCode || 'AST-SALES'}`;

  // Conversion rate calculation
  const conversionRate = useMemo(() => {
    if (!partner || !partner.totalClicks || partner.totalClicks === 0) return '0.0%';
    const rate = ((partner.totalOrders || 0) / partner.totalClicks) * 100;
    return `${rate.toFixed(1)}%`;
  }, [partner]);

  // Actual Sales KPI Metrics
  const unpaidCommissionVal = partner?.unpaidCommission ?? 0;
  const totalOrdersVal = partner?.totalOrders ?? 0;
  const totalClicksVal = partner?.totalClicks ?? 0;
  const totalCommissionVal = partner?.totalCommission ?? 0;
  const pendingCommissionVal = partner?.pendingCommission ?? 0;
  const totalSalesAmountVal = partner?.totalSalesAmount ?? 0;
  const paidCommissionVal = partner?.paidCommission ?? 0;

  // Recent referral orders fallback if list is empty
  const sampleReferralOrders = [
    {
      id: 'AST-ORD-20261024-9692',
      customer: 'Pembeli',
      time: '24 Okt 2026, 14:16',
      product: 'Netflix Premium Shared 30 Hari',
      method: 'QRIS',
      total: 17000,
      commission: 1700,
      status: 'Selesai',
    },
    {
      id: 'AST-ORD-20261023-9398',
      customer: 'Pembeli',
      time: '23 Okt 2026, 20:10',
      product: 'Google Gemini Pro Anggota 1 Tahun',
      method: 'QRIS',
      total: 95700,
      commission: 9570,
      status: 'Selesai',
    },
    {
      id: 'AST-ORD-20261023-1945',
      customer: 'Pembeli',
      time: '23 Okt 2026, 20:04',
      product: 'CapCut Pro Private 7 Hari',
      method: 'QRIS',
      total: 41700,
      commission: 4170,
      status: 'Selesai',
    },
  ];

  const recentOrders = orders.length > 0
    ? orders.slice(0, 5).map((o) => ({
        id: o.id,
        customer: o.customerName || 'Pembeli',
        time: o.createdAt || 'Baru saja',
        product: o.productNames || 'Produk Digital',
        method: o.paymentStatus || 'QRIS',
        total: o.totalAmount || 0,
        commission: o.commission || Math.round((o.totalAmount || 0) * (partnerRate / 100)),
        status: o.status === 'completed' || o.status === 'success' ? 'Selesai' : 'Diproses',
      }))
    : sampleReferralOrders;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-up">
      {/* 1. TOP SALES HIGHLIGHT BANNERS (Design matching Screenshot 100%) */}
      <div className="space-y-2.5">
        {/* Banner 1: Metallic Slate with Exact Luminous Sheen motif kilau-kilau */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-white/15 text-white"
          style={{
            background:
              'linear-gradient(108deg, #252E3E 0%, #303B4E 24%, #455571 45%, #506385 52%, #38465D 70%, #222937 100%)',
          }}
        >
          {/* Motif Kilau-Kilau Luminous Sheen Beams */}
          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              background:
                'linear-gradient(116deg, transparent 18%, rgba(255,255,255,0.02) 28%, rgba(255,255,255,0.14) 44%, rgba(255,255,255,0.26) 50%, rgba(255,255,255,0.06) 56%, transparent 74%)',
            }}
          />
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-300/[0.12] to-transparent pointer-events-none" />
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-amber-400/[0.08] rounded-full blur-2xl pointer-events-none" />

          {/* Left Content: Circular Glass Badge & Sales Program Info */}
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
            {/* Circular Glass Badge */}
            <div className="w-11 h-11 rounded-full bg-[#3B4A64]/70 border border-white/25 shadow-inner backdrop-blur-md flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-amber-400 stroke-[1.8]" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Program Kemitraan Sales — Komisi {partnerRate}% Per Transaksi
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-200 mt-0.5 leading-tight">
                Bagikan link referral Anda{' '}
                <strong className="text-white font-bold">{partnerCode}</strong> untuk
                mendapatkan bagi hasil komisi {partnerRate}% otomatis dari setiap pesanan sukses.
              </p>
            </div>
          </div>

          {/* Right Action: Quick Copy Link & Generator Button */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 relative z-10">
            <button
              type="button"
              onClick={() => handleCopy(referralUrl, 'ref-banner-link')}
              className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              title="Salin Link Referral"
            >
              {copiedLink === 'ref-banner-link' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Link Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>Link: {partnerCode}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('sales-links')}
              className="px-4 py-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Generator Tautan</span>
              <span className="text-[11px]">→</span>
            </button>
          </div>
        </div>

        {/* Banner 2: Soft Rose Milestone Tier Booster Banner */}
        <div className="rounded-2xl bg-[#FFF1F2] border border-rose-200/90 p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Target Milestone Tier VIP — Komisi Naik ke 15%
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                Tingkatkan omzet referral Anda! Capai target 50 transaksi sukses untuk otomatis menaikkan komisi dari {partnerRate}% menjadi{' '}
                <strong className="text-rose-600 font-bold">15% Profit Transaksi</strong>{' '}
                (Progres: {partner?.tierProgress?.currentOrders || totalOrdersVal}/50 order).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('sales-catalog')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-300 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer"
          >
            <span>Katalog Promosi ({products.length || 230}+)</span>
            <span className="text-[10px]">→</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE METRIC CARDS ROW (Exact same executive layout & sparklines, with Sales Metrics!) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Saldo Siap Tarik */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A36A] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Saldo Siap Tarik</span>
              </div>
              {/* Upward Emerald Sparkline */}
              <svg className="w-7 h-4 text-emerald-500" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L8 10L15 12L22 4L27 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2H27V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Rp {unpaidCommissionVal.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#16A36A] font-medium">
            <span>↑</span>
            <span>Siap ditransfer ke Rekening</span>
          </div>
        </div>

        {/* Card 2: Pesanan Referral */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Pesanan Referral</span>
              </div>
              {/* Upward Indigo Sparkline */}
              <svg className="w-7 h-4 text-indigo-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 13L8 11L15 13L21 6L27 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 3H27V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              {totalOrdersVal}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Total Omzet: Rp {totalSalesAmountVal.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Card 3: Klik & Kunjungan Link */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Klik &amp; Kunjungan</span>
              </div>
              {/* Upward Sky Blue Sparkline */}
              <svg className="w-7 h-4 text-sky-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L9 11L15 13L21 7L27 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2H27V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              {totalClicksVal}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#0284C7] font-medium">
            <span>↑</span>
            <span>Rasio Konversi: {conversionRate}</span>
          </div>
        </div>

        {/* Card 4: Total Akumulasi Komisi */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Komisi</span>
              </div>
              {/* Upward Amber Sparkline */}
              <svg className="w-7 h-4 text-amber-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L8 12L15 13L21 8L27 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4H27V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Rp {totalCommissionVal.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Telah Dicairkan: Rp {paidCommissionVal.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Card 5: Komisi Garansi (3 Hari) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all col-span-2 sm:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Komisi Garansi</span>
              </div>
              {/* Upward Purple Sparkline */}
              <svg className="w-7 h-4 text-purple-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L8 11L16 13L22 6L27 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2H27V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Rp {pendingCommissionVal.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-purple-600 font-medium">
            Masa proteksi garansi order
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN SPLIT (Exact layout match: Left 8 cols, Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: 8 Columns */}
        <div className="lg:col-span-8 space-y-5">
          {/* Sales Performance & Commission Chart */}
          <SalesTrendChart
            title="Grafik Performa Penjualan & Komisi Sales"
            subtitle="Pergerakan omzet referral dan estimasi komisi Anda berdasarkan periode waktu"
            legendLabel="Komisi Referral Terverifikasi"
            orders={orders}
            partnerRate={partnerRate}
            totalCommission={totalCommissionVal}
            onNavigateAnalytics={() => onTabChange && onTabChange('sales-orders')}
          />

          {/* Aktivitas Pesanan Referral Terbaru Table Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                  <Zap className="w-4 h-4 fill-slate-800" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    Aktivitas Pesanan Referral Terbaru
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">
                    Daftar transaksi yang masuk melalui tautan referral atau kupon Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('sales-orders')}
                className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Lihat Seluruh Pesanan</span>
                <span>→</span>
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 font-medium">Order ID &amp; Waktu</th>
                    <th className="py-2.5 font-medium">Produk</th>
                    <th className="py-2.5 font-medium">Total Belanja</th>
                    <th className="py-2.5 font-medium">Komisi Anda</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3">
                        <div className="font-bold text-slate-900 font-mono text-xs">
                          {order.id}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {order.customer} • {order.time}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <ProductBrandIcon name={order.product} className="w-6 h-6 rounded-full" />
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {order.product}
                            </div>
                            <div className="text-[10px] text-slate-400">Produk Digital</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-semibold text-slate-900 text-xs font-mono">
                        Rp {order.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 font-bold text-emerald-600 text-xs font-mono">
                        +Rp {order.commission.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Columns (Produk Rekomendasi & Bonus Tim) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Produk Rekomendasi Promosi (Komisi Tertinggi) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Produk Komisi Tertinggi</h3>
              </div>
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('sales-catalog')}
                className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Semua Produk</span>
                <span>→</span>
              </button>
            </div>

            {/* List of 3 Recommended High-Commission Products */}
            <div className="space-y-3 pt-1">
              {/* Product 1: Google Gemini Pro */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center shrink-0">1</span>
                  <ProductBrandIcon name="Google Gemini Pro" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      Google Gemini Pro Anggota 1...
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      Estimasi Komisi: Rp 9.570/order
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 95.700
                </div>
              </div>

              {/* Product 2: CapCut Pro */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center shrink-0">2</span>
                  <ProductBrandIcon name="CapCut Pro" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      CapCut Pro Private 7 Hari
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      Estimasi Komisi: Rp 4.170/order
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 41.700
                </div>
              </div>

              {/* Product 3: YouTube Premium */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center shrink-0">3</span>
                  <ProductBrandIcon name="YouTube Premium" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      YouTube Premium Family 1 Bulan
                    </h4>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                      Estimasi Komisi: Rp 1.880/order
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 18.800
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Bonus Tim & Rekrutmen Mitra (1-Level Referral) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Bonus Tim &amp; Teman Sales</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                {networkData?.summary?.totalDownlines || networkData?.teamMembers?.length || 0} Mitra
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Total Teman Diajak</span>
                <span className="font-bold text-slate-900 font-mono">
                  {networkData?.summary?.totalDownlines || networkData?.teamMembers?.length || 0} Mitra
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Bonus Pasif Tim (2%)</span>
                <span className="font-bold text-emerald-600 font-mono">
                  Rp {(networkData?.totalNetworkBonus || networkData?.summary?.totalEarnedCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Tingkat Komisi Anda</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {partnerRate}% Profit Bersih
                </span>
              </div>
            </div>

            {/* Blue Notice Callout for Sales Partner */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] text-blue-900 leading-tight">
                  Ajak teman Anda jadi mitra sales &amp; nikmati bonus pasif 2% profit dari setiap order mereka.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (inviteSalesUrl) handleCopy(inviteSalesUrl, 'invite-sales');
                  if (onTabChange) onTabChange('sales-network');
                }}
                className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
              >
                <span>Ajak Teman</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
