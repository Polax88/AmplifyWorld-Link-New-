import type { HTMLAttributes, Ref } from 'react';
import { cn } from '../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  ref?: Ref<HTMLDivElement>;
}

// React 19 supports `ref` as a plain prop on function components — no
// forwardRef needed. Accepting one here lets Card work as a dnd-kit
// draggable node without a separate ref-forwarding wrapper.
export function Card({ className, interactive = false, ref, ...props }: CardProps) {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-ink backdrop-blur-sm transition-all duration-150',
        interactive && 'cursor-pointer hover:border-white/16 hover:bg-white/[0.06] active:scale-[0.99]',
        className,
      )}
      {...props}
    />
  );
}
