import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SavedRoute } from "@/lib/queries/routes";
import { Mountain } from "lucide-react";

interface RouteCardProps {
  route: SavedRoute;
  index?: number; // optional position in a list — shown as a bib number
}

/**
 * Route card — race-bib listing. Big display distance, mono data row.
 */
export function RouteCard({ route, index }: RouteCardProps) {
  const distance = route.actual_distance_miles ?? route.target_distance_miles;

  return (
    <Link
      href={`/routes/${route.id}`}
      className="group flex items-center gap-3 rounded-sm border border-ink/15 bg-surface p-4 transition-colors hover:border-ink"
    >
      {/* Distance stamp — big mono number */}
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xs border border-ink bg-bone">
        <span className="font-display text-lg font-black leading-none tabular-nums text-ink">
          {distance.toFixed(distance % 1 === 0 ? 0 : 1)}
        </span>
        <span className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-bib text-ink-muted">
          MI
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {index != null && (
            <span className="bib">{String(index).padStart(2, "0")}</span>
          )}
          <h3 className="truncate font-display text-sm font-extrabold tracking-tight text-ink">
            {route.title ?? `${distance}mi route`}
          </h3>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
          <Badge variant="muted" className="uppercase">
            {route.route_type.replace("_", " ")}
          </Badge>
          {route.elevation_gain_ft != null && (
            <span className="inline-flex items-center gap-0.5 tabular-nums">
              <Mountain className="h-2.5 w-2.5" />
              {route.elevation_gain_ft}FT
            </span>
          )}
          {route.is_public && route.avg_rating != null && (
            <span className="tabular-nums">★ {route.avg_rating.toFixed(1)}</span>
          )}
        </div>
        {route.start_address && (
          <div className="mt-0.5 truncate text-[10px] text-ink-muted">
            {route.start_address}
          </div>
        )}
      </div>
    </Link>
  );
}
