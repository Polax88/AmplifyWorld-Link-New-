'use client';

import { useState, type MouseEvent } from 'react';
import { Card } from '@amplifyworld/ui';

export interface FanGrowthPoint {
  date: string;
  subscribers: number;
  passClaims: number;
}

const SUBSCRIBERS_COLOR = '#ff4081';
const PASS_CLAIMS_COLOR = '#34d399';
const SURFACE_COLOR = '#100e18';

const WIDTH = 640;
const HEIGHT = 220;
const PADDING_X = 8;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 24;

/**
 * Two-series line chart (page subscribers vs. pass claims) — the two
 * series are distinct *kinds* of engagement, so this is a categorical
 * color job, not sequential. Hand-rolled SVG, following the dataviz
 * skill's mark specs: 2px round-cap lines, r=4 end markers with a 2px
 * surface-color ring, a legend (mandatory for 2+ series), hairline
 * recessive gridlines, and a hover crosshair + tooltip.
 */
export function FanGrowthChart({ data }: { data: FanGrowthPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <Card className="items-center py-10 text-center text-sm text-white/50">
        No fan activity yet — the growth trend appears once fans start subscribing or claiming passes.
      </Card>
    );
  }

  const plotWidth = WIDTH - PADDING_X * 2;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const maxValue = Math.max(1, ...data.map((point) => Math.max(point.subscribers, point.passClaims)));
  const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

  function xAt(index: number): number {
    return PADDING_X + index * stepX;
  }
  function yAt(value: number): number {
    return PADDING_TOP + plotHeight - (value / maxValue) * plotHeight;
  }

  function pathFor(values: number[]): string {
    return values.map((value, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`).join(' ');
  }

  const subscriberPath = pathFor(data.map((point) => point.subscribers));
  const passClaimPath = pathFor(data.map((point) => point.passClaims));

  // Four evenly-spaced hairline gridlines (recessive — one step off the surface color).
  const gridlineValues = [0.25, 0.5, 0.75, 1].map((fraction) => maxValue * fraction);

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = stepX > 0 ? Math.round((relativeX - PADDING_X) / stepX) : 0;
    setHoverIndex(Math.min(Math.max(index, 0), data.length - 1));
  }

  const hovered = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <Card className="gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/40">
          Fan growth · last {data.length} days
        </span>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-white/60">
            <span className="size-2 rounded-full" style={{ backgroundColor: SUBSCRIBERS_COLOR }} />
            Page subscribers
          </span>
          <span className="flex items-center gap-1.5 text-white/60">
            <span className="size-2 rounded-full" style={{ backgroundColor: PASS_CLAIMS_COLOR }} />
            Pass claims
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          role="img"
          aria-label="Fan growth over the last 30 days"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {gridlineValues.map((value) => (
            <line
              key={value}
              x1={PADDING_X}
              x2={WIDTH - PADDING_X}
              y1={yAt(value)}
              y2={yAt(value)}
              stroke="#ffffff"
              strokeOpacity={0.06}
              strokeWidth={1}
            />
          ))}

          <path d={subscriberPath} fill="none" stroke={SUBSCRIBERS_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <path d={passClaimPath} fill="none" stroke={PASS_CLAIMS_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {hoverIndex !== null ? (
            <line
              x1={xAt(hoverIndex)}
              x2={xAt(hoverIndex)}
              y1={PADDING_TOP}
              y2={HEIGHT - PADDING_BOTTOM}
              stroke="#ffffff"
              strokeOpacity={0.15}
              strokeWidth={1}
            />
          ) : null}

          {data.map((point, index) => {
            const isLast = index === data.length - 1;
            const isHovered = index === hoverIndex;
            if (!isLast && !isHovered) return null;
            return (
              <g key={point.date}>
                <circle cx={xAt(index)} cy={yAt(point.subscribers)} r={4} fill={SUBSCRIBERS_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />
                <circle cx={xAt(index)} cy={yAt(point.passClaims)} r={4} fill={PASS_CLAIMS_COLOR} stroke={SURFACE_COLOR} strokeWidth={2} />
              </g>
            );
          })}
        </svg>

        {hovered ? (
          <div
            className="pointer-events-none absolute top-0 flex -translate-x-1/2 flex-col gap-1 rounded-lg border border-white/10 bg-surface-raised px-3 py-2 text-xs shadow-glow"
            style={{ left: `${(xAt(hoverIndex!) / WIDTH) * 100}%` }}
          >
            <span className="text-white/50">{new Date(hovered.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span className="flex items-center gap-1.5" style={{ color: SUBSCRIBERS_COLOR }}>
              {hovered.subscribers} subscribers
            </span>
            <span className="flex items-center gap-1.5" style={{ color: PASS_CLAIMS_COLOR }}>
              {hovered.passClaims} pass claims
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
