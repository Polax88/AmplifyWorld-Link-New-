'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Button, Card, Input, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * Open prediction markets + a stake input to back one. Demo picks resolve
 * **instantly** against the market's stated odds (see predictions.ts) — no
 * shared future event to wait for — so the result shows immediately after
 * placing a pick, not "pending" forever. Fictional points only, never real
 * money.
 */
export function PredictionMarketsList() {
  const utils = trpc.useUtils();
  const markets = trpc.predictions.openMarkets.useQuery();
  const balance = trpc.amps.myBalance.useQuery();
  const [stakes, setStakes] = useState<Record<string, number>>({});
  const [lastResult, setLastResult] = useState<{ marketId: string; hit: boolean; payout: number } | null>(null);

  const placePick = trpc.predictions.placePick.useMutation({
    onSuccess: (result, variables) => {
      setLastResult({ marketId: variables.marketId, hit: result.hit, payout: result.payout });
      utils.amps.myBalance.invalidate();
      utils.predictions.myHistory.invalidate();
      utils.predictions.leaderboard.invalidate();
    },
  });

  if (markets.isLoading) {
    return <Card className="h-64 animate-pulse" />;
  }

  if (!markets.data || markets.data.length === 0) {
    return (
      <Card className="items-center py-8 text-center text-sm text-white/50">
        No open predictions right now — check back soon.
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {markets.data.map((market) => {
        const stake = stakes[market.id] ?? 100;
        const result = lastResult?.marketId === market.id ? lastResult : null;
        return (
          <Card key={market.id} className="gap-3">
            <div>
              <p className="font-medium">{market.title}</p>
              <p className="text-xs text-white/40">
                {market.genre ?? 'Unknown genre'} · {market.country ?? 'Unknown market'}
              </p>
            </div>
            <p className="text-sm text-white/60">{market.question}</p>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <TrendingUp className="size-3.5" />
              ~{Math.round(market.odds * 100)}% consensus chance · {market.payoutMultiplier}x payout
            </div>

            <div className="flex items-center gap-2">
              <div className="w-24 shrink-0">
                <Input
                  type="number"
                  min={1}
                  max={2000}
                  value={stake}
                  onChange={(e) => setStakes((prev) => ({ ...prev, [market.id]: Number(e.target.value) }))}
                />
              </div>
              <Button
                size="sm"
                loading={placePick.isPending && placePick.variables?.marketId === market.id}
                disabled={!balance.data || balance.data.balance < stake}
                onClick={() => placePick.mutate({ marketId: market.id, stakeAmount: stake })}
              >
                Predict
              </Button>
            </div>

            {result ? (
              <Badge tone={result.hit ? 'success' : 'warning'}>
                {result.hit ? `Hit! +${result.payout} AMPS` : 'Missed this time'}
              </Badge>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
