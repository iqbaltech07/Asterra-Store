'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Info,
} from 'lucide-react';
import { SalesTrendChart } from '../sales-trend-chart';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { getStoreBaseUrl } from '@/lib/utils/url';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar';
import { SparklinePath } from '@/components/ui/sparkline-path';
import { CopyButton } from '@/components/ui/copy-button';
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
  onTabChange,
  networkData,
  inviteSalesUrl: _inviteSalesUrl,
  orders = [],
  products = [],
}: SalesOverviewTabProps) {
  const referralUrl = `${getStoreBaseUrl()}/?ref=${partnerCode || 'AST-SALES'}`;

  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Actual recent referral orders for this partner
  const recentOrders = useMemo(() => {
    return (orders || []).slice(0, 5).map((o) => ({
      id: o.id,
      customer: o.customerName || 'Pembeli',
      time: o.createdAt
        ? new Date(o.createdAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Baru saja',
      product: o.productNames || 'Produk Digital',
      method: o.paymentStatus || 'QRIS',
      total: o.totalAmount || 0,
      commission: o.commission || Math.round((o.totalAmount || 0) * (partnerRate / 100)),
      status: o.status === 'completed' || o.status === 'success' ? 'Selesai' : 'Diproses',
    }));
  }, [orders, partnerRate]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-up">
      {/* 1. TOP SALES HIGHLIGHT BANNERS */}
      <div className="space-y-2.5">
        {/* Banner 1: Metallic Slate with Luminous Sheen Beam */}
        <div
          className="relative overflow-hidden rounded-2xl p-4 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md border border-white/15 text-white"
          style={{
            background:
              'linear-gradient(108deg, #252E3E 0%, #303B4E 24%, #455571 45%, #506385 52%, #38465D 70%, #222937 100%)',
          }}
        >
          {/* Ambient Slow Sheen Loop */}
          <div
            className="absolute inset-0 pointer-events-none select-none animate-metallic-sheen"
            style={{
              background:
                'linear-gradient(116deg, transparent 20%, rgba(255,255,255,0.02) 30%, rgba(255,255,255,0.12) 48%, rgba(255,255,255,0.22) 52%, rgba(255,255,255,0.05) 58%, transparent 75%)',
            }}
          />
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-300/[0.12] to-transparent pointer-events-none" />
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-amber-400/[0.08] rounded-full blur-2xl pointer-events-none" />

          {/* Left Content: Circular Glass Badge & Sales Program Info */}
          <div className="flex items-center gap-3.5 relative z-10 min-w-0">
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

          {/* Right Action: Reusable CopyButton & Generator Link */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 relative z-10">
            <CopyButton
              text={referralUrl}
              variant="pill"
              label={`Link: ${partnerCode}`}
              copiedLabel="Tersalin!"
              minWidth="120px"
              title="Salin Link Referral"
            />
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('sales-links')}
              className="px-4 py-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold backdrop-blur-md transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Generator Tautan</span>
              <span className="text-[11px]">→</span>
            </button>
          </div>
        </div>

        {/* Banner 2: Soft Rose Milestone Tier Booster Banner with Animated Progress */}
        <div className="rounded-2xl bg-[#FFF1F2] border border-rose-200/90 p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Target Milestone Tier VIP — Komisi Naik ke 15%
                </h4>
                <span className="text-[11px] font-mono font-bold text-rose-600 shrink-0">
                  {partner?.tierProgress?.currentOrders || totalOrdersVal}/50 Order
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                Tingkatkan omzet referral Anda! Capai target 50 transaksi sukses untuk otomatis menaikkan komisi dari {partnerRate}% menjadi{' '}
                <strong className="text-rose-600 font-bold">15% Profit Transaksi</strong>.
              </p>
              {/* Animated Progress Bar */}
              <div className="mt-2 max-w-sm">
                <AnimatedProgressBar
                  value={partner?.tierProgress?.currentOrders || totalOrdersVal}
                  max={50}
                  showShimmer
                  className="h-1.5 bg-rose-100 border-none"
                  barClassName="bg-rose-500"
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('sales-catalog')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 active:scale-95 text-rose-600 font-semibold text-xs border border-rose-300 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer"
          >
            <span>Katalog Promosi ({products.length || 230}+)</span>
            <span className="text-[10px]">→</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE METRIC CARDS ROW (With Staggered Reveal, Count-Up, and Animated SVG Sparklines) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Saldo Siap Tarik */}
        <div
          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between card-hover-elevation animate-kpi-reveal"
          style={{ animationDelay: '0ms' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A36A] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Saldo Siap Tarik</span>
              </div>
              {/* Animated Emerald Sparkline */}
              <SparklinePath
                path={unpaidCommissionVal > 0 ? "M1 14L8 10L15 12L22 4L27 2" : "M1 12L8 12L15 11L21 12L27 12"}
                arrowPath={unpaidCommissionVal > 0 ? "M22 2H27V7" : undefined}
                endDot={{ cx: 27, cy: unpaidCommissionVal > 0 ? 2 : 12 }}
                color="#16A36A"
                gradientId="sparkline-emerald"
                delay={0}
              />
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              <AnimatedNumber
                value={unpaidCommissionVal}
                prefix="Rp "
                delay={0}
                className="font-sans font-black text-slate-900"
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#16A36A] font-medium">
            <span>{unpaidCommissionVal > 0 ? '↑' : '•'}</span>
            <span>Siap ditransfer ke Rekening</span>
          </div>
        </div>

        {/* Card 2: Pesanan Referral */}
        <div
          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between card-hover-elevation animate-kpi-reveal"
          style={{ animationDelay: '60ms' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Pesanan Referral</span>
              </div>
              {/* Animated Indigo Sparkline */}
              <SparklinePath
                path={totalOrdersVal > 0 ? "M1 13L8 11L15 13L21 6L27 3" : "M1 12L8 12L15 11L21 12L27 12"}
                arrowPath={totalOrdersVal > 0 ? "M22 3H27V8" : undefined}
                endDot={{ cx: 27, cy: totalOrdersVal > 0 ? 3 : 12 }}
                color="#6366F1"
                gradientId="sparkline-indigo"
                delay={60}
              />
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              <AnimatedNumber
                value={totalOrdersVal}
                delay={60}
                className="font-sans font-black text-slate-900"
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Total Omzet: Rp {totalSalesAmountVal.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Card 3: Klik & Kunjungan Link */}
        <div
          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between card-hover-elevation animate-kpi-reveal"
          style={{ animationDelay: '120ms' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Klik &amp; Kunjungan</span>
              </div>
              {/* Animated Sky Blue Sparkline */}
              <SparklinePath
                path={totalClicksVal > 0 ? "M1 14L9 11L15 13L21 7L27 2" : "M1 12L8 12L15 11L21 12L27 12"}
                arrowPath={totalClicksVal > 0 ? "M22 2H27V7" : undefined}
                endDot={{ cx: 27, cy: totalClicksVal > 0 ? 2 : 12 }}
                color="#0284C7"
                gradientId="sparkline-sky"
                delay={120}
              />
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              <AnimatedNumber
                value={totalClicksVal}
                delay={120}
                className="font-sans font-black text-slate-900"
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#0284C7] font-medium">
            <span>{totalClicksVal > 0 ? '↑' : '•'}</span>
            <span>Rasio Konversi: {conversionRate}</span>
          </div>
        </div>

        {/* Card 4: Total Akumulasi Komisi */}
        <div
          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between card-hover-elevation animate-kpi-reveal"
          style={{ animationDelay: '180ms' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Komisi</span>
              </div>
              {/* Animated Amber Sparkline */}
              <SparklinePath
                path={totalCommissionVal > 0 ? "M1 14L8 12L15 13L21 8L27 4" : "M1 12L8 12L15 11L21 12L27 12"}
                arrowPath={totalCommissionVal > 0 ? "M22 4H27V9" : undefined}
                endDot={{ cx: 27, cy: totalCommissionVal > 0 ? 4 : 12 }}
                color="#D97706"
                gradientId="sparkline-amber"
                delay={180}
              />
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              <AnimatedNumber
                value={totalCommissionVal}
                prefix="Rp "
                delay={180}
                className="font-sans font-black text-slate-900"
              />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Telah Dicairkan: Rp {paidCommissionVal.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Card 5: Komisi Garansi (3 Hari) */}
        <div
          className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between card-hover-elevation col-span-2 sm:col-span-1 animate-kpi-reveal"
          style={{ animationDelay: '240ms' }}
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-[#8B5CF6] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Komisi Garansi</span>
              </div>
              {/* Animated Purple Sparkline */}
              <SparklinePath
                path={pendingCommissionVal > 0 ? "M1 14L8 11L16 13L22 6L27 2" : "M1 12L8 12L15 11L21 12L27 12"}
                arrowPath={pendingCommissionVal > 0 ? "M22 2H27V7" : undefined}
                endDot={{ cx: 27, cy: pendingCommissionVal > 0 ? 2 : 12 }}
                color="#8B5CF6"
                gradientId="sparkline-purple"
                delay={240}
              />
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              <AnimatedNumber
                value={pendingCommissionVal}
                prefix="Rp "
                delay={240}
                className="font-sans font-black text-slate-900"
              />
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
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-800">Belum Ada Pesanan Referral</p>
                            <p className="text-[11px] text-slate-400 max-w-sm mt-0.5">
                              Tautan referral Anda belum memiliki catatan transaksi. Bagikan link referral Anda untuk mulai menghasilkan komisi!
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => onTabChange && onTabChange('sales-links')}
                            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            Bagikan Tautan Promo
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
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
                    ))
                  )}
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
