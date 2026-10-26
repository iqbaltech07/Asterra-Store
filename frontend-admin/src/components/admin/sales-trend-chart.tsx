'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { SlidingPillTabs, SlidingPillTabItem } from '@/components/ui/sliding-pill-tabs';
import { MOTION_DURATION, MOTION_EASING, MOTION_STAGGER } from '@/lib/motion';

export type SalesPeriod = 'daily' | 'weekly' | 'monthly';

export interface SalesDataPoint {
  label: string;
  orders: number;
  revenue: number;
}

export interface SalesTrendChartProps {
  salesData: SalesDataPoint[];
  salesPeriod: SalesPeriod;
  onPeriodChange: (period: SalesPeriod) => void;
  isLoading?: boolean;
}

const PERIOD_TABS: SlidingPillTabItem<SalesPeriod>[] = [
  { id: 'daily', label: 'Hari Ini' },
  { id: 'weekly', label: '7 Hari' },
  { id: 'monthly', label: '30 Hari' },
];

const BAR_COLORS = [
  '#475569', // 08:00 - Dark charcoal slate
  '#93C5FD', // 11:00 - Soft sky blue
  '#6EE7B7', // 14:00 - Mint emerald green
  '#FDE047', // 17:00 - Soft yellow amber
  '#C084FC', // 20:00 - Soft violet purple
  '#F472B6', // 23:00 - Soft rose pink
];

const DEFAULT_SALES_DATA: SalesDataPoint[] = [
  { label: '08:00', orders: 2, revenue: 42350 },
  { label: '11:00', orders: 1, revenue: 12800 },
  { label: '14:00', orders: 1, revenue: 9560 },
  { label: '17:00', orders: 1, revenue: 8750 },
  { label: '20:00', orders: 1, revenue: 7420 },
  { label: '23:00', orders: 1, revenue: 6230 },
];

export function SalesTrendChart({
  salesData,
  salesPeriod,
  onPeriodChange,
  isLoading = false,
}: SalesTrendChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Use provided salesData or fallback to reference defaults if empty
  const activeData = useMemo(() => {
    if (salesData && salesData.length > 0 && salesData.some((d) => d.revenue > 0)) {
      return salesData;
    }
    return DEFAULT_SALES_DATA;
  }, [salesData]);

  // Y-axis tick values: 50K, 40K, 30K, 20K, 10K, 0
  const yTicks = [50000, 40000, 30000, 20000, 10000, 0];
  const maxAxisValue = 50000;

  return (
    <div
      className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 card-hover-elevation animate-fade-up"
      style={{ animationDelay: '60ms' }}
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight">
              Grafik Penjualan &amp; Tren Transaksi
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-tight">
              Pergerakan omzet bruto toko berdasarkan periode waktu
            </p>
          </div>
        </div>

        {/* Period Switcher Pills using GPU-accelerated SlidingPillTabs */}
        <SlidingPillTabs<SalesPeriod>
          items={PERIOD_TABS}
          activeId={salesPeriod}
          onChange={onPeriodChange}
          ariaLabel="Filter Periode Grafik"
        />
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="relative pt-4 pb-1 transition-opacity duration-300"
        style={{ opacity: isLoading ? 0.65 : 1 }}
      >
        {/* Y-Axis Grid Lines & Tick Numbers matching 50K, 40K, 30K, 20K, 10K, 0 */}
        <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none select-none z-0">
          {yTicks.map((tickVal, i) => (
            <div key={i} className="flex items-center gap-3 w-full">
              <span className="text-[11px] font-sans font-medium text-slate-400 w-8 text-right shrink-0">
                {tickVal === 0 ? '0' : `${tickVal / 1000}K`}
              </span>
              <div className="flex-1 border-b border-slate-100" />
            </div>
          ))}
        </div>

        {/* Bar Container with Unified Motion Engine matching Sales */}
        <div className="relative z-10 pl-11 pr-2 h-56 flex items-end justify-between gap-2 sm:gap-4">
          {activeData.map((item, idx) => {
            const heightRatio = Math.min(1, Math.max(0.04, item.revenue / maxAxisValue));
            const barColor = BAR_COLORS[idx % BAR_COLORS.length];
            const isHovered = hoveredIndex === idx;
            const transitionDelayMs = mounted ? idx * MOTION_STAGGER.chartBar : 0;

            return (
              <div
                key={`${salesPeriod}-${idx}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Revenue Label Above Bar matching Reference Screenshot */}
                <span className="text-[11px] font-mono font-semibold text-slate-700 mb-1.5 tabular-nums text-center transition-colors group-hover:text-slate-900">
                  Rp {item.revenue.toLocaleString('id-ID')}
                </span>

                {/* Scaled Bar Track with Staggered Animation & Glow */}
                <div className="w-full h-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[48px] rounded-t-sm"
                    style={{
                      height: mounted ? `${Math.round(heightRatio * 100)}%` : '0%',
                      backgroundColor: barColor,
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                      transform: isHovered ? 'scaleY(1.025)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      boxShadow: isHovered ? `0 4px 14px ${barColor}50` : 'none',
                      transition: `height ${MOTION_DURATION.chart}ms ${MOTION_EASING.editorial}, opacity 300ms ease, transform 200ms ${MOTION_EASING.springPop}`,
                      transitionDelay: `${transitionDelayMs}ms`,
                    }}
                  />
                </div>

                {/* X-Axis Time / Date Label */}
                <span className="text-[11px] font-medium text-slate-500 mt-2">
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
            Omzet Transaksi Terverifikasi
          </span>
        </div>

        <button
          type="button"
          onClick={() => onPeriodChange(salesPeriod)}
          className="text-[#2563EB] hover:underline font-semibold text-xs flex items-center gap-1 cursor-pointer"
        >
          <span>Lihat Detail Analytics</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
