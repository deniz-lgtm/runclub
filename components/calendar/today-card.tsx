import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { formatLongDate } from "@/lib/date-utils";
import { initials } from "@/lib/utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { FriendRun } from "@/lib/mock-data";
import { Clock, MapPin, Users } from "lucide-react";

/**
 * "Today" card — the most-looked-at element in the app.
 *
 * Now includes a "CREW TODAY" section showing which friends are
 * running today with their workout, time, and location + a Join
 * button. This is what makes someone open the app every morning.
 */
export function TodayCard({
  date,
  workout,
  friendRunsToday = [],
}: {
  date: Date;
  workout: TrainingPlanWorkout | null;
  friendRunsToday?: FriendRun[];
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

        {/* Even on rest days, show if friends are running */}
        {friendRunsToday.length > 0 && (
          <CrewTodaySection friends={friendRunsToday} />
        )}
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
        {/* Eyebrow row */}
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

        {/* CREW TODAY — friends running today, right on the hero card */}
        {friendRunsToday.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-bib text-flash">
              <Users className="h-3 w-3" />
              Crew today · {friendRunsToday.length} running
            </div>
            <div className="mt-2 flex flex-col gap-1.5">
              {friendRunsToday.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center gap-2.5 rounded-xs bg-white/10 p-2"
                >
                  <Avatar className="h-7 w-7 shrink-0 rounded-xs">
                    <AvatarFallback className="rounded-xs bg-white/20 font-mono text-[9px] font-bold text-white">
                      {initials(run.friend_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-white">
                      {run.friend_name}
                    </div>
                    <div className="truncate font-mono text-[9px] font-bold uppercase tracking-bib text-white/50">
                      {run.title} · {formatTime(run.time)} · {run.location}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-white/40 text-white hover:bg-white hover:text-ink"
                  >
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Crew section for rest-day or no-workout TodayCards.
 * Same content, but on the bone (light) background.
 */
function CrewTodaySection({ friends }: { friends: FriendRun[] }) {
  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-bib text-flash">
        <Users className="h-3 w-3" />
        Crew today · {friends.length} running
      </div>
      <div className="mt-2 flex flex-col gap-1.5">
        {friends.map((run) => (
          <div
            key={run.id}
            className="flex items-center gap-2.5 rounded-xs border border-ink/10 bg-surface p-2"
          >
            <Avatar className="h-7 w-7 shrink-0 rounded-xs">
              <AvatarFallback className="rounded-xs bg-ink/10 font-mono text-[9px] font-bold text-ink">
                {initials(run.friend_name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-bold text-ink">
                {run.friend_name}
              </div>
              <div className="truncate font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                {run.title} · {formatTime(run.time)}
              </div>
            </div>
            <Button variant="flash" size="sm" className="shrink-0">
              Join
            </Button>
          </div>
        ))}
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
