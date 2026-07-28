import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getThemePreset } from '@amplifyworld/core';
import { router, protectedProcedure } from '../trpc';
import type { Context } from '../context';
import { isDemoMode } from '../../../env';
import { recordAmpsTransaction } from '../../services/amps-ledger';

const BOOST_COST = 300;
const BOOST_DAYS = 7;

export const ampsRouter = router({
  /** Current $AMPS balance + recent ledger entries, for the hub's balance card. */
  myBalance: protectedProcedure.query(async ({ ctx }) => {
    const [user, transactions] = await Promise.all([
      ctx.prisma.user.findUniqueOrThrow({
        where: { id: ctx.session.user.id },
        select: { ampsBalance: true, unlockedThemes: true },
      }),
      ctx.prisma.ampsTransaction.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);
    return { balance: user.ampsBalance, unlockedThemes: user.unlockedThemes, transactions };
  }),

  unlockTheme: protectedProcedure.input(z.object({ themeKey: z.string() })).mutation(async ({ ctx, input }) => {
    if (!isDemoMode) throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode is not enabled.' });

    const preset = getThemePreset(input.themeKey);
    if (!preset.isPremium) return { success: true };

    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } });
    if (user.unlockedThemes.includes(preset.key)) return { success: true };
    if (user.ampsBalance < preset.ampsCost) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `You need ${preset.ampsCost} AMPS to unlock this theme.` });
    }

    await ctx.prisma.$transaction(async (tx) => {
      await recordAmpsTransaction(tx, {
        userId: ctx.session.user.id,
        type: 'THEME_UNLOCK',
        amount: -preset.ampsCost,
        description: `Unlocked the "${preset.displayName}" theme`,
      });
      await tx.user.update({
        where: { id: ctx.session.user.id },
        data: { unlockedThemes: { push: preset.key } },
      });
    });

    return { success: true };
  }),

  boostPage: protectedProcedure.input(z.object({ pageId: z.string() })).mutation(async ({ ctx, input }) => {
    if (!isDemoMode) throw new TRPCError({ code: 'FORBIDDEN', message: 'Demo mode is not enabled.' });

    const page = await assertOwnership(ctx, input.pageId);
    const user = await ctx.prisma.user.findUniqueOrThrow({ where: { id: ctx.session.user.id } });
    if (user.ampsBalance < BOOST_COST) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: `You need ${BOOST_COST} AMPS to boost your page.` });
    }

    const boostedUntil = new Date(Date.now() + BOOST_DAYS * 24 * 60 * 60 * 1000);
    await ctx.prisma.$transaction(async (tx) => {
      await recordAmpsTransaction(tx, {
        userId: ctx.session.user.id,
        type: 'LEADERBOARD_BOOST',
        amount: -BOOST_COST,
        description: `Boosted "${page.title}" in Discover for ${BOOST_DAYS} days`,
      });
      await tx.page.update({ where: { id: page.id }, data: { discoverBoostedUntil: boostedUntil } });
    });

    return { success: true, boostedUntil };
  }),
});

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
