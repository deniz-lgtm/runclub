"use client";

import { useMemo, useState } from "react";
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

export function CalendarView({
  workouts,
  friendRuns,
  clubEvents,
}: CalendarViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [mode, setMode] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

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

  const todaysWorkout = useMemo(() => {
    const iso = toISODate(today);
    return workouts.find((w) => w.scheduled_date === iso) ?? null;
  }, [today, workouts]);

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
      {/* Today card */}
      {isSameDay(selectedDate, today) || isCursorInCurrentWeek(cursor, today) ? (
        <TodayCard date={today} workout={todaysWorkout} />
      ) : null}

      {/* This Week summary */}
      <WeekSummary workouts={weekWorkouts} friendRuns={weekFriendRuns} />

      {/* View toggle + navigation */}
      <div className="flex items-center justify-between">
        {/* Segmented toggle */}
        <div className="inline-flex overflow-hidden rounded-xs border border-ink">
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

        {/* Prev / Today / Next */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={navigatePrev}
            aria-label="Previous"
            className="flex h-8 w-8 items-center justify-center rounded-xs border border-ink/20 bg-surface text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={navigateToday}
            className="h-8 rounded-xs border border-ink/20 bg-surface px-3 text-[10px] font-bold uppercase tracking-bib text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={navigateNext}
            aria-label="Next"
            className="flex h-8 w-8 items-center justify-center rounded-xs border border-ink/20 bg-surface text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Period label */}
      <div className="-mt-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-ink/20" aria-hidden />
        <div className="label-bib">{headerLabel}</div>
        <div className="h-px flex-1 bg-ink/20" aria-hidden />
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
        "px-3 py-1.5 text-[10px] font-bold uppercase tracking-bib transition-colors",
        active ? "bg-ink text-white" : "text-ink hover:bg-ink/5",
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
