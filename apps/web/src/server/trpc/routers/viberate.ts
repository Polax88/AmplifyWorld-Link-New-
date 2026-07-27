import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import type { Context } from '../context';
import { artistIntelligence } from '../../services/artist-intelligence';
import { syncViberateSnapshot } from '../../services/artist-intelligence/sync';

/**
 * The "Connect Viberate" flow for pages that skipped/predate the onboarding
 * wizard's automatic match attempt (see `onboarding.ts`). Entirely
 * artist-initiated — no background matching on login.
 */
export const viberateRouter = router({
  search: protectedProcedure.input(z.object({ query: z.string().min(1) })).query(({ input }) =>
    artistIntelligence.search(input.query),
  ),

  connect: protectedProcedure
    .input(z.object({ pageId: z.string(), externalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertOwnership(ctx, input.pageId);

      // Unlike the wizard's background attempt, a failure here is surfaced —
      // the artist explicitly picked this match and should know if it failed.
      let snapshot;
      try {
        snapshot = await syncViberateSnapshot(input.pageId, input.externalId);
      } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Could not fetch Viberate data for that artist.' });
      }

      await ctx.prisma.page.update({
        where: { id: input.pageId },
        data: { viberateArtistId: input.externalId, viberateConnectedAt: new Date() },
      });

      return { success: true, snapshot };
    }),
});

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
