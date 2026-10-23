'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { MOTION_DURATION, MOTION_EASING, isReducedMotion } from '@/lib/motion';

export interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const normStatus = (status || '').toLowerCase();

  let variantClasses = 'bg-status-warning/15 text-status-warning border-status-warning/30';
  let defaultLabel = 'Pending';

  if (normStatus === 'completed' || normStatus === 'paid' || normStatus === 'settlement' || normStatus === 'active') {
    variantClasses = 'bg-status-success/15 text-status-success border-status-success/30';
    defaultLabel = normStatus === 'active' ? 'Aktif' : 'Lunas';
  } else if (normStatus === 'processing') {
    variantClasses = 'bg-primary/15 text-primary border-primary/30';
    defaultLabel = 'Diproses';
  } else if (normStatus === 'cancelled' || normStatus === 'failed' || normStatus === 'expired' || normStatus === 'suspended') {
    variantClasses = 'bg-status-error/15 text-status-error border-status-error/30';
    defaultLabel = normStatus === 'suspended' ? 'Suspended' : 'Dibatalkan';
  } else if (normStatus === 'archived') {
    variantClasses = 'bg-muted text-foreground-muted border-border';
    defaultLabel = 'Diarsipkan';
  }

  const displayLabel = label || defaultLabel;
  const reduced = isReducedMotion();

  return (
    <Badge
      key={normStatus}
      variant="outline"
      className={`text-[10px] font-semibold transition-all ${variantClasses} ${
        reduced ? '' : 'animate-scale-pop'
      } ${className}`}
      style={{
        transitionDuration: `${MOTION_DURATION.base}ms`,
        transitionTimingFunction: MOTION_EASING.editorial,
      }}
    >
      {displayLabel}
    </Badge>
  );
}
