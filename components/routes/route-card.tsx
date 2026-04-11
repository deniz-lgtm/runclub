import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { SavedRoute } from "@/lib/queries/routes";
import { Mountain, Navigation } from "lucide-react";

/**
 * Compact saved-route card for the library + community lists.
 * Shows title, distance, elevation, surface, and rating (if public).
 */
export function RouteCard({ route }: { route: SavedRoute }) {
  return (
    <Link
      href={`/routes/${route.id}`}
      className="group flex items-center gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary/40"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Navigation className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold">
            {route.title ?? `${route.target_distance_miles}mi route`}
          </h3>
          <Badge variant="muted" className="text-[9px] capitalize">
            {route.route_type.replace("_", " ")}
          </Badge>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground tabular-nums">
          <span className="font-semibold text-foreground">
            {route.actual_distance_miles ?? route.target_distance_miles} mi
          </span>
          {route.elevation_gain_ft != null && (
            <span className="inline-flex items-center gap-0.5">
              <Mountain className="h-2.5 w-2.5" />
              {route.elevation_gain_ft}ft
            </span>
          )}
          {route.is_public && route.avg_rating != null && (
            <span>★ {route.avg_rating.toFixed(1)}</span>
          )}
        </div>
        {route.start_address && (
          <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
            {route.start_address}
          </div>
        )}
      </div>
    </Link>
  );
}
