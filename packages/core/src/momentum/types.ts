/** One page's aggregated activity for a single UTC calendar day — the ETL's unit of input. */
export interface DailyPageMetrics {
  date: string; // YYYY-MM-DD
  visits: number;
  uniqueVisitors: number;
  returningVisitors: number; // subset of uniqueVisitors seen on an earlier day too
  clicks: number;
  /**
   * Subset of `clicks` classified as a real conversion (a non-`generic`
   * `conversionType` — see `analytics/conversion-types.ts`), not just a
   * click. Feeds the Conversion pillar below.
   */
  conversions: number;
  countries: string[]; // distinct countries seen this day
  sources: Record<string, number>; // traffic-source key -> visit count
}

/**
 * Where a pillar's value actually came from — the basis for the AMI
 * "Confidence" indicator. `first-party` means it's computed directly from
 * this page's own tracked Link data (clicks, visits, conversions).
 * `third-party` means it leans on a connected external signal (Viberate).
 * `estimated` means there wasn't enough data (no history, no traffic) to
 * compute a real value, so a neutral default was used instead.
 */
export type MomentumDataSource = 'first-party' | 'third-party' | 'estimated';

export interface PillarScore {
  /** 0-100. */
  value: number;
  /** This pillar's fixed weight in the overall score (0-1) — see `AMI_PILLAR_WEIGHTS`. Carried on the value itself so the UI can show weights next to scores without importing the constant separately. */
  weight: number;
  source: MomentumDataSource;
}

/**
 * The 5 weighted AMI pillars. Reach: how far/wide the page's traffic
 * spreads. Engagement: how deeply fans engage once they land. Conversion:
 * how often a visit turns into a real action (stream/pre-save/ticket/merch/
 * follow). Consistency: how much of that traffic returns rather than
 * bouncing once. Amplification: growth outside the page itself — a
 * connected Viberate cross-platform signal when available, an organic
 * fan-growth proxy otherwise.
 */
export interface MomentumBreakdown {
  reach: PillarScore;
  engagement: PillarScore;
  conversion: PillarScore;
  consistency: PillarScore;
  amplification: PillarScore;
}

export const AMI_PILLAR_WEIGHTS: Record<keyof MomentumBreakdown, number> = {
  reach: 0.25,
  engagement: 0.2,
  conversion: 0.2,
  consistency: 0.15,
  amplification: 0.2,
};

/** External (Viberate) rank/score trend for a page, if connected — feeds the Amplification pillar's third-party signal. */
export interface ExternalMomentumSignal {
  current: number;
  history: number[];
}

/**
 * How much of the overall score rests on real, connected data vs. an
 * estimate — the weighted share of `AMI_PILLAR_WEIGHTS` in each
 * `MomentumDataSource` bucket. `value` is the headline number the dashboard
 * leads with: the first-party share, as a 0-100 percentage.
 */
export interface MomentumConfidence {
  value: number;
  firstPartyShare: number; // 0-1
  thirdPartyShare: number; // 0-1
  estimatedShare: number; // 0-1
}

export interface MomentumResult {
  score: number; // 0-100, rounded
  breakdown: MomentumBreakdown;
  confidence: MomentumConfidence;
}

/**
 * What actually gets persisted per page per day (in `PageMomentumScore.breakdown`).
 * Storing the day's raw `metrics` alongside the computed `subScores` lets the
 * next day's ETL rebuild trailing history straight from prior score rows,
 * without re-aggregating raw AnalyticsEvent rows further back than "yesterday".
 */
export interface StoredMomentumBreakdown {
  subScores: MomentumBreakdown;
  confidence: MomentumConfidence;
  metrics: DailyPageMetrics;
}
