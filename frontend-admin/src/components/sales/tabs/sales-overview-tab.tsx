'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Award,
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ArrowRight,
  Package,
  DollarSign,
  ChevronRight,
  ShoppingBag,
  Percent,
  Clock,
  Send,
  Users,
  Flame,
  Link as LinkIcon,
} from 'lucide-react';
import { useGsapReveal } from '@/lib/animations/use-gsap-reveal';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar';
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
  userName = 'Mitra Sales',
  copiedLink,
  handleCopy,
  onTabChange,
  networkData,
  isProfileLoading = false,
  inviteSalesUrl,
  campaigns,
}: SalesOverviewTabProps) {
  const containerRef = useGsapReveal<HTMLDivElement>();
  const referralUrl = `${getStoreBaseUrl()}/?ref=${partnerCode}`;

  const unpaidCommissionVal = partner?.unpaidCommission ?? 0;
  const totalOrdersVal = partner?.totalOrders ?? 0;
  const totalClicksVal = partner?.totalClicks ?? 0;

  const displayUnpaidCommission = useCountUp(unpaidCommissionVal, {
    formatter: (v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`,
  });
  const displayTotalOrders = useCountUp(totalOrdersVal, {
    formatter: (v) => `${Math.round(v).toLocaleString('id-ID')}`,
  });
  const displayTotalClicks = useCountUp(totalClicksVal, {
    formatter: (v) => `${Math.round(v).toLocaleString('id-ID')}`,
  });
  const displayRate = useCountUp(partnerRate, {
    formatter: (v) => `${Math.round(v)}%`,
  });

  const conversionRate = useMemo(() => {
    if (!partner || !partner.totalClicks || partner.totalClicks === 0) return '0.0%';
    const rate = ((partner.totalOrders || 0) / partner.totalClicks) * 100;
    return `${rate.toFixed(1)}%`;
  }, [partner]);

  const handleShare = async (url: string, title: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
  };

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      {/* Welcome & Referral Banner */}
      <div className="animate-fade-up rounded-2xl border border-white/80 bg-surface p-4 sm:p-6 shadow-xs relative overflow-hidden backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 relative z-10">
          <div className="space-y-2 sm:space-y-2.5 max-w-xl">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                partner?.status === 'active'
                  ? 'bg-emerald-50/80 border-emerald-200/80 text-[#16A36A]'
                  : partner?.status === 'suspended'
                  ? 'bg-rose-50/80 border-rose-200/80 text-[#EF4444]'
                  : partner?.status === 'pending'
                  ? 'bg-amber-50/80 border-amber-200/80 text-[#D97706]'
                  : 'bg-gray-100/80 border-border text-foreground-muted'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>
                Status Akun:{' '}
                {partner?.status === 'active'
                  ? `Mitra Aktif (${partner?.tier || 'Standard 15%'})`
                  : partner?.status === 'suspended'
                  ? 'Ditangguhkan (Suspended)'
                  : partner?.status === 'pending'
                  ? 'Menunggu Verifikasi (Pending Review)'
                  : 'Non-Aktif'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-[#10213D] tracking-tight">
              Halo, {partner?.name || userName}!
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Bagikan link referral Anda untuk mendapatkan bagi hasil komisi{' '}
              <strong className="text-foreground font-semibold">{partnerRate}% dari Profit Transaksi</strong> bersih (otomatis naik ke 20% setelah 50 transaksi tercapai).
            </p>
          </div>

          {/* Referral Link Box */}
          <div className="bg-white/60 backdrop-blur-md border border-white/80 p-3.5 sm:p-5 rounded-2xl space-y-2.5 sm:space-y-3 w-full min-w-0 lg:max-w-md shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted font-medium flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-semibold text-slate-700">Link Referral Anda</span>
              </span>
              <Badge variant="primary" className="font-mono text-[10px] uppercase font-bold">
                {partnerCode}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={referralUrl}
                className="bg-white/90 border-slate-200/80 text-xs font-mono h-10 select-all rounded-xl shadow-2xs"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(referralUrl, 'ref-banner')}
                className="h-10 px-3.5 gap-1.5 shrink-0 text-xs font-semibold rounded-xl cursor-pointer"
              >
                {copiedLink === 'ref-banner' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleShare(
                    referralUrl,
                    'Asterra Store - Akun Digital Premium Resmi',
                    'Dapatkan akun digital premium resmi bergaransi (Canva Pro, Gemini AI, Netflix, Spotify) di Asterra Store:'
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Link</span>
              </button>
              <a
                href={`https://wa.me/?text=Halo!%20Dapatkan%20akun%20premium%20resmi%20bergaransi%20(Canva%20Pro,%20Gemini%20AI,%20Netflix,%20Spotify)%20di%20Asterra%20Store:%20${encodeURIComponent(
                  referralUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-[#16A36A] hover:bg-[#15803D] text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaign Booster Teaser Banner */}
      {campaigns && campaigns.length > 0 && (
        <div className="animate-fade-up stagger-1 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563EB] flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#2563EB] text-white">
                  🔥 Flash Sale & Event Aktif
                </span>
                <span className="text-xs text-foreground-muted font-medium">
                  Booster Komisi hingga {Math.max(...campaigns.map((c) => c.boosterCommissionRate || 15))}%
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground">
                {campaigns[0].name} — Diskon Pembeli & Bonus Komisi Mitra
              </h4>
              <p className="text-xs text-foreground-muted mt-0.5">
                Promosikan event resmi ini untuk mendapatkan komisi lebih tinggi ({campaigns[0].boosterCommissionRate}% vs {partnerRate}% normal).
              </p>
            </div>
          </div>
          {onTabChange && (
            <Button
              size="sm"
              onClick={() => onTabChange('sales-links')}
              className="shrink-0 text-xs font-semibold gap-1.5 shadow-xs rounded-xl"
            >
              <span>Lihat Campaign & Salin Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* 4 Metric Cards - Responsive Density */}
      {isProfileLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-2 sm:space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-20 sm:w-32 bg-gray-200 rounded" />
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-200" />
              </div>
              <div className="h-6 sm:h-8 w-24 sm:w-36 bg-gray-200 rounded" />
              <div className="pt-2 border-t border-border/60 space-y-1 sm:space-y-2">
                <div className="h-3 w-16 sm:w-28 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Saldo Komisi Siap Tarik */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-2 sm:space-y-3 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500 tracking-wide truncate">Saldo Siap Tarik</span>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-[#16A36A] flex items-center justify-center border border-emerald-200/60 shrink-0">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#16A36A] tracking-tight tabular-nums font-mono truncate">
                <AnimatedNumber
                  value={unpaidCommissionVal}
                  formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                  showDelta
                />
              </div>
              {onTabChange && (
                <button
                  type="button"
                  onClick={() => onTabChange('sales-wallet')}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Tarik Saldo</span>
                </button>
              )}
            </div>
            <div className="pt-2.5 border-t border-border space-y-1 text-xs">
              <div className="flex items-center justify-between text-foreground-muted text-[11px]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#D97706]" />
                  <span>Garansi (3 Hari):</span>
                </span>
                <span className="font-semibold text-foreground font-mono">
                  <AnimatedNumber
                    value={partner?.pendingCommission || 0}
                    formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                  />
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted text-[11px]">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-[#16A36A]" />
                  <span>Total Ditarik:</span>
                </span>
                <span className="font-semibold text-foreground font-mono">
                  <AnimatedNumber
                    value={partner?.paidCommission || 0}
                    formatter={(v) => `Rp ${Math.round(v).toLocaleString('id-ID')}`}
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Pesanan Referral */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Pesanan Referral</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-200/60">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={totalOrdersVal} showDelta />
              <span className="text-sm font-normal text-foreground-muted ml-1">transaksi</span>
            </div>
            <div className="pt-3 border-t border-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Omzet Penjualan:</span>
                <span className="font-semibold text-foreground font-mono">
                  Rp {(partner?.totalSalesAmount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Total Komisi Didapat:</span>
                <span className="font-semibold text-[#16A36A] font-mono">
                  Rp {(partner?.totalCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Traffic & Klik Referral */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Traffic & Klik Link</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center border border-purple-200/60">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={totalClicksVal} showDelta />
              <span className="text-sm font-normal text-foreground-muted ml-1">klik</span>
            </div>
            <div className="pt-3 border-t border-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Conversion Rate:</span>
                <span className="font-semibold text-foreground font-mono">{conversionRate}</span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Masa Aktif Cookie:</span>
                <span className="font-semibold text-[#2563EB]">30 Hari Penuh</span>
              </div>
            </div>
          </div>

          {/* Card 4: Tingkat Kemitraan */}
          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 hover:shadow-card-hover transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 tracking-wide">Tingkat Kemitraan</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center border border-amber-200/60">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight tabular-nums font-mono">
              <AnimatedNumber value={partnerRate} formatter={(v) => `${Math.round(v)}%`} showDelta />
              <span className="text-sm font-normal text-foreground-muted ml-1">Profit Bersih</span>
            </div>
            <div className="pt-2 border-t border-border space-y-2 text-xs">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Target Tier Berikutnya:</span>
                  <span className="font-semibold text-foreground font-mono">
                    {partner?.tierProgress
                      ? `${partner.tierProgress.currentOrders}/${partner.tierProgress.targetOrders} Order`
                      : '50 Transaksi'}
                  </span>
                </div>
                <AnimatedProgressBar
                  value={
                    partner?.tierProgress
                      ? Math.min(100, Math.round((partner.tierProgress.currentOrders / partner.tierProgress.targetOrders) * 100))
                      : 25
                  }
                  barClassName="bg-amber-500"
                  showShimmer
                />
              </div>
              <div className="flex items-center justify-between text-foreground-muted pt-0.5">
                <span>Bonus Tier Berikutnya:</span>
                <span className="font-semibold text-[#D97706]">{partnerRate >= 20 ? 'Tier Maksimal (20%)' : 'Naik ke 20% (VIP)'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Downline Bonus Quick Banner */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8B5CF6] border border-purple-200/60 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple" className="text-[10px] uppercase font-bold">
                Fitur Resmi: 1-Level Referral
              </Badge>
              <span className="text-xs text-foreground-muted font-medium">Bukan Multi-Level</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Ajak Teman Jadi Mitra Sales & Dapatkan Bonus 2% Profit!
            </h4>
            <p className="text-xs text-foreground-muted mt-0.5 max-w-2xl">
              Dapatkan bonus 2% dari Profit Transaksi teman langsung Anda tanpa memotong komisi penjualan mereka (teman tetap menerima 15% utuh).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(inviteSalesUrl, 'ref-banner-quick')}
            className="text-xs gap-1.5 h-9 font-medium flex-1 sm:flex-initial rounded-xl cursor-pointer"
          >
            {copiedLink === 'ref-banner-quick' ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16A36A]" />
                <span>Link Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Link</span>
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() =>
              handleShare(
                inviteSalesUrl,
                'Gabung Mitra Sales Asterra Store',
                'Ayo gabung jadi Mitra Sales Asterra Store! Dapatkan komisi 15% profit dari setiap penjualan produk digital bergaransi:'
              )
            }
            className="h-9 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Bagikan Tautan Pendaftaran"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bagikan</span>
          </button>
          {onTabChange && (
            <Button
              size="sm"
              onClick={() => onTabChange('sales-network')}
              className="text-xs gap-1.5 h-9 font-semibold flex-1 sm:flex-initial rounded-xl cursor-pointer"
            >
              <span>Bonus Tim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Fast Navigation Grid (4 Modules) */}
      {onTabChange && (
        <div className="animate-fade-up stagger-6 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div
            onClick={() => onTabChange('sales-catalog')}
            className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform border border-blue-200/60">
                <Package className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-foreground">Katalog Produk</h3>
              <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">
                Jelajahi produk digital & salin link promosi per produk.
              </p>
            </div>
          </div>

          <div
            onClick={() => onTabChange('sales-links')}
            className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#16A36A] flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-200/60">
                <Share2 className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-foreground">Generator Link</h3>
              <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">
                Custom link kampanye & materi promosi siap pakai.
              </p>
            </div>
          </div>

          <div
            onClick={() => onTabChange('sales-network')}
            className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-200/60">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <div className="flex items-center justify-between gap-1">
                <h3 className="font-bold text-xs sm:text-sm text-foreground">Bonus Tim</h3>
                <Badge variant="success" className="text-[9px] px-1.5 py-0 font-mono">
                  {networkData?.summary?.totalDownlines || 0}
                </Badge>
              </div>
              <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">
                Pantau teman yang diajak & bonus pasif 2% profit.
              </p>
            </div>
          </div>

          <div
            onClick={() => onTabChange('sales-wallet')}
            className="bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs hover:border-[#171717]/30 hover:shadow-card-hover transition-all cursor-pointer group space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 text-[#8B5CF6] flex items-center justify-center group-hover:scale-105 transition-transform border border-purple-200/60">
                <Wallet className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-foreground">Dompet Saldo</h3>
              <p className="text-[11px] sm:text-xs text-foreground-muted mt-0.5 line-clamp-2 leading-relaxed">
                Cairkan komisi langsung ke bank / e-wallet resmi Anda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
