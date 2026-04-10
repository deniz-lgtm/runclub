"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TodayCard } from "./today-card";
import { WeekSummary } from "./week-summary";
import { WeekView, weekRange } from "./week-view";
import { MonthView } from "./month-view";
import { DayDetail } from "./day-detail";
import {
  addDays,
  formatMonth,
  getWeekDays,
  isSameDay,
  startOfDay,
  startOfWeek,
  toISODate,
} from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { TrainingPlanWorkout } from "@/lib/types";
import type { ClubEvent, FriendRun } from "@/lib/mock-data";

type ViewMode = "week" | "month";

interface CalendarViewProps {
  workouts: TrainingPlanWorkout[];
  friendRuns: FriendRun[];
  clubEvents: ClubEvent[];
}

/**
 * The Calendar tab's main body. Owns:
 *   - Week/month view toggle
 *   - The "cursor" (selected date)
 *   - Prev/next navigation (by week or by month, depending on view)
 *   - The Today card, This Week summary, the grid, and the day-detail card
 *
 * Data is passed in as props — the page-level server component queries
 * Supabase (or falls back to the mock fixtures) before rendering this.
 */
export function CalendarView({
  workouts,
  friendRuns,
  clubEvents,
}: CalendarViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [mode, setMode] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Current week's workouts/friends/events (for the summary tile).
  const weekWorkouts = useMemo(() => {
    const start = startOfWeek(cursor);
    const dates = new Set(
      Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i))),
    );
    return workouts.filter((w) => dates.has(w.scheduled_date));
  }, [cursor, workouts]);

  const weekFriendRuns = useMemo(() => {
    const start = startOfWeek(cursor);
    const dates = new Set(
      Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i))),
    );
    return friendRuns.filter((r) => dates.has(r.date));
  }, [cursor, friendRuns]);

  // Today's workout for the hero card.
  const todaysWorkout = useMemo(() => {
    const iso = toISODate(today);
    return workouts.find((w) => w.scheduled_date === iso) ?? null;
  }, [today, workouts]);

  // Selected day's detail.
  const selectedIso = toISODate(selectedDate);
  const selectedWorkout =
    workouts.find((w) => w.scheduled_date === selectedIso) ?? null;
  const selectedFriendRuns = friendRuns.filter((r) => r.date === selectedIso);
  const selectedClubEvents = clubEvents.filter((e) => e.date === selectedIso);

  function navigatePrev() {
    setCursor((prev) => addDays(prev, mode === "week" ? -7 : -30));
  }
  function navigateNext() {
    setCursor((prev) => addDays(prev, mode === "week" ? 7 : 30));
  }
  function navigateToday() {
    setCursor(today);
    setSelectedDate(today);
  }

  const headerLabel =
    mode === "week" ? weekRange(startOfWeek(cursor)) : formatMonth(cursor);

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Today card — only when today is visible in the current view */}
      {isSameDay(selectedDate, today) || isCursorInCurrentWeek(cursor, today) ? (
        <TodayCard date={today} workout={todaysWorkout} />
      ) : null}

      {/* This Week summary */}
      <WeekSummary workouts={weekWorkouts} friendRuns={weekFriendRuns} />

      {/* View toggle + navigation */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          <ToggleButton
            active={mode === "week"}
            onClick={() => setMode("week")}
            label="Week"
          />
          <ToggleButton
            active={mode === "month"}
            onClick={() => setMode("month")}
            label="Month"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={navigatePrev}
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={navigateToday}
            className="h-8 px-2 text-[11px]"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={navigateNext}
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Period label */}
      <div className="-mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {headerLabel}
      </div>

      {/* Grid */}
      {mode === "week" ? (
        <WeekView
          weekStart={startOfWeek(cursor)}
          today={today}
          selectedDate={selectedDate}
          workouts={workouts}
          friendRuns={friendRuns}
          clubEvents={clubEvents}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <MonthView
          month={cursor}
          today={today}
          selectedDate={selectedDate}
          workouts={workouts}
          friendRuns={friendRuns}
          clubEvents={clubEvents}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Day detail */}
      <DayDetail
        date={selectedDate}
        workout={selectedWorkout}
        friendRuns={selectedFriendRuns}
        clubEvents={selectedClubEvents}
      />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

function isCursorInCurrentWeek(cursor: Date, today: Date): boolean {
  const days = getWeekDays(cursor);
  return days.some((d) => isSameDay(d, today));
}
