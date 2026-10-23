import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'purple';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-black/5 text-[#171717] border-black/10',
    primary: 'bg-blue-50 text-[#2563EB] border-blue-200/80',
    secondary: 'bg-[#F8F9FB] text-[#666A73] border-[#E5E7EB]',
    outline: 'text-[#171717] border-[#E5E7EB] bg-white',
    success: 'bg-emerald-50 text-[#16A36A] border-emerald-200/80',
    warning: 'bg-amber-50 text-[#D97706] border-amber-200/80',
    destructive: 'bg-rose-50 text-[#EF4444] border-rose-200/80',
    purple: 'bg-purple-50 text-[#8B5CF6] border-purple-200/80',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
