import type { DailyPageMetrics, ExternalMomentumSignal, MomentumBreakdown, MomentumResult } from './types';

type CoreMomentumBreakdown = Omit<MomentumBreakdown, 'externalMomentum'>;

/** Weighted formula for Link's own 6 factors — unchanged by the optional Viberate blend below. */
export const MOMENTUM_WEIGHTS: Record<keyof CoreMomentumBreakdown, number> = {
  trafficAcceleration: 0.3,
  uniqueFanGrowth: 0.2,
  geographicExpansion: 0.15,
  platformDiversity: 0.15,
  clickDepth: 0.1,
  retention: 0.1,
};

/**
 * Weight given to `externalMomentum` (Viberate) when present. The 6 core
 * weights above are *not* rescaled to compensate — a page without a
 * Viberate connection gets `score = coreWeightedSum` exactly as before this
 * factor existed; a page with one gets a blended score. This keeps the
 * existing formula byte-for-byte stable for the vast majority of pages.
 */
export const EXTERNAL_MOMENTUM_WEIGHT = 0.15;

const KNOWN_SOURCES = ['direct', 'social', 'search', 'referral'] as const;
const MAX_SOURCE_ENTROPY = Math.log(KNOWN_SOURCES.length);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Maps a percent-change-vs-baseline into a 0-100 score centered on 50
 * (no change = neutral). +100% growth maxes the score out; -50% or worse
 * bottoms it out. With no baseline to compare against, any activity at all
 * reads as positive momentum (new artists shouldn't be penalized for
 * lacking history).
 */
function accelerationScore(current: number, baseline: number): number {
  if (baseline <= 0) return current > 0 ? 65 : 50;
  const pctChange = (current - baseline) / baseline;
  return clamp(50 + pctChange * 100, 0, 100);
}

/** Shannon-entropy-based diversity of traffic sources, normalized against the known source set. */
function platformDiversityScore(sources: Record<string, number>): number {
  const total = Object.values(sources).reduce((sum, v) => sum + v, 0);
  if (total === 0) return 0;

  const entropy = KNOWN_SOURCES.reduce((sum, key) => {
    const count = sources[key] ?? 0;
    if (count === 0) return sum;
    const p = count / total;
    return sum - p * Math.log(p);
  }, 0);

  return clamp((entropy / MAX_SOURCE_ENTROPY) * 100, 0, 100);
}

/**
 * Computes a page's daily Artist Momentum Index: not "how big" a page is,
 * but how much its traffic is accelerating right now, using only the
 * current day's metrics plus trailing history for context. Pure and
 * side-effect-free — the ETL cron (apps/web) is responsible for gathering
 * `current`/`history` from Postgres and persisting the result.
 *
 * `external` is optional Viberate rank/score trend data, present only for
 * pages with a connected match. When absent, the score is exactly today's
 * 6-factor formula with no change — the blend below only ever applies on
 * top of it, never in place of it.
 */
export function calculateMomentumScore(
  current: DailyPageMetrics,
  history: DailyPageMetrics[],
  external?: ExternalMomentumSignal,
): MomentumResult {
  const trailing7 = history.slice(-7);
  const trailing30 = history.slice(-30);

  const trafficAcceleration = accelerationScore(current.visits, average(trailing7.map((d) => d.visits)));
  const uniqueFanGrowth = accelerationScore(
    current.uniqueVisitors,
    average(trailing7.map((d) => d.uniqueVisitors)),
  );

  const knownCountries = new Set(trailing30.flatMap((d) => d.countries));
  const newCountryCount = current.countries.filter((c) => !knownCountries.has(c)).length;
  const geographicExpansion =
    trailing30.length === 0 ? 50 : clamp(50 + newCountryCount * 15, 0, 100);

  const platformDiversity = platformDiversityScore(current.sources);

  const clickDepth = current.visits === 0 ? 0 : clamp((current.clicks / current.visits) * 200, 0, 100);

  const retention =
    current.uniqueVisitors === 0 ? 0 : clamp((current.returningVisitors / current.uniqueVisitors) * 150, 0, 100);

  const coreBreakdown: CoreMomentumBreakdown = {
    trafficAcceleration,
    uniqueFanGrowth,
    geographicExpansion,
    platformDiversity,
    clickDepth,
    retention,
  };

  const coreWeightedSum = Object.entries(coreBreakdown).reduce(
    (sum, [key, value]) => sum + value * MOMENTUM_WEIGHTS[key as keyof CoreMomentumBreakdown],
    0,
  );

  let score: number;
  let externalMomentum: number | undefined;
  if (external) {
    externalMomentum = accelerationScore(external.current, average(external.history.slice(-7)));
    score = clamp(
      coreWeightedSum * (1 - EXTERNAL_MOMENTUM_WEIGHT) + externalMomentum * EXTERNAL_MOMENTUM_WEIGHT,
      0,
      100,
    );
  } else {
    score = clamp(coreWeightedSum, 0, 100);
  }

  const breakdown: MomentumBreakdown =
    externalMomentum !== undefined ? { ...coreBreakdown, externalMomentum } : coreBreakdown;

  return { score: Math.round(score), breakdown };
}
