'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Flame,
  Target,
  Gift,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AdminModalPortal } from '@/components/admin/admin-modal-portal';

interface PartnerStreakItem {
  id: string;
  name: string;
  code: string;
  todayAccumulated: number;
  todayTarget: number;
  todayStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completedDaysThisWeek: number;
  totalCommissionThisWeek: number;
  estimatedBonusThisWeek: number;
  weeklyStatus: string;
  streakCalendar: Array<{
    day: string;
    status: string;
  }>;
}

interface BonusLedgerItem {
  id: string;
  salesId: string;
  salesName: string;
  salesCode: string;
  bonusType: string;
  baseCommission: number;
  bonusPercentage: number;
  bonusAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED';
  reversalReason?: string | null;
  approvedBy?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  paidAt?: string | null;
}

interface GamificationConfig {
  id: string;
  isEnabled: boolean;
  dailyTargetAmount: number;
  weeklyStreakDays: number;
  weeklyBonusPercentage: number;
  timezone: string;
  weekStartDay: string;
  productSuggestionEnabled: boolean;
  autoApproveWeeklyBonus: boolean;
  updatedBy?: string | null;
  updatedAt?: string | null;
}

interface GamificationMetrics {
  dailyCompletionRate: number;
  todayCompletedCount: number;
  todayActivePartners: number;
  weeklyCompletionRate: number;
  totalBonusPaid: number;
  totalBonusApproved: number;
  totalBonusPending: number;
  totalBonusReversed: number;
  totalGamificationCost: number;
  gamificationCostRatio: number;
  totalDirectCommission: number;
  totalTransactionProfit: number;
}

interface AuditData {
  partner: {
    id: string;
    name: string;
    code: string;
    email: string;
  };
  events: Array<{
    id: string;
    orderId: string;
    wibDate: string;
    directCommissionAmount: number;
    isCounted: boolean;
    orderStatus: string;
    validatedAt?: string | null;
  }>;
  dailies: Array<{
    id: string;
    date: string;
    targetAmount: number;
    accumulatedCommission: number;
    status: string;
  }>;
}

export function AdminGamificationSubtab({
  onNotify,
}: {
  onNotify?: (msg: string) => void;
}) {
  const [metrics, setMetrics] = useState<GamificationMetrics | null>(null);
  const [config, setConfig] = useState<GamificationConfig | null>(null);
  const [partnerStreaks, setPartnerStreaks] = useState<PartnerStreakItem[]>([]);
  const [bonusLedgers, setBonusLedgers] = useState<BonusLedgerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'COMPLETED' | 'IN_PROGRESS' | 'FAILED'>('all');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedPartnerAudit, setSelectedPartnerAudit] = useState<string | null>(null);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);

  // Config edit state
  const [editDailyTarget, setEditDailyTarget] = useState<number>(25000);
  const [editBonusPercentage, setEditBonusPercentage] = useState<number>(10);
  const [editIsEnabled, setEditIsEnabled] = useState<boolean>(true);
  const [editAutoApprove, setEditAutoApprove] = useState<boolean>(true);
  const [editProductSuggestion, setEditProductSuggestion] = useState<boolean>(true);

  // Fetch macro overview
  const fetchGamificationData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await fetch('/api/v1/admin/gamification/overview', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setConfig(data.config);
        setPartnerStreaks(data.partnerStreaks || []);
        setBonusLedgers(data.bonusLedgers || []);

        if (data.config) {
          setEditDailyTarget(data.config.dailyTargetAmount || 25000);
          setEditBonusPercentage(data.config.weeklyBonusPercentage || 10);
          setEditIsEnabled(data.config.isEnabled ?? true);
          setEditAutoApprove(data.config.autoApproveWeeklyBonus ?? true);
          setEditProductSuggestion(data.config.productSuggestionEnabled ?? true);
        }
      }
    } catch (e) {
      console.error('[AdminGamification] Fetch error:', e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGamificationData(false);
  }, [fetchGamificationData]);

  // Open audit modal for specific sales
  const handleOpenAudit = async (partnerId: string) => {
    setSelectedPartnerAudit(partnerId);
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/v1/admin/gamification/sales/${encodeURIComponent(partnerId)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuditData(data);
        }
      }
    } catch (e) {
      console.error('[AdminGamification] Audit fetch error:', e);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  // Trigger cutoff manually
  const handleTriggerCutoff = async () => {
    if (!confirm('Jalankan kalkulasi cutoff harian dan penutupan bonus mingguan sekarang?')) return;
    try {
      setIsProcessing(true);
      const res = await fetch('/api/v1/admin/gamification/trigger-cutoff', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        onNotify?.(`Cutoff selesai diproses (${data.finalizedDaysCount || 0} hari difinalisasi, ${data.settledWeeksCount || 0} minggu diselesaikan).`);
        await fetchGamificationData(true);
      } else {
        alert(data.error || 'Gagal menjalankan cutoff.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat menjalankan cutoff.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsProcessing(true);
      const res = await fetch('/api/v1/admin/gamification/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled: editIsEnabled,
          dailyTargetAmount: editDailyTarget,
          weeklyBonusPercentage: editBonusPercentage,
          autoApproveWeeklyBonus: editAutoApprove,
          productSuggestionEnabled: editProductSuggestion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.('Konfigurasi gamification berhasil disimpan.');
        setIsConfigModalOpen(false);
        await fetchGamificationData(true);
      } else {
        alert(data.message || 'Gagal menyimpan konfigurasi.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi saat menyimpan konfigurasi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Bonus ledger action (Approve / Pay / Reverse)
  const handleBonusAction = async (ledgerId: string, action: 'approve' | 'pay' | 'reverse') => {
    const actionLabel = action === 'approve' ? 'menyetujui' : action === 'pay' ? 'menandai lunas' : 'membatalkan (reverse)';
    if (!confirm(`Apakah Anda yakin ingin ${actionLabel} bonus ledger ini?`)) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/v1/admin/gamification/bonus/${encodeURIComponent(ledgerId)}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        onNotify?.(`Bonus ledger berhasil diperbarui (${action.toUpperCase()}).`);
        await fetchGamificationData(true);
      } else {
        alert(data.message || 'Gagal memproses aksi bonus.');
      }
    } catch {
      alert('Terjadi kesalahan koneksi.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered partners
  const filteredPartners = partnerStreaks.filter((p) => {
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.todayStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Daily Target Completion Rate */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Daily Target Completion</span>
            <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {metrics?.dailyCompletionRate ?? 0}%
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            <strong>{metrics?.todayCompletedCount ?? 0}</strong> dari {metrics?.todayActivePartners ?? 0} mitra capai target hari ini
          </p>
        </div>

        {/* Metric 2: Weekly Streak Rate */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Weekly 7-Day Streak Rate</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Flame className="w-4 h-4 fill-indigo-500" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {metrics?.weeklyCompletionRate ?? 0}%
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            Tingkat keberhasilan streak 7 hari berturut-turut
          </p>
        </div>

        {/* Metric 3: Total Weekly Bonus Issued */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Total Bonus Mingguan</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            Rp {((metrics?.totalBonusPaid || 0) + (metrics?.totalBonusApproved || 0)).toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            <span className="text-emerald-600 font-semibold font-mono">
              Rp {(metrics?.totalBonusApproved || 0).toLocaleString('id-ID')}
            </span>{' '}
            siap ditarik mitra
          </p>
        </div>

        {/* Metric 4: Gamification Cost Ratio */}
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Gamification Cost Ratio</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {metrics?.gamificationCostRatio ?? 0}%
          </div>
          <p className="text-[11px] text-foreground-muted mt-1">
            Dari profit transaksi (Maksimal ekuivalen 10%)
          </p>
        </div>
      </div>

      {/* 2. ACTION & FILTER HEADER */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Monitoring Streak Mitra Sales</h3>
              <Badge variant="outline" className="font-mono text-[10px]">
                Target: Rp {(config?.dailyTargetAmount || 25000).toLocaleString('id-ID')} / Hari
              </Badge>
              {config?.isEnabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  Nonaktif
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Pantau progres harian, kalender streak 7-hari, dan estimasi bonus mingguan tiap mitra secara real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTriggerCutoff}
              disabled={isProcessing}
              className="text-xs h-8.5 gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Jalankan Cutoff</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsConfigModalOpen(true)}
              className="text-xs h-8.5 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan Gamification</span>
            </Button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <Input
              type="text"
              placeholder="Cari nama atau kode mitra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-xs h-8.5 bg-surface-raised"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-raised p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] ${
                statusFilter === 'all'
                  ? 'bg-surface text-foreground font-semibold shadow-xs border border-border'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              Semua ({partnerStreaks.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1 ${
                statusFilter === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold shadow-xs border border-emerald-500/30'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Target Tercapai
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all text-[11px] flex items-center gap-1 ${
                statusFilter === 'IN_PROGRESS'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold shadow-xs border border-amber-500/30'
                  : 'text-foreground-muted hover:text-foreground'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-500" />
              In Progress
            </button>
          </div>
        </div>

        {/* 3. PARTNERS STREAK TABLE */}
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">Mitra Sales</th>
                <th className="py-3 px-4 font-semibold">Progress Hari Ini</th>
                <th className="py-3 px-4 font-semibold text-center">Streak 7 Hari (Sen–Min)</th>
                <th className="py-3 px-4 font-semibold text-right">Komisi Minggu Ini</th>
                <th className="py-3 px-4 font-semibold text-right">Estimasi Bonus</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted animate-pulse">
                    Memuat data streak mitra...
                  </td>
                </tr>
              ) : filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    Tidak ada mitra sales yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredPartners.map((p) => {
                  const isDone = p.todayStatus === 'COMPLETED';
                  const isInProg = p.todayStatus === 'IN_PROGRESS';
                  return (
                    <tr key={p.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground text-xs">{p.name}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{p.code}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-foreground text-xs">
                            Rp {p.todayAccumulated.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            / Rp {p.todayTarget.toLocaleString('id-ID')}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-800'
                                : isInProg
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isDone ? '✓ Capai' : isInProg ? 'In Progress' : 'Belum'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          {p.streakCalendar.map((sc, idx) => (
                            <span
                              key={idx}
                              title={`${sc.day}: ${sc.status}`}
                              className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center font-mono ${
                                sc.status === 'COMPLETED'
                                  ? 'bg-emerald-500 text-white'
                                  : sc.status === 'FAILED'
                                  ? 'bg-rose-500 text-white'
                                  : sc.status === 'IN_PROGRESS'
                                  ? 'bg-orange-500 text-white animate-pulse'
                                  : 'bg-surface-raised text-foreground-muted border border-border'
                              }`}
                            >
                              {sc.day[0]}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px] text-foreground-muted font-mono mt-0.5">
                          {p.completedDaysThisWeek}/7 Hari
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        Rp {p.totalCommissionThisWeek.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        +Rp {p.estimatedBonusThisWeek.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenAudit(p.id)}
                          className="text-xs h-7 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Audit</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BONUS LEDGER TABLE */}
      <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Buku Besar Bonus Streak Mingguan</h3>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Daftar bonus 10% yang telah diterbitkan untuk mitra yang berhasil menyelesaikan 7/7 hari.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[11px] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4 font-semibold">ID & Mitra</th>
                <th className="py-3 px-4 font-semibold">Komisi Dasar (7 Hari)</th>
                <th className="py-3 px-4 font-semibold">Bonus 10%</th>
                <th className="py-3 px-4 font-semibold">Waktu Terbit</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bonusLedgers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-foreground-muted">
                    Belum ada bonus mingguan yang diterbitkan.
                  </td>
                </tr>
              ) : (
                bonusLedgers.map((bl) => {
                  const isApproved = bl.status === 'APPROVED';
                  const isPaid = bl.status === 'PAID';
                  const isPending = bl.status === 'PENDING';
                  const isReversed = bl.status === 'REVERSED';

                  return (
                    <tr key={bl.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-primary font-bold">{bl.id}</div>
                        <div className="font-semibold text-foreground text-xs mt-0.5">{bl.salesName}</div>
                        <div className="text-[10px] text-foreground-muted font-mono">{bl.salesCode}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-foreground">
                        Rp {bl.baseCommission.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                        +Rp {bl.bonusAmount.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4 text-foreground-muted text-[11px] font-mono">
                        {bl.createdAt ? bl.createdAt.slice(0, 10) : '-'}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : isApproved
                              ? 'bg-indigo-100 text-indigo-800'
                              : isReversed
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isApproved ? 'Saldo Siap Tarik' : isPaid ? 'Telah Dicairkan' : isReversed ? 'Dibatalkan' : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleBonusAction(bl.id, 'approve')}
                              disabled={isProcessing}
                              className="text-[11px] h-7 px-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                            >
                              Approve
                            </Button>
                          )}
                          {isApproved && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleBonusAction(bl.id, 'pay')}
                              disabled={isProcessing}
                              className="text-[11px] h-7 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              Tandai Paid
                            </Button>
                          )}
                          {!isReversed && !isPaid && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBonusAction(bl.id, 'reverse')}
                              disabled={isProcessing}
                              className="text-[11px] h-7 px-2 text-rose-600 hover:bg-rose-50"
                            >
                              Reverse
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  <h3 className="font-bold text-base text-foreground">Pengaturan Gamification</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="text-foreground-muted hover:text-foreground p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
                {/* Toggle Fitur */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
                  <div>
                    <div className="font-semibold text-foreground">Status Fitur Gamification</div>
                    <div className="text-[11px] text-foreground-muted">Aktifkan misi harian & bonus streak untuk sales</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editIsEnabled}
                    onChange={(e) => setEditIsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Target Harian */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Target Komisi Harian (Rupiah)</label>
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    value={editDailyTarget}
                    onChange={(e) => setEditDailyTarget(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-foreground-muted">Default: Rp 25.000 / hari per sales.</p>
                </div>

                {/* Persentase Bonus Mingguan */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Persentase Bonus Mingguan (%)</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    step={0.5}
                    value={editBonusPercentage}
                    onChange={(e) => setEditBonusPercentage(Number(e.target.value))}
                    className="font-mono text-xs"
                  />
                  <p className="text-[10px] text-foreground-muted">Default: 10% dari total komisi langsung 7 hari.</p>
                </div>

                {/* Auto Approve Weekly Bonus */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
                  <div>
                    <div className="font-semibold text-foreground">Auto-Approve Bonus Mingguan</div>
                    <div className="text-[11px] text-foreground-muted">Otomatis setujui dan masukkan ke Saldo Siap Tarik</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editAutoApprove}
                    onChange={(e) => setEditAutoApprove(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                {/* Product Suggestion Engine Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-raised border border-border">
                  <div>
                    <div className="font-semibold text-foreground">Product Suggestion Engine</div>
                    <div className="text-[11px] text-foreground-muted">Aktifkan rekomendasi produk efisien di portal sales</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editProductSuggestion}
                    onChange={(e) => setEditProductSuggestion(e.target.checked)}
                    className="w-4 h-4 accent-primary rounded cursor-pointer"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsConfigModalOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isProcessing}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isProcessing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </AdminModalPortal>
      )}

      {/* 6. AUDIT DETAIL MODAL */}
      {selectedPartnerAudit && (
        <AdminModalPortal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Audit Gamification — {auditData?.partner?.name || 'Mitra Sales'}
                  </h3>
                  <p className="text-[11px] text-foreground-muted font-mono">
                    Kode: {auditData?.partner?.code} • ID: {auditData?.partner?.id}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPartnerAudit(null)}
                  className="text-foreground-muted hover:text-foreground p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto space-y-4 pr-1 text-xs">
                {isLoadingAudit ? (
                  <div className="py-12 text-center text-foreground-muted animate-pulse">
                    Memuat data transaksi pembentuk progress...
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-bold text-xs text-foreground mb-2">
                        Transaksi Pembentuk Progress ({auditData?.events?.length || 0} order)
                      </h4>
                      <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-surface-raised border-b border-border text-foreground-muted text-[10px] uppercase font-semibold">
                            <tr>
                              <th className="py-2 px-3">Order ID</th>
                              <th className="py-2 px-3">Tanggal WIB</th>
                              <th className="py-2 px-3">Direct Komisi</th>
                              <th className="py-2 px-3">Status Validasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(!auditData?.events || auditData.events.length === 0) ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-foreground-muted">
                                  Belum ada order berkontribusi.
                                </td>
                              </tr>
                            ) : (
                              auditData.events.map((ev) => (
                                <tr key={ev.id}>
                                  <td className="py-2 px-3 font-mono font-bold text-primary">{ev.orderId}</td>
                                  <td className="py-2 px-3 font-mono text-[11px]">{ev.wibDate}</td>
                                  <td className="py-2 px-3 font-mono font-bold text-foreground">
                                    Rp {ev.directCommissionAmount.toLocaleString('id-ID')}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        ev.isCounted
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {ev.isCounted ? '✓ Dihitung' : ev.orderStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </AdminModalPortal>
      )}
    </div>
  );
}
