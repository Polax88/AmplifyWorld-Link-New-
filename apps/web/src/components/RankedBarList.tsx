import { Card } from '@amplifyworld/ui';

export interface RankedBarEntry {
  label: string;
  count: number;
}

/**
 * Magnitude ranking as a sequential, single-hue bar list — length encodes
 * value, not hue (see the dataviz skill's "sequential is the safe default
 * for magnitude" guidance). Mirrors MomentumPanel's `BreakdownRow` bar-meter
 * styling exactly, reused rather than reinvented.
 */
export function RankedBarList({
  title,
  entries,
  emptyMessage = 'No data yet',
}: {
  title: string;
  entries: RankedBarEntry[];
  emptyMessage?: string;
}) {
  if (entries.length === 0) {
    return (
      <Card className="gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</span>
        <p className="text-sm text-white/40">{emptyMessage}</p>
      </Card>
    );
  }

  const max = Math.max(...entries.map((entry) => entry.count));

  return (
    <Card className="gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/40">{title}</span>
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div key={entry.label} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 truncate capitalize text-white/60">{entry.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-brand-400"
                style={{ width: `${Math.round((entry.count / max) * 100)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right tabular-nums text-white/70">{entry.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
