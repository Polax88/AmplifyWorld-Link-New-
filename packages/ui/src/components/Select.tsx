import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
}

export function Select({ label, hint, className, children, id, ...props }: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-xs font-medium text-ink-muted">{label}</span> : null}
      <span className="relative block">
        <select
          id={id}
          className={cn(
            'w-full appearance-none rounded-xl border border-white/8 bg-white/[0.035] px-3.5 py-2.5 pr-9 text-sm text-ink transition-colors',
            'focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      </span>
      {hint ? <span className="text-xs text-ink-faint">{hint}</span> : null}
    </label>
  );
}
