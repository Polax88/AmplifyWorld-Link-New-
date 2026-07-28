import { router, protectedProcedure } from '../trpc';
import { getLeaderboard } from '../../services/momentum-queries';
import { ensureDiscoverRosterSeeded } from '../../services/demo/discover-roster';

export const discoverRouter = router({
  /**
   * Artist-facing "Top 100 Rising Artists" — same underlying query as the
   * admin-only `momentum.leaderboard` (it already scans `PageMomentumScore`
   * with no owner filter), augmented with genre/country/boost status for
   * Discover's table. Lazily seeds the fictional artist roster on first
   * call so there's always a real spread to browse, not just the viewer's
   * own page.
   */
  leaderboard: protectedProcedure.query(async ({ ctx }) => {
    await ensureDiscoverRosterSeeded();
    const board = await getLeaderboard();

    const pages = await ctx.prisma.page.findMany({
      where: { id: { in: board.entries.map((entry) => entry.pageId) } },
      select: { id: true, genre: true, country: true, discoverBoostedUntil: true },
    });
    const pageById = new Map(pages.map((page) => [page.id, page]));
    const now = new Date();

    return {
      ...board,
      entries: board.entries.map((entry) => {
        const page = pageById.get(entry.pageId);
        return {
          ...entry,
          genre: page?.genre ?? null,
          country: page?.country ?? null,
          isBoosted: Boolean(page?.discoverBoostedUntil && page.discoverBoostedUntil > now),
        };
      }),
    };
  }),

  /** Which genres are trending in which markets today, from the same momentum data as the leaderboard. */
  genreTrends: protectedProcedure.query(async ({ ctx }) => {
    await ensureDiscoverRosterSeeded();

    const latest = await ctx.prisma.pageMomentumScore.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    });
    if (!latest) return { date: null, trends: [] };

    const rows = await ctx.prisma.pageMomentumScore.findMany({
      where: { date: latest.date },
      select: { score: true, page: { select: { genre: true, country: true } } },
    });

    const byGenre = new Map<string, { totalScore: number; count: number; countries: Map<string, number> }>();
    for (const row of rows) {
      const genre = row.page.genre;
      if (!genre) continue;
      const bucket = byGenre.get(genre) ?? { totalScore: 0, count: 0, countries: new Map() };
      bucket.totalScore += row.score;
      bucket.count += 1;
      if (row.page.country) {
        bucket.countries.set(row.page.country, (bucket.countries.get(row.page.country) ?? 0) + 1);
      }
      byGenre.set(genre, bucket);
    }

    const trends = Array.from(byGenre.entries())
      .map(([genre, bucket]) => ({
        genre,
        avgScore: Math.round(bucket.totalScore / bucket.count),
        artistCount: bucket.count,
        topCountry: [...bucket.countries.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
      }))
      .sort((a, b) => b.avgScore - a.avgScore);

    return { date: latest.date, trends };
  }),
});
