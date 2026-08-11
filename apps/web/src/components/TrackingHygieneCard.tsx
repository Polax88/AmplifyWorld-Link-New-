'use client';

import { ShieldAlert, ArrowRight } from 'lucide-react';
import { Card, Badge } from '@amplifyworld/ui';
import { trpc } from '../lib/trpc/client';

/**
 * Flags published-page-bound smart links that are missing tracking
 * classification (see `analytics.trackingHygieneForPage`) so an artist can
 * fix them before a launch, rather than discovering after the fact that a
 * pre-save or ticket link never got tagged. Renders nothing once every
 * smart link is classified.
 */
export function TrackingHygieneCard({
  pageId,
  onFix,
}: {
  pageId: string;
  onFix: (blockId: string) => void;
}) {
  const hygiene = trpc.analytics.trackingHygieneForPage.useQuery({ pageId });

  if (!hygiene.data || hygiene.data.length === 0) return null;

  return (
    <Card className="gap-2.5 border-amber-400/25 bg-amber-500/[0.04]">
      <div className="flex items-center gap-2">
        <ShieldAlert className="size-4 text-amber-400" />
        <div>
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
            Tracking hygiene
            <Badge tone="warning">{hygiene.data.length}</Badge>
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            These links aren&apos;t classified yet, so their clicks won&apos;t count toward your AMI Conversion score.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        {hygiene.data.map((issue) => (
          <button
            key={issue.blockId}
            type="button"
            onClick={() => onFix(issue.blockId)}
            className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs text-ink-muted transition-colors hover:border-amber-400/40 hover:text-ink"
          >
            <span className="capitalize">
              {issue.type}: {issue.label}
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              Classify
              <ArrowRight className="size-3" />
            </span>
          </button>
        ))}
      </div>
    </Card>
  );
}
