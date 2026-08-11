import { describe, expect, it } from 'vitest';
import { calculateMomentumScore } from './score';
import { AMI_PILLAR_WEIGHTS } from './types';
import type { DailyPageMetrics } from './types';

function metrics(overrides: Partial<DailyPageMetrics> = {}): DailyPageMetrics {
  return {
    date: '2026-07-27',
    visits: 100,
    uniqueVisitors: 80,
    returningVisitors: 20,
    clicks: 20,
    conversions: 5,
    countries: ['US'],
    sources: { direct: 100 },
    ...overrides,
  };
}

describe('calculateMomentumScore', () => {
  it('scores a brand-new page (no history) within a plausible range, without penalizing missing history', () => {
    const result = calculateMomentumScore(metrics({ sources: { direct: 60, social: 40 } }), []);
    expect(result.breakdown.reach.value).toBeGreaterThan(50);
    expect(result.breakdown.amplification.value).toBeGreaterThan(50);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('the 5 pillar weights sum to 1', () => {
    const total = Object.values(AMI_PILLAR_WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it('every pillar carries its fixed weight on the score', () => {
    const result = calculateMomentumScore(metrics(), []);
    expect(result.breakdown.reach.weight).toBe(AMI_PILLAR_WEIGHTS.reach);
    expect(result.breakdown.engagement.weight).toBe(AMI_PILLAR_WEIGHTS.engagement);
    expect(result.breakdown.conversion.weight).toBe(AMI_PILLAR_WEIGHTS.conversion);
    expect(result.breakdown.consistency.weight).toBe(AMI_PILLAR_WEIGHTS.consistency);
    expect(result.breakdown.amplification.weight).toBe(AMI_PILLAR_WEIGHTS.amplification);
  });

  it('rewards accelerating traffic over a flat 7-day average', () => {
    const flatHistory = Array.from({ length: 7 }, (_, i) =>
      metrics({ date: `day-${i}`, visits: 100, uniqueVisitors: 80 }),
    );
    const accelerating = calculateMomentumScore(metrics({ visits: 130, uniqueVisitors: 104 }), flatHistory);
    const flat = calculateMomentumScore(metrics({ visits: 100, uniqueVisitors: 80 }), flatHistory);

    expect(accelerating.score).toBeGreaterThan(flat.score);
    expect(accelerating.breakdown.reach.value).toBeGreaterThan(flat.breakdown.reach.value);
  });

  it('penalizes declining traffic relative to history', () => {
    const flatHistory = Array.from({ length: 7 }, (_, i) => metrics({ date: `day-${i}`, visits: 100 }));
    const declining = calculateMomentumScore(metrics({ visits: 50 }), flatHistory);
    const flat = calculateMomentumScore(metrics({ visits: 100 }), flatHistory);
    expect(declining.breakdown.reach.value).toBeLessThan(flat.breakdown.reach.value);
  });

  it('rewards a page appearing in a new country it had no history in', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}`, countries: ['US'] }));
    const expanded = calculateMomentumScore(metrics({ countries: ['US', 'DE', 'NG'] }), history);
    const steady = calculateMomentumScore(metrics({ countries: ['US'] }), history);
    expect(expanded.breakdown.reach.value).toBeGreaterThan(steady.breakdown.reach.value);
  });

  it('rewards diverse traffic sources over a single dominant one', () => {
    const diverse = calculateMomentumScore(
      metrics({ sources: { direct: 25, social: 25, search: 25, referral: 25 } }),
      [],
    );
    const single = calculateMomentumScore(metrics({ sources: { direct: 100 } }), []);
    expect(diverse.breakdown.reach.value).toBeGreaterThan(single.breakdown.reach.value);
  });

  it('scores engagement from the clicks/visits ratio', () => {
    const highCtr = calculateMomentumScore(metrics({ visits: 100, clicks: 60 }), []);
    const lowCtr = calculateMomentumScore(metrics({ visits: 100, clicks: 5 }), []);
    expect(highCtr.breakdown.engagement.value).toBeGreaterThan(lowCtr.breakdown.engagement.value);
  });

  it('scores conversion from the conversions/visits ratio, independent of raw clicks', () => {
    const highConversion = calculateMomentumScore(metrics({ visits: 100, clicks: 60, conversions: 40 }), []);
    const lowConversion = calculateMomentumScore(metrics({ visits: 100, clicks: 60, conversions: 2 }), []);
    expect(highConversion.breakdown.conversion.value).toBeGreaterThan(lowConversion.breakdown.conversion.value);
  });

  it('marks conversion as estimated (not first-party) when there are zero visits to convert', () => {
    const result = calculateMomentumScore(metrics({ visits: 0, clicks: 0, conversions: 0 }), []);
    expect(result.breakdown.conversion.source).toBe('estimated');
  });

  it('scores consistency from the returning/unique visitor ratio', () => {
    const highRetention = calculateMomentumScore(metrics({ uniqueVisitors: 100, returningVisitors: 80 }), []);
    const lowRetention = calculateMomentumScore(metrics({ uniqueVisitors: 100, returningVisitors: 5 }), []);
    expect(highRetention.breakdown.consistency.value).toBeGreaterThan(lowRetention.breakdown.consistency.value);
  });

  it('handles a page with zero visits without throwing or producing NaN', () => {
    const result = calculateMomentumScore(
      metrics({ visits: 0, uniqueVisitors: 0, returningVisitors: 0, clicks: 0, conversions: 0, countries: [], sources: {} }),
      [],
    );
    expect(Number.isNaN(result.score)).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('always returns a score within [0, 100] even under extreme inputs', () => {
    const result = calculateMomentumScore(
      metrics({ visits: 100000, uniqueVisitors: 100000, returningVisitors: 100000, clicks: 100000, conversions: 100000 }),
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
    expect(withoutParam.breakdown.amplification.source).not.toBe('third-party');
  });

  it('blends in a third-party amplification signal only when a Viberate signal is provided', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
    const withExternal = calculateMomentumScore(metrics(), history, { current: 80, history: [50, 50, 50, 50, 50] });
    expect(withExternal.breakdown.amplification.value).toBeGreaterThan(50);
    expect(withExternal.breakdown.amplification.source).toBe('third-party');
  });

  it('rewards accelerating external (Viberate) rank/score the same way it rewards accelerating traffic', () => {
    const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
    const accelerating = calculateMomentumScore(metrics(), history, { current: 90, history: [60, 60, 60, 60, 60] });
    const flat = calculateMomentumScore(metrics(), history, { current: 60, history: [60, 60, 60, 60, 60] });
    expect(accelerating.score).toBeGreaterThan(flat.score);
    expect(accelerating.breakdown.amplification.value).toBeGreaterThan(flat.breakdown.amplification.value);
  });

  it('keeps the external blend within [0, 100] even under extreme external inputs', () => {
    const result = calculateMomentumScore(metrics(), [], { current: 1_000_000, history: [1] });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  describe('confidence', () => {
    it('is fully estimated for a brand-new page on its first day with no traffic at all', () => {
      const result = calculateMomentumScore(
        metrics({ visits: 0, uniqueVisitors: 0, returningVisitors: 0, clicks: 0, conversions: 0 }),
        [],
      );
      expect(result.confidence.value).toBe(0);
      expect(result.confidence.estimatedShare).toBeCloseTo(1, 5);
    });

    it('rises once there is trailing history and real traffic to compute pillars from', () => {
      const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
      const result = calculateMomentumScore(metrics(), history);
      expect(result.confidence.value).toBeGreaterThan(0);
      expect(result.confidence.firstPartyShare).toBeGreaterThan(0);
      expect(result.confidence.thirdPartyShare).toBe(0);
    });

    it('attributes amplification to the third-party share once Viberate is connected', () => {
      const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
      const result = calculateMomentumScore(metrics(), history, { current: 80, history: [50, 50, 50] });
      expect(result.confidence.thirdPartyShare).toBeCloseTo(AMI_PILLAR_WEIGHTS.amplification, 5);
    });

    it('first-party, third-party, and estimated shares always sum to 1', () => {
      const history = Array.from({ length: 10 }, (_, i) => metrics({ date: `day-${i}` }));
      const result = calculateMomentumScore(metrics(), history, { current: 80, history: [50, 50, 50] });
      const total = result.confidence.firstPartyShare + result.confidence.thirdPartyShare + result.confidence.estimatedShare;
      expect(total).toBeCloseTo(1, 5);
    });
  });
});
