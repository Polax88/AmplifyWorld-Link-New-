import { z } from 'zod';
import { domainEvents } from '@amplifyworld/core';
import { router, publicProcedure } from '../trpc';
import { analytics } from '../../services/analytics';

export const analyticsRouter = router({
  /** Called from the public page renderer — no auth, so keep this side-effect-light and rate-limited in front (e.g. at the edge/CDN). */
  trackBlockClick: publicProcedure
    .input(z.object({ pageId: z.string(), blockId: z.string(), blockType: z.string() }))
    .mutation(async ({ input }) => {
      const occurredAt = new Date().toISOString();
      await analytics.track({ type: 'BLOCK_CLICK', pageId: input.pageId, blockId: input.blockId });
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
