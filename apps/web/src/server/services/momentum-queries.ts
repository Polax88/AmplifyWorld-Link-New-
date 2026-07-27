import { prisma } from '@amplifyworld/database';
import type { StoredMomentumBreakdown } from '@amplifyworld/core';

const HISTORY_DAYS = 30;
const LEADERBOARD_SIZE = 100;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Shared momentum read queries — called by both the internal tRPC router
 * (`trpc/routers/momentum.ts`) and the external read-only REST API
 * (`app/api/v1/momentum/*`), so the query logic and response shape live in
 * exactly one place.
 */

export async function getLeaderboard() {
  const latest = await prisma.pageMomentumScore.findFirst({
    orderBy: { date: 'desc' },
    select: { date: true },
  });
  if (!latest) {
    return { date: null, entries: [] };
  }

  const [today, yesterdayTop] = await Promise.all([
    prisma.pageMomentumScore.findMany({
      where: { date: latest.date },
      orderBy: { scoreChange: 'desc' },
      take: LEADERBOARD_SIZE,
      include: { page: { select: { title: true, handle: true } } },
    }),
    prisma.pageMomentumScore.findMany({
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
}

export async function getPageMomentumHistory(pageId: string) {
  const rows = await prisma.pageMomentumScore.findMany({
    where: { pageId },
    orderBy: { date: 'desc' },
    take: HISTORY_DAYS,
  });

  const history = rows
    .slice()
    .reverse()
    .map((row) => ({
      date: row.date,
      score: row.score,
      scoreChange: row.scoreChange,
      breakdown: (row.breakdown as unknown as StoredMomentumBreakdown).subScores,
    }));

  return { current: history.at(-1) ?? null, history };
}

/**
 * Public-facing lookup by handle (external API consumers identify artists by
 * their public handle, not internal page ids) — only ever returns data for
 * published pages, same visibility rule as the public page renderer.
 */
export async function getPageMomentumByHandle(handle: string) {
  const page = await prisma.page.findUnique({ where: { handle }, select: { id: true, title: true, status: true } });
  if (!page || page.status !== 'PUBLISHED') return null;

  const momentum = await getPageMomentumHistory(page.id);
  return { handle, title: page.title, ...momentum };
}

function topEntry(sources: Record<string, number>): string | null {
  const sorted = Object.entries(sources).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
