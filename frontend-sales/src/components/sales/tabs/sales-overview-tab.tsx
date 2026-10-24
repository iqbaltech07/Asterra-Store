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
  Crown,
  Package,
  Copy,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SalesTrendChart } from '../sales-trend-chart';
import { AdminTab } from '@/components/admin/admin-sidebar';
import { getStoreBaseUrl } from '@/lib/utils/url';
import type { SalesProfileData, NetworkDataResponse } from '../types';

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
}

export function SalesOverviewTab({
  partner,
  partnerCode,
  partnerRate,
  userName = 'Super Admin',
  copiedLink,
  handleCopy,
  onTabChange,
  networkData,
  isProfileLoading = false,
  inviteSalesUrl,
  campaigns,
}: SalesOverviewTabProps) {
  const referralUrl = `${getStoreBaseUrl()}/?ref=${partnerCode || 'ASTERRASALES'}`;

  // Metrics calculation
  const unpaidCommissionVal = partner?.unpaidCommission ?? 132090;
  const totalOrdersVal = partner?.totalOrders ?? 10;
  const totalClicksVal = partner?.totalClicks ?? 4;
  const grossProfitVal = partner?.totalCommission ?? 64590;
  const pendingOrdersVal = partner?.pendingCommission ? Math.round(partner.pendingCommission / 10000) : 0;

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-up">
      {/* 1. TOP ALERT BANNERS (Matching Screenshot) */}
      <div className="space-y-2.5">
        {/* Banner 1: Dark metallic VIP Saldo Alert */}
        <div className="rounded-2xl bg-gradient-to-r from-[#202738] via-[#2D3748] to-[#1E2433] text-white p-3.5 sm:px-5 sm:py-3.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-400/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                Perhatian Saldo Supplier VIP Reseller
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-tight">
                Saldo deposit saat ini adalah{' '}
                <strong className="text-white font-semibold">Rp 5.979</strong>. Jika saldo
                habis, pemesanan otomatis upstream akan tertunda.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => handleCopy(referralUrl, 'ref-banner-link')}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
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
                  <span>Link: {partnerCode || 'ASTERRASALES'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('providers')}
              className="px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white font-semibold text-xs border border-slate-600/80 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Cek Provider VIP</span>
              <span className="text-[10px]">→</span>
            </button>
          </div>
        </div>

        {/* Banner 2: Soft Rose Stock Alert */}
        <div className="rounded-2xl bg-[#FFF1F2] border border-rose-200/90 p-3.5 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-rose-500 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                Stok Upstream Kosong
              </h4>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-tight">
                Terdapat <strong className="text-rose-600 font-bold">15 produk</strong> di katalog toko yang stoknya saat ini kosong di gateway supplier.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTabChange && onTabChange('sales-catalog')}
            className="px-3.5 py-1.5 rounded-full bg-white hover:bg-rose-50 text-rose-600 font-semibold text-xs border border-rose-300 transition-all flex items-center gap-1.5 self-start sm:self-auto shrink-0 shadow-2xs cursor-pointer"
          >
            <span>Tinjau Katalog (15)</span>
            <span className="text-[10px]">→</span>
          </button>
        </div>
      </div>

      {/* 2. FIVE METRIC CARDS ROW (Exact match to Screenshot) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Revenue */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Revenue</span>
              </div>
              {/* Upward Blue Sparkline */}
              <svg className="w-7 h-4 text-blue-500" viewBox="0 0 28 16" fill="none">
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
            <span>Terverifikasi Sistem</span>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Total Orders</span>
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
            7 Selesai diproses
          </div>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#16A36A] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Customers</span>
              </div>
              {/* Upward Emerald Sparkline */}
              <svg className="w-7 h-4 text-emerald-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L9 11L15 13L21 7L27 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2H27V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              {totalClicksVal}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-[#16A36A] font-medium">
            <span>↑</span>
            <span>3 pelanggan terdata</span>
          </div>
        </div>

        {/* Card 4: Gross Profit */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Gross Profit</span>
              </div>
              {/* Upward Amber Sparkline */}
              <svg className="w-7 h-4 text-amber-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L8 12L15 13L21 8L27 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 4H27V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              Rp {grossProfitVal.toLocaleString('id-ID')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            Estimasi Margin 48.9%
          </div>
        </div>

        {/* Card 5: Pending Orders */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-all col-span-2 sm:col-span-1">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-500">Pending Orders</span>
              </div>
              {/* Upward Sky Blue Sparkline */}
              <svg className="w-7 h-4 text-sky-400" viewBox="0 0 28 16" fill="none">
                <path d="M1 14L8 11L16 13L22 6L27 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2H27V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="mt-3 text-xl lg:text-2xl font-black text-slate-900 tracking-tight font-sans">
              {pendingOrdersVal}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-amber-600 font-medium">
            Menunggu pembayaran
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN SPLIT (Exact match: Left 8 cols, Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: 8 Columns */}
        <div className="lg:col-span-8 space-y-5">
          {/* Chart Card */}
          <SalesTrendChart />

          {/* Aktivitas Transaksi Terbaru Card (Exact match to Screenshot) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                  <Zap className="w-4 h-4 fill-slate-800" />
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
                onClick={() => onTabChange && onTabChange('orders')}
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
                    <th className="py-2.5 font-medium">Order ID &amp; Pembeli</th>
                    <th className="py-2.5 font-medium">Produk</th>
                    <th className="py-2.5 font-medium">Metode</th>
                    <th className="py-2.5 font-medium">Total</th>
                    <th className="py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3">
                      <div className="font-bold text-slate-900 font-mono text-xs">
                        AST-ORD-20261022-7223
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Pelanggan • 22 Okt 2026, 08:42
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {/* Google Logo */}
                        <div className="w-6 h-6 rounded-md bg-white border border-slate-200/80 p-0.5 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 text-xs">
                            Google Gemini Pro Anggota 1 Tahun
                          </div>
                          <div className="text-[10px] text-slate-400">Produk Digital</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 font-medium text-slate-600 text-xs">QRIS</td>
                    <td className="py-3 font-semibold text-slate-900 text-xs">Rp 95.700</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                        Selesai
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 4 Columns (Produk Terlaris & Performa Affiliate Sales) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Card 1: Produk Terlaris (Exact match to Screenshot) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-orange-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Produk Terlaris</h3>
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

            {/* List of 3 Products */}
            <div className="space-y-3 pt-1">
              {/* Product 1: Google Gemini Pro */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center">1</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      Google Gemini Pro Anggota 1 Tahun (5 TB ...
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      3 unit terjual • Produk Digital
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 95.700
                </div>
              </div>

              {/* Product 2: CapCut Pro */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center">2</span>
                  <div className="w-8 h-8 rounded-lg bg-black text-white p-1 flex items-center justify-center shrink-0">
                    {/* Capcut Logo Representation */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M4 6.5C4 5.12 5.12 4 6.5 4h2.2l3.3 5-3.3 5H6.5C5.12 14 4 12.88 4 11.5v-5zm16 0c0-1.38-1.12-2.5-2.5-2.5h-2.2l-3.3 5 3.3 5h2.2c1.38 0 2.5-1.12 2.5-2.5v-5zM6.5 16h2.2l3.3-5 3.3 5h2.2c1.38 0 2.5 1.12 2.5 2.5v1c0 1.38-1.12 2.5-2.5 2.5h-11C5.12 22 4 20.88 4 19.5v-1C4 17.12 5.12 16 6.5 16z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      CapCut Pro Private 7 Hari (Garansi 5 Hari)
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      3 unit terjual • Produk Digital
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 41.700
                </div>
              </div>

              {/* Product 3: YouTube Premium */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-400 w-3 text-center">3</span>
                  <div className="w-8 h-8 rounded-lg bg-red-600 text-white p-1 flex items-center justify-center shrink-0">
                    {/* YouTube Logo Representation */}
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M21.58 7.19a2.5 2.5 0 00-1.76-1.77C18.26 5 12 5 12 5s-6.26 0-7.82.42A2.5 2.5 0 002.42 7.2C2 8.76 2 12 2 12s0 3.24.42 4.81a2.5 2.5 0 001.76 1.77C5.74 19 12 19 12 19s6.26 0 7.82-.42a2.5 2.5 0 001.76-1.77C22 15.24 22 12 22 12s0-3.24-.42-4.81zM10 15V9l5.2 3-5.2 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                      YouTube Premium Family Anggota 1 Bulan...
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      1 unit terjual • Produk Digital
                    </p>
                  </div>
                </div>
                <div className="font-bold text-xs text-slate-900 shrink-0 font-mono">
                  Rp 18.800
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Performa Affiliate Sales (Exact match to Screenshot) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Performa Affiliate Sales</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                7 Mitra
              </span>
            </div>

            <div className="space-y-2 text-xs pt-1">
              <div className="flex items-center justify-between text-slate-500">
                <span>Omzet via Referral</span>
                <span className="font-bold text-slate-900 font-mono">Rp 15.300</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Komisi Terbayar</span>
                <span className="font-bold text-emerald-600 font-mono">Rp 0</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Top Mitra Sales</span>
                <span className="font-medium text-slate-700 truncate max-w-[170px]">
                  Iqbal Sales Pro Max (A...
                </span>
              </div>
            </div>

            {/* Blue Notice Callout matching screenshot */}
            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] sm:text-[11px] text-blue-900 leading-tight">
                  Persentase komisi dan detail mitra dapat dilihat pada halaman Sales.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onTabChange && onTabChange('sales-network')}
                className="text-[11px] font-bold text-blue-600 hover:underline shrink-0 cursor-pointer flex items-center gap-0.5"
              >
                <span>Lihat Sales</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
