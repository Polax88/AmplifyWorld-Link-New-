import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { domainEvents } from '@amplifyworld/core';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { analytics } from '../../services/analytics';
import { getRequestSignals } from '../../services/request-signals';

export const analyticsRouter = router({
  /** Simple view/click totals for a page's own dashboard — no charting yet, just the numbers. */
  summaryForPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    const page = await ctx.prisma.page.findUnique({ where: { id: input.pageId } });
    if (!page || page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const counts = await ctx.prisma.analyticsEvent.groupBy({
      by: ['type'],
      where: { pageId: input.pageId },
      _count: { _all: true },
    });

    const byType = Object.fromEntries(counts.map((row) => [row.type, row._count._all]));
    return {
      views: byType.PAGE_VIEW ?? 0,
      clicks: byType.BLOCK_CLICK ?? 0,
    };
  }),

  /** Called from the public page renderer — no auth, so keep this side-effect-light and rate-limited in front (e.g. at the edge/CDN). */
  trackBlockClick: publicProcedure
    .input(z.object({ pageId: z.string(), blockId: z.string(), blockType: z.string() }))
    .mutation(async ({ input }) => {
      const occurredAt = new Date().toISOString();
      const signals = await getRequestSignals();
      await analytics.track({ type: 'BLOCK_CLICK', pageId: input.pageId, blockId: input.blockId, ...signals });
      await domainEvents.publish('block.clicked', input, occurredAt);
      return { success: true };
    }),

  trackPageView: publicProcedure
    .input(z.object({ pageId: z.string() }))
    .mutation(async ({ input }) => {
      await analytics.track({ type: 'PAGE_VIEW', pageId: input.pageId });
      return { success: true };
    }),
});
