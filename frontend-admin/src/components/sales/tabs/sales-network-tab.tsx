'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  RefreshCw,
  Sparkles,
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
  return (
    <div className="space-y-6">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Program Referral Mitra 1-Level Resmi (Single-Tier • Bukan MLM)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Bonus Teman yang Anda Ajak (1-Level Referral)
          </h2>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Ajak teman menjadi mitra sales langsung dengan kode Anda. Nikmati bonus 2% dari subsidi margin Asterra Store tanpa memotong hak komisi teman Anda.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2 text-xs self-start sm:self-auto shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Invitation Link Box */}
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-surface to-surface-raised p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
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
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                <span>Komisi teman 100% utuh (10% Profit Transaksi)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>Bonus rekrutmen 2% dari Profit Transaksi (1-Level, bukan MLM)</span>
              </div>
            </div>
          </div>

          {/* Link Input & Share Actions */}
          <div className="bg-surface border border-border p-4 rounded-xl space-y-3 min-w-[320px] max-w-md w-full">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted font-medium">Link Ajak Jadi Sales:</span>
              <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold text-primary border-primary/30">
                Ref: {partnerCode}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={inviteSalesUrl}
                className="bg-surface-raised border-border text-xs font-mono h-9 select-all"
              />
              <Button
                size="sm"
                onClick={() => handleCopy(inviteSalesUrl, 'invite-sales')}
                className="h-9 px-3 gap-1.5 shrink-0 text-xs font-semibold"
              >
                {copiedLink === 'invite-sales' ? (
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
              href={`https://wa.me/?text=${inviteWaMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-status-success hover:bg-status-success/90 text-white font-semibold text-xs transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ajak Teman via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Total Bonus Teman Sales</span>
            <div className="w-8 h-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            Rp {(networkData?.totalNetworkBonus || 0).toLocaleString('id-ID')}
          </div>
          <div className="pt-2 border-t border-border/60 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-status-success" />
                <span>Siap Tarik (Final):</span>
              </span>
              <span className="font-semibold text-status-success">
                Rp {(networkData?.finalNetworkBonus || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Masa Garansi (3 Hari):</span>
              </span>
              <span className="font-semibold text-amber-500">
                Rp {(networkData?.pendingNetworkBonus || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Total Teman Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {(networkData?.totalTeamMembers || 0).toLocaleString('id-ID')} Orang
          </div>
          <p className="text-[11px] text-foreground-muted pt-2 border-t border-border/60">
            Teman langsung yang bergabung via kode referral Anda.
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Total Pesanan Tim Teman</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-foreground tracking-tight">
            {(networkData?.totalTeamOrders || 0).toLocaleString('id-ID')} Pesanan
          </div>
          <p className="text-[11px] text-foreground-muted pt-2 border-t border-border/60">
            Nilai omzet tim: <strong>Rp {(networkData?.totalTeamRevenue || 0).toLocaleString('id-ID')}</strong>
          </p>
        </div>
      </div>

      {/* Downline Members Table */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>Daftar Teman Sales Langsung Anda</span>
          </h3>
          <span className="text-xs text-foreground-muted">
            {networkData?.teamMembers?.length || 0} Mitra Terdaftar
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-foreground-muted">Memuat data tim...</div>
        ) : (networkData?.teamMembers || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-muted">
            Belum ada teman yang mendaftar via kode referral Anda. Bagikan link pendaftaran di atas!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                <tr>
                  <th className="py-3 px-4">Nama Teman</th>
                  <th className="py-3 px-4">Kode Referral</th>
                  <th className="py-3 px-4">Tanggal Bergabung</th>
                  <th className="py-3 px-4">Total Pesanan</th>
                  <th className="py-3 px-4">Total Omzet Penjualan</th>
                  <th className="py-3 px-4">Bonus Dihasilkan untuk Anda (2%)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(networkData?.teamMembers || []).map((m) => (
                  <tr key={m.id} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {m.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {m.code}
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground-muted text-[11px]">
                      {new Date(m.joinedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {m.totalOrders} Pesanan
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      Rp {m.totalRevenue.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold text-status-success">
                      Rp {m.bonusEarnedFromMember.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold uppercase ${
                          m.status === 'active'
                            ? 'text-status-success border-status-success/30 bg-status-success/10'
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
        )}
      </div>

      {/* Bonus Log History */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-status-success" />
            <span>Riwayat Bonus dari Transaksi Teman (Audit 2% Margin)</span>
          </h3>
          <span className="text-xs text-foreground-muted">
            {networkData?.bonusLogs?.length || 0} Catatan Transaksi
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-foreground-muted">Memuat riwayat bonus...</div>
        ) : (networkData?.bonusLogs || []).length === 0 ? (
          <div className="p-8 text-center text-xs text-foreground-muted">
            Belum ada riwayat transaksi bonus dari teman sales Anda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-raised border-b border-border text-foreground-muted font-medium">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Dari Mitra</th>
                  <th className="py-3 px-4">ID Pesanan</th>
                  <th className="py-3 px-4">Total Nilai Pesanan</th>
                  <th className="py-3 px-4">Profit Bersih Transaksi</th>
                  <th className="py-3 px-4">Bonus Anda (2%)</th>
                  <th className="py-3 px-4">Status & Masa Garansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(networkData?.bonusLogs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-surface-raised/50 transition-colors">
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
                    <td className="py-3 px-4 font-bold text-foreground">
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
                    <td className="py-3 px-4 font-bold text-status-success">
                      + Rp {log.bonusAmount.toLocaleString('id-ID')}
                      <span className="text-[10px] text-foreground-muted ml-1">(2% Profit)</span>
                    </td>
                    <td className="py-3 px-4">
                      {log.status === 'pending' ? (
                        <div className="space-y-0.5">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-amber-500 border-amber-500/30 bg-amber-500/10 flex items-center gap-1 w-fit"
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
                            className="text-[10px] font-semibold text-status-error border-status-error/30 bg-status-error/10 flex items-center gap-1 w-fit"
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            <span>Dibatalkan / Refund</span>
                          </Badge>
                        </div>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-semibold text-status-success border-status-success/30 bg-status-success/10 flex items-center gap-1 w-fit"
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
        )}
      </div>

      {/* Edukasi & Transparansi Sistem Komisi Teman */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>1-Level Murni (Bukan MLM)</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Hanya 1 level langsung. Anda hanya menerima bonus dari mitra yang langsung Anda ajak. Tidak ada sistem piramida bertingkat.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
          <div className="flex items-center gap-2 text-status-success font-semibold text-xs">
            <Award className="w-4 h-4 shrink-0" />
            <span>100% Hak Teman Utuh</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Bonus 2% disubsidi 100% dari alokasi laba bersih Asterra Store. Komisi teman Anda tidak dipotong sepeser pun.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
          <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
            <Percent className="w-4 h-4 shrink-0" />
            <span>Terkait Buffer Margin Sehat</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Bonus dikaitkan dengan buffer margin laba toko, mencegah risiko defisit toko pada produk digital dengan margin sangat tipis.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface space-y-1.5">
          <div className="flex items-center gap-2 text-blue-500 font-semibold text-xs">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Holding Garansi 3 Hari & Refund</span>
          </div>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Dana ditahan dalam masa garansi 3 hari untuk mengantisipasi refund pembeli, lalu otomatis berpindah ke saldo siap ditarik.
          </p>
        </div>
      </div>
    </div>
  );
}
