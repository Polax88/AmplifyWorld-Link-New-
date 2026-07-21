import { describe, expect, it } from 'vitest';
import { FeatureFlagService, type FeatureFlagRecord, type FeatureFlagRepository } from './service';

function repoWith(record: FeatureFlagRecord | null): FeatureFlagRepository {
  return { findByKey: async () => record };
}

describe('FeatureFlagService', () => {
  it('is disabled when no flag record exists', async () => {
    const service = new FeatureFlagService(repoWith(null));
    expect(await service.isEnabled('new-dashboard')).toBe(false);
  });

  it('is disabled when isEnabled is false regardless of rollout', async () => {
    const service = new FeatureFlagService(
      repoWith({ key: 'x', isEnabled: false, rolloutPercentage: 100 }),
    );
    expect(await service.isEnabled('x')).toBe(false);
  });

  it('is enabled for everyone at 100% rollout', async () => {
    const service = new FeatureFlagService(
      repoWith({ key: 'x', isEnabled: true, rolloutPercentage: 100 }),
    );
    expect(await service.isEnabled('x', 'user-1')).toBe(true);
    expect(await service.isEnabled('x', 'user-2')).toBe(true);
  });

  it('is disabled for everyone at 0% rollout', async () => {
    const service = new FeatureFlagService(
      repoWith({ key: 'x', isEnabled: true, rolloutPercentage: 0 }),
    );
    expect(await service.isEnabled('x', 'user-1')).toBe(false);
  });

  it('is deterministic for a given subject at partial rollout', async () => {
    const service = new FeatureFlagService(
      repoWith({ key: 'x', isEnabled: true, rolloutPercentage: 50 }),
    );
    const first = await service.isEnabled('x', 'stable-subject');
    const second = await service.isEnabled('x', 'stable-subject');
    expect(first).toBe(second);
  });
});
