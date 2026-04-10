import type { TrainingPlanWorkout } from "@/lib/types";
import type { FriendRun } from "@/lib/mock-data";

/**
 * "This Week" summary tile. Computes planned vs completed miles,
 * workouts remaining, and a count of friends running near you.
 */
export function WeekSummary({
  workouts,
  friendRuns,
}: {
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
}) {
  const plannedMiles = workouts.reduce(
    (sum, w) => sum + (w.target_distance_miles ?? 0),
    0,
  );
  const completedMiles = workouts
    .filter((w) => w.is_completed)
    .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0);
  const runsRemaining = workouts.filter(
    (w) => !w.is_completed && w.workout_type !== "rest",
  ).length;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This week
        </h3>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {completedMiles.toFixed(0)} / {plannedMiles.toFixed(0)} mi
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{
            width: `${
              plannedMiles > 0
                ? Math.min(100, (completedMiles / plannedMiles) * 100)
                : 0
            }%`,
          }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Planned" value={`${plannedMiles.toFixed(0)} mi`} />
        <Stat label="Remaining" value={String(runsRemaining)} />
        <Stat label="Friends" value={String(friendRuns.length)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-base font-bold tabular-nums">
        {value}
      </div>
    </div>
  );
}
