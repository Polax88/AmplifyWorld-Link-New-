import { describe, expect, it } from 'vitest';
import { calculateMomentumScore } from './score';
import type { DailyPageMetrics } from './types';

function metrics(overrides: Partial<DailyPageMetrics> = {}): DailyPageMetrics {
  return {
    date: '2026-07-27',
    visits: 100,
    uniqueVisitors: 80,
    returningVisitors: 20,
    clicks: 20,
    countries: ['US'],
    sources: { direct: 100 },
    ...overrides,
  };
}

describe('calculateMomentumScore', () => {
  it('scores a brand-new page (no history) within a plausible range, without penalizing missing history', () => {
    const result = calculateMomentumScore(metrics(), []);
    expect(result.breakdown.trafficAcceleration).toBeGreaterThan(50);
    expect(result.breakdown.uniqueFanGrowth).toBeGreaterThan(50);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('rewards accelerating traffic over a flat 7-day average', () => {
    const flatHistory = Array.from({ length: 7 }, (_, i) =>
      metrics({ date: `day-${i}`, visits: 100, uniqueVisitors: 80 }),
    );
    const accelerating = calculateMomentumScore(metrics({ visits: 130, uniqueVisitors: 104 }), flatHistory);
    const flat = calculateMomentumScore(metrics({ visits: 100, uniqueVisitors: 80 }), flatHistory);

    expect(accelerating.score).toBeGreaterThan(flat.score);
    expect(accelerating.breakdown.trafficAcceleration).toBeGreaterThan(flat.breakdown.trafficAcceleration);
  });

  it('penalizes declining traffic relative to history', () => {
    const flatHistory = Array.from({ length: 7 }, (_, i) => metrics({ date: `day-${i}`, visits: 100 }));
    const declining = calculateMomentumScore(metrics({ visits: 50 }), flatHistory);
    expect(declining.breakdown.trafficAcceleration).toBeLessThan(50);
  });

  it('rewards a page appearing in a new country it had no history in', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}`, countries: ['US'] }));
    const expanded = calculateMomentumScore(metrics({ countries: ['US', 'DE', 'NG'] }), history);
    const steady = calculateMomentumScore(metrics({ countries: ['US'] }), history);
    expect(expanded.breakdown.geographicExpansion).toBeGreaterThan(steady.breakdown.geographicExpansion);
  });

  it('rewards diverse traffic sources over a single dominant one', () => {
    const diverse = calculateMomentumScore(
      metrics({ sources: { direct: 25, social: 25, search: 25, referral: 25 } }),
      [],
    );
    const single = calculateMomentumScore(metrics({ sources: { direct: 100 } }), []);
    expect(diverse.breakdown.platformDiversity).toBeGreaterThan(single.breakdown.platformDiversity);
  });

  it('scores click depth from the clicks/visits ratio', () => {
    const highCtr = calculateMomentumScore(metrics({ visits: 100, clicks: 60 }), []);
    const lowCtr = calculateMomentumScore(metrics({ visits: 100, clicks: 5 }), []);
    expect(highCtr.breakdown.clickDepth).toBeGreaterThan(lowCtr.breakdown.clickDepth);
  });

  it('scores retention from the returning/unique visitor ratio', () => {
    const highRetention = calculateMomentumScore(metrics({ uniqueVisitors: 100, returningVisitors: 80 }), []);
    const lowRetention = calculateMomentumScore(metrics({ uniqueVisitors: 100, returningVisitors: 5 }), []);
    expect(highRetention.breakdown.retention).toBeGreaterThan(lowRetention.breakdown.retention);
  });

  it('handles a page with zero visits without throwing or producing NaN', () => {
    const result = calculateMomentumScore(
      metrics({ visits: 0, uniqueVisitors: 0, returningVisitors: 0, clicks: 0, countries: [], sources: {} }),
      [],
    );
    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('always returns a score within [0, 100] even under extreme inputs', () => {
    const result = calculateMomentumScore(
      metrics({ visits: 100000, uniqueVisitors: 100000, returningVisitors: 100000, clicks: 100000 }),
      [metrics({ visits: 1 })],
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('is byte-for-byte identical with and without an unused external param (backward compatible)', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
    const withoutParam = calculateMomentumScore(metrics(), history);
    const withUndefined = calculateMomentumScore(metrics(), history, undefined);
    expect(withUndefined).toEqual(withoutParam);
    expect(withoutParam.breakdown.externalMomentum).toBeUndefined();
  });

  it('blends in externalMomentum only when a Viberate signal is provided', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
    const withExternal = calculateMomentumScore(metrics(), history, { current: 80, history: [50, 50, 50, 50, 50] });
    expect(withExternal.breakdown.externalMomentum).toBeGreaterThan(50);
  });

  it('rewards accelerating external (Viberate) rank/score the same way it rewards accelerating traffic', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
    const accelerating = calculateMomentumScore(metrics(), history, { current: 90, history: [60, 60, 60, 60, 60] });
    const flat = calculateMomentumScore(metrics(), history, { current: 60, history: [60, 60, 60, 60, 60] });
    expect(accelerating.score).toBeGreaterThan(flat.score);
    expect(accelerating.breakdown.externalMomentum!).toBeGreaterThan(flat.breakdown.externalMomentum!);
  });

  it('keeps the external blend within [0, 100] even under extreme external inputs', () => {
    const result = calculateMomentumScore(metrics(), [], { current: 1_000_000, history: [1] });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
