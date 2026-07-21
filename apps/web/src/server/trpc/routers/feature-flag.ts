import { z } from 'zod';
import { router, adminProcedure, publicProcedure } from '../trpc';
import { featureFlags } from '../../services/feature-flags';

export const featureFlagRouter = router({
  list: adminProcedure.query(({ ctx }) => ctx.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })),

  isEnabled: publicProcedure
    .input(z.object({ key: z.string(), subjectId: z.string().optional() }))
    .query(async ({ input }) => ({
      enabled: await featureFlags.isEnabled(input.key, input.subjectId),
    })),

  upsert: adminProcedure
    .input(
      z.object({
        key: z.string().min(1),
        description: z.string().optional(),
        isEnabled: z.boolean(),
        rolloutPercentage: z.number().int().min(0).max(100),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.featureFlag.upsert({
        where: { key: input.key },
        create: input,
        update: input,
      }),
    ),
});
