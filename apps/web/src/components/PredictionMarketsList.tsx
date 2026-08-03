'use client';

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Button, Card, Input, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

interface Market {
  id: string;
  subjectType: 'ARTIST' | 'GENRE' | 'COUNTRY';
  pageId: string | null;
  title: string;
  handle: string | null;
  genre: string | null;
  country: string | null;
  question: string;
  odds: number;
  payoutMultiplier: number;
  closesAt: Date;
}

const SECTIONS: Array<{ subjectType: Market['subjectType']; title: string; emptyMessage: string }> = [
  { subjectType: 'ARTIST', title: 'Individual Artists', emptyMessage: 'No open artist markets right now.' },
  { subjectType: 'GENRE', title: 'Genres', emptyMessage: 'No open genre markets right now.' },
  { subjectType: 'COUNTRY', title: 'Geographies', emptyMessage: 'No open geography markets right now.' },
];

/**
 * Open prediction markets, grouped into individual artists / genres /
 * geographies, each with a stake input to back one. Demo picks resolve
 * **instantly** against the market's stated odds (see predictions.ts) — no
 * shared future event to wait for — so the result shows immediately after
 * placing a pick, not "pending" forever. Fictional points only, never real
 * money.
 */
export function PredictionMarketsList() {
  const markets = trpc.predictions.openMarkets.useQuery();

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
    <div className="flex flex-col gap-6">
      {SECTIONS.map((section) => {
        const sectionMarkets = markets.data!.filter((market) => market.subjectType === section.subjectType);
        if (sectionMarkets.length === 0) return null;
        return (
          <div key={section.subjectType} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">{section.title}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {sectionMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MarketCard({ market }: { market: Market }) {
  const utils = trpc.useUtils();
  const balance = trpc.amps.myBalance.useQuery();
  const [stake, setStake] = useState(100);
  const [result, setResult] = useState<{ hit: boolean; payout: number } | null>(null);

  const placePick = trpc.predictions.placePick.useMutation({
    onSuccess: (data) => {
      setResult({ hit: data.hit, payout: data.payout });
      utils.amps.myBalance.invalidate();
      utils.predictions.myHistory.invalidate();
      utils.predictions.leaderboard.invalidate();
    },
  });

  return (
    <Card className="gap-3">
      <div>
        <p className="font-medium">{market.title}</p>
        {market.subjectType === 'ARTIST' ? (
          <p className="text-xs text-white/40">
            {market.genre ?? 'Unknown genre'} · {market.country ?? 'Unknown market'}
          </p>
        ) : (
          <Badge tone="neutral">{market.subjectType === 'GENRE' ? 'Genre' : 'Geography'}</Badge>
        )}
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
            onChange={(e) => setStake(Number(e.target.value))}
          />
        </div>
        <Button
          size="sm"
          loading={placePick.isPending}
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
}
