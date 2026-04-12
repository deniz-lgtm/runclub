"use client";

import { useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  getWeekDays,
  isSameDay,
  startOfDay,
  toISODate,
  formatWeekdayShort,
} from "@/lib/date-utils";
import { styleForWorkout } from "@/lib/workout-colors";
import type { TrainingPlanWorkout } from "@/lib/types";

interface MyWeekStripProps {
  workouts: TrainingPlanWorkout[];
}

/**
 * Compact horizontal week strip showing your workouts for the current week.
 * Each day is a small column: day letter, date, colored dot for workout type.
 * Tapping a day links to the workout detail.
 */
export function MyWeekStrip({ workouts }: MyWeekStripProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => getWeekDays(today), [today]);

  const byDate = useMemo(() => {
    const map = new Map<string, TrainingPlanWorkout>();
    for (const w of workouts) {
      map.set(w.scheduled_date, w);
    }
    return map;
  }, [workouts]);

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, idx) => {
        const iso = toISODate(day);
        const workout = byDate.get(iso);
        const isToday = isSameDay(day, today);
        const style = workout ? styleForWorkout(workout.workout_type) : null;
        const isPast = day < today && !isToday;

        const content = (
          <div
            className={cn(
              "flex flex-col items-center rounded-xs py-2 transition-colors",
              isToday
                ? "border border-ink bg-ink text-white"
                : "border border-ink/10 bg-surface text-ink hover:border-ink/30",
              isPast && !isToday && "opacity-50",
            )}
          >
            <span
              className={cn(
                "text-[8px] font-bold uppercase tracking-bib",
                isToday ? "text-white/60" : "text-ink-muted",
              )}
            >
              {formatWeekdayShort(idx).slice(0, 1)}
            </span>
            <span
              className={cn(
                "mt-0.5 font-display text-sm font-black leading-none tabular-nums",
                isToday ? "text-white" : "text-ink",
              )}
            >
              {String(day.getDate()).padStart(2, "0")}
            </span>
            {style && (
              <div
                className="mt-1 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: style.dot }}
              />
            )}
            {!style && <div className="mt-1 h-1.5 w-1.5" />}
          </div>
        );

        if (workout) {
          return (
            <Link key={iso} href={`/workout/${workout.id}`}>
              {content}
            </Link>
          );
        }
        return <div key={iso}>{content}</div>;
      })}
    </div>
  );
}
