'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Target,
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Gift,
  Copy,
  Check,
} from 'lucide-react';
import { AnimatedProgressBar } from '@/components/ui/animated-progress-bar';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { ProductBrandIcon } from '@/components/ui/product-brand-icon';
import { getStoreBaseUrl } from '@/lib/utils/url';

export interface DailyMissionData {
  date: string;
  targetAmount: number;
  accumulatedCommission: number;
  estimatedPendingCommission: number;
  progressPercentage: number;
  rawPercentage: number;
  remainingTarget: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  completedAt?: string | null;
  eligibleOrdersCount: number;
  secondsRemaining: number;
  todayOrders?: Array<{
    orderId: string;
    commissionAmount: number;
    isCounted: boolean;
    orderStatus: string;
    time: string;
  }>;
}

export interface DayCalendarItem {
  dayIndex: number;
  dayName: string;
  date: string;
  dateFormatted: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  accumulatedCommission: number;
  targetAmount: number;
}

export interface WeeklyStreakData {
  weekStart: string;
  weekEnd: string;
  completedDays: number;
  totalDays: number;
  totalCommission: number;
  bonusPercentage: number;
  estimatedBonus: number;
  bonusAmount: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BONUS_PENDING' | 'BONUS_APPROVED' | 'BONUS_PAID';
  isEligibleForBonus: boolean;
  calendar: DayCalendarItem[];
}

export interface BonusHistoryItem {
  id: string;
  bonusType: string;
  baseCommission: number;
  bonusPercentage: number;
  bonusAmount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REVERSED';
  reversalReason?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface ProductSuggestionItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  providerPrice: number;
  estimatedCommission: number;
  ordersNeeded: number;
  imageUrl?: string | null;
  features?: string[];
  score?: number;
}

export interface SalesGamificationPanelProps {
  salesId?: string;
  partnerCode?: string;
  onNavigateToCatalog?: () => void;
  className?: string;
}

export function SalesGamificationPanel({
  salesId,
  partnerCode,
  onNavigateToCatalog: _onNavigateToCatalog,
  className = '',
}: SalesGamificationPanelProps) {
  const [overview, setOverview] = useState<{
    dailyMission: DailyMissionData;
    weeklyStreak: WeeklyStreakData;
    commissionSummary: {
      approvedWeeklyBonus: number;
      pendingWeeklyBonus: number;
      bonusHistory: BonusHistoryItem[];
    };
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [showBonusHistory, setShowBonusHistory] = useState<boolean>(false);

  // Fetch gamification overview
  const fetchOverview = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('asterra_admin_token') || localStorage.getItem('asterra_sales_token'))
        : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const queryParam = salesId ? `?salesId=${encodeURIComponent(salesId)}` : (partnerCode ? `?code=${encodeURIComponent(partnerCode)}` : '');
      const res = await fetch(`/api/v1/sales/gamification/overview${queryParam}`, {
        cache: 'no-store',
        headers,
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setOverview(data);
        if (data.dailyMission?.secondsRemaining) {
          setSecondsLeft(data.dailyMission.secondsRemaining);
        }
      }
    } catch (e) {
      console.error('[Gamification] Error fetching overview:', e);
    } finally {
      setIsLoading(false);
    }
  }, [salesId, partnerCode]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 45000); // Poll every 45s
    return () => clearInterval(interval);
  }, [fetchOverview]);

  // Live countdown timer to 23:59:59 WIB
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formattedCountdown = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const minutes = Math.floor((secondsLeft % 3600) / 60);
    const seconds = secondsLeft % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [secondsLeft]);

  if (isLoading && !overview) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-5 ${className}`}>
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs animate-pulse h-48" />
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs animate-pulse h-48" />
      </div>
    );
  }

  const dm = overview?.dailyMission;
  const ws = overview?.weeklyStreak;

  const isCompleted = dm?.status === 'COMPLETED';
  const isFailed = dm?.status === 'FAILED';
  const isInProgress = dm?.status === 'IN_PROGRESS';

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 2-COLUMN GRID: Daily Mission & Weekly Streak Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* CARD 1: DAILY MISSION */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow when completed */}
          {isCompleted && (
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          )}

          <div>
            {/* Top row: Mission Title & Status Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : isInProgress
                      ? 'bg-orange-50 text-orange-500 border border-orange-200/60'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Target className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight">Daily Mission</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      WIB (UTC+7)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Target komisi langsung Rp 25.000 / hari
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isCompleted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Streak Aktif ✓</span>
                  </span>
                ) : isInProgress ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Target Terlewati</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <span>Belum Mulai</span>
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Progress Numbers */}
            <div className="mt-5">
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                    <AnimatedNumber
                      value={dm?.accumulatedCommission ?? 0}
                      prefix="Rp "
                      className="font-mono font-black"
                    />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-400">
                    / Rp {(dm?.targetAmount ?? 25000).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-sm sm:text-base font-black font-mono ${
                      isCompleted ? 'text-emerald-600' : 'text-slate-700'
                    }`}
                  >
                    {dm?.progressPercentage ?? 0}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2">
                <AnimatedProgressBar
                  value={dm?.accumulatedCommission ?? 0}
                  max={dm?.targetAmount ?? 25000}
                  showShimmer={!isCompleted}
                  className="h-2.5 bg-slate-100"
                  barClassName={isCompleted ? 'bg-emerald-500' : 'bg-orange-500'}
                />
              </div>

              {/* Remaining target info & pending commissions */}
              <div className="mt-2.5 flex items-center justify-between text-[11px]">
                <div>
                  {isCompleted ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <span>🎉 Target hari ini tercapai! Daily streak Anda aktif.</span>
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      Sisa target hari ini:{' '}
                      <strong className="text-slate-900 font-mono">
                        Rp {(dm?.remainingTarget ?? 25000).toLocaleString('id-ID')}
                      </strong>
                    </span>
                  )}
                </div>
                {Boolean(dm?.estimatedPendingCommission && dm.estimatedPendingCommission > 0) && (
                  <div className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                    +Rp {(dm?.estimatedPendingCommission || 0).toLocaleString('id-ID')} (Pending Verifikasi)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom row: Cutoff Countdown & Contributing Orders */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset harian dalam:</span>
              <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                {formattedCountdown}
              </span>
            </div>

            <div className="text-slate-500 text-[11px]">
              <span className="font-semibold text-slate-900">{dm?.eligibleOrdersCount ?? 0}</span> transaksi valid
            </div>
          </div>
        </div>

        {/* CARD 2: WEEKLY STREAK & CALENDAR */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header: Weekly Streak & 10% Bonus Chip */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 shadow-xs">
                  <Flame className="w-5 h-5 fill-indigo-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900 tracking-tight">Weekly Streak</h3>
                    <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-2xs flex items-center gap-1">
                      <Gift className="w-2.5 h-2.5" />
                      <span>+10% Bonus Komisi</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Pertahankan streak 7 hari berturut-turut untuk bonus ekstra
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-indigo-700 font-mono">
                  {ws?.completedDays ?? 0}/7 Hari
                </div>
                <div className="text-[10px] text-slate-400">
                  {ws?.weekStart ? `${ws.weekStart.slice(5)} s/d ${ws.weekEnd?.slice(5)}` : 'Minggu Ini'}
                </div>
              </div>
            </div>

            {/* 7-Day Visual Calendar Tracker */}
            <div className="mt-4 pt-1 grid grid-cols-7 gap-1.5 sm:gap-2">
              {(ws?.calendar || []).map((day) => {
                const isDayCompleted = day.status === 'COMPLETED';
                const isDayFailed = day.status === 'FAILED';
                const isDayToday = day.isToday;

                return (
                  <div
                    key={day.dayIndex}
                    className={`rounded-xl p-2 text-center transition-all flex flex-col items-center justify-between border ${
                      isDayToday
                        ? isDayCompleted
                          ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-orange-50/70 border-orange-300 ring-2 ring-orange-500/20 shadow-xs'
                        : isDayCompleted
                        ? 'bg-emerald-50/50 border-emerald-200/80'
                        : isDayFailed
                        ? 'bg-rose-50/40 border-rose-200/60'
                        : 'bg-slate-50/70 border-slate-200/70'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {day.dayName.slice(0, 3)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {day.dateFormatted}
                    </span>

                    {/* Status Icon */}
                    <div className="my-1.5">
                      {isDayCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isDayFailed ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                          <XCircle className="w-3 h-3" />
                        </div>
                      ) : isDayToday ? (
                        <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center animate-pulse shadow-xs">
                          <Flame className="w-3 h-3 fill-white" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-[9px] font-mono font-semibold line-clamp-1 ${
                        isDayCompleted
                          ? 'text-emerald-700'
                          : isDayFailed
                          ? 'text-rose-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {isDayCompleted
                        ? `${Math.round(day.accumulatedCommission / 1000)}k`
                        : isDayToday
                        ? 'Hari Ini'
                        : isDayFailed
                        ? 'Missed'
                        : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom row: Total Commission & Estimated Bonus Payout */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Total Komisi Minggu Ini: </span>
              <strong className="text-slate-900 font-mono font-bold">
                Rp {(ws?.totalCommission ?? 0).toLocaleString('id-ID')}
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 text-[11px]">Estimasi Bonus (10%):</span>
              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                +Rp {(ws?.estimatedBonus ?? 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Bonus History Drawer / Toggle */}
          {Boolean(overview?.commissionSummary?.bonusHistory && overview.commissionSummary.bonusHistory.length > 0) && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowBonusHistory(!showBonusHistory)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-between w-full cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Riwayat Bonus Streak ({overview?.commissionSummary?.bonusHistory?.length || 0})</span>
                </span>
                <span>{showBonusHistory ? '▲ Tutup' : '▼ Lihat Riwayat'}</span>
              </button>

              {showBonusHistory && (
                <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {overview?.commissionSummary?.bonusHistory.map((bh) => (
                    <div
                      key={bh.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">
                          +Rp {bh.bonusAmount.toLocaleString('id-ID')}
                          <span className="ml-1.5 text-[10px] text-slate-500 font-normal">
                            (10% dari Rp {bh.baseCommission.toLocaleString('id-ID')})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {bh.createdAt?.slice(0, 10)}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bh.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : bh.status === 'APPROVED'
                            ? 'bg-indigo-100 text-indigo-800'
                            : bh.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bh.status === 'APPROVED' ? 'Saldo Siap Tarik' : bh.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Dynamic Product Suggestion Component
 * Replaces hardcoded products in Section 2 with live commission calculations
 * and non-repeating recommendations via exclude IDs.
 */
export function SalesProductSuggestionCard({
  salesId,
  partnerCode,
  onNavigateToCatalog,
}: {
  salesId?: string;
  partnerCode?: string;
  onNavigateToCatalog?: () => void;
}) {
  const [suggestions, setSuggestions] = useState<ProductSuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async (excludeIds: string[] = []) => {
    try {
      const qp = new URLSearchParams();
      if (salesId) qp.set('salesId', salesId);
      if (partnerCode) qp.set('code', partnerCode);
      if (excludeIds.length > 0) qp.set('exclude', excludeIds.join(','));
      qp.set('limit', '3');

      const token = typeof window !== 'undefined'
        ? (localStorage.getItem('asterra_admin_token') || localStorage.getItem('asterra_sales_token'))
        : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/v1/sales/gamification/suggestions?${qp.toString()}`, {
        cache: 'no-store',
        headers,
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error('[ProductSuggestion] Error fetching:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [salesId, partnerCode]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    const currentIds = suggestions.map((s) => s.id);
    fetchSuggestions(currentIds);
  };

  const handleCopyLink = (item: ProductSuggestionItem) => {
    const link = `${getStoreBaseUrl()}/products/${item.id}?ref=${partnerCode || 'AST-SALES'}`;
    navigator.clipboard.writeText(link);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Rekomendasi Target Harian</h3>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Recommended for your daily target
            </span>
          </div>
        </div>

        {/* Action buttons: Refresh & All Catalog */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh rekomendasi produk"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onNavigateToCatalog}
            className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer ml-1"
          >
            <span>Semua</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Product List */}
      <div className="space-y-3 pt-1">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
            <div className="h-14 bg-slate-100 rounded-xl" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            Belum ada rekomendasi produk saat ini.
          </div>
        ) : (
          suggestions.map((p, idx) => {
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all flex items-center justify-between gap-2.5 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-3.5 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <ProductBrandIcon name={p.brand || p.name} />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-slate-900">
                      {p.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-600 font-semibold font-mono">
                        Komisi: Rp {p.estimatedCommission.toLocaleString('id-ID')}/order
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 font-semibold">
                        Butuh ~{p.ordersNeeded} order
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="font-bold text-xs text-slate-900 font-mono">
                      Rp {p.price.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyLink(p)}
                    title="Salin Link Referral Produk"
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-300'
                        : 'bg-white hover:bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isCopied ? <Check className="w-3 h-3 stroke-[2.5]" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disclaimer / Transparency Note */}
      <div className="pt-1 text-[10px] text-slate-400 leading-relaxed border-t border-slate-100">
        Rekomendasi ini bersifat opsional untuk efisiensi penjualan. Seluruh transaksi produk tetap menghasilkan progress komisi langsung.
      </div>
    </div>
  );
}
