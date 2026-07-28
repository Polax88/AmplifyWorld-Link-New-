'use client';

import Link from 'next/link';
import { Users } from 'lucide-react';
import { Avatar, Card } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/** Hub summary of who's interacting with the page — full detail lives at `/dashboard/[pageId]/fans`. */
export function FansCard({ pageId }: { pageId: string }) {
  const fans = trpc.fan.listForPage.useQuery({ pageId });

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
          <Users className="size-3.5" />
          Fans
        </span>
        <Link
          href={`/dashboard/${pageId}/fans` as never}
          className="text-xs font-medium text-brand-400 hover:text-brand-300"
        >
          View all
        </Link>
      </div>

      {fans.data && fans.data.length > 0 ? (
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {fans.data.slice(0, 6).map((fan) => (
              <Avatar key={fan.id} name={fan.email ?? 'Fan'} size="sm" className="ring-2 ring-surface" />
            ))}
          </div>
          <p className="text-sm text-white/60">
            {fans.data.length} {fans.data.length === 1 ? 'fan has' : 'fans have'} subscribed to this page
          </p>
        </div>
      ) : (
        <p className="text-sm text-white/50">No fans yet — they&apos;ll show up here once someone subscribes.</p>
      )}
    </Card>
  );
}
