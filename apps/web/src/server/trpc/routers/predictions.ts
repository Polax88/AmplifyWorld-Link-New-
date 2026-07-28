import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import { isDemoMode } from '../../../env';
import { recordAmpsTransaction } from '../../services/amps-ledger';
import { ensureDiscoverRosterSeeded } from '../../services/demo/discover-roster';

const MAX_STAKE = 2000;

/**
 * Fictional, playful "who will break out" points game — never real money.
 * The signed-in artist (the only authenticated persona this app has) also
 * acts as a fan/predictor browsing other fictional artists here, same
 * framing Discover already uses. Picks resolve **instantly** against the
 * market's stated odds rather than waiting on a shared future event — no
 * new cron/resolution job, and it's obviously a demo simplification rather
 * than anything gambling-like.
 */
export const predictionsRouter = router({
  openMarkets: protectedProcedure.query(async ({ ctx }) => {
    await ensureDiscoverRosterSeeded();
    const markets = await ctx.prisma.predictionMarket.findMany({
      orderBy: { closesAt: 'asc' },
      take: 30,
      include: { page: { select: { title: true, handle: true, genre: true, country: true } } },
    });

    return markets.map((market) => ({
      id: market.id,
      pageId: market.pageId,
      title: market.page.title,
      handle: market.page.handle,
      genre: market.page.genre,
      country: market.page.country,
      question: market.question,
      odds: market.odds,
      payoutMultiplier: Math.round((1 / market.odds) * 100) / 100,
      closesAt: market.closesAt,
    }));
  }),

  placePick: protectedProcedure
    .input(z.object({ marketId: z.string(), stakeAmount: z.number().int().positive().max(MAX_STAKE) }))
    .mutation(async ({ ctx, input }) => {
      if (!isDemoMode) throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode is not enabled.' });

      const market = await ctx.prisma.predictionMarket.findUnique({ where: { id: input.marketId } });
      if (!market) throw new TRPCError({ code: 'NOT_FOUND' });

      const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } });
      if (user.ampsBalance < input.stakeAmount) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Not enough AMPS for that stake.' });
      }

      const hit = Math.random() < market.odds;
      const payout = hit ? Math.round(input.stakeAmount / market.odds) : 0;

      const pick = await ctx.prisma.$transaction(async (tx) => {
        await recordAmpsTransaction(tx, {
          userId: ctx.session.user.id,
          type: 'PREDICTION_STAKE',
          amount: -input.stakeAmount,
          description: 'Placed a prediction',
        });
        if (payout > 0) {
          await recordAmpsTransaction(tx, {
            userId: ctx.session.user.id,
            type: 'PREDICTION_PAYOUT',
            amount: payout,
            description: 'Prediction hit — payout',
          });
        }
        return tx.predictionPick.create({
          data: {
            marketId: input.marketId,
            userId: ctx.session.user.id,
            stakeAmount: input.stakeAmount,
            hit,
            payout,
          },
        });
      });

      return { hit, payout, pick };
    }),

  myHistory: protectedProcedure.query(async ({ ctx }) => {
    const picks = await ctx.prisma.predictionPick.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { market: { include: { page: { select: { title: true, handle: true } } } } },
    });

    return picks.map((pick) => ({
      id: pick.id,
      artist: pick.market.page.title,
      handle: pick.market.page.handle,
      stakeAmount: pick.stakeAmount,
      hit: pick.hit,
      payout: pick.payout,
      createdAt: pick.createdAt,
    }));
  }),

  /** Top predictors by net AMPS won — includes the seeded fictional predictor pool alongside real viewers. */
  leaderboard: protectedProcedure.query(async ({ ctx }) => {
    const grouped = await ctx.prisma.predictionPick.groupBy({
      by: ['userId'],
      _sum: { stakeAmount: true, payout: true },
      _count: { _all: true },
    });
    if (grouped.length === 0) return [];

    const users = await ctx.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
      select: { id: true, name: true, email: true },
    });
    const userById = new Map(users.map((user) => [user.id, user]));

    return grouped
      .map((g) => {
        const user = userById.get(g.userId);
        return {
          userId: g.userId,
          name: user?.name ?? user?.email ?? 'Anonymous',
          picks: g._count._all,
          net: (g._sum.payout ?? 0) - (g._sum.stakeAmount ?? 0),
        };
      })
      .sort((a, b) => b.net - a.net)
      .slice(0, 50);
  }),
});
