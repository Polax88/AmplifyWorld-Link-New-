import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import type { StoredMomentumBreakdown } from '@amplifyworld/core';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import type { Context } from '../context';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_DAYS = 30;
const LEADERBOARD_SIZE = 100;

export const momentumRouter = router({
  /** A page's own Artist Momentum Index: current score + trailing 30-day history, for the editor's momentum panel. */
  forPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);

    const rows = await ctx.prisma.pageMomentumScore.findMany({
      where: { pageId: input.pageId },
      orderBy: { date: 'desc' },
      take: HISTORY_DAYS,
    });

    const history = rows
      .slice()
      .reverse()
      .map((row) => ({ date: row.date, score: row.score, scoreChange: row.scoreChange }));

    return { current: history.at(-1) ?? null, history };
  }),

  /**
   * "Top 100 Rising Artists" — sorted by AMI *change*, not raw traffic, per
   * the deck's own framing (a small artist going 500->2500 matters more than
   * a huge one inching up). Admin-only in v1: this is the investor/label/
   * brand-facing data product, not an artist-facing feature yet.
   */
  leaderboard: adminProcedure.query(async ({ ctx }) => {
    const latest = await ctx.prisma.pageMomentumScore.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (!latest) {
      return { date: null, entries: [] };
    }

    const [today, yesterdayTop] = await Promise.all([
      ctx.prisma.pageMomentumScore.findMany({
        where: { date: latest.date },
        orderBy: { scoreChange: 'desc' },
        take: LEADERBOARD_SIZE,
        include: { page: { select: { title: true, handle: true } } },
      }),
      ctx.prisma.pageMomentumScore.findMany({
        where: { date: new Date(latest.date.getTime() - ONE_DAY_MS) },
        orderBy: { scoreChange: 'desc' },
        take: LEADERBOARD_SIZE,
        select: { pageId: true },
      }),
    ]);

    const yesterdayTopIds = new Set(yesterdayTop.map((row) => row.pageId));

    return {
      date: latest.date,
      entries: today.map((row, index) => {
        const breakdown = row.breakdown as unknown as StoredMomentumBreakdown;
        return {
          rank: index + 1,
          pageId: row.pageId,
          title: row.page.title,
          handle: row.page.handle,
          score: row.score,
          scoreChange: row.scoreChange,
          isNewEntrant: !yesterdayTopIds.has(row.pageId),
          topCountries: breakdown.metrics.countries.slice(0, 3),
          topSource: topEntry(breakdown.metrics.sources),
        };
      }),
    };
  }),
});

function topEntry(sources: Record<string, number>): string | null {
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
