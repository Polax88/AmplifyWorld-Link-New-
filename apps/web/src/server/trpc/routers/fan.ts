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

const GRAPH_HISTORY_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

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

  /**
   * Unifies fan data from every feature that ingests it — page
   * subscriptions (`FanSubscription`) and pass claims (`PassHolder`, see
   * `pass.ts`) both point at the same `Fan` model — into one aggregated
   * view for the Fan Graph page. Same in-memory-reduce style as
   * `listForPage` above and `discover.ts`'s `genreTrends`.
   */
  graphForPage: protectedProcedure.input(z.object({ pageId: z.string() })).query(async ({ ctx, input }) => {
    await assertOwnership(ctx, input.pageId);

    const since = new Date(Date.now() - GRAPH_HISTORY_DAYS * DAY_MS);

    const [subscriptions, passes, events] = await Promise.all([
      ctx.prisma.fanSubscription.findMany({
        where: { pageId: input.pageId },
        select: { fanId: true, subscribedAt: true },
      }),
      ctx.prisma.pass.findMany({ where: { pageId: input.pageId }, select: { id: true } }),
      ctx.prisma.analyticsEvent.findMany({
        where: { pageId: input.pageId, occurredAt: { gte: since } },
        select: { country: true, deviceType: true, source: true },
      }),
    ]);

    const passIds = passes.map((pass) => pass.id);
    const holders =
      passIds.length > 0
        ? await ctx.prisma.passHolder.findMany({
            where: { passId: { in: passIds } },
            select: { fanId: true, claimedAt: true, checkedInAt: true },
          })
        : [];

    const uniqueFanIds = new Set([
      ...subscriptions.map((subscription) => subscription.fanId),
      ...holders.map((holder) => holder.fanId),
    ]);

    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const sources: Record<string, number> = {};
    for (const event of events) {
      if (event.country) countries[event.country] = (countries[event.country] ?? 0) + 1;
      if (event.deviceType) devices[event.deviceType] = (devices[event.deviceType] ?? 0) + 1;
      if (event.source) sources[event.source] = (sources[event.source] ?? 0) + 1;
    }

    return {
      totalUniqueFans: uniqueFanIds.size,
      subscriberCount: subscriptions.length,
      passHolderCount: holders.length,
      checkedInCount: holders.filter((holder) => holder.checkedInAt).length,
      growth: buildGrowthSeries(
        subscriptions.map((subscription) => subscription.subscribedAt),
        holders.map((holder) => holder.claimedAt),
      ),
      topCountries: rankEntries(countries),
      topDevices: rankEntries(devices),
      topSources: rankEntries(sources),
    };
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

function rankEntries(counts: Record<string, number>, limit = 8): Array<{ label: string; count: number }> {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function tallyByDay(dates: Date[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const date of dates) {
    const key = dayKey(date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

/** Zero-filled daily series over the trailing `GRAPH_HISTORY_DAYS` window, oldest first. */
function buildGrowthSeries(
  subscribedDates: Date[],
  claimedDates: Date[],
): Array<{ date: string; subscribers: number; passClaims: number }> {
  const subscribersByDay = tallyByDay(subscribedDates);
  const claimsByDay = tallyByDay(claimedDates);

  const series: Array<{ date: string; subscribers: number; passClaims: number }> = [];
  for (let daysAgo = GRAPH_HISTORY_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - daysAgo);
    const key = dayKey(date);
    series.push({ date: key, subscribers: subscribersByDay.get(key) ?? 0, passClaims: claimsByDay.get(key) ?? 0 });
  }
  return series;
}
