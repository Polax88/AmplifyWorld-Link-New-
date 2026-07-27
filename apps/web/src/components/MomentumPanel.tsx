'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { MomentumBreakdown } from '@amplifyworld/core';
import { Card, Sparkline, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

const FACTOR_LABELS: Record<keyof MomentumBreakdown, string> = {
  trafficAcceleration: 'Traffic acceleration',
  uniqueFanGrowth: 'Fan growth',
  geographicExpansion: 'Geographic reach',
  platformDiversity: 'Platform diversity',
  clickDepth: 'Click depth',
  retention: 'Retention',
  externalMomentum: 'Cross-platform momentum',
};

const FACTOR_ORDER: Array<keyof MomentumBreakdown> = [
  'trafficAcceleration',
  'uniqueFanGrowth',
  'geographicExpansion',
  'platformDiversity',
  'clickDepth',
  'retention',
  'externalMomentum',
];

function BreakdownRow({ factor, value }: { factor: keyof MomentumBreakdown; value: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-36 shrink-0 text-white/60">
        {FACTOR_LABELS[factor]}
        {factor === 'externalMomentum' ? (
          <span className="ml-1.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
            via Viberate
          </span>
        ) : null}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-brand-400" style={{ width: `${Math.round(value)}%` }} />
      </div>
      <span className="w-7 shrink-0 text-right tabular-nums text-white/70">{Math.round(value)}</span>
    </div>
  );
}

/** Per-page Artist Momentum Index panel — current score, 30-day trend, and the per-factor breakdown behind it. */
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

      <div className="mt-1 flex flex-col gap-1.5 border-t border-white/8 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
          How this score is calculated
        </span>
        {FACTOR_ORDER.filter((factor) => current.breakdown[factor] !== undefined).map((factor) => (
          <BreakdownRow key={factor} factor={factor} value={current.breakdown[factor] as number} />
        ))}
      </div>
    </Card>
  );
}
