import { useId } from 'react';
import { cn } from '../lib/cn';

export interface LogoProps {
  className?: string;
  height?: number;
}

/**
 * AmplifyWorld's mark + wordmark, rendered inline as SVG/text — nothing to
 * fetch, nothing to 404 on. The mark is three ascending bars (momentum/
 * sound), on the brand gradient; the wordmark uses the shared ink token so
 * it stays legible against the design system's palette everywhere it's
 * dropped in (nav, login, public-page footer).
 */
export function Logo({ className, height = 20 }: LogoProps) {
  const gradientId = useId();

  return (
    <span className={cn('inline-flex items-center gap-2', className)} style={{ height }}>
      <svg width={height} height={height} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="7" fill={`url(#${gradientId})`} />
        <path d="M7.5 15.5V11" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 15.5V8" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 15.5V10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff4081" />
            <stop offset="1" stopColor="#c9004a" />
          </linearGradient>
        </defs>
      </svg>
      <span className="font-semibold tracking-tight text-ink" style={{ fontSize: Math.max(12, Math.round(height * 0.7)) }}>
        AmplifyWorld
      </span>
    </span>
  );
}
