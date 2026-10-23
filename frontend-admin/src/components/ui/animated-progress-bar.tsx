'use client';

import React from 'react';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface AnimatedProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  className?: string;
  barClassName?: string;
  showShimmer?: boolean;
}

export function AnimatedProgressBar({
  value,
  max = 100,
  className = '',
  barClassName = '',
  showShimmer = false,
}: AnimatedProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const reduced = isReducedMotion();

  return (
    <div
      className={`w-full bg-surface-raised border border-border/80 rounded-full h-2 overflow-hidden relative ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={`h-full rounded-full bg-primary relative ${barClassName}`}
        style={{
          width: `${percent}%`,
          transition: reduced
            ? 'none'
            : `width ${MOTION_DURATION.chart}ms ${MOTION_EASING.editorial}`,
        }}
      >
        {showShimmer && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        )}
      </div>
    </div>
  );
}
