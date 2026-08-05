import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import type { Context } from '../context';
import { getGenrePercentile, getLeaderboard, getPageMomentumHistory } from '../../services/momentum-queries';

export const momentumRouter = router({
  /** A page's own Artist Momentum Index: current score + trailing 30-day history, for the editor's momentum panel. */
  forPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);
    return getPageMomentumHistory(input.pageId);
  }),

  /** This page's rank within its own genre this week — the AMI card's shareable "flex metric". */
  genrePercentile: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);
    return getGenrePercentile(input.pageId);
  }),

  /**
   * "Top 100 Rising Artists" — sorted by AMI *change*, not raw traffic, per
   * the deck's own framing (a small artist going 500->2500 matters more than
   * a huge one inching up). Admin-only in v1: this is the investor/label/
   * brand-facing data product, not an artist-facing feature yet.
   */
  leaderboard: adminProcedure.query(() => getLeaderboard()),

  /** Recent momentum alerts (e.g. "entered the Top 100 today") across all of the current user's pages. */
  myAlerts: protectedProcedure.query(async ({ ctx }) => {
    const alerts = await ctx.prisma.momentumAlert.findMany({
      where: { page: { ownerId: ctx.session.user.id } },
      orderBy: { date: 'desc' },
      take: 20,
      include: { page: { select: { title: true, handle: true } } },
    });

    return alerts.map((alert) => ({
      id: alert.id,
      pageId: alert.pageId,
      pageTitle: alert.page.title,
      date: alert.date,
      message: alert.message,
      seen: alert.seenAt !== null,
    }));
  }),

  markAlertSeen: protectedProcedure.input(z.object({ alertId: z.string() })).mutation(async ({ ctx, input }) => {
    const alert = await ctx.prisma.momentumAlert.findUnique({
      where: { id: input.alertId },
      include: { page: true },
    });
    if (!alert || alert.page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    await ctx.prisma.momentumAlert.update({ where: { id: input.alertId }, data: { seenAt: new Date() } });
    return { success: true };
  }),

  markAllAlertsSeen: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.momentumAlert.updateMany({
      where: { page: { ownerId: ctx.session.user.id }, seenAt: null },
      data: { seenAt: new Date() },
    });
    return { success: true };
  }),
});

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
