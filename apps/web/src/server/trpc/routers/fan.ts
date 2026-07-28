import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../trpc';
import type { Context } from '../context';

export interface FanListEntry {
  id: string;
  email: string | null;
  subscribedAt: Date;
  lastSeenAt: Date;
  interactionCount: number;
  topCountry: string | null;
  topDevice: string | null;
}

/** Read-only view of the fans who've interacted with a page — email, subscribe date, and interaction history. */
export const fanRouter = router({
  listForPage: protectedProcedure
    .input(z.object({ pageId: z.string() }))
    .query(async ({ ctx, input }): Promise<FanListEntry[]> => {
      await assertOwnership(ctx, input.pageId);

      const subscriptions = await ctx.prisma.fanSubscription.findMany({
        where: { pageId: input.pageId },
        orderBy: { subscribedAt: 'desc' },
        include: { fan: { select: { id: true, email: true } } },
      });
      if (subscriptions.length === 0) return [];

      const fanIds = subscriptions.map((subscription) => subscription.fanId);
      const events = await ctx.prisma.analyticsEvent.findMany({
        where: { pageId: input.pageId, fanId: { in: fanIds } },
        select: { fanId: true, occurredAt: true, country: true, deviceType: true },
      });

      const statsByFanId = new Map<
        string,
        { count: number; lastSeenAt: Date; countries: Record<string, number>; devices: Record<string, number> }
      >();
      for (const event of events) {
        if (!event.fanId) continue;
        const stats = statsByFanId.get(event.fanId) ?? {
          count: 0,
          lastSeenAt: event.occurredAt,
          countries: {},
          devices: {},
        };
        stats.count += 1;
        if (event.occurredAt > stats.lastSeenAt) stats.lastSeenAt = event.occurredAt;
        if (event.country) stats.countries[event.country] = (stats.countries[event.country] ?? 0) + 1;
        if (event.deviceType) stats.devices[event.deviceType] = (stats.devices[event.deviceType] ?? 0) + 1;
        statsByFanId.set(event.fanId, stats);
      }

      return subscriptions.map((subscription) => {
        const stats = statsByFanId.get(subscription.fanId);
        return {
          id: subscription.fan.id,
          email: subscription.fan.email,
          subscribedAt: subscription.subscribedAt,
          lastSeenAt: stats?.lastSeenAt ?? subscription.subscribedAt,
          interactionCount: stats?.count ?? 0,
          topCountry: stats ? topEntry(stats.countries) : null,
          topDevice: stats ? topEntry(stats.devices) : null,
        };
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

function topEntry(counts: Record<string, number>): string | null {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
