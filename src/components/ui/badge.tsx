import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-primary/20 text-primary border-primary/30',
    secondary: 'bg-surface-raised text-foreground-muted border-border',
    outline: 'text-foreground border-border',
    success: 'bg-status-success/10 text-status-success border-status-success/20',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors',
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
