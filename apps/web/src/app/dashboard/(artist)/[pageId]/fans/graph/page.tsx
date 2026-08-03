'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { IconButton, Card, Button } from '@amplifyworld/ui';
import { trpc } from '../../../../../../lib/trpc/client';
import { FanGrowthChart } from '../../../../../../components/FanGrowthChart';
import { RankedBarList } from '../../../../../../components/RankedBarList';

export default function FanGraphPage({ params }: { params: Promise<{ pageId: string }> }) {
  const { pageId } = use(params);
  const page = trpc.page.getById.useQuery({ id: pageId });
  const graph = trpc.fan.graphForPage.useQuery({ pageId });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/${pageId}` as never}>
            <IconButton aria-label="Back to hub" variant="secondary">
              <ArrowLeft className="size-4" />
            </IconButton>
          </Link>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Fan graph</h1>
            <p className="text-sm text-white/50">
              Every fan signal {page.data?.title ?? 'this page'} is ingesting — subscribers, pass claims, and
              engagement — in one view.
            </p>
          </div>
        </div>
        <Link href={`/dashboard/${pageId}/fans` as never}>
          <Button variant="ghost" size="sm">
            List
          </Button>
        </Link>
      </div>

      {graph.isLoading || !graph.data ? (
        <Card className="h-64 animate-pulse" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total fans" value={graph.data.totalUniqueFans} />
            <StatTile label="Subscribers" value={graph.data.subscriberCount} />
            <StatTile label="Pass holders" value={graph.data.passHolderCount} />
            <StatTile label="Checked in" value={graph.data.checkedInCount} />
          </div>

          <FanGrowthChart data={graph.data.growth} />

          <div className="grid gap-3 sm:grid-cols-3">
            <RankedBarList
              title="Top countries"
              entries={graph.data.topCountries.map((entry) => ({ label: entry.label, count: entry.count }))}
            />
            <RankedBarList
              title="Devices"
              entries={graph.data.topDevices.map((entry) => ({ label: entry.label, count: entry.count }))}
            />
            <RankedBarList
              title="Traffic sources"
              entries={graph.data.topSources.map((entry) => ({ label: entry.label, count: entry.count }))}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card className="gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</span>
      <span className="text-3xl font-semibold tabular-nums">{value.toLocaleString()}</span>
    </Card>
  );
}
