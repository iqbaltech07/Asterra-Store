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
        'bg-[#C96F55] text-[#F7F5EF] hover:bg-[#B86047] active:bg-[#A9553E] shadow-xs border border-transparent font-semibold',
      secondary:
        'bg-[#121A2A] text-[#F7F5EF] hover:bg-[#182235] active:bg-[#0C121E] shadow-xs border border-[#121A2A] font-semibold',
      navy:
        'bg-[#121A2A] text-[#F7F5EF] hover:bg-[#182235] active:bg-[#0C121E] shadow-xs border border-[#121A2A] font-semibold',
      outline:
        'border border-[#121A2A] bg-transparent text-[#121A2A] hover:bg-[#121A2A]/5 active:bg-[#121A2A]/10 font-semibold',
      ghost:
        'bg-transparent hover:bg-[#121A2A]/5 text-[#121A2A] hover:text-[#C96F55] font-medium',
      link:
        'text-[#C96F55] underline-offset-4 hover:underline p-0 h-auto font-medium',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-xs font-semibold',
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
