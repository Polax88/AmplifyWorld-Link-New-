import { prisma } from '@amplifyworld/database';
import { FeatureFlagService, type FeatureFlagRepository } from '@amplifyworld/core';

const prismaFeatureFlagRepository: FeatureFlagRepository = {
  async findByKey(key) {
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) return null;
    return {
      key: flag.key,
      isEnabled: flag.isEnabled,
      rolloutPercentage: flag.rolloutPercentage,
    };
  },
};

export const featureFlags = new FeatureFlagService(prismaFeatureFlagRepository);
