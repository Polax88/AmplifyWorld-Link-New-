'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

export interface LogoProps {
  className?: string;
  height?: number;
  src?: string;
}

/**
 * Official AmplifyWorld wordmark. Falls back to a styled text wordmark if
 * the SVG asset isn't present at `src` yet (e.g. `apps/web/public/logos/`) —
 * drop the real file in and every call site upgrades automatically, no code
 * change needed.
 */
export function Logo({ className, height = 20, src = '/logos/amplifyworld-wordmark.svg' }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The server-rendered <img> can start loading (and erroring, on a fast
  // localhost 404) before hydration attaches `onError` — that event is
  // otherwise lost. Checking `complete`/`naturalWidth` on mount catches it.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  if (failed) {
    return <span className={cn('text-sm font-semibold tracking-tight text-white', className)}>AmplifyWorld</span>;
  }

  return (
    <img
      ref={imgRef}
      src={src}
      alt="AmplifyWorld"
      height={height}
      style={{ height, width: 'auto' }}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
