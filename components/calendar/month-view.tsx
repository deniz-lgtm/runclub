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
  month: Date;
  today: Date;
  selectedDate: Date;
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
  onSelectDate: (date: Date) => void;
}

/**
 * Month view — stark ink grid on bone. Each day is a square cell with
 * mono numeric date and a colored workout bar below. Today is a
 * solid ink square. Selected day gets a hairline ink ring.
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
    <div className="overflow-hidden rounded-sm border border-ink/10 bg-surface">
      {/* Weekday header row */}
      <div className="grid grid-cols-7 border-b border-ink/10">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="py-2 text-center text-[9px] font-bold uppercase tracking-bib text-ink-muted"
          >
            {formatWeekdayShort(i).slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {grid.map((day, idx) => {
          const iso = toISODate(day);
          const entry = lookup.get(iso);
          const inMonth = day.getMonth() === monthIndex;
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);
          const style = entry?.workout
            ? styleForWorkout(entry.workout.workout_type)
            : null;
          const rowEnd = idx % 7 === 6;
          const lastRow = idx >= 35;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(day)}
              className={cn(
                "relative flex aspect-square flex-col items-start p-1.5 text-left transition-colors",
                !rowEnd && "border-r border-ink/10",
                !lastRow && "border-b border-ink/10",
                inMonth ? "bg-surface" : "bg-bone-soft/50",
                isSelected && "bg-ink/[0.04] ring-1 ring-inset ring-ink",
              )}
            >
              {/* Date number */}
              <div
                className={cn(
                  "flex items-center justify-center font-mono text-[11px] font-bold tabular-nums",
                  inMonth ? "text-ink" : "text-ink/25",
                  isToday &&
                    "h-[18px] w-[18px] rounded-xs bg-ink text-white",
                )}
              >
                {String(day.getDate()).padStart(2, "0")}
              </div>

              {/* Workout indicator bar */}
              {style && (
                <div
                  className="absolute bottom-1.5 left-1.5 right-1.5 h-[3px]"
                  style={{ backgroundColor: style.dot }}
                />
              )}

              {/* Friend + club indicators */}
              {entry && (entry.friends.length > 0 || entry.events.length > 0) && (
                <div className="absolute right-1 top-1 flex gap-0.5">
                  {entry.friends.length > 0 && (
                    <span className="h-1 w-1 rounded-none bg-flash" />
                  )}
                  {entry.events.length > 0 && (
                    <span className="h-1 w-1 rounded-none bg-ink" />
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
