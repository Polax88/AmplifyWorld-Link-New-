'use client';

import { Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/** Which genres are trending in which markets today — same hand-rolled table-in-Card pattern as FansTable/DiscoverLeaderboard. */
export function GenreGeoTrends() {
  const trends = trpc.discover.genreTrends.useQuery();

  if (trends.isLoading) {
    return <Card className="h-48 animate-pulse" />;
  }

  if (!trends.data?.date || trends.data.trends.length === 0) {
    return (
      <Card className="items-center py-8 text-center text-sm text-white/50">
        No genre trends yet — check back soon.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Genre</th>
            <th className="px-4 py-3 font-medium">Avg AMI</th>
            <th className="px-4 py-3 font-medium">Artists</th>
            <th className="px-4 py-3 font-medium">Top market</th>
          </tr>
        </thead>
        <tbody>
          {trends.data.trends.map((trend) => (
            <tr key={trend.genre} className="border-b border-white/5 last:border-none">
              <td className="px-4 py-3 font-medium capitalize">{trend.genre}</td>
              <td className="px-4 py-3 tabular-nums">{trend.avgScore}</td>
              <td className="px-4 py-3 tabular-nums text-white/60">{trend.artistCount}</td>
              <td className="px-4 py-3 text-white/60">{trend.topCountry ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
