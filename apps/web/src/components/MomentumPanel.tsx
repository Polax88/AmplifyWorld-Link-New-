'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Sparkles } from 'lucide-react';
import type { MomentumBreakdown } from '@amplifyworld/core';
import { Card, Sparkline, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';
import { ShareMomentumCardButton } from './ShareMomentumCardButton';

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

/** Below this, a sub-score is "low" enough to surface an action prompt rather than just the number. */
const LOW_SCORE_THRESHOLD = 45;

type ActionableFactor = Exclude<keyof MomentumBreakdown, 'externalMomentum'>;

/** Where a low sub-score sends the artist to actually do something about it — externalMomentum gets its own dedicated Viberate prompt instead (see CrossPlatformRow). */
const FACTOR_ACTIONS: Record<ActionableFactor, (pageId: string) => { label: string; href: string }> = {
  retention: (pageId) => ({ label: 'Create a Fan Pass', href: `/dashboard/${pageId}/passes` }),
  trafficAcceleration: () => ({ label: 'Boost this page on Discover', href: '/dashboard/discover' }),
  uniqueFanGrowth: (pageId) => ({ label: 'Add a smart link', href: `/dashboard/${pageId}#smart-links` }),
  clickDepth: (pageId) => ({ label: 'Add a smart link', href: `/dashboard/${pageId}#smart-links` }),
  geographicExpansion: (pageId) => ({
    label: 'Connect more platforms',
    href: `/dashboard/${pageId}#connected-platforms`,
  }),
  platformDiversity: (pageId) => ({
    label: 'Connect more platforms',
    href: `/dashboard/${pageId}#connected-platforms`,
  }),
};

function ActionChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href as never}
      className="flex w-fit items-center gap-1 rounded-full border border-brand-400/25 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-300 transition-colors hover:bg-brand-500/20"
    >
      {label}
      <ArrowRight className="size-2.5" />
    </Link>
  );
}

function BreakdownRow({ pageId, factor, value }: { pageId: string; factor: keyof MomentumBreakdown; value: number }) {
  const isLow = value < LOW_SCORE_THRESHOLD;
  const action = factor !== 'externalMomentum' ? FACTOR_ACTIONS[factor](pageId) : null;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-3">
        <span className="w-36 shrink-0 text-white/60">
          {FACTOR_LABELS[factor]}
          {factor === 'externalMomentum' ? (
            <span className="ml-1.5 rounded-full bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-medium text-brand-400">
              via Viberate
            </span>
          ) : null}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className={isLow ? 'h-full rounded-full bg-amber-400' : 'h-full rounded-full bg-brand-400'}
            style={{ width: `${Math.round(value)}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right tabular-nums text-white/70">{Math.round(value)}</span>
      </div>
      {isLow && action ? (
        <div className="ml-[9.5rem]">
          <ActionChip href={action.href} label={action.label} />
        </div>
      ) : null}
    </div>
  );
}

/** Dedicated externalMomentum treatment — a Viberate connection prompt, not the generic low-score action mechanism. */
function CrossPlatformRow({
  pageId,
  value,
  viberateConnected,
}: {
  pageId: string;
  value: number;
  viberateConnected: boolean;
}) {
  if (viberateConnected) {
    return <BreakdownRow pageId={pageId} factor="externalMomentum" value={value} />;
  }
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-brand-400/20 bg-brand-500/5 p-2 text-xs">
      <div className="flex items-center gap-3">
        <span className="w-36 shrink-0 text-white/60">{FACTOR_LABELS.externalMomentum}</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-white/15" style={{ width: '0%' }} />
        </div>
        <span className="w-7 shrink-0 text-right tabular-nums text-white/40">—</span>
      </div>
      <Link
        href={`/dashboard/${pageId}#connected-platforms` as never}
        className="ml-[9.5rem] flex w-fit items-center gap-1 rounded-full border border-brand-400/25 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-300 transition-colors hover:bg-brand-500/20"
      >
        Connect socials to boost accuracy (+15% score precision)
        <ArrowRight className="size-2.5" />
      </Link>
    </div>
  );
}

/** Per-page Artist Momentum Index panel — current score, 30-day trend, and the per-factor breakdown behind it. */
export function MomentumPanel({
  pageId,
  pageTitle,
  pageHandle,
  viberateConnected,
}: {
  pageId: string;
  pageTitle: string;
  pageHandle: string;
  viberateConnected: boolean;
}) {
  const momentum = trpc.momentum.forPage.useQuery({ pageId });
  const percentile = trpc.momentum.genrePercentile.useQuery({ pageId });

  if (momentum.isLoading) {
    return <Card className="h-[104px] animate-pulse" />;
  }

  if (!momentum.data?.current) {
    return (
      <Card className="gap-1 text-sm text-white/50">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Artist Momentum Index (AMI)
        </span>
        <p>Your AMI score appears after your page gets its first day of traffic.</p>
      </Card>
    );
  }

  const { current, history } = momentum.data;
  const change = current.scoreChange;
  const Icon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const tone = change > 0 ? 'success' : change < 0 ? 'warning' : 'neutral';
  const percentileLabel = percentile.data
    ? `Top ${percentile.data.percentile}% in ${percentile.data.genre} this week`
    : null;

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Artist Momentum Index (AMI)
        </span>
        <div className="flex items-center gap-2">
          <Badge tone={tone}>
            <Icon className="size-3" />
            {change > 0 ? '+' : ''}
            {change.toFixed(0)}
          </Badge>
          <ShareMomentumCardButton
            title={pageTitle}
            handle={pageHandle}
            score={current.score}
            percentileLabel={percentileLabel}
            history={history.map((h) => h.score)}
          />
        </div>
      </div>
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-semibold tabular-nums">{current.score}</span>
          {percentileLabel ? (
            <span className="flex items-center gap-1 text-xs text-white/50">
              <Sparkles className="size-3 text-brand-400" />
              {percentileLabel}
            </span>
          ) : null}
        </div>
        <Sparkline values={history.map((h) => h.score)} width={160} height={44} />
      </div>
      <p className="text-xs text-white/40">30-day trend · 0-100 AMI score</p>

      <div className="mt-1 flex flex-col gap-1.5 border-t border-white/8 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">
          How this score is calculated
        </span>
        {FACTOR_ORDER.filter((factor) => current.breakdown[factor] !== undefined).map((factor) =>
          factor === 'externalMomentum' ? (
            <CrossPlatformRow
              key={factor}
              pageId={pageId}
              value={current.breakdown[factor] as number}
              viberateConnected={viberateConnected}
            />
          ) : (
            <BreakdownRow key={factor} pageId={pageId} factor={factor} value={current.breakdown[factor] as number} />
          ),
        )}
      </div>
    </Card>
  );
}
