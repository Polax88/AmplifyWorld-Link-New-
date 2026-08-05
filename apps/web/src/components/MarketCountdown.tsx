'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'Closing…';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Live ticking countdown to a market's closesAt. Purely cosmetic once it hits zero — the next `openMarkets` refetch is what actually swaps in a fresh replacement market. */
export function MarketCountdown({ closesAt }: { closesAt: Date }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining = closesAt.getTime() - now;

  return (
    <span className="flex items-center gap-1">
      <Clock className="size-3.5" />
      {remaining <= 0 ? 'Closing…' : `Closes in ${formatRemaining(remaining)}`}
    </span>
  );
}
