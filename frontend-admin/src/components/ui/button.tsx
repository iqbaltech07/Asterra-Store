'use client';

import * as React from 'react';
import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MOTION_DURATION } from '@/lib/motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'navy' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      loadingText,
      success = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const btnRef = React.useRef<HTMLButtonElement | null>(null);
    const [lockedMinWidth, setLockedMinWidth] = React.useState<number | undefined>(undefined);

    // Lock minimum width when loading starts so button width never abruptly collapses or shifts layout
    React.useEffect(() => {
      if (loading && btnRef.current) {
        setLockedMinWidth(btnRef.current.offsetWidth);
      } else if (!loading) {
        // Smoothly release locked width after transition
        const timer = setTimeout(() => {
          setLockedMinWidth(undefined);
        }, MOTION_DURATION.micro);
        return () => clearTimeout(timer);
      }
    }, [loading]);

    const setMergedRef = (element: HTMLButtonElement | null) => {
      btnRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLButtonElement | null>).current = element;
      }
    };

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
        ref={setMergedRef}
        disabled={disabled || loading}
        style={{
          minWidth: lockedMinWidth ? `${lockedMinWidth}px` : undefined,
          ...props.style,
        }}
        className={cn(
          'relative inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] cursor-pointer',
          variantStyles,
          sizeStyles,
          className
        )}
        {...props}
      >
        {/* Loading Spinner with smooth opacity cross-fade */}
        {loading ? (
          <span className="inline-flex items-center gap-1.5 animate-in fade-in duration-150">
            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
            {loadingText && <span>{loadingText}</span>}
          </span>
        ) : success ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-300 animate-in zoom-in-75 duration-150">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{children}</span>
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };

