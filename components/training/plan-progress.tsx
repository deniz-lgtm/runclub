/**
 * Progress dashboard for a training plan.
 * Shown at the top of the plan detail page.
 */
interface PlanProgressProps {
  plannedMiles: number;
  completedMiles: number;
  totalWorkouts: number;
  completedWorkouts: number;
  consistencyPct: number;
  daysToGoal: number | null;
}

export function PlanProgress({
  plannedMiles,
  completedMiles,
  totalWorkouts,
  completedWorkouts,
  consistencyPct,
  daysToGoal,
}: PlanProgressProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <Stat
          label="Completed"
          value={`${completedWorkouts}/${totalWorkouts}`}
          hint="workouts"
        />
        <Stat
          label="Miles run"
          value={completedMiles.toFixed(0)}
          hint={`of ${plannedMiles.toFixed(0)} planned`}
        />
        <Stat
          label="Consistency"
          value={`${consistencyPct}%`}
          hint="hit rate"
        />
        <Stat
          label={daysToGoal != null ? "Days to race" : "Goal date"}
          value={daysToGoal != null ? String(Math.max(0, daysToGoal)) : "—"}
          hint={daysToGoal != null && daysToGoal < 0 ? "past" : undefined}
        />
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Plan progress</span>
          <span className="tabular-nums">
            {totalWorkouts > 0
              ? Math.round((completedWorkouts / totalWorkouts) * 100)
              : 0}
            %
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${
                totalWorkouts > 0
                  ? (completedWorkouts / totalWorkouts) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 truncate text-xl font-bold tabular-nums">
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-muted-foreground">{hint}</div>
      )}
    </div>
  );
}
