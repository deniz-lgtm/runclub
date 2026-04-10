"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  formatWeekdayShort,
  getMonthGrid,
  isSameDay,
  toISODate,
} from "@/lib/date-utils";
import { styleForWorkout } from "@/lib/workout-colors";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { ClubEvent, FriendRun } from "@/lib/mock-data";

interface MonthViewProps {
  month: Date; // any date in the target month
  today: Date;
  selectedDate: Date;
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
  onSelectDate: (date: Date) => void;
}

/**
 * Month view — 6×7 grid.
 *
 * Tiny cells with a single color dot for the workout type + indicators
 * for friends/club events. Tapping a cell promotes that day to the
 * selected state and pops the day-detail sheet below.
 */
export function MonthView({
  month,
  today,
  selectedDate,
  workouts,
  friendRuns,
  clubEvents,
  onSelectDate,
}: MonthViewProps) {
  const grid = useMemo(() => getMonthGrid(month), [month]);

  const lookup = useMemo(() => {
    const byDate = new Map<
      string,
      {
        workout?: TrainingPlanWorkout;
        friends: FriendRun[];
        events: ClubEvent[];
      }
    >();
    for (const w of workouts) {
      const bucket = byDate.get(w.scheduled_date) ?? {
        friends: [],
        events: [],
      };
      bucket.workout = w;
      byDate.set(w.scheduled_date, bucket);
    }
    for (const f of friendRuns) {
      const bucket = byDate.get(f.date) ?? { friends: [], events: [] };
      bucket.friends.push(f);
      byDate.set(f.date, bucket);
    }
    for (const e of clubEvents) {
      const bucket = byDate.get(e.date) ?? { friends: [], events: [] };
      bucket.events.push(e);
      byDate.set(e.date, bucket);
    }
    return byDate;
  }, [workouts, friendRuns, clubEvents]);

  const monthIndex = month.getMonth();

  return (
    <div>
      {/* Weekday row */}
      <div className="grid grid-cols-7 gap-1 px-0.5 pb-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {formatWeekdayShort(i)}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day) => {
          const iso = toISODate(day);
          const entry = lookup.get(iso);
          const inMonth = day.getMonth() === monthIndex;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const style = entry?.workout
            ? styleForWorkout(entry.workout.workout_type)
            : null;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-start rounded-md border p-1 text-left transition-colors",
                inMonth
                  ? "border-border bg-surface"
                  : "border-transparent bg-transparent text-muted-foreground/50",
                isSelected && "border-primary ring-1 ring-primary/40",
              )}
            >
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center self-start text-[10px] font-semibold tabular-nums",
                  isToday &&
                    "rounded-full bg-primary text-primary-foreground",
                )}
              >
                {day.getDate()}
              </div>

              {/* Workout indicator dot */}
              {style && (
                <div
                  className="absolute bottom-1.5 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: style.dot }}
                />
              )}

              {/* Tiny indicators for friend runs / events */}
              {entry && (entry.friends.length > 0 || entry.events.length > 0) && (
                <div className="absolute right-1 top-1 flex gap-0.5">
                  {entry.friends.length > 0 && (
                    <span className="h-1 w-1 rounded-full bg-secondary" />
                  )}
                  {entry.events.length > 0 && (
                    <span className="text-[9px] leading-none">🏁</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
