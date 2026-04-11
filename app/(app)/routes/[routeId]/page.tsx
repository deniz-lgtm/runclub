import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RouteMap } from "@/components/routes/route-map";
import { ElevationChart } from "@/components/routes/elevation-chart";
import { getSavedRouteById } from "@/lib/queries/routes";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft, Mountain } from "lucide-react";

export default async function RouteDetailPage({
  params,
}: {
  params: { routeId: string };
}) {
  await requireProfile();
  const route = await getSavedRouteById(params.routeId);
  if (!route || !route.route_geojson) notFound();

  const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  return (
    <>
      <PageHeader title={route.title ?? `${route.actual_distance_miles}mi route`}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/routes">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Stats */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="muted" className="capitalize">
                {route.route_type.replace("_", " ")}
              </Badge>
              <Badge variant="muted" className="capitalize">
                {route.surface_type}
              </Badge>
              {route.is_public && <Badge>Public</Badge>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Distance"
                value={`${route.actual_distance_miles ?? route.target_distance_miles} mi`}
              />
              <Stat
                label="Elevation"
                value={`${route.elevation_gain_ft ?? 0} ft`}
                icon={<Mountain className="h-3 w-3" />}
              />
              <Stat label="Uses" value={String(route.times_used)} />
            </div>

            {route.start_address && (
              <div className="text-[11px] text-muted-foreground">
                Starts at {route.start_address}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <RouteMap
          geometry={route.route_geojson}
          startLat={route.start_latitude}
          startLng={route.start_longitude}
          mapboxToken={mapboxPublicToken}
        />

        {/* Elevation */}
        {route.elevation_profile && route.elevation_profile.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <ElevationChart
                points={route.elevation_profile}
                gain_ft={route.elevation_gain_ft ?? 0}
                loss_ft={route.elevation_loss_ft ?? 0}
                max_ft={Math.max(
                  ...route.elevation_profile.map((p) => p.elevation_ft),
                )}
                min_ft={Math.min(
                  ...route.elevation_profile.map((p) => p.elevation_ft),
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button asChild>
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${route.start_latitude},${route.start_longitude}&travelmode=walking`}
              target="_blank"
              rel="noreferrer"
            >
              Get directions
            </a>
          </Button>
          <Button variant="outline" disabled>
            Export to GPX (Phase 2D+)
          </Button>
          <Button variant="outline" disabled>
            Share to community
          </Button>
        </div>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
