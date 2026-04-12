"use client";

import { useMemo, useState } from "react";
import { FriendsMonthCalendar } from "./friends-month-calendar";
import { FriendsWeekList } from "./friends-week-list";
import { Button } from "@/components/ui/button";
import { addDays, startOfWeek, toISODate, startOfDay } from "@/lib/date-utils";
import type { FriendRun } from "@/lib/mock-data";

interface FriendsFeedViewProps {
  friendRuns: FriendRun[];
}

/**
 * The main Feed view — friends-first calendar feed.
 *
 * Top: Monthly calendar with friend avatars on running days.
 * Bottom: Upcoming week list with detailed friend workouts.
 * Tapping a day on the calendar filters the list to that day.
 */
export function FriendsFeedView({ friendRuns }: FriendsFeedViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  // For the week list, show the upcoming 7 days unless a date is selected
  const upcomingRuns = useMemo(() => {
    const start = toISODate(today);
    const end = toISODate(addDays(today, 7));
    return friendRuns.filter((r) => r.date >= start && r.date <= end);
  }, [friendRuns, today]);

  function handleDaySelect(date: string) {
    // Toggle: tap same day again to deselect
    setSelectedDate((prev) => (prev === date ? null : date));
  }

  function clearFilter() {
    setSelectedDate(null);
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Monthly calendar */}
      <FriendsMonthCalendar
        friendRuns={friendRuns}
        onDaySelect={handleDaySelect}
        selectedDate={selectedDate}
      />

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-ink/20" />
        <div className="label-bib">
          {selectedDate ? formatSelectedLabel(selectedDate) : "Upcoming · This week"}
        </div>
        <div className="h-px flex-1 bg-ink/20" />
      </div>

      {/* Active filter indicator */}
      {selectedDate && (
        <div className="flex items-center justify-between rounded-xs border border-flash/30 bg-flash/5 px-3 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-bib text-flash">
            Showing: {formatSelectedLabel(selectedDate)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilter}
            className="h-6 px-2 text-[10px] text-ink-muted hover:text-ink"
          >
            Show all
          </Button>
        </div>
      )}

      {/* Week list */}
      <FriendsWeekList
        friendRuns={selectedDate ? friendRuns : upcomingRuns}
        filterDate={selectedDate}
      />
    </div>
  );
}

function formatSelectedLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delta = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (delta === 0) return "Today";
  if (delta === 1) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
