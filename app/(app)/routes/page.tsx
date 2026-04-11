import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RouteGenerator } from "@/components/routes/route-generator";
import { RouteCard } from "@/components/routes/route-card";
import { getMySavedRoutes } from "@/lib/queries/routes";
import { requireProfile } from "@/lib/auth";
import { hasMapboxToken } from "@/lib/mapbox";

/**
 * Routes tab — the killer feature.
 *
 * Top: the interactive generator form (powered by Mapbox Directions
 * + Terrain-RGB when a token is configured, or synthetic fallback).
 * Bottom: saved routes library.
 *
 * A query param `?distance=7&workoutId=xxx` pre-fills the generator
 * for a specific scheduled workout (used by the "Find a route"
 * shortcut on the workout detail page).
 */
export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { distance?: string; workoutId?: string };
}) {
  await requireProfile();
  const savedRoutes = await getMySavedRoutes();

  const defaultDistance =
    searchParams.distance && !isNaN(Number(searchParams.distance))
      ? Number(searchParams.distance)
      : 5;
  const linkedWorkoutId = searchParams.workoutId ?? null;

  const mapboxPublicToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  return (
    <>
      <PageHeader
        title="Routes"
        description="Tell me how far. I'll find the perfect loop."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/routes/explore">Explore</Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {!hasMapboxToken() && (
          <div className="rounded-lg border border-accent/40 bg-accent/10 p-3 text-xs">
            <p className="font-semibold">Preview mode</p>
            <p className="mt-0.5 text-muted-foreground">
              Add <code className="text-[10px]">MAPBOX_SECRET_TOKEN</code>{" "}
              to your <code className="text-[10px]">.env.local</code> to
              generate real routes. Until then, synthetic routes will be
              shown.
            </p>
          </div>
        )}

        <RouteGenerator
          mapboxPublicToken={mapboxPublicToken}
          defaultDistance={defaultDistance}
          linkedWorkoutId={linkedWorkoutId}
        />

        {/* Saved routes library */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your saved routes ({savedRoutes.length})
          </h2>
          {savedRoutes.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-xs text-muted-foreground">
                Generate a route above and save it. It&apos;ll show up here
                for quick access next time.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {savedRoutes.map((r) => (
                <RouteCard key={r.id} route={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
