import { Button } from "@/components/ui/button";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { formatLongDate } from "@/lib/date-utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import { Clock, MapPin } from "lucide-react";

/**
 * "Today" card — the most-looked-at element in the app. Editorial
 * treatment: all-caps eyebrow label, huge display title, mono data
 * row, stark ink-on-bone composition.
 *
 * Rest day gets a quieter variant.
 */
export function TodayCard({
  date,
  workout,
}: {
  date: Date;
  workout: TrainingPlanWorkout | null;
}) {
  // Rest day fallback.
  if (!workout || workout.workout_type === "rest") {
    return (
      <div className="relative overflow-hidden rounded-sm border border-ink/10 bg-bone-soft p-5">
        <div className="label-bib">
          Today · {formatLongDate(date).toUpperCase()}
        </div>
        <h3 className="mt-2 font-display text-3xl font-black leading-[0.95] tracking-tightest text-ink">
          Rest Day
        </h3>
        <p className="mt-2 text-sm text-ink-muted">
          Hydrate. Roll out. Sleep in. Recovery is training.
        </p>
      </div>
    );
  }

  const style = styleForWorkout(workout.workout_type);

  return (
    <div className="relative overflow-hidden rounded-sm border border-ink bg-ink text-white">
      {/* Accent stripe in workout color — thin top band */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />

      <div className="p-5">
        {/* Eyebrow row: date + bib index + workout type chip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-xs border border-white/30 bg-transparent px-1 font-mono text-[10px] font-bold tabular-nums text-white">
              01
            </span>
            <span className="text-[10px] font-bold uppercase tracking-bib text-white/60">
              Today · {formatLongDate(date)}
            </span>
          </div>
          <WorkoutChip type={workout.workout_type} label={style.label} />
        </div>

        {/* Title */}
        <h3 className="mt-3 font-display text-3xl font-black leading-[0.95] tracking-tightest text-white">
          {workout.title}
        </h3>

        {/* Description */}
        {workout.description && (
          <p className="mt-2 text-sm leading-snug text-white/70">
            {workout.description}
          </p>
        )}

        {/* Data row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3">
          {workout.target_distance_miles != null && (
            <Data label="Dist">
              {workout.target_distance_miles.toFixed(1)} mi
            </Data>
          )}
          {workout.scheduled_time && (
            <Data label="Time" icon={<Clock className="h-2.5 w-2.5" />}>
              {formatTime(workout.scheduled_time)}
            </Data>
          )}
          {workout.location && (
            <Data label="Loc" icon={<MapPin className="h-2.5 w-2.5" />}>
              {workout.location}
            </Data>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Button variant="flash" size="sm" className="flex-1">
            Open to friends
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-white/50 text-white hover:bg-white hover:text-ink"
          >
            Find a route
          </Button>
        </div>
      </div>
    </div>
  );
}

function Data({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold uppercase tracking-bib text-white/40">
        {label}
      </span>
      <span className="flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-white">
        {icon}
        {children}
      </span>
    </div>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}
