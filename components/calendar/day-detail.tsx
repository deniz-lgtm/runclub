"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { formatLongDate } from "@/lib/date-utils";
import { initials } from "@/lib/utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { ClubEvent, FriendRun } from "@/lib/mock-data";
import { Clock, MapPin } from "lucide-react";

interface DayDetailProps {
  date: Date;
  workout: TrainingPlanWorkout | null;
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
}

/**
 * Day detail — the selected day's full breakdown. Editorial panel
 * with the date as a display headline, workout details, crew runs,
 * and club events sorted into labeled sections.
 */
export function DayDetail({
  date,
  workout,
  friendRuns,
  clubEvents,
}: DayDetailProps) {
  return (
    <div className="rounded-sm border border-ink/10 bg-surface p-4">
      {/* Date header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="label-bib">Day</div>
          <h3 className="font-display text-xl font-extrabold leading-none tracking-tightest text-ink">
            {formatLongDate(date)}
          </h3>
        </div>
        {workout && (
          <WorkoutChip
            type={workout.workout_type}
            label={styleForWorkout(workout.workout_type).label}
            size="md"
          />
        )}
      </div>

      {/* Your workout */}
      {workout ? (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <div className="flex items-center justify-between">
            <span className="label-bib">Workout</span>
            {workout.is_completed && (
              <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                ✓ Done
              </span>
            )}
          </div>
          <div className="mt-2 font-display text-base font-extrabold tracking-tight text-ink">
            {workout.title}
          </div>
          {workout.description && (
            <p className="mt-1 text-xs leading-snug text-ink-muted">
              {workout.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
            {workout.target_distance_miles != null && (
              <span className="tabular-nums text-ink">
                {workout.target_distance_miles}MI
              </span>
            )}
            {workout.scheduled_time && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {formatTime(workout.scheduled_time)}
              </span>
            )}
            {workout.location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {workout.location}
              </span>
            )}
          </div>
          {!workout.is_completed && workout.workout_type !== "rest" && (
            <div className="mt-3 flex gap-2">
              <Button variant="flash" size="sm" className="flex-1">
                Open to friends
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Find a route
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 border-t border-ink/10 pt-3 text-center">
          <span className="label-bib">∅ Unscheduled</span>
        </div>
      )}

      {/* Friend runs */}
      {friendRuns.length > 0 && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <div className="label-bib mb-2">
            Crew · {friendRuns.length} running
          </div>
          <div className="flex flex-col gap-1.5">
            {friendRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-2.5 rounded-xs border border-ink/10 bg-bone-soft/60 p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px]">
                    {initials(run.friend_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-xs font-extrabold text-ink">
                    {run.friend_name}
                  </div>
                  <div className="truncate font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                    {run.title} · {formatTime(run.time)} · {run.location}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Join
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Club events */}
      {clubEvents.length > 0 && (
        <div className="mt-4 border-t border-ink/10 pt-3">
          <div className="label-bib mb-2">Club events</div>
          <div className="flex flex-col gap-1.5">
            {clubEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2.5 rounded-xs border border-flash/40 bg-flash/10 p-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xs bg-flash font-mono text-[9px] font-bold uppercase tracking-bib text-ink">
                  CLUB
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-xs font-extrabold text-ink">
                    {e.title}
                  </div>
                  <div className="truncate font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                    {e.club_name} · {formatTime(e.time)} · {e.location}
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  RSVP
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}
