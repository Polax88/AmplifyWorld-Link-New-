'use client';

import { Card, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

export function PredictionHistory() {
  const history = trpc.predictions.myHistory.useQuery();

  if (history.isLoading) return <Card className="h-32 animate-pulse" />;
  if (!history.data || history.data.length === 0) {
    return <Card className="items-center py-6 text-center text-sm text-white/50">No predictions placed yet.</Card>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Artist</th>
            <th className="px-4 py-3 font-medium">Stake</th>
            <th className="px-4 py-3 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {history.data.map((pick) => (
            <tr key={pick.id} className="border-b border-white/5 last:border-none">
              <td className="px-4 py-3">
                <span className="font-medium">{pick.artist}</span>
                <span className="ml-2 text-xs text-white/40">amplify.world/{pick.handle}</span>
              </td>
              <td className="px-4 py-3 tabular-nums text-white/60">{pick.stakeAmount}</td>
              <td className="px-4 py-3">
                <Badge tone={pick.hit ? 'success' : 'neutral'}>{pick.hit ? `+${pick.payout}` : 'Missed'}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function PredictorLeaderboard() {
  const leaderboard = trpc.predictions.leaderboard.useQuery();

  if (leaderboard.isLoading) return <Card className="h-32 animate-pulse" />;
  if (!leaderboard.data || leaderboard.data.length === 0) {
    return <Card className="items-center py-6 text-center text-sm text-white/50">No predictors yet.</Card>;
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Rank</th>
            <th className="px-4 py-3 font-medium">Predictor</th>
            <th className="px-4 py-3 font-medium">Picks</th>
            <th className="px-4 py-3 font-medium">Net AMPS</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.data.map((entry, index) => (
            <tr key={entry.userId} className="border-b border-white/5 last:border-none">
              <td className="px-4 py-3 text-white/50">{index + 1}</td>
              <td className="px-4 py-3 font-medium">{entry.name}</td>
              <td className="px-4 py-3 tabular-nums text-white/60">{entry.picks}</td>
              <td className="px-4 py-3 tabular-nums">
                <Badge tone={entry.net > 0 ? 'success' : entry.net < 0 ? 'warning' : 'neutral'}>
                  {entry.net > 0 ? '+' : ''}
                  {entry.net}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
