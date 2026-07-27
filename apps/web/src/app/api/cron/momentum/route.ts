import { NextResponse } from 'next/server';
import { prisma, type Prisma } from '@amplifyworld/database';
import {
  calculateMomentumScore,
  type DailyPageMetrics,
  type ExternalMomentumSignal,
  type StoredMomentumBreakdown,
} from '@amplifyworld/core';
import { env } from '../../../../env';
import { syncViberateSnapshot } from '../../../../server/services/artist-intelligence/sync';

const HISTORY_DAYS = 30;

/**
 * The Artist Momentum Index daily ETL. Triggered once a day by Vercel Cron
 * (see `vercel.json`) and secured by `CRON_SECRET` — Vercel signs the
 * request with it as a bearer token. For every page with at least one
 * analytics event "yesterday" (UTC), aggregates that day's traffic into a
 * `DailyPageMetrics`, rebuilds trailing history from prior
 * `PageMomentumScore` rows (no need to re-scan raw events further back),
 * and upserts today's score + `scoreChange` vs. the previous day.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dateKey = previousUtcDateKey(new Date());
  const { start, end } = utcDayBounds(dateKey);

  const [pageIdRows, viberatePages] = await Promise.all([
    prisma.analyticsEvent.groupBy({ by: ['pageId'], where: { occurredAt: { gte: start, lt: end } } }),
    // A page with a Viberate connection but no Link traffic yesterday still
    // needs a score — otherwise a low-traffic-but-trending-elsewhere artist
    // would never appear at all.
    prisma.page.findMany({ where: { viberateArtistId: { not: null } }, select: { id: true, viberateArtistId: true } }),
  ]);

  const viberateArtistIdByPage = new Map(viberatePages.map((p) => [p.id, p.viberateArtistId as string]));
  const allPageIds = new Set([...pageIdRows.map((row) => row.pageId), ...viberateArtistIdByPage.keys()]);

  for (const pageId of allPageIds) {
    await scorePage(pageId, dateKey, start, end, viberateArtistIdByPage.get(pageId));
  }

  return NextResponse.json({ success: true, date: dateKey, pagesScored: allPageIds.size });
}

async function scorePage(
  pageId: string,
  dateKey: string,
  start: Date,
  end: Date,
  viberateArtistId: string | undefined,
): Promise<void> {
  const current = await aggregateDailyMetrics(pageId, dateKey, start, end);

  const priorScores = await prisma.pageMomentumScore.findMany({
    where: { pageId, date: { lt: start } },
    orderBy: { date: 'desc' },
    take: HISTORY_DAYS,
  });

  const history: DailyPageMetrics[] = priorScores
    .slice()
    .reverse()
    .map((row) => (row.breakdown as unknown as StoredMomentumBreakdown).metrics);

  const external = await resolveExternalSignal(pageId, viberateArtistId, start);

  const result = calculateMomentumScore(current, history, external);
  const previousScore = priorScores[0]?.score ?? 0;
  const scoreChange = result.score - previousScore;

  const breakdown: StoredMomentumBreakdown = { subScores: result.breakdown, metrics: current };

  await prisma.pageMomentumScore.upsert({
    where: { pageId_date: { pageId, date: start } },
    create: {
      pageId,
      date: start,
      score: result.score,
      scoreChange,
      breakdown: breakdown as unknown as Prisma.InputJsonValue,
    },
    update: {
      score: result.score,
      scoreChange,
      breakdown: breakdown as unknown as Prisma.InputJsonValue,
    },
  });
}

/**
 * Fetches today's Viberate snapshot and builds the trailing rank/score
 * history the momentum engine needs. Never throws — a Viberate hiccup (rate
 * limit, an unmatched artist, or simply no API key configured yet) must
 * never block this page's own Link-derived score from computing.
 */
async function resolveExternalSignal(
  pageId: string,
  viberateArtistId: string | undefined,
  start: Date,
): Promise<ExternalMomentumSignal | undefined> {
  if (!viberateArtistId) return undefined;

  try {
    const snapshot = await syncViberateSnapshot(pageId, viberateArtistId);
    if (snapshot.rankScore === undefined) return undefined;

    const priorSnapshots = await prisma.viberateSnapshot.findMany({
      where: { pageId, date: { lt: start } },
      orderBy: { date: 'desc' },
      take: HISTORY_DAYS,
      select: { rankScore: true },
    });

    return {
      current: snapshot.rankScore,
      history: priorSnapshots
        .slice()
        .reverse()
        .map((row) => row.rankScore ?? 0),
    };
  } catch {
    return undefined;
  }
}

async function aggregateDailyMetrics(
  pageId: string,
  dateKey: string,
  start: Date,
  end: Date,
): Promise<DailyPageMetrics> {
  const events = await prisma.analyticsEvent.findMany({
    where: { pageId, occurredAt: { gte: start, lt: end } },
    select: { type: true, visitorId: true, country: true, source: true },
  });

  const visits = events.filter((e) => e.type === 'PAGE_VIEW').length;
  const clicks = events.filter((e) => e.type === 'BLOCK_CLICK').length;

  const visitorIdsToday = Array.from(
    new Set(events.filter((e) => e.type === 'PAGE_VIEW' && e.visitorId).map((e) => e.visitorId as string)),
  );

  const countries = Array.from(new Set(events.filter((e) => e.country).map((e) => e.country as string)));

  const sources: Record<string, number> = {};
  for (const event of events) {
    if (event.type !== 'PAGE_VIEW') continue;
    const key = event.source ?? 'direct';
    sources[key] = (sources[key] ?? 0) + 1;
  }

  let returningVisitors = 0;
  if (visitorIdsToday.length > 0) {
    const priorRows = await prisma.analyticsEvent.findMany({
      where: { pageId, type: 'PAGE_VIEW', occurredAt: { lt: start }, visitorId: { in: visitorIdsToday } },
      select: { visitorId: true },
      distinct: ['visitorId'],
    });
    returningVisitors = priorRows.length;
  }

  return {
    date: dateKey,
    visits,
    uniqueVisitors: visitorIdsToday.length,
    returningVisitors,
    clicks,
    countries,
    sources,
  };
}

function previousUtcDateKey(now: Date): string {
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  return yesterday.toISOString().slice(0, 10);
}

function utcDayBounds(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00.000Z`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}
