/** One page's aggregated activity for a single UTC calendar day — the ETL's unit of input. */
export interface DailyPageMetrics {
  date: string; // YYYY-MM-DD
  visits: number;
  uniqueVisitors: number;
  returningVisitors: number; // subset of uniqueVisitors seen on an earlier day too
  clicks: number;
  countries: string[]; // distinct countries seen this day
  sources: Record<string, number>; // traffic-source key -> visit count
}

export interface MomentumBreakdown {
  trafficAcceleration: number;
  uniqueFanGrowth: number;
  geographicExpansion: number;
  platformDiversity: number;
  clickDepth: number;
  retention: number;
}

export interface MomentumResult {
  score: number; // 0-100, rounded
  breakdown: MomentumBreakdown;
}

/**
 * What actually gets persisted per page per day (in `PageMomentumScore.breakdown`).
 * Storing the day's raw `metrics` alongside the computed `subScores` lets the
 * next day's ETL rebuild trailing history straight from prior score rows,
 * without re-aggregating raw AnalyticsEvent rows further back than "yesterday".
 */
export interface StoredMomentumBreakdown {
  subScores: MomentumBreakdown;
  metrics: DailyPageMetrics;
}
