import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import type { Context } from '../context';
import { generatePassHolders } from '../../services/demo/pass-holders';

const createPassInput = z.object({
  pageId: z.string(),
  name: z.string().min(1).max(80),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color, e.g. #ff4081'),
  imageUrl: z.union([z.string().url(), z.literal('')]).optional(),
  eventName: z.string().max(120).optional(),
  eventDate: z.string().datetime().optional(),
  eventVenue: z.string().max(120).optional(),
});

export const passRouter = router({
  /** Passes for a page, with holder/checked-in counts — for the hub card and the passes list page. */
  listForPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);

    const passes = await ctx.prisma.pass.findMany({
      where: { pageId: input.pageId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { holders: true } } },
    });
    const checkedInCounts = await ctx.prisma.passHolder.groupBy({
      by: ['passId'],
      where: { passId: { in: passes.map((pass) => pass.id) }, checkedInAt: { not: null } },
      _count: { _all: true },
    });
    const checkedInByPassId = new Map(checkedInCounts.map((row) => [row.passId, row._count._all]));

    return passes.map((pass) => ({
      ...pass,
      holderCount: pass._count.holders,
      checkedInCount: checkedInByPassId.get(pass.id) ?? 0,
    }));
  }),

  /** Full pass + holder roster, for the Overview/Check-in tabs. Ownership-checked via the pass's own page. */
  getById: protectedProcedure.input(z.object({ passId: z.string() })).query(async ({ ctx, input }) => {
    const pass = await ctx.prisma.pass.findUnique({
      where: { id: input.passId },
      include: { page: { select: { ownerId: true, title: true, handle: true } } },
    });
    if (!pass || pass.page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    const holders = await ctx.prisma.passHolder.findMany({
      where: { passId: input.passId },
      orderBy: { claimedAt: 'desc' },
      include: { fan: { select: { id: true, email: true } } },
    });

    return { ...pass, holders };
  }),

  /**
   * Minimal, holder-data-free view for the public pass page — no roster
   * exposed publicly, mirroring the privacy stance of the public artist
   * page (which also only ever exposes what's meant to be public).
   */
  getPublic: publicProcedure.input(z.object({ passId: z.string() })).query(async ({ ctx, input }) => {
    const pass = await ctx.prisma.pass.findUnique({
      where: { id: input.passId },
      select: {
        id: true,
        name: true,
        accentColor: true,
        imageUrl: true,
        eventName: true,
        eventDate: true,
        eventVenue: true,
        page: { select: { title: true, handle: true, status: true } },
      },
    });
    if (!pass || pass.page.status !== 'PUBLISHED') {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }
    return pass;
  }),

  create: protectedProcedure.input(createPassInput).mutation(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);

    const pass = await ctx.prisma.pass.create({
      data: {
        pageId: input.pageId,
        name: input.name,
        accentColor: input.accentColor,
        imageUrl: input.imageUrl || null,
        eventName: input.eventName || null,
        eventDate: input.eventDate ? new Date(input.eventDate) : null,
        eventVenue: input.eventVenue || null,
      },
    });

    await generatePassHolders(pass.id);

    return pass;
  }),

  toggleCheckIn: protectedProcedure.input(z.object({ holderId: z.string() })).mutation(async ({ ctx, input }) => {
    const holder = await ctx.prisma.passHolder.findUnique({
      where: { id: input.holderId },
      include: { pass: { include: { page: { select: { ownerId: true } } } } },
    });
    if (!holder || holder.pass.page.ownerId !== ctx.session.user.id) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    return ctx.prisma.passHolder.update({
      where: { id: input.holderId },
      data: { checkedInAt: holder.checkedInAt ? null : new Date() },
    });
  }),
});

async function assertOwnership(ctx: Context & { session: NonNullable<Context['session']> }, pageId: string) {
  const page = await ctx.prisma.page.findUnique({ where: { id: pageId } });
  if (!page || page.ownerId !== ctx.session.user.id) {
    throw new TRPCError({ code: 'NOT_FOUND' });
  }
  return page;
}
