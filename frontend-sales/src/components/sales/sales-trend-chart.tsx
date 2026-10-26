'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart3, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { MOTION_DURATION, MOTION_EASING, MOTION_STAGGER, isReducedMotion } from '@/lib/motion';
import { SlidingPillTabs, SlidingTabOption } from '@/components/ui/sliding-pill-tabs';
import type { SalesOrder } from './types';

export type SalesPeriod = 'daily' | 'weekly' | 'monthly';

const PERIOD_TABS: Array<SlidingTabOption<SalesPeriod>> = [
  { id: 'daily', label: 'Hari Ini' },
  { id: 'weekly', label: '7 Hari' },
  { id: 'monthly', label: '30 Hari' },
];

export interface SalesDataPoint {
  label: string;
  orders: number;
  revenue: number;
  periodDescription?: string;
}

export interface SalesTrendChartProps {
  title?: string;
  subtitle?: string;
  legendLabel?: string;
  salesData?: SalesDataPoint[];
  salesPeriod?: SalesPeriod;
  onPeriodChange?: (period: SalesPeriod) => void;
  isLoading?: boolean;
  orders?: SalesOrder[];
  partnerRate?: number;
  totalCommission?: number;
  onNavigateAnalytics?: () => void;
}

const BAR_COLORS = [
  '#475569', // 1. Dark charcoal slate
  '#93C5FD', // 2. Soft sky blue
  '#6EE7B7', // 3. Mint emerald green
  '#FDE047', // 4. Soft yellow amber
  '#C084FC', // 5. Soft violet purple
  '#F472B6', // 6. Soft rose pink
  '#38BDF8', // 7. Soft cyan sky (for 7-day view)
];

// Default 6 time intervals for daily view
const DAILY_BUCKETS = [
  { label: '08:00', periodDescription: '00:00 - 08:59 WIB' },
  { label: '11:00', periodDescription: '09:00 - 11:59 WIB' },
  { label: '14:00', periodDescription: '12:00 - 14:59 WIB' },
  { label: '17:00', periodDescription: '15:00 - 17:59 WIB' },
  { label: '20:00', periodDescription: '18:00 - 20:59 WIB' },
  { label: '23:00', periodDescription: '21:00 - 23:59 WIB' },
];

/**
 * Formats a local date to YYYY-MM-DD string
 */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates optimal dynamic Y-axis maximum & 6 tick intervals
 */
function calculateYAxisTicks(maxValue: number): { maxAxisValue: number; yTicks: number[] } {
  let ceiling = 50000;
  if (maxValue === 0) ceiling = 50000;
  else if (maxValue <= 10000) ceiling = 10000;
  else if (maxValue <= 25000) ceiling = 25000;
  else if (maxValue <= 50000) ceiling = 50000;
  else if (maxValue <= 100000) ceiling = 100000;
  else if (maxValue <= 200000) ceiling = 200000;
  else if (maxValue <= 500000) ceiling = 500000;
  else if (maxValue <= 1000000) ceiling = 1000000;
  else ceiling = Math.ceil(maxValue / 200000) * 200000;

  const yTicks = [
    ceiling,
    Math.round(ceiling * 0.8),
    Math.round(ceiling * 0.6),
    Math.round(ceiling * 0.4),
    Math.round(ceiling * 0.2),
    0,
  ];

  return { maxAxisValue: ceiling, yTicks };
}

function formatTickLabel(val: number): string {
  if (val === 0) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
  return `${Math.round(val / 1000)}K`;
}

/**
 * Animated individual revenue label with Monetira-style count-up motion
 */
function AnimatedBarRevenue({ value, isHovered }: { value: number; isHovered: boolean }) {
  const formatted = useCountUp(value, { duration: MOTION_DURATION.chart });
  return (
    <span
      className={`text-[10px] sm:text-[11px] font-mono font-semibold mb-1.5 tabular-nums text-center transition-all duration-200 ${
        isHovered ? 'text-slate-900 font-bold scale-105' : 'text-slate-700'
      }`}
    >
      Rp {formatted}
    </span>
  );
}

export function SalesTrendChart({
  title = 'Grafik Performa Penjualan & Komisi Sales',
  subtitle = 'Pergerakan omzet referral dan estimasi komisi Anda berdasarkan periode waktu',
  legendLabel = 'Komisi Referral Terverifikasi',
  salesData,
  salesPeriod = 'daily',
  onPeriodChange,
  isLoading = false,
  orders = [],
  partnerRate = 10,
  totalCommission: _totalCommission,
  onNavigateAnalytics,
}: SalesTrendChartProps) {
  const [currentPeriod, setCurrentPeriod] = useState<SalesPeriod>(salesPeriod);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 80);
    return () => clearTimeout(timer);
  }, []);

  const handlePeriodChange = (period: SalesPeriod) => {
    setCurrentPeriod(period);
    setHoveredIndex(null);
    if (onPeriodChange) onPeriodChange(period);
  };

  // Compute active dataset based on selected period & actual partner orders
  const activeData: SalesDataPoint[] = useMemo(() => {
    // 1. If explicit salesData provided and contains values, use it
    if (salesData && salesData.length > 0) {
      return salesData;
    }

    const now = new Date();

    // 2. Daily View: 6 time buckets for today
    if (currentPeriod === 'daily') {
      const todayStr = toLocalDateString(now);
      const buckets: SalesDataPoint[] = DAILY_BUCKETS.map((b) => ({
        label: b.label,
        orders: 0,
        revenue: 0,
        periodDescription: b.periodDescription,
      }));

      if (orders && orders.length > 0) {
        const todayOrders = orders.filter((o) => {
          if (!o.createdAt) return false;
          const oDate = new Date(o.createdAt);
          return toLocalDateString(oDate) === todayStr;
        });

        todayOrders.forEach((o) => {
          const date = new Date(o.createdAt);
          const hour = date.getHours();
          const comm = o.commission || Math.round((o.totalAmount || 0) * (partnerRate / 100));

          let bIndex = 0;
          if (hour < 9) bIndex = 0;
          else if (hour < 12) bIndex = 1;
          else if (hour < 15) bIndex = 2;
          else if (hour < 18) bIndex = 3;
          else if (hour < 21) bIndex = 4;
          else bIndex = 5;

          buckets[bIndex].orders += 1;
          buckets[bIndex].revenue += comm;
        });
      }

      return buckets;
    }

    // 3. Weekly View: Last 7 days
    if (currentPeriod === 'weekly') {
      const days: SalesDataPoint[] = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dStr = toLocalDateString(d);
        const dLabel = `${d.getDate()} ${monthNames[d.getMonth()]}`;

        const matchedOrders = (orders || []).filter((o) => {
          if (!o.createdAt) return false;
          const oDate = new Date(o.createdAt);
          return toLocalDateString(oDate) === dStr;
        });

        const totalComm = matchedOrders.reduce((sum, o) => {
          return sum + (o.commission || Math.round((o.totalAmount || 0) * (partnerRate / 100)));
        }, 0);

        days.push({
          label: dLabel,
          orders: matchedOrders.length,
          revenue: totalComm,
          periodDescription: `${dLabel} ${d.getFullYear()}${i === 0 ? ' (Hari Ini)' : ''}`,
        });
      }

      return days;
    }

    // 4. Monthly View: 6 intervals across 30 days
    const intervals: SalesDataPoint[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 5; i >= 0; i--) {
      const startDaysAgo = (i + 1) * 5;
      const endDaysAgo = i * 5;
      const dStart = new Date(now);
      dStart.setDate(dStart.getDate() - startDaysAgo);
      dStart.setHours(0, 0, 0, 0);

      const dEnd = new Date(now);
      dEnd.setDate(dEnd.getDate() - endDaysAgo);
      dEnd.setHours(23, 59, 59, 999);

      const matchedOrders = (orders || []).filter((o) => {
        if (!o.createdAt) return false;
        const oDate = new Date(o.createdAt);
        return oDate >= dStart && oDate <= dEnd;
      });

      const totalComm = matchedOrders.reduce((sum, o) => {
        return sum + (o.commission || Math.round((o.totalAmount || 0) * (partnerRate / 100)));
      }, 0);

      const label = `${dStart.getDate()} - ${dEnd.getDate()} ${monthNames[dEnd.getMonth()]}`;
      intervals.push({
        label,
        orders: matchedOrders.length,
        revenue: totalComm,
        periodDescription: `Rentang ${label} ${dEnd.getFullYear()}`,
      });
    }

    return intervals;
  }, [salesData, orders, currentPeriod, partnerRate]);

  // Aggregate statistics for active period
  const totalPeriodRevenue = useMemo(() => {
    return activeData.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [activeData]);

  const totalPeriodOrders = useMemo(() => {
    return activeData.reduce((acc, curr) => acc + curr.orders, 0);
  }, [activeData]);

  const animatedTotalRevenueStr = useCountUp(totalPeriodRevenue, { duration: MOTION_DURATION.counter });

  const maxRevenueInData = useMemo(() => {
    return Math.max(...activeData.map((d) => d.revenue), 1000);
  }, [activeData]);

  const { maxAxisValue, yTicks } = useMemo(() => {
    return calculateYAxisTicks(maxRevenueInData);
  }, [maxRevenueInData]);

  const periodBadgeText = useMemo(() => {
    if (currentPeriod === 'weekly') return '7 Hari Terakhir';
    if (currentPeriod === 'monthly') return '30 Hari Terakhir';
    return 'Hari Ini';
  }, [currentPeriod]);

  const reducedMotion = isReducedMotion();

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 animate-fade-up">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 leading-tight">
                {title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 transition-all duration-300">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>Aktif</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Period Switcher with Smooth Sliding Pill Indicator */}
        <SlidingPillTabs<SalesPeriod>
          tabs={PERIOD_TABS}
          activeTab={currentPeriod}
          onChange={handlePeriodChange}
          ariaLabel="Filter Periode Grafik"
          className="self-start sm:self-auto"
        />
      </div>

      {/* Period Stats Summary Pill Banner with Live Animated Count-Up */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs transition-colors duration-300">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>
            Total Komisi <strong>{periodBadgeText}</strong>:
          </span>
          <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
            Rp {animatedTotalRevenueStr}
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500 text-[11px]">
          <span>
            Volume: <strong className="text-slate-800">{totalPeriodOrders} Pesanan</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Bagi Hasil: <strong className="text-emerald-600">{partnerRate}%</strong>
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="relative pt-4 pb-1 transition-opacity duration-300"
        style={{ opacity: isLoading ? 0.65 : 1 }}
      >
        {/* Y-Axis Grid Lines & Dynamic Tick Numbers */}
        <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none select-none z-0">
          {yTicks.map((tickVal, i) => (
            <div key={i} className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-sans font-medium text-slate-400 w-9 text-right shrink-0 tabular-nums">
                {formatTickLabel(tickVal)}
              </span>
              <div className="flex-1 border-b border-slate-100" />
            </div>
          ))}
        </div>

        {/* Subtle Zero-Activity Notification Banner */}
        {totalPeriodOrders === 0 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-xs mb-1 backdrop-blur-xs">
              <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Belum ada aktivitas penjualan pada periode ini</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm">
              Bagikan tautan referral atau kupon Anda untuk mulai mencatat pesanan dan komisi.
            </p>
          </div>
        )}

        {/* Bar Container with Unified Admin Motion Engine */}
        <div className="relative z-10 pl-12 pr-2 h-56 flex items-end justify-between gap-1.5 sm:gap-3">
          {activeData.map((item, idx) => {
            const hasRevenue = item.revenue > 0;
            const heightRatio = hasRevenue ? Math.min(1, Math.max(0.06, item.revenue / maxAxisValue)) : 0;
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];
            const isHovered = hoveredIndex === idx;

            // Staggered motion delay matching admin motion tokens
            const transitionDelayMs = !reducedMotion && mounted && hasRevenue ? idx * MOTION_STAGGER.chartBar : 0;

            return (
              <div
                key={`${currentPeriod}-${idx}-${item.label}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
              >
                {/* Floating Interactive Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-30 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95">
                    <div className="bg-slate-900 text-white rounded-lg px-2.5 py-1.5 shadow-xl text-[10px] whitespace-nowrap border border-slate-700/60 flex flex-col items-center gap-0.5">
                      <div className="font-bold text-amber-300 flex items-center gap-1">
                        <span>{item.periodDescription || item.label}</span>
                      </div>
                      <div className="font-mono font-semibold text-white">
                        Rp {item.revenue.toLocaleString('id-ID')} ({item.orders} Order)
                      </div>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-2 border-r border-b border-slate-700/60" />
                    </div>
                  </div>
                )}

                {/* Animated Revenue Label with Count-Up Motion */}
                {hasRevenue ? (
                  <AnimatedBarRevenue value={item.revenue} isHovered={isHovered} />
                ) : (
                  <span className="text-[10px] sm:text-[11px] font-mono mb-1.5 tabular-nums text-center text-slate-300 select-none">
                    -
                  </span>
                )}

                {/* Scaled Bar Track with Staggered Height Animation matching Admin */}
                <div className="w-full h-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[48px] rounded-t-md"
                    style={{
                      height: mounted && hasRevenue ? `${Math.round(heightRatio * 100)}%` : '2px',
                      backgroundColor: hasRevenue ? barColor : '#E2E8F0',
                      transition: reducedMotion
                        ? 'none'
                        : `height ${MOTION_DURATION.chart}ms ${MOTION_EASING.editorial}, opacity 300ms ease, transform 200ms ${MOTION_EASING.springPop}`,
                      transitionDelay: `${transitionDelayMs}ms`,
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                      transform: isHovered && hasRevenue ? 'scaleY(1.025)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      boxShadow: isHovered && hasRevenue ? `0 4px 14px ${barColor}50` : 'none',
                    }}
                  />
                </div>

                {/* X-Axis Time / Date Label */}
                <span
                  className={`text-[10px] sm:text-[11px] font-medium mt-2 transition-colors duration-200 truncate max-w-full text-center ${
                    isHovered ? 'text-slate-900 font-bold' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info: Dot Legend on Left & Analytics Link on Right */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#475569]" />
          <span className="text-xs text-slate-600 font-medium">
            {legendLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigateAnalytics) {
              onNavigateAnalytics();
            } else {
              handlePeriodChange(currentPeriod);
            }
          }}
          className="text-[#2563EB] hover:underline font-semibold text-xs flex items-center gap-1 cursor-pointer group"
        >
          <span>Lihat Detail Analytics</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </div>
  );
}
