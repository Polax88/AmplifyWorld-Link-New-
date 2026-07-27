import { z } from 'zod';
import { router, adminProcedure } from '../trpc';
import { createApiKey } from '../../services/api-keys';

/** Admin-only management of the read-only external momentum API's keys — no self-serve signup yet. */
export const apiKeyRouter = router({
  list: adminProcedure.query(({ ctx }) =>
    ctx.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, createdAt: true, lastUsedAt: true, revokedAt: true },
    }),
  ),

  /** Returns the plaintext key once — it is never retrievable again after this. */
  create: adminProcedure.input(z.object({ label: z.string().min(1) })).mutation(({ input }) => createApiKey(input.label)),

  revoke: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.apiKey.update({ where: { id: input.id }, data: { revokedAt: new Date() } }),
    ),
});
