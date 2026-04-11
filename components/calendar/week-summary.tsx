import type { TrainingPlanWorkout } from "@/lib/types";
import type { FriendRun } from "@/lib/mock-data";

/**
 * "Week" summary panel. Editorial stat box with big display numbers
 * and a flash-orange progress bar. Reads like a race-day scoreboard.
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
  const pct =
    plannedMiles > 0 ? Math.min(100, (completedMiles / plannedMiles) * 100) : 0;

  return (
    <div className="rounded-sm border border-ink/10 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-bib">Week</span>
        <span className="font-mono text-[10px] font-bold tabular-nums text-ink-muted">
          {completedMiles.toFixed(0)}/{plannedMiles.toFixed(0)}MI
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 border-t border-ink/10 pt-3">
        <Stat label="Planned" value={`${plannedMiles.toFixed(0)}`} unit="MI" />
        <Stat label="Left" value={String(runsRemaining)} />
        <Stat label="Crew" value={String(friendRuns.length)} />
      </div>

      {/* Progress bar — track + fill */}
      <div className="mt-3 h-1 w-full overflow-hidden bg-ink/10">
        <div
          className="h-full bg-flash transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] font-bold uppercase tracking-bib text-ink-muted">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1 truncate">
        <span className="font-display text-2xl font-black leading-none tracking-tightest tabular-nums text-ink">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9px] font-bold uppercase text-ink-muted">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
