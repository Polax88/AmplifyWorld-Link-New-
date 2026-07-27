import type { DailyPageMetrics, MomentumBreakdown, MomentumResult } from './types';

/** Weighted formula: how much each factor contributes to the final 0-100 score. */
export const MOMENTUM_WEIGHTS: Record<keyof MomentumBreakdown, number> = {
  trafficAcceleration: 0.3,
  uniqueFanGrowth: 0.2,
  geographicExpansion: 0.15,
  platformDiversity: 0.15,
  clickDepth: 0.1,
  retention: 0.1,
};

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
 */
export function calculateMomentumScore(current: DailyPageMetrics, history: DailyPageMetrics[]): MomentumResult {
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

  const breakdown: MomentumBreakdown = {
    trafficAcceleration,
    uniqueFanGrowth,
    geographicExpansion,
    platformDiversity,
    clickDepth,
    retention,
  };

  const score = clamp(
    Object.entries(breakdown).reduce(
      (sum, [key, value]) => sum + value * MOMENTUM_WEIGHTS[key as keyof MomentumBreakdown],
      0,
    ),
    0,
    100,
  );

  return { score: Math.round(score), breakdown };
}
