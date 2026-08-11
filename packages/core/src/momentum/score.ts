import {
  AMI_PILLAR_WEIGHTS,
  type DailyPageMetrics,
  type ExternalMomentumSignal,
  type MomentumBreakdown,
  type MomentumConfidence,
  type MomentumDataSource,
  type MomentumResult,
  type PillarScore,
} from './types';

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

function pillar(value: number, weight: number, source: MomentumDataSource): PillarScore {
  return { value: clamp(value, 0, 100), weight, source };
}

/** How far and wide the page's traffic spreads: acceleration, geographic reach, and channel diversity. */
function reachPillar(current: DailyPageMetrics, trailing7: DailyPageMetrics[], trailing30: DailyPageMetrics[]): PillarScore {
  const trafficAcceleration = accelerationScore(current.visits, average(trailing7.map((d) => d.visits)));

  const knownCountries = new Set(trailing30.flatMap((d) => d.countries));
  const newCountryCount = current.countries.filter((c) => !knownCountries.has(c)).length;
  const geographicExpansion = trailing30.length === 0 ? 50 : clamp(50 + newCountryCount * 15, 0, 100);

  const platformDiversity = platformDiversityScore(current.sources);

  const value = trafficAcceleration * 0.5 + geographicExpansion * 0.3 + platformDiversity * 0.2;
  const source: MomentumDataSource = trailing7.length === 0 ? 'estimated' : 'first-party';
  return pillar(value, AMI_PILLAR_WEIGHTS.reach, source);
}

/** How deeply fans engage once they land — the click-through ratio. Zero visits means there's nothing to measure engagement from at all, not a real "0%". */
function engagementPillar(current: DailyPageMetrics): PillarScore {
  if (current.visits === 0) return pillar(0, AMI_PILLAR_WEIGHTS.engagement, 'estimated');
  const clickDepth = (current.clicks / current.visits) * 200;
  return pillar(clickDepth, AMI_PILLAR_WEIGHTS.engagement, 'first-party');
}

/** How often a visit turns into a real, classified conversion (stream/pre-save/ticket/merch/follow) rather than just a click. */
function conversionPillar(current: DailyPageMetrics): PillarScore {
  if (current.visits === 0) return pillar(0, AMI_PILLAR_WEIGHTS.conversion, 'estimated');
  const value = (current.conversions / current.visits) * 300;
  return pillar(value, AMI_PILLAR_WEIGHTS.conversion, 'first-party');
}

/** How much traffic returns rather than bouncing once. */
function consistencyPillar(current: DailyPageMetrics): PillarScore {
  if (current.uniqueVisitors === 0) return pillar(0, AMI_PILLAR_WEIGHTS.consistency, 'estimated');
  const value = (current.returningVisitors / current.uniqueVisitors) * 150;
  return pillar(value, AMI_PILLAR_WEIGHTS.consistency, 'first-party');
}

/**
 * Growth outside the page itself. With a connected Viberate match, blends
 * that third-party cross-platform acceleration in as the dominant signal
 * over an organic fan-growth proxy; without one, the proxy is all there is.
 */
function amplificationPillar(
  current: DailyPageMetrics,
  trailing7: DailyPageMetrics[],
  external: ExternalMomentumSignal | undefined,
): PillarScore {
  const organicProxy = accelerationScore(current.uniqueVisitors, average(trailing7.map((d) => d.uniqueVisitors)));

  if (!external) {
    const source: MomentumDataSource = trailing7.length === 0 ? 'estimated' : 'first-party';
    return pillar(organicProxy, AMI_PILLAR_WEIGHTS.amplification, source);
  }

  const externalAcceleration = accelerationScore(external.current, average(external.history.slice(-7)));
  const value = organicProxy * 0.4 + externalAcceleration * 0.6;
  return pillar(value, AMI_PILLAR_WEIGHTS.amplification, 'third-party');
}

function calculateConfidence(breakdown: MomentumBreakdown): MomentumConfidence {
  const shareOf = (source: MomentumDataSource) =>
    Object.values(breakdown)
      .filter((p) => p.source === source)
      .reduce((sum, p) => sum + p.weight, 0);

  const firstPartyShare = shareOf('first-party');
  const thirdPartyShare = shareOf('third-party');
  const estimatedShare = shareOf('estimated');

  return {
    value: Math.round(firstPartyShare * 100),
    firstPartyShare,
    thirdPartyShare,
    estimatedShare,
  };
}

/**
 * Computes a page's daily Artist Momentum Index across the 5 weighted AMI
 * pillars (Reach 25%, Engagement 20%, Conversion 20%, Consistency 15%,
 * Amplification 20% — see `AMI_PILLAR_WEIGHTS`): not "how big" a page is,
 * but how much its traffic is accelerating and converting right now, using
 * only the current day's metrics plus trailing history for context. Pure
 * and side-effect-free — the ETL cron (apps/web) is responsible for
 * gathering `current`/`history` from Postgres and persisting the result.
 *
 * `external` is optional Viberate rank/score trend data, present only for
 * pages with a connected match — it strengthens the Amplification pillar
 * but never fully replaces the organic signal beneath it.
 */
export function calculateMomentumScore(
  current: DailyPageMetrics,
  history: DailyPageMetrics[],
  external?: ExternalMomentumSignal,
): MomentumResult {
  const trailing7 = history.slice(-7);
  const trailing30 = history.slice(-30);

  const breakdown: MomentumBreakdown = {
    reach: reachPillar(current, trailing7, trailing30),
    engagement: engagementPillar(current),
    conversion: conversionPillar(current),
    consistency: consistencyPillar(current),
    amplification: amplificationPillar(current, trailing7, external),
  };

  const score = clamp(
    Object.values(breakdown).reduce((sum, p) => sum + p.value * p.weight, 0),
    0,
    100,
  );

  return { score: Math.round(score), breakdown, confidence: calculateConfidence(breakdown) };
}
