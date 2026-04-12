"use client";

import { useMemo } from "react";
import Link from "next/link";
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
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
}

/**
 * Week view — editorial race-list treatment.
 *
 * 7 stacked day rows, each one rendered like a line in a race
 * program: BIB · DAY · DATE — TITLE — meta. Active day gets an ink
 * background, today gets a flash-orange bib number.
 */
export function WeekView({
  weekStart,
  today,
  workouts,
  friendRuns,
  clubEvents,
}: WeekViewProps) {
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
    <div className="overflow-hidden rounded-sm border border-ink/10 bg-surface">
      {days.map((day, idx) => {
        const iso = toISODate(day);
        const entry = lookup.get(iso)!;
        const isToday = isSameDay(day, today);
        const style = entry.workout
          ? styleForWorkout(entry.workout.workout_type)
          : null;
        const isLast = idx === days.length - 1;

        return (
          <Link
            key={iso}
            href={`/calendar/${iso}`}
            className={cn(
              "relative flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-ink/[0.03]",
              !isLast && "border-b border-ink/10",
            )}
          >
            {/* Left accent bar in workout color */}
            {style && (
              <div
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ backgroundColor: style.dot }}
                aria-hidden
              />
            )}

            {/* Bib column — day number + day letter */}
            <div className="flex w-11 shrink-0 flex-col items-center pl-1">
              <span
                className={cn(
                  "text-[9px] font-bold uppercase tracking-bib",
                  isToday ? "text-flash" : "text-ink-muted",
                )}
              >
                {formatWeekdayShort(idx)}
              </span>
              <span
                className={cn(
                  "mt-0.5 font-display text-xl font-black leading-none tabular-nums",
                  isToday ? "text-flash" : "text-ink",
                )}
              >
                {String(day.getDate()).padStart(2, "0")}
              </span>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              {entry.workout ? (
                <>
                  <div className="mb-0.5 font-mono text-[8px] font-bold uppercase tracking-bib text-flash">
                    Your workout
                  </div>
                  <div
                    className={cn(
                      "truncate font-display text-sm font-extrabold tracking-tight text-ink",
                      entry.workout.is_completed && "line-through text-ink-muted",
                    )}
                  >
                    {entry.workout.title}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                    {entry.workout.target_distance_miles != null && (
                      <span className="tabular-nums">
                        {entry.workout.target_distance_miles}MI
                      </span>
                    )}
                    {entry.workout.scheduled_time && (
                      <>
                        <span className="text-ink/20">·</span>
                        <span className="tabular-nums">
                          {formatTime(entry.workout.scheduled_time)}
                        </span>
                      </>
                    )}
                    {style && (
                      <>
                        <span className="text-ink/20">·</span>
                        <span>{style.label}</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs uppercase tracking-bib text-ink-muted/60">
                  ∅ Unscheduled
                </div>
              )}

              {(entry.friends.length > 0 || entry.events.length > 0) && (
                <div className="mt-1.5 flex flex-col gap-1">
                  {entry.friends.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center gap-1.5 rounded-xs bg-ink/[0.04] px-1.5 py-1"
                    >
                      <div
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-xs text-white"
                        style={{ backgroundColor: styleForWorkout(f.workout_type).dot }}
                      >
                        <span className="font-mono text-[8px] font-bold">
                          {f.friend_name.split(" ").map(w => w[0]).join("")}
                        </span>
                      </div>
                      <span className="truncate font-mono text-[9px] font-bold text-ink-muted">
                        {f.friend_name.split(" ")[0]} · {f.distance}MI · {formatTime(f.time)}
                      </span>
                    </div>
                  ))}
                  {entry.events.length > 0 && (
                    <div className="flex items-center gap-1.5 rounded-xs bg-flash/10 px-1.5 py-1">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-flash">
                        CLUB · {entry.events[0].title}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right-side status */}
            {entry.workout?.workout_type === "race" && (
              <span className="shrink-0 rounded-xs bg-flash px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink">
                RACE
              </span>
            )}
            {entry.workout?.is_completed && (
              <span className="shrink-0 rounded-xs border border-ink/20 bg-bone-soft px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                DONE
              </span>
            )}
          </Link>
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
