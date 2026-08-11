import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  'aria-label': string;
  children: ReactNode;
}

const variantClasses: Record<NonNullable<IconButtonProps['variant']>, string> = {
  ghost: 'text-ink-muted hover:bg-white/8 hover:text-ink',
  secondary: 'bg-white/7 text-ink hover:bg-white/12',
  danger: 'text-red-400/70 hover:bg-red-500/15 hover:text-red-300',
};

const sizeClasses: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'size-7',
  md: 'size-9',
};

export function IconButton({
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60',
        'disabled:pointer-events-none disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
