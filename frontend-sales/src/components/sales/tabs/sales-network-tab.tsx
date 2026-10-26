'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  Copy,
  Check,
  Send,
  DollarSign,
  Clock,
  AlertCircle,
  Users,
  ShoppingBag,
  Award,
  Percent,
  Share2,
} from 'lucide-react';
import { NetworkDataResponse } from '../types';

interface SalesNetworkTabProps {
  partnerCode: string;
  inviteSalesUrl: string;
  inviteWaMessage: string;
  networkData: NetworkDataResponse | null | undefined;
  isLoading?: boolean;
  onRefresh: () => void;
  handleCopy: (text: string, id: string) => void;
  copiedLink: string | null;
}

export function SalesNetworkTab({
  partnerCode,
  inviteSalesUrl,
  inviteWaMessage,
  networkData,
  isLoading = false,
  onRefresh,
  handleCopy,
  copiedLink,
}: SalesNetworkTabProps) {
  const handleShare = async (url: string, title: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${inviteWaMessage}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Program Referral Mitra 1-Level Resmi (Single-Tier • Bukan MLM)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Bonus Teman yang Anda Ajak (1-Level Referral)
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Ajak teman menjadi mitra sales langsung dengan kode Anda. Nikmati bonus 2% dari subsidi margin Asterra Store tanpa memotong hak komisi teman Anda.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 text-xs self-start sm:self-auto shrink-0 border-border rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Invitation Link Box */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <UserPlus className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-foreground">
                Link Khusus Pendaftaran Mitra Sales (1-Level)
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Bagikan link pendaftaran resmi ini. Teman yang mendaftar akan langsung terdaftar di bawah kode referral{' '}
              <strong className="text-primary font-mono">{partnerCode}</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs text-foreground-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Komisi teman 100% utuh (10% – 15% Profit)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Bonus rekrutmen 2% disubsidi toko</span>
              </div>
            </div>
          </div>

          {/* Link Input & Share Actions */}
          <div className="bg-surface-raised border border-border p-5 rounded-2xl space-y-3.5 w-full min-w-0 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted font-medium">Link Ajak Jadi Sales:</span>
              <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary border-primary/20 bg-primary/5">
                Ref: {partnerCode}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteSalesUrl}
                className="bg-surface border-border text-xs font-mono h-10 select-all rounded-xl"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(inviteSalesUrl, 'invite-sales')}
                className="h-10 px-3.5 gap-1.5 shrink-0 text-xs font-semibold"
              >
                {copiedLink === 'invite-sales' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
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
                    inviteSalesUrl,
                    'Ayo Gabung Jadi Mitra Sales Asterra Store',
                    'Ayo gabung jadi Mitra Sales resmi Asterra Store! Dapatkan komisi profit bersih 10% hingga 15% dari setiap penjualan produk digital bergaransi:'
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan Link</span>
              </button>
              <a
                href={`https://wa.me/?text=${inviteWaMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards - Responsive Density */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        <div className="col-span-2 sm:col-span-1 bg-surface border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Total Bonus Teman Sales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight font-mono">
            Rp {(networkData?.totalNetworkBonus || 0).toLocaleString('id-ID')}
          </div>
          <div className="pt-2 border-t border-border space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Siap Tarik (Final):</span>
              </span>
              <span className="font-semibold text-emerald-600 font-mono text-[11px]">
                Rp {(networkData?.finalNetworkBonus || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted flex items-center gap-1 text-[11px]">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Masa Garansi (3 Hari):</span>
              </span>
              <span className="font-semibold text-amber-500 font-mono text-[11px]">
                Rp {(networkData?.pendingNetworkBonus || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="col-span-1 bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted truncate">Teman Terdaftar</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight font-mono">
            {(networkData?.totalTeamMembers || 0).toLocaleString('id-ID')} Orang
          </div>
          <p className="text-[10px] sm:text-xs text-foreground-muted pt-1.5 border-t border-border leading-tight">
            Mitra referral langsung.
          </p>
        </div>

        <div className="col-span-1 bg-surface border border-border rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-xs space-y-1.5 sm:space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-foreground-muted truncate">Pesanan Tim</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-foreground tracking-tight font-mono">
            {(networkData?.totalTeamOrders || 0).toLocaleString('id-ID')} Order
          </div>
          <p className="text-[10px] sm:text-xs text-foreground-muted pt-1.5 border-t border-border leading-tight">
            Omzet: <strong className="text-foreground font-mono">Rp {(networkData?.totalTeamRevenue || 0).toLocaleString('id-ID')}</strong>
          </p>
        </div>
      </div>

      {/* Downline Members Table */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Daftar Teman Sales Langsung Anda</span>
          </h3>
          <span className="text-xs text-foreground-muted font-mono">
            {networkData?.teamMembers?.length || 0} Mitra Terdaftar
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-foreground-muted animate-pulse">Memuat data tim...</div>
        ) : (networkData?.teamMembers || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-muted">
            Belum ada teman yang mendaftar via kode referral Anda. Bagikan link pendaftaran di atas!
          </div>
        ) : (
          <>
            {/* Mobile View: Compact Team Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-border">
              {(networkData?.teamMembers || []).map((m) => (
                <div key={m.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-foreground">{m.name}</h4>
                      <span className="font-mono text-[10px] text-primary font-semibold">Kode: {m.code}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-semibold uppercase ${
                        m.status === 'active'
                          ? 'text-emerald-700 border-emerald-200/60 bg-emerald-50'
                          : 'text-foreground-muted border-border'
                      }`}
                    >
                      {m.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <div className="text-[11px] text-foreground-muted">
                      <span>{m.totalOrders} Pesanan</span> • <span className="font-mono">Rp {m.totalRevenue.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-foreground-muted block">Bonus Anda</span>
                      <span className="font-mono font-bold text-xs text-emerald-600">
                        + Rp {m.bonusEarnedFromMember.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Nama Teman</th>
                    <th className="py-3 px-4 font-semibold">Kode Referral</th>
                    <th className="py-3 px-4 font-semibold">Tanggal Bergabung</th>
                    <th className="py-3 px-4 font-semibold">Total Pesanan</th>
                    <th className="py-3 px-4 font-semibold">Total Omzet Penjualan</th>
                    <th className="py-3 px-4 font-semibold">Bonus Dihasilkan (2%)</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(networkData?.teamMembers || []).map((m) => (
                    <tr key={m.id} className="hover:bg-surface-raised/60 transition-colors">
                      <td className="py-3 px-4 text-foreground font-semibold">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {m.code}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                        {new Date(m.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground font-mono">
                        {m.totalOrders} Pesanan
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground font-mono">
                        Rp {m.totalRevenue.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 font-mono">
                        Rp {m.bonusEarnedFromMember.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase ${
                            m.status === 'active'
                              ? 'text-emerald-700 border-emerald-200/60 bg-emerald-50'
                              : 'text-foreground-muted border-border'
                          }`}
                        >
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Bonus Log History */}
      <div className="bg-surface border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Riwayat Bonus dari Transaksi Teman (Audit 2% Margin)</span>
          </h3>
          <span className="text-xs text-foreground-muted font-mono">
            {networkData?.bonusLogs?.length || 0} Catatan Transaksi
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-foreground-muted animate-pulse">Memuat riwayat bonus...</div>
        ) : (networkData?.bonusLogs || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-muted">
            Belum ada riwayat transaksi bonus dari teman sales Anda.
          </div>
        ) : (
          <>
            {/* Mobile View: Compact Bonus Log Cards (md:hidden) */}
            <div className="md:hidden divide-y divide-border">
              {(networkData?.bonusLogs || []).map((log) => (
                <div key={log.id} className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-foreground">{log.fromPartnerName}</span>
                      <span className="font-mono text-[10px] text-primary">({log.fromPartnerCode})</span>
                    </div>
                    {log.status === 'pending' ? (
                      <Badge variant="outline" className="text-[9px] font-semibold text-amber-700 border-amber-200/60 bg-amber-50">
                        Garansi (3 Hari)
                      </Badge>
                    ) : log.status === 'reversed' ? (
                      <Badge variant="outline" className="text-[9px] font-semibold text-rose-700 border-rose-200/60 bg-rose-50">
                        Batal
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] font-semibold text-emerald-700 border-emerald-200/60 bg-emerald-50">
                        Siap Tarik
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-foreground-muted block">
                        {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="font-mono text-[11px] text-foreground">
                        Order: Rp {log.orderTotal.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-foreground-muted block">Bonus 2% Profit</span>
                      <span className="font-mono font-bold text-xs text-emerald-600">
                        + Rp {log.bonusAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Waktu</th>
                    <th className="py-3 px-4 font-semibold">Dari Mitra</th>
                    <th className="py-3 px-4 font-semibold">ID Pesanan</th>
                    <th className="py-3 px-4 font-semibold">Total Nilai</th>
                    <th className="py-3 px-4 font-semibold">Profit Bersih</th>
                    <th className="py-3 px-4 font-semibold">Bonus Anda (2%)</th>
                    <th className="py-3 px-4 font-semibold">Status & Masa Garansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(networkData?.bonusLogs || []).map((log) => (
                    <tr key={log.id} className="hover:bg-surface-raised/60 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground-muted">
                        {new Date(log.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-foreground font-medium">
                        {log.fromPartnerName}
                        <span className="ml-1.5 font-mono text-[10px] text-primary">({log.fromPartnerCode})</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {log.orderId ? `${log.orderId.substring(0, 12)}...` : '-'}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground font-mono">
                        Rp {log.orderTotal.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        Rp {(typeof log.transactionProfit === 'number' ? log.transactionProfit : 0).toLocaleString('id-ID')}
                        {log.transactionProfit === 0 && (
                          <span className="block text-[10px] text-foreground-muted font-normal">
                            (Margin tergerus promo)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600 font-mono">
                        + Rp {log.bonusAmount.toLocaleString('id-ID')}
                        <span className="text-[10px] text-foreground-muted ml-1">(2% Profit)</span>
                      </td>
                      <td className="py-3 px-4">
                        {log.status === 'pending' ? (
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-amber-700 border-amber-200/60 bg-amber-50 flex items-center gap-1 w-fit"
                            >
                              <Clock className="w-2.5 h-2.5" />
                              <span>Masa Garansi (3 Hari)</span>
                            </Badge>
                            {log.holdingUntil && (
                              <p className="text-[9px] text-foreground-muted font-mono">
                                Rilis: {new Date(log.holdingUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        ) : log.status === 'reversed' ? (
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="text-[10px] font-semibold text-rose-700 border-rose-200/60 bg-rose-50 flex items-center gap-1 w-fit"
                            >
                              <AlertCircle className="w-2.5 h-2.5" />
                              <span>Dibatalkan / Refund</span>
                            </Badge>
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-emerald-700 border-emerald-200/60 bg-emerald-50 flex items-center gap-1 w-fit"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Siap Ditarik (Final)</span>
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Edukasi & Transparansi Sistem Komisi Teman */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>1-Level Murni (Bukan MLM)</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Hanya 1 level langsung. Anda hanya menerima bonus dari mitra yang langsung Anda ajak. Tidak ada sistem piramida bertingkat.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs">
            <Award className="w-4 h-4 shrink-0" />
            <span>100% Hak Teman Utuh</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Bonus 2% disubsidi 100% dari alokasi laba bersih Asterra Store. Komisi teman Anda tidak dipotong sepeser pun.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
            <Percent className="w-4 h-4 shrink-0" />
            <span>Buffer Margin Sehat</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Bonus dikaitkan dengan buffer margin laba toko, mencegah risiko defisit toko pada produk digital dengan margin sangat tipis.
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Holding Garansi 3 Hari</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Dana ditahan dalam masa garansi 3 hari untuk mengantisipasi refund pembeli, lalu otomatis berpindah ke saldo siap ditarik.
          </p>
        </div>
      </div>
    </div>
  );
}
