"use client";

import type { ElevationPoint } from "@/lib/elevation";

interface ElevationChartProps {
  points: ElevationPoint[];
  gain_ft: number;
  loss_ft: number;
  max_ft: number;
  min_ft: number;
}

/**
 * Hand-rolled SVG elevation profile chart.
 *
 * Skipping a chart library keeps the bundle small and the rendering
 * is trivially simple: one filled path per elevation curve, with
 * steep sections highlighted in red.
 *
 * The x-axis is distance in miles, y-axis is elevation in feet.
 */
export function ElevationChart({
  points,
  gain_ft,
  loss_ft,
  max_ft,
  min_ft,
}: ElevationChartProps) {
  if (points.length === 0) return null;

  const W = 320;
  const H = 100;
  const PAD_X = 0;
  const PAD_TOP = 6;
  const PAD_BOTTOM = 14;

  const maxDist = points[points.length - 1]?.distance_mi ?? 1;
  const elevationRange = Math.max(1, max_ft - min_ft);

  const toX = (mi: number) =>
    PAD_X + (mi / maxDist) * (W - PAD_X * 2);
  const toY = (ft: number) =>
    PAD_TOP +
    (H - PAD_TOP - PAD_BOTTOM) *
      (1 - (ft - min_ft) / elevationRange);

  // Build the filled area path.
  const linePoints = points
    .map((p) => `${toX(p.distance_mi).toFixed(1)},${toY(p.elevation_ft).toFixed(1)}`)
    .join(" L ");
  const fillPath = `M ${toX(0).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} L ${linePoints} L ${toX(maxDist).toFixed(1)},${(H - PAD_BOTTOM).toFixed(1)} Z`;
  const strokePath = `M ${linePoints}`;

  // Identify "steep" segments (> 6% grade) for red highlight.
  const steepSegments: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  for (let i = 1; i < points.length; i++) {
    const dx_mi = points[i].distance_mi - points[i - 1].distance_mi;
    const dy_ft = points[i].elevation_ft - points[i - 1].elevation_ft;
    const dx_ft = dx_mi * 5280;
    if (dx_ft === 0) continue;
    const grade = Math.abs(dy_ft / dx_ft);
    if (grade > 0.06) {
      steepSegments.push({
        x1: toX(points[i - 1].distance_mi),
        y1: toY(points[i - 1].elevation_ft),
        x2: toX(points[i].distance_mi),
        y2: toY(points[i].elevation_ft),
      });
    }
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span>Elevation profile</span>
        <span className="tabular-nums">
          ↑ {gain_ft} ft &nbsp;·&nbsp; ↓ {loss_ft} ft
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-24 w-full rounded-md bg-muted/40"
      >
        {/* Grid baseline */}
        <line
          x1={0}
          x2={W}
          y1={H - PAD_BOTTOM}
          y2={H - PAD_BOTTOM}
          stroke="rgba(0,0,0,0.1)"
        />
        {/* Fill */}
        <path d={fillPath} fill="#FF6B35" fillOpacity={0.12} />
        {/* Curve */}
        <path
          d={strokePath}
          stroke="#FF6B35"
          strokeWidth={1.5}
          fill="none"
          strokeLinejoin="round"
        />
        {/* Steep sections in red */}
        {steepSegments.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="#EF4444"
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {/* Min/max labels */}
        <text
          x={4}
          y={12}
          className="fill-muted-foreground"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(max_ft)}ft
        </text>
        <text
          x={4}
          y={H - 2}
          className="fill-muted-foreground"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          {Math.round(min_ft)}ft
        </text>
        {/* Distance labels */}
        <text
          x={W - 4}
          y={H - 2}
          textAnchor="end"
          className="fill-muted-foreground"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          {maxDist.toFixed(1)}mi
        </text>
      </svg>
    </div>
  );
}
