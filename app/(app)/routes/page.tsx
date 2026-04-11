import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RouteCard } from "@/components/routes/route-card";
import { RoutesWorkbench } from "@/components/routes/routes-workbench";
import { getMySavedRoutes } from "@/lib/queries/routes";
import { requireProfile } from "@/lib/auth";
import { hasMapboxToken } from "@/lib/mapbox";

/**
 * Routes tab — the killer feature.
 *
 * Top: the RoutesWorkbench client component, which exposes two modes:
 *   - Generate: auto route generator (distance + terrain → candidates)
 *   - Build:    OnTheGoMap-style manual route builder (tap the map)
 *
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
        eyebrow="Routes"
        title="Where to."
        description="Auto-generate a loop or tap the map yourself."
      >
        <Button variant="outline" size="sm" asChild>
          <Link href="/routes/explore">Explore</Link>
        </Button>
      </PageHeader>

      <div className="column space-y-4">
        {!hasMapboxToken() && (
          <div className="rounded-sm border border-flash/40 bg-flash/10 p-3">
            <div className="label-bib text-flash">Preview mode</div>
            <p className="mt-1 text-xs leading-snug text-ink-muted">
              Add{" "}
              <code className="font-mono text-[10px]">MAPBOX_SECRET_TOKEN</code>{" "}
              to your Vercel env vars to generate real routes. Synthetic
              routes will be shown until then.
            </p>
          </div>
        )}

        <RoutesWorkbench
          mapboxPublicToken={mapboxPublicToken}
          defaultDistance={defaultDistance}
          linkedWorkoutId={linkedWorkoutId}
        />

        {/* Saved routes library */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-ink/20" />
            <div className="label-bib">
              Library · {savedRoutes.length} saved
            </div>
            <div className="h-px flex-1 bg-ink/20" />
          </div>
          {savedRoutes.length === 0 ? (
            <div className="rounded-sm border border-dashed border-ink/20 bg-surface p-4 text-center">
              <p className="font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
                No saved routes yet
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Generate or build a route above and save it. It&apos;ll
                show up here for quick access next time.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {savedRoutes.map((r, i) => (
                <RouteCard key={r.id} route={r} index={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
