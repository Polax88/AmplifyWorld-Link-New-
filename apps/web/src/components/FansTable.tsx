'use client';

import { Card, Skeleton } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

export function FansTable({ pageId }: { pageId: string }) {
  const fans = trpc.fan.listForPage.useQuery({ pageId });

  if (fans.isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (!fans.data || fans.data.length === 0) {
    return (
      <Card className="items-center py-10 text-center text-sm text-white/50">
        No fans yet — they&apos;ll show up here once someone subscribes to this page.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Fan</th>
            <th className="px-4 py-3 font-medium">Subscribed</th>
            <th className="px-4 py-3 font-medium">Last active</th>
            <th className="px-4 py-3 font-medium">Interactions</th>
            <th className="px-4 py-3 font-medium">Top country</th>
            <th className="px-4 py-3 font-medium">Device</th>
          </tr>
        </thead>
        <tbody>
          {fans.data.map((fan) => (
            <tr key={fan.id} className="border-b border-white/5 last:border-none">
              <td className="px-4 py-3 font-medium text-white">{fan.email ?? 'Anonymous fan'}</td>
              <td className="px-4 py-3 text-white/60">{new Date(fan.subscribedAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-white/60">{new Date(fan.lastSeenAt).toLocaleDateString()}</td>
              <td className="px-4 py-3 tabular-nums text-white/60">{fan.interactionCount}</td>
              <td className="px-4 py-3 text-white/60">{fan.topCountry ?? '—'}</td>
              <td className="px-4 py-3 capitalize text-white/60">{fan.topDevice ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
