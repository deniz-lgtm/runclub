"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatWeekdayShort,
  getWeekDays,
  isSameDay,
  toISODate,
} from "@/lib/date-utils";
import { styleForWorkout } from "@/lib/workout-colors";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { ClubEvent, FriendRun } from "@/lib/mock-data";

interface WeekViewProps {
  weekStart: Date;
  today: Date;
  selectedDate: Date;
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
  onSelectDate: (date: Date) => void;
}

/**
 * Week view — 7 stacked day rows.
 *
 * On a narrow phone screen, a side-by-side grid gives each day way too
 * little room for real info. So week view is a *vertical stack* of
 * day rows, each one rich: weekday label, date, workout chip, miles,
 * friends' runs as avatars, club event markers.
 */
export function WeekView({
  weekStart,
  today,
  selectedDate,
  workouts,
  friendRuns,
  clubEvents,
  onSelectDate,
}: WeekViewProps) {
  // Index all the events by date once, for O(1) lookups inside the loop.
  const lookup = useMemo(() => {
    const byDate = new Map<
      string,
      {
        workout?: TrainingPlanWorkout;
        friends: FriendRun[];
        events: ClubEvent[];
      }
    >();
    for (const d of getWeekDays(weekStart)) {
      byDate.set(toISODate(d), { friends: [], events: [] });
    }
    for (const w of workouts) {
      const bucket = byDate.get(w.scheduled_date);
      if (bucket) bucket.workout = w;
    }
    for (const f of friendRuns) {
      const bucket = byDate.get(f.date);
      if (bucket) bucket.friends.push(f);
    }
    for (const e of clubEvents) {
      const bucket = byDate.get(e.date);
      if (bucket) bucket.events.push(e);
    }
    return byDate;
  }, [weekStart, workouts, friendRuns, clubEvents]);

  const days = getWeekDays(weekStart);

  return (
    <div className="flex flex-col gap-1.5">
      {days.map((day, idx) => {
        const iso = toISODate(day);
        const entry = lookup.get(iso)!;
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDate);
        const style = entry.workout
          ? styleForWorkout(entry.workout.workout_type)
          : null;

        return (
          <button
            key={iso}
            type="button"
            onClick={() => onSelectDate(day)}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-lg border bg-surface p-3 text-left transition-all active:scale-[0.99]",
              isSelected
                ? "border-primary shadow-sm"
                : "border-border hover:border-primary/40",
            )}
          >
            {/* Color stripe on left edge */}
            {style && (
              <div
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: style.dot }}
                aria-hidden
              />
            )}

            {/* Date column */}
            <div className="flex w-12 shrink-0 flex-col items-center pl-1">
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {formatWeekdayShort(idx)}
              </span>
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold tabular-nums",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {entry.workout ? (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm font-semibold",
                        entry.workout.is_completed &&
                          "text-muted-foreground line-through",
                      )}
                    >
                      {entry.workout.title}
                    </span>
                  </div>
                  {entry.workout.target_distance_miles != null && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                      {entry.workout.target_distance_miles} mi
                      {entry.workout.scheduled_time &&
                        ` • ${formatTime(entry.workout.scheduled_time)}`}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs italic text-muted-foreground">
                  No workout scheduled
                </div>
              )}

              {/* Friends + club event indicators */}
              {(entry.friends.length > 0 || entry.events.length > 0) && (
                <div className="mt-1.5 flex items-center gap-1">
                  {entry.friends.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      className="h-4 w-4 shrink-0 rounded-full border-2 border-surface"
                      style={{
                        backgroundColor: styleForWorkout(f.workout_type).dot,
                      }}
                      title={`${f.friend_name} — ${f.title}`}
                    />
                  ))}
                  {entry.friends.length > 4 && (
                    <span className="text-[9px] text-muted-foreground">
                      +{entry.friends.length - 4}
                    </span>
                  )}
                  {entry.events.map((e) => (
                    <span
                      key={e.id}
                      className="ml-1 text-[11px]"
                      title={`${e.club_name} — ${e.title}`}
                    >
                      🏁
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right-side status pill */}
            {entry.workout?.workout_type === "race" && (
              <span className="ml-auto shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                RACE
              </span>
            )}
            {entry.workout?.is_completed && (
              <span className="ml-auto shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                DONE
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function weekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6);
  const startMonth = weekStart.toLocaleString("en-US", { month: "short" });
  const endMonth = end.toLocaleString("en-US", { month: "short" });
  if (startMonth === endMonth) {
    return `${startMonth} ${weekStart.getDate()}–${end.getDate()}`;
  }
  return `${startMonth} ${weekStart.getDate()} – ${endMonth} ${end.getDate()}`;
}
