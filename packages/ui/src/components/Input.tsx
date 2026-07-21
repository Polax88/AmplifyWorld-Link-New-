import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

const fieldClasses =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 transition-colors ' +
  'focus:border-brand-400/50 focus:outline-none focus:ring-2 focus:ring-brand-400/20 disabled:opacity-50';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-xs font-medium text-white/60">{label}</span> : null}
      <input id={id} className={cn(fieldClasses, className)} {...props} />
      {hint ? <span className="text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function Textarea({ label, hint, className, id, ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-xs font-medium text-white/60">{label}</span> : null}
      <textarea id={id} className={cn(fieldClasses, 'min-h-24 resize-y', className)} {...props} />
      {hint ? <span className="text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}
