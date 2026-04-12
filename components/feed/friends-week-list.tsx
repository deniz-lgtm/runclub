"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import type { FriendRun } from "@/lib/mock-data";
import { Clock, MapPin, ChevronRight } from "lucide-react";

interface FriendsWeekListProps {
  friendRuns: FriendRun[];
  /** If set, only show runs on this date */
  filterDate?: string | null;
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
 * Detailed list of friends' upcoming workouts, grouped by day.
 * Each card is tappable and links to the full workout detail.
 * Shows enough info to decide "can I join?" — type, distance,
 * time, location, and a preview of the workout structure.
 */
export function FriendsWeekList({
  friendRuns,
  filterDate,
}: FriendsWeekListProps) {
  const runs = filterDate
    ? friendRuns.filter((r) => r.date === filterDate)
    : friendRuns;

  if (runs.length === 0) {
    return (
      <div className="rounded-sm border border-dashed border-ink/20 bg-surface p-4 text-center">
        <div className="label-bib mb-1">
          {filterDate ? "No runs this day" : "No upcoming runs"}
        </div>
        <p className="text-xs leading-snug text-ink-muted">
          {filterDate
            ? "None of your friends have workouts scheduled on this day."
            : "Add friends to see their workouts here."}
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = new Map<string, FriendRun[]>();
  for (const run of runs) {
    const existing = grouped.get(run.date) ?? [];
    existing.push(run);
    grouped.set(run.date, existing);
  }

  return (
    <div className="flex flex-col gap-3">
      {Array.from(grouped.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, dayRuns]) => (
          <div key={date}>
            <div className="mb-1.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
              {formatDayLabel(date)}
            </div>
            <div className="flex flex-col gap-2">
              {dayRuns.map((run) => (
                <FriendRunDetailCard key={run.id} run={run} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

/**
 * Detailed friend run card — shows workout structure preview.
 * Links to the full workout detail page.
 */
function FriendRunDetailCard({ run }: { run: FriendRun }) {
  const style = styleForWorkout(run.workout_type);

  return (
    <Link
      href={`/feed/workout/${run.id}`}
      className="group relative block overflow-hidden rounded-sm border border-ink/10 bg-surface transition-colors hover:border-ink/30"
    >
      {/* Left accent */}
      <div
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />

      <div className="p-3 pl-4">
        {/* Header: avatar + name + chip */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 shrink-0 rounded-xs">
            <AvatarFallback className="rounded-xs bg-ink/10 font-display text-[10px] font-black text-ink">
              {initials(run.friend_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate font-display text-xs font-extrabold text-ink">
                {run.friend_name}
              </span>
              <WorkoutChip type={run.workout_type} label={style.label} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted transition-colors group-hover:text-ink" />
        </div>

        {/* Title */}
        <div className="mt-1.5 font-display text-sm font-black leading-tight tracking-tight text-ink">
          {run.title}
        </div>

        {/* Meta row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
          <span className="tabular-nums text-ink">{run.distance}MI</span>
          <span className="inline-flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {formatTime(run.time)}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <MapPin className="h-2.5 w-2.5" />
            {run.location}
          </span>
        </div>

        {/* Workout structure preview */}
        {run.segments && run.segments.length > 0 && (
          <div className="mt-2 border-t border-ink/10 pt-2">
            <div className="flex flex-wrap gap-1">
              {run.segments.slice(0, 4).map((seg, i) => (
                <span
                  key={i}
                  className={segmentBadgeClass(seg.type)}
                >
                  {seg.label}
                  {seg.reps && seg.reps > 1 ? ` ×${seg.reps}` : ""}
                  {seg.pace ? ` @ ${seg.pace}` : ""}
                </span>
              ))}
              {run.segments.length > 4 && (
                <span className="inline-flex items-center rounded-xs bg-ink/5 px-1.5 py-0.5 text-[8px] font-bold text-ink-muted">
                  +{run.segments.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function segmentBadgeClass(type: string): string {
  const base =
    "inline-flex items-center rounded-xs px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide";
  switch (type) {
    case "warmup":
      return `${base} bg-amber-100 text-amber-800`;
    case "interval":
      return `${base} bg-red-100 text-red-800`;
    case "rest":
      return `${base} bg-gray-100 text-gray-600`;
    case "cooldown":
      return `${base} bg-blue-100 text-blue-800`;
    case "steady":
      return `${base} bg-green-100 text-green-800`;
    case "recovery":
      return `${base} bg-purple-100 text-purple-700`;
    default:
      return `${base} bg-ink/5 text-ink-muted`;
  }
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
