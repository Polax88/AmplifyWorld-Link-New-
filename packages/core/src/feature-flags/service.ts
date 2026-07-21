export interface FeatureFlagRecord {
  key: string;
  isEnabled: boolean;
  rolloutPercentage: number; // 0-100
}

/** Storage-agnostic lookup. `apps/web` supplies a Prisma-backed implementation. */
export interface FeatureFlagRepository {
  findByKey(key: string): Promise<FeatureFlagRecord | null>;
}

/** Deterministic 0-99 bucket for a (flag, subject) pair, no crypto dependency needed. */
function bucketFor(key: string, subjectId: string): number {
  let hash = 0;
  const input = `${key}:${subjectId}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

/**
 * Evaluates feature flags with optional percentage rollout, so new
 * functionality can ship dark and be dialed in gradually per user/page
 * without a redeploy.
 */
export class FeatureFlagService {
  constructor(private readonly repository: FeatureFlagRepository) {}

  async isEnabled(key: string, subjectId = 'global'): Promise<boolean> {
    const flag = await this.repository.findByKey(key);
    if (!flag || !flag.isEnabled) return false;
    if (flag.rolloutPercentage >= 100) return true;
    if (flag.rolloutPercentage <= 0) return false;
    return bucketFor(key, subjectId) < flag.rolloutPercentage;
  }
}
