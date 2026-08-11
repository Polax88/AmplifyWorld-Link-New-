'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import type { MomentumBreakdown, MomentumConfidence } from '@amplifyworld/core';
import { Card, Sparkline, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';
import { ShareMomentumCardButton } from './ShareMomentumCardButton';

type Pillar = keyof MomentumBreakdown;

/** Fixed display order — matches the weighted order the AMI pillars are described in everywhere else (dashboard copy, docs). */
const PILLAR_ORDER: Pillar[] = ['reach', 'engagement', 'conversion', 'consistency', 'amplification'];

const PILLAR_LABELS: Record<Pillar, string> = {
  reach: 'Reach',
  engagement: 'Engagement',
  conversion: 'Conversion',
  consistency: 'Consistency',
  amplification: 'Amplification',
};

const PILLAR_DESCRIPTIONS: Record<Pillar, string> = {
  reach: 'How far and wide your traffic spreads — acceleration, geography, channels.',
  engagement: 'How deeply fans engage with your page once they land.',
  conversion: 'How often a visit turns into a real action — stream, pre-save, ticket, merch, follow.',
  consistency: 'How much of your traffic returns rather than bouncing once.',
  amplification: "Growth outside your page — cross-platform signal when connected, organic fan growth otherwise.",
};

/** Below this, a pillar is "low" enough to surface an action prompt rather than just the number. */
const LOW_SCORE_THRESHOLD = 45;

const PILLAR_ACTIONS: Record<Pillar, (pageId: string) => { label: string; href: string }> = {
  reach: () => ({ label: 'Boost this page on Discover', href: '/dashboard/discover' }),
  engagement: (pageId) => ({ label: 'Add a smart link', href: `/dashboard/${pageId}#smart-links` }),
  conversion: (pageId) => ({ label: 'Classify your links', href: `/dashboard/${pageId}#smart-links` }),
  consistency: (pageId) => ({ label: 'Create a Fan Pass', href: `/dashboard/${pageId}/passes` }),
  amplification: (pageId) => ({ label: 'Connect more platforms', href: `/dashboard/${pageId}#connected-platforms` }),
};

const SOURCE_BADGE: Record<MomentumBreakdown['reach']['source'], { label: string; tone: 'brand' | 'neutral' }> = {
  'first-party': { label: 'Your data', tone: 'brand' },
  'third-party': { label: 'Viberate', tone: 'brand' },
  estimated: { label: 'Estimated', tone: 'neutral' },
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

function PillarRow({
  pageId,
  pillar,
  score,
  viberateConnected,
}: {
  pageId: string;
  pillar: Pillar;
  score: MomentumBreakdown[Pillar];
  viberateConnected: boolean;
}) {
  const isLow = score.value < LOW_SCORE_THRESHOLD;
  const action = PILLAR_ACTIONS[pillar](pageId);
  const showConnectViberatePrompt = pillar === 'amplification' && !viberateConnected;

  return (
    <div className="flex flex-col gap-1 text-xs">
      <div className="flex items-center gap-3">
        <span className="w-32 shrink-0 text-ink-muted" title={PILLAR_DESCRIPTIONS[pillar]}>
          {PILLAR_LABELS[pillar]}
          <span className="ml-1.5 text-[10px] text-ink-faint">{Math.round(score.weight * 100)}%</span>
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
          <div
            className={isLow ? 'h-full rounded-full bg-amber-400' : 'h-full rounded-full bg-brand-400'}
            style={{ width: `${Math.round(score.value)}%` }}
          />
        </div>
        <span className="w-7 shrink-0 text-right tabular-nums text-ink-muted">{Math.round(score.value)}</span>
        <Badge tone={SOURCE_BADGE[score.source].tone} className="shrink-0">
          {SOURCE_BADGE[score.source].label}
        </Badge>
      </div>
      {showConnectViberatePrompt ? (
        <div className="ml-[8.5rem]">
          <Link
            href={`/dashboard/${pageId}#connected-platforms` as never}
            className="flex w-fit items-center gap-1 rounded-full border border-brand-400/25 bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-300 transition-colors hover:bg-brand-500/20"
          >
            Connect Viberate for a cross-platform signal
            <ArrowRight className="size-2.5" />
          </Link>
        </div>
      ) : isLow ? (
        <div className="ml-[8.5rem]">
          <ActionChip href={action.href} label={action.label} />
        </div>
      ) : null}
    </div>
  );
}

function confidenceLabel(value: number): { text: string; tone: 'success' | 'warning' | 'neutral' } {
  if (value >= 70) return { text: 'High confidence', tone: 'success' };
  if (value >= 40) return { text: 'Medium confidence', tone: 'warning' };
  return { text: 'Low confidence', tone: 'neutral' };
}

function ConfidenceBar({ confidence }: { confidence: MomentumConfidence }) {
  const { text, tone } = confidenceLabel(confidence.value);
  return (
    <div className="flex flex-col gap-1.5 border-t border-white/8 pt-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          <ShieldCheck className="size-3.5" />
          Confidence
        </span>
        <Badge tone={tone}>{confidence.value}% · {text}</Badge>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full bg-brand-400" style={{ width: `${confidence.firstPartyShare * 100}%` }} />
        <div className="h-full bg-white/30" style={{ width: `${confidence.thirdPartyShare * 100}%` }} />
        <div className="h-full bg-white/10" style={{ width: `${confidence.estimatedShare * 100}%` }} />
      </div>
      <p className="text-[11px] text-ink-faint">
        {Math.round(confidence.firstPartyShare * 100)}% from your connected first-party click &amp; conversion data
        {confidence.thirdPartyShare > 0 ? `, ${Math.round(confidence.thirdPartyShare * 100)}% from Viberate` : ''}
        {confidence.estimatedShare > 0 ? `, ${Math.round(confidence.estimatedShare * 100)}% estimated` : ''}.
      </p>
    </div>
  );
}

/** Per-page Artist Momentum Index panel — current score, 30-day trend, the 5 weighted pillars behind it, and a confidence indicator. */
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
      <Card className="gap-1 text-sm text-ink-muted">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
            <span className="flex items-center gap-1 text-xs text-ink-muted">
              <Sparkles className="size-3 text-brand-400" />
              {percentileLabel}
            </span>
          ) : null}
        </div>
        <Sparkline values={history.map((h) => h.score)} width={160} height={44} />
      </div>
      <p className="text-xs text-ink-faint">30-day trend · 0-100 AMI score</p>

      <div className="mt-1 flex flex-col gap-1.5 border-t border-white/8 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          The 5 AMI pillars — weight shown next to each
        </span>
        {PILLAR_ORDER.map((pillarKey) => (
          <PillarRow
            key={pillarKey}
            pageId={pageId}
            pillar={pillarKey}
            score={current.breakdown[pillarKey]}
            viberateConnected={viberateConnected}
          />
        ))}
      </div>

      <ConfidenceBar confidence={current.confidence} />
    </Card>
  );
}
