import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { OpenToFriendsPanel } from "@/components/training/open-to-friends-panel";
import { WorkoutCompletionForm } from "@/components/training/workout-completion-form";
import { styleForWorkout } from "@/lib/workout-colors";
import { getWorkoutById } from "@/lib/queries/plans";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { formatLongDate, fromISODate } from "@/lib/date-utils";
import { ChevronLeft, Clock, MapPin } from "lucide-react";

/**
 * Workout detail page.
 *
 * Shows:
 *  - The prescription (title, description, target distance/time/location)
 *  - Open-to-Friends panel (Phase 2B)
 *  - Log-completion form (or the logged actuals if already done)
 *  - A link back to the parent plan
 */
export default async function WorkoutDetailPage({
  params,
}: {
  params: { workoutId: string };
}) {
  const profile = await requireProfile();
  const result = await getWorkoutById(params.workoutId);
  if (!result) notFound();

  const { workout, plan } = result;
  const style = styleForWorkout(workout.workout_type);
  const isOwner = plan.user_id === profile.id;

  // Fetch the existing invite (if any) so the panel knows current state.
  const supabase = createSupabaseServerClient();
  const { data: invite } = await supabase
    .from("run_invites")
    .select(
      `
      id, is_open, meetup_location, max_joiners, notes,
      responses:run_invite_responses ( status )
    `,
    )
    .eq("workout_id", workout.id)
    .maybeSingle();

  const goingCount =
    ((invite as any)?.responses as { status: string }[] | null)?.filter(
      (r) => r.status === "going",
    ).length ?? 0;

  return (
    <>
      <PageHeader title={workout.title}>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/train/${plan.id}`}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Prescription */}
        <div
          className="relative overflow-hidden rounded-lg border bg-surface p-5 shadow-sm"
          style={{ borderColor: `${style.dot}66` }}
        >
          <div
            className="absolute inset-y-0 left-0 w-1.5"
            style={{ backgroundColor: style.dot }}
            aria-hidden
          />
          <div className="flex items-center justify-between">
            <WorkoutChip type={workout.workout_type} label={style.label} />
            {workout.is_completed && <Badge>Completed</Badge>}
          </div>
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {formatLongDate(fromISODate(workout.scheduled_date))}
          </div>
          {workout.description && (
            <p className="mt-2 text-sm leading-relaxed">{workout.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {workout.target_distance_miles != null && (
              <span className="font-semibold tabular-nums text-foreground">
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
          {plan.sync_source !== "none" && (
            <p className="mt-3 text-[10px] text-muted-foreground">
              Synced from{" "}
              {plan.sync_source === "trainingpeaks"
                ? "TrainingPeaks"
                : "Final Surge"}{" "}
              — don&apos;t edit here; changes will be overwritten on next sync.
            </p>
          )}
        </div>

        {/* Actual (if completed) */}
        {workout.is_completed && workout.actual_distance_miles != null && (
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-secondary">
              Actual
            </h3>
            <div className="mt-2 grid grid-cols-3 gap-3">
              <Stat
                label="Distance"
                value={`${workout.actual_distance_miles} mi`}
              />
              <Stat
                label="Duration"
                value={
                  workout.actual_duration_minutes
                    ? `${workout.actual_duration_minutes} min`
                    : "—"
                }
              />
              <Stat
                label="Effort"
                value={workout.effort_rating ? `${workout.effort_rating}/10` : "—"}
              />
            </div>
            {workout.notes && (
              <p className="mt-3 text-sm text-muted-foreground">
                {workout.notes}
              </p>
            )}
          </div>
        )}

        {/* Phase 2B — Open to Friends (only if owner + not a rest day) */}
        {isOwner && workout.workout_type !== "rest" && (
          <OpenToFriendsPanel
            workoutId={workout.id}
            currentlyOpen={Boolean((invite as any)?.is_open)}
            initialMeetup={(invite as any)?.meetup_location ?? null}
            initialMaxJoiners={(invite as any)?.max_joiners ?? null}
            initialNotes={(invite as any)?.notes ?? null}
            goingCount={goingCount}
          />
        )}

        {/* Completion logging (only if owner + not a rest day) */}
        {isOwner && workout.workout_type !== "rest" && (
          <WorkoutCompletionForm
            workoutId={workout.id}
            isCompleted={workout.is_completed}
            actualDistance={workout.actual_distance_miles}
            actualDuration={workout.actual_duration_minutes}
            effortRating={workout.effort_rating}
            existingNotes={workout.notes}
          />
        )}

        {/* Route generator shortcut */}
        {workout.target_distance_miles != null && (
          <Button variant="outline" className="w-full" asChild>
            <Link
              href={`/routes?distance=${workout.target_distance_miles}&workoutId=${workout.id}`}
            >
              Find a route for this workout
            </Link>
          </Button>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
