'use client';

import { Coins, Rocket } from 'lucide-react';
import { Card, Button, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * $AMPS balance stat-tile, styled like MomentumPanel — a fictional in-app
 * points currency (no real monetary value). Shows the current balance, a
 * short ledger of how it was earned/spent, and a one-click "Boost this page"
 * spend (see amps.boostPage).
 */
export function AmpsBalanceCard({ pageId }: { pageId: string }) {
  const utils = trpc.useUtils();
  const balance = trpc.amps.myBalance.useQuery();
  const boost = trpc.amps.boostPage.useMutation({ onSuccess: () => utils.amps.myBalance.invalidate() });

  if (balance.isLoading) {
    return <Card className="h-[104px] animate-pulse" />;
  }

  if (!balance.data) return null;

  const { balance: amount, transactions } = balance.data;

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          <Coins className="size-3.5" />
          $AMPS balance
        </span>
        <Button
          variant="outline"
          size="sm"
          icon={<Rocket className="size-3.5" />}
          loading={boost.isPending}
          onClick={() => boost.mutate({ pageId })}
        >
          Boost in Discover · 300
        </Button>
      </div>
      <span className="text-3xl font-semibold tabular-nums">{amount.toLocaleString()}</span>
      {boost.error ? <p className="text-xs text-red-300">{boost.error.message}</p> : null}
      {boost.data ? <Badge tone="success">Boosted for 7 days</Badge> : null}

      {transactions.length > 0 ? (
        <div className="mt-1 flex flex-col gap-1.5 border-t border-white/8 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Recent activity</span>
          {transactions.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-white/60">{entry.description}</span>
              <span className={`shrink-0 tabular-nums ${entry.amount >= 0 ? 'text-emerald-400' : 'text-white/50'}`}>
                {entry.amount >= 0 ? '+' : ''}
                {entry.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
