'use client';

import React from 'react';
import { useCountUpDetails } from '@/lib/hooks/use-count-up';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface AnimatedNumberProps {
  value: number;
  formatter?: (val: number) => string;
  showDelta?: boolean;
  className?: string;
  badgeClassName?: string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({
  value,
  formatter,
  showDelta = false,
  className = '',
  badgeClassName = '',
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const {
    formattedValue,
    direction,
    deltaPercent,
    isPulsing,
    isAnimating,
  } = useCountUpDetails(value, {
    formatter: formatter || ((v) => Math.round(v).toLocaleString('id-ID')),
  });

  return (
    <span
      className="inline-flex items-center gap-1.5 align-baseline"
      aria-label={formatter ? formatter(value) : value.toString()}
      aria-live={isAnimating ? 'off' : 'polite'}
    >
      <span
        className={`font-variant-numeric tabular-nums inline-block transition-colors duration-500 ${
          isPulsing
            ? direction === 'up'
              ? 'text-status-success'
              : 'text-status-error'
            : ''
        } ${className}`}
      >
        {prefix}
        {formattedValue}
        {suffix}
      </span>

      {showDelta && deltaPercent !== null && deltaPercent !== 0 && (
        <span
          className={`inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full transition-all duration-300 ${
            direction === 'up'
              ? 'bg-status-success/15 text-status-success'
              : 'bg-status-error/15 text-status-error'
          } ${badgeClassName}`}
        >
          {direction === 'up' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          <span>{Math.abs(deltaPercent)}%</span>
        </span>
      )}
    </span>
  );
}
