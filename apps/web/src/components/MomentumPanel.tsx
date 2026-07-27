'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Sparkline, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/** Per-page Artist Momentum Index panel — current score + 30-day trend, shown in the page editor. */
export function MomentumPanel({ pageId }: { pageId: string }) {
  const momentum = trpc.momentum.forPage.useQuery({ pageId });

  if (momentum.isLoading) {
    return <Card className="h-[104px] animate-pulse" />;
  }

  if (!momentum.data?.current) {
    return (
      <Card className="gap-1 text-sm text-white/50">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Artist Momentum</span>
        <p>Score appears after your page gets its first day of traffic.</p>
      </Card>
    );
  }

  const { current, history } = momentum.data;
  const change = current.scoreChange;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const tone = change > 0 ? 'success' : change < 0 ? 'warning' : 'neutral';

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">Artist Momentum</span>
        <Badge tone={tone}>
          <Icon className="size-3" />
          {change > 0 ? '+' : ''}
          {change.toFixed(0)}
        </Badge>
      </div>
      <div className="flex items-end justify-between gap-4">
        <span className="text-3xl font-semibold tabular-nums">{current.score}</span>
        <Sparkline values={history.map((h) => h.score)} width={160} height={44} />
      </div>
      <p className="text-xs text-white/40">30-day trend · 0-100 momentum score</p>
    </Card>
  );
}
