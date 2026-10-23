import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'navy' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variantStyles = {
      default:
        'bg-[#34404F] text-white hover:bg-[#25303D] active:bg-[#1E2732] shadow-xs border border-white/10 font-medium transition-all',
      primary:
        'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:bg-[#1E40AF] shadow-xs border border-blue-600/30 font-semibold transition-all',
      secondary:
        'bg-white/60 backdrop-blur-md text-[#10213D] hover:bg-white/80 active:bg-white/90 shadow-xs border border-white/70 font-medium transition-all',
      navy:
        'bg-[#1E2530] text-white hover:bg-[#2A3443] active:bg-[#111318] shadow-xs border border-white/10 font-medium transition-all',
      outline:
        'border border-white/80 bg-white/70 backdrop-blur-md text-[#10213D] hover:bg-white/90 hover:border-white active:bg-white font-medium shadow-xs transition-all',
      ghost:
        'bg-transparent hover:bg-slate-500/10 text-[#10213D] hover:text-[#10213D] font-medium transition-colors',
      link:
        'text-[#2563EB] underline-offset-4 hover:underline p-0 h-auto font-medium',
      destructive:
        'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] shadow-xs border border-red-600/30 font-semibold transition-all',
    }[variant];

    const sizeStyles = {
      default: 'h-10 px-4 py-2 text-sm rounded-xl',
      sm: 'h-8 px-3 text-xs rounded-lg',
      lg: 'h-11 px-6 text-base rounded-xl',
      icon: 'h-9 w-9 rounded-xl p-0',
    }[size];

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] cursor-pointer',
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
