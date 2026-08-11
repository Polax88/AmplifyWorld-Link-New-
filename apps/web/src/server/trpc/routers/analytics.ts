import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { domainEvents, CONVERSION_EVENT_TYPES } from '@amplifyworld/core';
import type { LinkBlockConfig, SocialBlockConfig } from '@amplifyworld/core';
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

  /**
   * Called from the public page renderer — no auth, so keep this
   * side-effect-light and rate-limited in front (e.g. at the edge/CDN).
   * Fires *before* the browser follows the link's (already UTM-tagged)
   * href, and carries the block's classified conversion type so the AMI
   * engine's Conversion pillar and the dashboard's tracking-hygiene
   * indicator both have real data to work from.
   */
  trackBlockClick: publicProcedure
    .input(
      z.object({
        pageId: z.string(),
        blockId: z.string(),
        blockType: z.string(),
        conversionType: z.enum(CONVERSION_EVENT_TYPES).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const occurredAt = new Date().toISOString();
      const signals = await getRequestSignals();
      await analytics.track({
        type: 'BLOCK_CLICK',
        pageId: input.pageId,
        blockId: input.blockId,
        metadata: { blockType: input.blockType, conversionType: input.conversionType ?? 'generic' },
        ...signals,
      });
      await domainEvents.publish('block.clicked', input, occurredAt);
      return { success: true };
    }),

  trackPageView: publicProcedure
    .input(z.object({ pageId: z.string() }))
    .mutation(async ({ input }) => {
      await analytics.track({ type: 'PAGE_VIEW', pageId: input.pageId });
      return { success: true };
    }),

  /**
   * "Tracking hygiene" — flags every enabled `link`/`social` block on a
   * page whose *stored* config has no explicit `conversionType` (i.e. it's
   * never been classified, and is only running on the schema's untagged
   * default). Read from the raw config, not `blockRegistry.parseConfig`'s
   * output, since parsing always fills the default in and would hide
   * exactly what this is meant to surface.
   */
  trackingHygieneForPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    const page = await ctx.prisma.page.findUnique({ where: { id: input.pageId } });
    if (!page || page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const blocks = await ctx.prisma.block.findMany({
      where: { pageId: input.pageId, isEnabled: true, type: { in: ['link', 'social'] } },
      orderBy: { position: 'asc' },
    });

    const untagged = blocks.filter((block) => (block.config as Record<string, unknown>).conversionType === undefined);

    return untagged.map((block) => ({
      blockId: block.id,
      type: block.type,
      label:
        block.type === 'link'
          ? (block.config as unknown as LinkBlockConfig).label
          : (block.config as unknown as SocialBlockConfig).handle,
    }));
  }),
});
