"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  addDays,
  formatMonth,
  formatWeekdayShort,
  getMonthGrid,
  isSameDay,
  startOfDay,
  toISODate,
} from "@/lib/date-utils";
import { styleForWorkout } from "@/lib/workout-colors";
import type { FriendRun } from "@/lib/mock-data";

interface FriendsMonthCalendarProps {
  friendRuns: FriendRun[];
  onDaySelect?: (date: string) => void;
  selectedDate?: string | null;
}

/**
 * Monthly calendar showing friend avatars on days they're running.
 * Each day cell shows tiny colored initials for each friend who has
 * a workout that day. Tapping a day highlights it and scrolls
 * the list below to that day's workouts.
 */
export function FriendsMonthCalendar({
  friendRuns,
  onDaySelect,
  selectedDate,
}: FriendsMonthCalendarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState<Date>(today);

  const grid = useMemo(() => getMonthGrid(month), [month]);
  const monthIndex = month.getMonth();

  // Group friend runs by date, dedup by friend
  const runsByDate = useMemo(() => {
    const map = new Map<
      string,
      { friend_id: string; friend_name: string; workout_type: string }[]
    >();
    for (const run of friendRuns) {
      const existing = map.get(run.date) ?? [];
      // Deduplicate by friend_id per day
      if (!existing.some((r) => r.friend_id === run.friend_id)) {
        existing.push({
          friend_id: run.friend_id,
          friend_name: run.friend_name,
          workout_type: run.workout_type,
        });
      }
      map.set(run.date, existing);
    }
    return map;
  }, [friendRuns]);

  function navigatePrev() {
    setMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }
  function navigateNext() {
    setMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }
  function navigateToday() {
    setMonth(today);
  }

  return (
    <div>
      {/* Month nav header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-black tracking-tight text-ink">
            {formatMonth(month)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={navigatePrev}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-xs border border-ink/20 bg-surface text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={navigateToday}
            className="h-7 rounded-xs border border-ink/20 bg-surface px-2 text-[9px] font-bold uppercase tracking-bib text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={navigateNext}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-xs border border-ink/20 bg-surface text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-sm border border-ink/10 bg-surface">
        {/* Weekday header row */}
        <div className="grid grid-cols-7 border-b border-ink/10">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="py-1.5 text-center text-[9px] font-bold uppercase tracking-bib text-ink-muted"
            >
              {formatWeekdayShort(i).slice(0, 1)}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            const iso = toISODate(day);
            const inMonth = day.getMonth() === monthIndex;
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate === iso;
            const friends = runsByDate.get(iso) ?? [];
            const rowEnd = idx % 7 === 6;
            const lastRow = idx >= 35;

            return (
              <button
                key={iso}
                type="button"
                onClick={() => onDaySelect?.(iso)}
                className={cn(
                  "relative flex aspect-square flex-col items-center p-1 transition-colors",
                  !rowEnd && "border-r border-ink/10",
                  !lastRow && "border-b border-ink/10",
                  inMonth ? "bg-surface" : "bg-bone-soft/50",
                  isSelected && "bg-flash/10",
                  !isSelected && "hover:bg-ink/[0.04]",
                )}
              >
                {/* Date number */}
                <div
                  className={cn(
                    "flex h-[18px] w-[18px] items-center justify-center font-mono text-[10px] font-bold tabular-nums",
                    inMonth ? "text-ink" : "text-ink/25",
                    isToday && "rounded-xs bg-ink text-white",
                    isSelected && !isToday && "rounded-xs bg-flash text-white",
                  )}
                >
                  {String(day.getDate()).padStart(2, "0")}
                </div>

                {/* Friend avatars */}
                {friends.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap justify-center gap-[2px]">
                    {friends.slice(0, 3).map((f) => {
                      const style = styleForWorkout(
                        f.workout_type as import("@/lib/types").WorkoutType,
                      );
                      const initial = f.friend_name
                        .split(" ")
                        .map((w) => w[0])
                        .join("");
                      return (
                        <div
                          key={f.friend_id}
                          className="flex h-[14px] w-[14px] items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: style.dot }}
                          title={f.friend_name}
                        >
                          <span className="text-[6px] font-bold leading-none">
                            {initial}
                          </span>
                        </div>
                      );
                    })}
                    {friends.length > 3 && (
                      <div className="flex h-[14px] w-[14px] items-center justify-center rounded-full bg-ink/20 text-ink">
                        <span className="text-[6px] font-bold leading-none">
                          +{friends.length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
