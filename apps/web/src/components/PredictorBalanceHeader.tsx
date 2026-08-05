'use client';

import { Coins } from 'lucide-react';
import { Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/** Compact $AMPS balance readout for the Predictions page — shown to both personas, since both earn and spend AMPS by predicting here. */
export function PredictorBalanceHeader() {
  const balance = trpc.amps.myBalance.useQuery();

  if (balance.isLoading) {
    return <Card className="h-[68px] animate-pulse" />;
  }
  if (!balance.data) return null;

  return (
    <Card className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
        <Coins className="size-3.5" />
        Your $AMPS balance
      </span>
      <span className="text-2xl font-semibold tabular-nums">{balance.data.balance.toLocaleString()}</span>
    </Card>
  );
}
