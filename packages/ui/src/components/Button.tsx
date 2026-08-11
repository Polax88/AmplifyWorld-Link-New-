import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow hover:brightness-110 active:brightness-95',
  secondary: 'bg-white/7 text-ink hover:bg-white/12 active:bg-white/9',
  ghost: 'bg-transparent text-ink-muted hover:bg-white/7 hover:text-ink',
  outline: 'border border-white/12 text-ink hover:bg-white/7 hover:border-white/20',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-8 gap-1.5 rounded-full px-3.5 text-xs',
  md: 'h-10 gap-2 rounded-full px-5 text-sm',
  lg: 'h-12 gap-2 rounded-full px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
