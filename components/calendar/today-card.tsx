import { Button } from "@/components/ui/button";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { formatMiles } from "@/lib/utils";
import { formatLongDate } from "@/lib/date-utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import { Clock, MapPin } from "lucide-react";

/**
 * Prominent "today's workout" card — pinned to the top of the Calendar
 * tab. Designed to be the first thing the runner sees each morning.
 */
export function TodayCard({
  date,
  workout,
}: {
  date: Date;
  workout: TrainingPlanWorkout | null;
}) {
  // Rest day or nothing scheduled → lighter treatment.
  if (!workout || workout.workout_type === "rest") {
    return (
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted/40 p-5">
        <Label>Today • {formatLongDate(date)}</Label>
        <div className="mt-2 flex items-start gap-3">
          <div className="text-3xl">😴</div>
          <div>
            <h3 className="text-lg font-bold">Rest day</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Hydrate, roll out, sleep in. Recovery is training.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const style = styleForWorkout(workout.workout_type);

  return (
    <div
      className="relative overflow-hidden rounded-lg border bg-surface p-5 shadow-sm"
      style={{ borderColor: `${style.dot}66` }}
    >
      {/* Color accent stripe on the left edge */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />

      <div className="flex items-center justify-between">
        <Label>Today • {formatLongDate(date)}</Label>
        <WorkoutChip
          type={workout.workout_type}
          label={style.label}
          size="sm"
        />
      </div>

      <h3 className="mt-2 text-lg font-bold leading-tight">{workout.title}</h3>

      {workout.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {workout.description}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {workout.target_distance_miles != null && (
          <span className="font-semibold tabular-nums text-foreground">
            {formatMiles(workout.target_distance_miles)}
          </span>
        )}
        {workout.scheduled_time && (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(workout.scheduled_time)}
          </span>
        )}
        {workout.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {workout.location}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button size="sm" className="flex-1">
          Open to friends
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          Find a route
        </Button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

/**
 * Format "HH:MM" → "6:30 AM". No timezone conversions — the value is
 * already local wall-clock time.
 */
function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

