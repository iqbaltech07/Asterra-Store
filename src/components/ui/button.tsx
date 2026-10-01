import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'navy' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-accent text-white hover:bg-accent-hover active:bg-accent-dark shadow-sm border border-transparent font-semibold',
      navy:
        'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-sm border border-navy-border font-semibold',
      destructive:
        'bg-status-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm font-semibold',
      outline:
        'border border-border bg-white text-navy-900 hover:bg-surface-secondary hover:text-accent hover:border-slate-300 font-medium',
      secondary:
        'bg-surface-secondary text-navy-900 hover:bg-slate-100 hover:text-accent border border-border font-medium',
      ghost:
        'bg-transparent hover:bg-surface-secondary text-navy-900 hover:text-accent font-medium',
      link:
        'text-accent underline-offset-4 hover:underline hover:text-accent-hover p-0 h-auto font-medium',
    }[variant];

    const sizeStyles = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 rounded-input px-3 text-xs',
      lg: 'h-11 rounded-input px-6 text-base',
      icon: 'h-9 w-9 rounded-input p-0',
    }[size];

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-input transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] cursor-pointer',
          variantStyles,
          sizeStyles,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
