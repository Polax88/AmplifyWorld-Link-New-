import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-all duration-150',
        interactive && 'cursor-pointer hover:border-white/20 hover:bg-white/[0.07] active:scale-[0.99]',
        className,
      )}
      {...props}
    />
  );
}
