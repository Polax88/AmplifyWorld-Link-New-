'use client';

import { Sparkles, Rocket } from 'lucide-react';
import { Badge, Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * Artist-facing Top 100 leaderboard — forked from MomentumLeaderboard (the
 * admin-only original stays untouched) rather than sharing one parametrized
 * component, matching this codebase's existing tolerance for small
 * duplication (e.g. `assertOwnership` copy-pasted per router). Adds
 * genre/country columns and a "Boosted" badge on top of the admin version.
 */
export function DiscoverLeaderboard() {
  const leaderboard = trpc.discover.leaderboard.useQuery();

  if (leaderboard.isLoading) {
    return <Card className="h-64 animate-pulse" />;
  }

  if (!leaderboard.data?.date || leaderboard.data.entries.length === 0) {
    return (
      <Card className="items-center py-8 text-center text-sm text-white/50">
        No artists to discover yet — check back soon.
      </Card>
    );
  }

  const { date, entries } = leaderboard.data;
  const newEntrants = entries.filter((entry) => entry.isNewEntrant);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-xs text-white/40">As of {new Date(date).toLocaleDateString()}</p>

      {newEntrants.length > 0 ? (
        <Card className="gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-400">
            <Sparkles className="size-3.5" />
            New entrants today
          </span>
          <p className="text-sm text-white/70">
            {newEntrants
              .slice(0, 8)
              .map((entry) => entry.title)
              .join(', ')}{' '}
            entered the Top 100 today.
          </p>
        </Card>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
              <th className="px-4 py-3 font-medium">Rank</th>
              <th className="px-4 py-3 font-medium">Artist</th>
              <th className="px-4 py-3 font-medium">Genre</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">AMI</th>
              <th className="px-4 py-3 font-medium">Change</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.pageId} className="border-b border-white/5 last:border-none">
                <td className="px-4 py-3 text-white/50">{entry.rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.title}</span>
                    {entry.isNewEntrant ? <Badge tone="brand">New</Badge> : null}
                    {entry.isBoosted ? (
                      <Badge tone="brand">
                        <Rocket className="size-3" />
                        Boosted
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-xs text-white/40">amplify.world/{entry.handle}</span>
                </td>
                <td className="px-4 py-3 text-white/60">{entry.genre ?? '—'}</td>
                <td className="px-4 py-3 text-white/60">{entry.country ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{entry.score}</td>
                <td className="px-4 py-3 tabular-nums">
                  <Badge tone={entry.scoreChange > 0 ? 'success' : entry.scoreChange < 0 ? 'warning' : 'neutral'}>
                    {entry.scoreChange > 0 ? '+' : ''}
                    {entry.scoreChange.toFixed(0)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
