import { cn } from '../lib/cn';

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeColor?: string;
}

/** Minimal hand-rolled SVG trend line — no charting dependency for a single 30-point series. */
export function Sparkline({ values, width = 240, height = 56, className, strokeColor = '#ff4081' }: SparklineProps) {
  if (values.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-white/30', className)}
        style={{ width, height }}
      >
        No data yet
      </div>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  const padding = 4;
  const plotHeight = height - padding * 2;

  const points = values.map((value, index) => {
    const x = index * stepX;
    const y = padding + plotHeight - ((value - min) / range) * plotHeight;
    return [x, y] as const;
  });

  const path = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
  const last = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="30-day trend"
    >
      <path d={path} fill="none" stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {last ? <circle cx={last[0]} cy={last[1]} r={3} fill={strokeColor} /> : null}
    </svg>
  );
}
