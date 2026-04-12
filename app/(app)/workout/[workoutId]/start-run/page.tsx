import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { getWorkoutById } from "@/lib/queries/plans";
import { requireProfile } from "@/lib/auth";
import { formatLongDate, fromISODate } from "@/lib/date-utils";
import { getLinkedRoute } from "./queries";
import { StartRunClient } from "./start-run-client";
import { ChevronLeft, Clock, MapPin } from "lucide-react";

/**
 * Pre-run screen.
 *
 * Shows the workout prescription at a glance, an optional route map,
 * and deep-link buttons to start the run in Strava or the native
 * Apple Watch workout app.
 */
export default async function StartRunPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const profile = await requireProfile();
  const result = await getWorkoutById(params.workoutId);
  if (!result) notFound();

  const { workout, plan } = result;

  // Only the plan owner can start their own run.
  if (plan.user_id !== profile.id) notFound();
  if (workout.workout_type === "rest") notFound();

  const style = styleForWorkout(workout.workout_type);
  const route = await getLinkedRoute(workout.id);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;

  return (
    <>
      <PageHeader title="Start Run">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/workout/${workout.id}`}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4 pb-8">
        {/* Workout summary card */}
        <div
          className="relative overflow-hidden rounded-lg border bg-surface p-4 shadow-sm"
          style={{ borderColor: `${style.dot}66` }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ backgroundColor: style.dot }}
            aria-hidden
          />
          <div className="flex items-center gap-2">
            <WorkoutChip type={workout.workout_type} label={style.label} />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {formatLongDate(fromISODate(workout.scheduled_date))}
            </span>
          </div>
          <h2 className="mt-2 text-lg font-black leading-tight tracking-tight text-ink">
            {workout.title}
          </h2>
          {workout.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {workout.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {workout.target_distance_miles != null && (
              <span className="text-base font-black tabular-nums text-ink">
                {workout.target_distance_miles} mi
              </span>
            )}
            {workout.scheduled_time && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {workout.scheduled_time.slice(0, 5)}
              </span>
            )}
            {workout.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {workout.location}
              </span>
            )}
          </div>
        </div>

        {/* Client-side interactive portion: route map, deep links, tips */}
        <StartRunClient
          workoutId={workout.id}
          workoutType={workout.workout_type}
          targetDistance={workout.target_distance_miles}
          route={
            route
              ? {
                  title: route.title,
                  geometry: route.route_geojson,
                  startLat: route.start_latitude,
                  startLng: route.start_longitude,
                  elevationGainFt: route.elevation_gain_ft,
                  distanceMiles: route.actual_distance_miles ?? route.target_distance_miles,
                }
              : null
          }
          mapboxToken={mapboxToken}
        />
      </div>
    </>
  );
}
