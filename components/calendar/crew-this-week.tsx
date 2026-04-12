"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "./workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import type { FriendRun } from "@/lib/mock-data";
import { Clock, MapPin } from "lucide-react";

interface CrewThisWeekProps {
  friendRuns: FriendRun[];
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * "Crew This Week" — the social heart of the calendar.
 *
 * Shows every friend's upcoming run for the current week as an
 * actionable card. This is the section that makes someone open
 * the app every morning: "Who's running today? Can I join?"
 *
 * Sorted by date, then by time within each day.
 */
export function CrewThisWeek({ friendRuns }: CrewThisWeekProps) {
  if (friendRuns.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-ink/20 bg-surface p-4 text-center">
        <div className="label-bib mb-1">Crew</div>
        <p className="text-xs leading-snug text-ink-muted">
          No friends have runs scheduled this week. Add friends to see
          their workouts here — that&apos;s the whole point.
        </p>
        <Button variant="outline" size="sm" className="mt-3" asChild>
          <a href="/friends">Add friends</a>
        </Button>
      </div>
    );
  }

  // Group by date for visual clarity.
  const grouped = new Map<string, FriendRun[]>();
  for (const run of friendRuns) {
    const existing = grouped.get(run.date) ?? [];
    existing.push(run);
    grouped.set(run.date, existing);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-px flex-1 bg-ink/20" />
        <span className="label-bib">Crew · {friendRuns.length} runs</span>
        <div className="h-px flex-1 bg-ink/20" />
      </div>

      <div className="flex flex-col gap-2">
        {Array.from(grouped.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, runs]) => (
            <div key={date}>
              {/* Day label */}
              <div className="mb-1 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                {formatDayLabel(date)}
              </div>
              <div className="flex flex-col gap-1.5">
                {runs.map((run) => (
                  <FriendRunCard key={run.id} run={run} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * Individual friend run card — compact but readable.
 * Avatar, name, workout, time, location, and a Join button.
 * This is what makes the calendar feel social.
 */
function FriendRunCard({ run }: { run: FriendRun }) {
  const style = styleForWorkout(run.workout_type);

  return (
    <div className="relative flex items-center gap-2.5 overflow-hidden rounded-sm border border-ink/10 bg-surface p-3">
      {/* Left accent */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />

      {/* Avatar */}
      <Avatar className="h-9 w-9 shrink-0 rounded-xs">
        <AvatarFallback className="rounded-xs bg-ink/10 font-display text-[10px] font-black text-ink">
          {initials(run.friend_name)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="min-w-0 flex-1 pl-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-xs font-extrabold text-ink">
            {run.friend_name}
          </span>
          <WorkoutChip type={run.workout_type} label={style.label} />
        </div>
        <div className="mt-0.5 font-display text-sm font-black leading-tight tracking-tight text-ink">
          {run.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          <span className="tabular-nums text-ink">
            {run.distance}MI
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(run.time)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {run.location}
          </span>
        </div>
      </div>

      {/* Join CTA */}
      <Button variant="flash" size="sm" className="shrink-0">
        Join
      </Button>
    </div>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delta = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (delta === 0) return "TODAY";
  if (delta === 1) return "TOMORROW";
  return `${DAY_NAMES[date.getDay()]?.toUpperCase()} · ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;
}
