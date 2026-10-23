'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BarChart3 } from 'lucide-react';
import { MOTION_DURATION, MOTION_EASING, MOTION_STAGGER, isReducedMotion } from '@/lib/motion';
import { AnimatedNumber } from '@/components/ui/animated-number';

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

interface TrackedBarItem extends SalesDataPoint {
  id: string;
  slotIndex: number;
  isEntering?: boolean;
  isExiting?: boolean;
}

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

  // Compute maximum revenue across current data points with a clean ceil
  const maxRevenue = useMemo(() => {
    const rawMax = Math.max(...salesData.map((d) => d.revenue), 1000);
    // Round up to nice number
    if (rawMax <= 100000) return Math.ceil(rawMax / 10000) * 10000;
    if (rawMax <= 1000000) return Math.ceil(rawMax / 100000) * 100000;
    return Math.ceil(rawMax / 500000) * 500000;
  }, [salesData]);

  // Y-axis tick values: 100%, 66%, 33%, 0%
  const yTicks = useMemo(() => {
    return [
      maxRevenue,
      Math.round(maxRevenue * 0.66),
      Math.round(maxRevenue * 0.33),
      0,
    ];
  }, [maxRevenue]);

  // Tracked bars with persistent stable slots to prevent remounting
  // Supports FLIP and graceful enter/exit transitions
  const barItems: TrackedBarItem[] = useMemo(() => {
    return salesData.map((d, idx) => ({
      ...d,
      id: `${salesPeriod}-bar-${idx}`,
      slotIndex: idx,
    }));
  }, [salesData, salesPeriod]);

  const reduced = isReducedMotion();

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 motion-card-interactive">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Grafik Penjualan & Tren Transaksi</span>
          </h3>
          <p className="text-xs text-foreground-muted">
            Pergerakan omzet bruto toko berdasarkan periode waktu
          </p>
        </div>

        {/* Period Switcher with Smooth Monetira Sliding Pill */}
        <div
          role="tablist"
          aria-label="Filter Periode Grafik"
          className="relative flex items-center bg-white/70 p-1 rounded-xl border border-white/80 text-xs min-w-[210px] shadow-xs"
        >
          {/* Sliding Active Pill */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-[#34404F] shadow-xs pointer-events-none"
            style={{
              transition: reduced
                ? 'none'
                : `left 220ms ${MOTION_EASING.editorial}, width 220ms ${MOTION_EASING.editorial}`,
              left:
                salesPeriod === 'daily'
                  ? '4px'
                  : salesPeriod === 'weekly'
                  ? 'calc(33.333% + 2px)'
                  : 'calc(66.666% - 1px)',
              width: 'calc(33.333% - 3px)',
            }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={salesPeriod === 'daily'}
            onClick={() => onPeriodChange('daily')}
            className={`relative z-10 flex-1 px-2.5 py-1 rounded-md text-center font-medium transition-colors duration-150 ${
              salesPeriod === 'daily'
                ? 'text-white font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Hari Ini
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={salesPeriod === 'weekly'}
            onClick={() => onPeriodChange('weekly')}
            className={`relative z-10 flex-1 px-2.5 py-1 rounded-md text-center font-medium transition-colors duration-150 ${
              salesPeriod === 'weekly'
                ? 'text-white font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            7 Hari
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={salesPeriod === 'monthly'}
            onClick={() => onPeriodChange('monthly')}
            className={`relative z-10 flex-1 px-2.5 py-1 rounded-md text-center font-medium transition-colors duration-150 ${
              salesPeriod === 'monthly'
                ? 'text-white font-semibold'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            30 Hari
          </button>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        className="relative pt-2 transition-opacity duration-300"
        style={{ opacity: isLoading ? 0.65 : 1 }}
      >
        {/* Y-Axis Grid Lines & Tick Numbers */}
        <div className="absolute inset-0 pb-7 flex flex-col justify-between pointer-events-none select-none z-0">
          {yTicks.map((tickVal, i) => (
            <div key={i} className="flex items-center gap-2 w-full">
              <span className="text-[10px] font-mono text-foreground-muted/70 w-16 text-right shrink-0">
                <AnimatedNumber
                  value={tickVal}
                  formatter={(v) => (v === 0 ? 'Rp 0' : `Rp ${(v / 1000).toLocaleString('id-ID')}k`)}
                />
              </span>
              <div className="flex-1 border-b border-border/40 border-dashed" />
            </div>
          ))}
        </div>

        {/* Floating Tooltip Indicator */}
        {hoveredIndex !== null && barItems[hoveredIndex] && (
          <div
            className="absolute z-30 pointer-events-none bg-surface border border-primary/30 text-foreground px-2.5 py-1.5 rounded-lg shadow-lg text-xs whitespace-nowrap transform -translate-x-1/2 -translate-y-full transition-all duration-150"
            style={{
              left: `${((hoveredIndex + 0.5) / barItems.length) * 100}%`,
              top: '8px',
            }}
          >
            <div className="text-[10px] font-mono font-bold text-primary">
              {barItems[hoveredIndex].label}
            </div>
            <div className="font-extrabold text-xs">
              Rp {barItems[hoveredIndex].revenue.toLocaleString('id-ID')}
            </div>
            <div className="text-[10px] text-foreground-muted">
              {barItems[hoveredIndex].orders} transaksi lunas
            </div>
          </div>
        )}

        {/* Stable Bar Container (Zero Remounting, Smooth GPU Scale Transitions) */}
        <div className="relative z-10 pl-18 pr-2 h-48 flex items-end gap-2 sm:gap-4 justify-between">
          {barItems.map((item, idx) => {
            const rawRatio = maxRevenue > 0 ? item.revenue / maxRevenue : 0;
            const heightRatio = Math.min(1, Math.max(0.04, rawRatio));
            const isHovered = hoveredIndex === idx;
            const hasHover = hoveredIndex !== null;

            const barColors = [
              { bg: '#4A5568', top: '#2D3748', glow: 'rgba(74, 85, 104, 0.4)' },
              { bg: '#60A5FA', top: '#3B82F6', glow: 'rgba(96, 165, 250, 0.4)' },
              { bg: '#34D399', top: '#10B981', glow: 'rgba(52, 211, 153, 0.4)' },
              { bg: '#FBBF24', top: '#F59E0B', glow: 'rgba(251, 191, 36, 0.4)' },
              { bg: '#A78BFA', top: '#8B5CF6', glow: 'rgba(167, 139, 250, 0.4)' },
              { bg: '#F472B6', top: '#EC4899', glow: 'rgba(244, 114, 182, 0.4)' },
            ];
            const palette = barColors[idx % barColors.length];

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
              >
                {/* Revenue Label Above Bar (as seen in reference screenshot) */}
                {item.revenue > 0 && (
                  <span className="text-[10px] font-mono font-bold text-foreground mb-1 tabular-nums hidden sm:block">
                    Rp {item.revenue.toLocaleString('id-ID')}
                  </span>
                )}

                {/* Bar Track & Scaled Fill */}
                <div className="w-full h-full flex items-end justify-center">
                  <div
                    className="w-full max-w-[42px] rounded-t-md relative transition-all"
                    style={{
                      height: mounted ? `${Math.max(6, Math.round(heightRatio * 100))}%` : '0%',
                      transitionDuration: '650ms',
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                      transitionDelay: `${idx * 30}ms`,
                      opacity: !mounted ? 0 : hasHover && !isHovered ? 0.45 : 1,
                      backgroundColor: palette.bg,
                      boxShadow: isHovered ? `0 6px 16px ${palette.glow}` : undefined,
                    }}
                  >
                    {/* Top Accent Edge */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1 rounded-t-md transition-colors"
                      style={{
                        backgroundColor: palette.top,
                      }}
                    />
                  </div>
                </div>

                {/* X-Axis Time / Date Label with Subtle Crossfade */}
                <span
                  className="text-[11px] font-medium text-foreground-muted truncate max-w-full mt-1.5 transition-all duration-200"
                  style={{
                    color: isHovered ? 'var(--primary)' : undefined,
                    fontWeight: isHovered ? 600 : 500,
                  }}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Analytics Link */}
      <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded bg-primary" />
          <span>Omzet Transaksi Terverifikasi</span>
          <span className="text-[11px] font-mono text-primary font-semibold hidden sm:inline">
            • Maksimum Periode: Rp {maxRevenue.toLocaleString('id-ID')}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onPeriodChange(salesPeriod)}
          className="text-primary hover:underline font-semibold flex items-center gap-1"
        >
          Lihat Detail Analytics →
        </button>
      </div>
    </div>
  );
}
