"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { formatLongDate } from "@/lib/date-utils";
import { initials } from "@/lib/utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { ClubEvent, FriendRun } from "@/lib/mock-data";
import { Clock, MapPin, Users } from "lucide-react";

interface DayDetailProps {
  date: Date;
  workout: TrainingPlanWorkout | null;
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
}

/**
 * "Selected day" card that sits below the calendar.
 * Shows your workout (if any), friends who are running that day, and
 * any club events. This is how the runner jumps from calendar → action.
 */
export function DayDetail({
  date,
  workout,
  friendRuns,
  clubEvents,
}: DayDetailProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold">{formatLongDate(date)}</h3>
        {workout && (
          <WorkoutChip
            type={workout.workout_type}
            label={styleForWorkout(workout.workout_type).label}
            size="sm"
          />
        )}
      </div>

      {/* Your workout */}
      {workout ? (
        <div className="rounded-md border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your workout
            </div>
            {workout.is_completed && (
              <span className="text-[10px] font-semibold text-secondary">
                ✓ Completed
              </span>
            )}
          </div>
          <div className="mt-1.5 text-sm font-semibold">{workout.title}</div>
          {workout.description && (
            <p className="mt-1 text-xs text-muted-foreground">
              {workout.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {workout.target_distance_miles != null && (
              <span className="font-semibold tabular-nums text-foreground">
                {workout.target_distance_miles} mi
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
          {!workout.is_completed && workout.workout_type !== "rest" && (
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1">
                Open to friends
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                Find a route
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-muted/20 p-3 text-center text-xs text-muted-foreground">
          No workout scheduled.
        </div>
      )}

      {/* Friend runs */}
      {friendRuns.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Users className="h-3 w-3" /> Friends running
          </div>
          <div className="flex flex-col gap-2">
            {friendRuns.map((run) => (
              <div
                key={run.id}
                className="flex items-center gap-2.5 rounded-md border border-border bg-background/60 p-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px]">
                    {initials(run.friend_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">
                    {run.friend_name}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {run.title} • {formatTime(run.time)} •{" "}
                    {run.location}
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
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Club events
          </div>
          <div className="flex flex-col gap-2">
            {clubEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 p-2"
              >
                <span className="text-lg">🏁</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold">
                    {e.title}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {e.club_name} • {formatTime(e.time)} • {e.location}
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
