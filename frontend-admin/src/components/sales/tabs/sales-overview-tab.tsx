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
} from 'lucide-react';
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
  const referralUrl = `${getStoreBaseUrl()}/?ref=${partnerCode}`;

  const conversionRate = useMemo(() => {
    if (!partner || !partner.totalClicks || partner.totalClicks === 0) return '0.0%';
    const rate = ((partner.totalOrders || 0) / partner.totalClicks) * 100;
    return `${rate.toFixed(1)}%`;
  }, [partner]);

  return (
    <div className="space-y-6">
      {/* Welcome & Referral Banner */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                partner?.status === 'active'
                  ? 'bg-status-success/15 border-status-success/30 text-status-success'
                  : partner?.status === 'suspended'
                  ? 'bg-status-error/15 border-status-error/30 text-status-error'
                  : partner?.status === 'pending'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-500'
                  : 'bg-muted border-border text-foreground-muted'
              }`}
            >
              <span>
                Status Akun:{' '}
                {partner?.status === 'active'
                  ? `Mitra Aktif (${partner?.tier || 'Standard 10%'})`
                  : partner?.status === 'suspended'
                  ? 'Ditangguhkan (Suspended)'
                  : partner?.status === 'pending'
                  ? 'Menunggu Verifikasi (Pending Review)'
                  : 'Non-Aktif'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Halo, {partner?.name || userName}!
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Bagikan link referral Anda untuk mendapatkan bagi hasil komisi{' '}
              <strong className="text-foreground">{partnerRate}% dari Profit Transaksi</strong> bersih (naik ke 15% setelah 50 transaksi).
            </p>
          </div>

          {/* Referral Link Box */}
          <div className="bg-surface-raised border border-border p-4 rounded-xl space-y-3 min-w-[320px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted font-medium">Link Referral Anda:</span>
              <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary border-primary/30">
                {partnerCode}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={referralUrl}
                className="bg-surface border-border text-xs font-mono h-9 select-all"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(referralUrl, 'ref-banner')}
                className="h-9 px-3 gap-1.5 shrink-0 text-xs font-semibold"
              >
                {copiedLink === 'ref-banner' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-status-success" />
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

            <a
              href={`https://wa.me/?text=Halo!%20Dapatkan%20akun%20premium%20resmi%20bergaransi%20(Canva%20Pro,%20Gemini%20AI,%20Netflix,%20Spotify)%20di%20Asterra%20Store:%20${encodeURIComponent(
                referralUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Bagikan ke Status WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Active Campaign Booster Teaser Banner */}
      {campaigns && campaigns.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
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
                Promosikan event resmi ini untuk mendapatkan komisi lebih tinggi ({campaigns[0].boosterCommissionRate}% vs {partnerRate}% normal). Link siap pakai tersedia!
              </p>
            </div>
          </div>
          {onTabChange && (
            <Button
              size="sm"
              onClick={() => onTabChange('sales-links')}
              className="shrink-0 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <span>Lihat Campaign & Salin Link</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* 4 Metric Cards */}
      {isProfileLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 bg-foreground/10 rounded" />
                <div className="w-8 h-8 rounded-lg bg-foreground/10" />
              </div>
              <div className="h-8 w-36 bg-foreground/15 rounded" />
              <div className="pt-2 border-t border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-28 bg-foreground/10 rounded" />
                  <div className="h-3 w-16 bg-foreground/10 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Saldo Komisi Siap Tarik */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Saldo Siap Tarik</span>
              <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Rp {(partner?.unpaidCommission || 0).toLocaleString('id-ID')}
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-status-warning" />
                  <span>Tertahan Garansi 3 Hari:</span>
                </span>
                <span className="font-semibold text-foreground">
                  Rp {(partner?.pendingCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-status-success" />
                  <span>Total Telah Ditarik:</span>
                </span>
                <span className="font-semibold text-foreground">
                  Rp {(partner?.paidCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Pesanan Referral */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Pesanan Referral</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {partner?.totalOrders || 0}
              <span className="text-sm font-normal text-foreground-muted ml-1">transaksi</span>
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Omset Penjualan Bersih:</span>
                <span className="font-semibold text-foreground">
                  Rp {(partner?.totalSalesAmount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Total Komisi Didapat:</span>
                <span className="font-semibold text-status-success">
                  Rp {(partner?.totalCommission || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Traffic & Klik Referral */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Traffic & Klik Link</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {partner?.totalClicks || 0}
              <span className="text-sm font-normal text-foreground-muted ml-1">klik</span>
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Conversion Rate:</span>
                <span className="font-semibold text-foreground font-mono">{conversionRate}</span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Masa Aktif Cookie:</span>
                <span className="font-semibold text-primary">30 Hari Penuh</span>
              </div>
            </div>
          </div>

          {/* Card 4: Tingkat Kemitraan */}
          <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground-muted">Tingkat Kemitraan</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {partnerRate}%
              <span className="text-sm font-normal text-foreground-muted ml-1">Profit Bersih</span>
            </div>
            <div className="pt-2 border-t border-border space-y-1 text-xs">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Target Tier Berikutnya:</span>
                <span className="font-semibold text-foreground">
                  {partner?.tierProgress
                    ? `${partner.tierProgress.currentOrders}/${partner.tierProgress.targetOrders} Order`
                    : '50 Transaksi'}
                </span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Bonus Tier Berikutnya:</span>
                <span className="font-semibold text-amber-500">Naik ke 15%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Downline Bonus Quick Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                Fitur Baru: 1-Level Referral
              </Badge>
              <span className="text-xs text-foreground-muted font-medium">Bukan Multi-Level</span>
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Ajak Teman Jadi Mitra Sales & Dapatkan Bonus 2% Profit!
            </h4>
            <p className="text-xs text-foreground-muted">
              Dapatkan bonus 2% dari Profit Transaksi teman langsung Anda tanpa memotong komisi penjualan mereka (teman tetap menerima 10% utuh). Dilengkapi masa garansi 3 hari (bukan MLM).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopy(inviteSalesUrl, 'ref-banner-quick')}
            className="text-xs gap-1.5 h-8"
          >
            {copiedLink === 'ref-banner-quick' ? (
              <>
                <Check className="w-3.5 h-3.5 text-status-success" />
                <span>Link Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Link Ajak</span>
              </>
            )}
          </Button>
          {onTabChange && (
            <Button
              size="sm"
              onClick={() => onTabChange('sales-network')}
              className="text-xs gap-1.5 h-8 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              <span>Lihat Bonus Tim</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Fast Navigation Grid (4 Modules) */}
      {onTabChange && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onTabChange('sales-catalog')}
            className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Package className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Katalog Produk & Komisi</h3>
            <p className="text-xs text-foreground-muted">
              Jelajahi produk digital Asterra, hitung komisi Anda, dan salin link promosi per produk.
            </p>
          </div>

          <div
            onClick={() => onTabChange('sales-links')}
            className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center group-hover:scale-105 transition-transform">
                <Share2 className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Generator Link & Teks Promo</h3>
            <p className="text-xs text-foreground-muted">
              Buat custom link kampanye dan gunakan template copywriting yang siap dibagikan ke medsos.
            </p>
          </div>

          <div
            onClick={() => onTabChange('sales-network')}
            className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">Bonus Tim & Teman</h3>
              <Badge variant="outline" className="text-[10px] font-semibold text-status-success border-status-success/30">
                {networkData?.summary?.totalDownlines || 0} Teman
              </Badge>
            </div>
            <p className="text-xs text-foreground-muted">
              Pantau teman yang diajak & bonus pasif 2% dari setiap transaksi yang mereka hasilkan.
            </p>
          </div>

          <div
            onClick={() => onTabChange('sales-wallet')}
            className="bg-surface border border-border rounded-xl p-5 shadow-xs hover:border-primary/50 transition-all cursor-pointer group space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
              <ChevronRight className="w-4 h-4 text-foreground-muted group-hover:translate-x-1 transition-transform" />
            </div>
            <h3 className="font-bold text-sm text-foreground">Dompet & Penarikan Dana</h3>
            <p className="text-xs text-foreground-muted">
              Cairkan komisi Anda langsung ke rekening bank atau e-wallet tanpa biaya admin tersembunyi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
