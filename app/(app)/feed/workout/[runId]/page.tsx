import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import { requireProfile } from "@/lib/auth";
import { MOCK_FRIEND_RUNS, type WorkoutSegment } from "@/lib/mock-data";
import { ChevronLeft, Clock, MapPin, Route, Users } from "lucide-react";

/**
 * Friend workout detail page.
 *
 * Shows the full breakdown of a friend's workout so you can decide
 * if you can join for any or all of it. Includes warm up, main set,
 * cool down, paces, and rest intervals.
 */
export default async function FriendWorkoutDetailPage({
  params,
}: {
  params: { runId: string };
}) {
  await requireProfile();

  // For now, look up from mock data. Phase 2 will wire this to real data.
  const run = MOCK_FRIEND_RUNS.find((r) => r.id === params.runId);
  if (!run) notFound();

  const style = styleForWorkout(run.workout_type);

  return (
    <>
      <PageHeader title={run.friend_name}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4" /> Feed
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Hero card */}
        <div className="relative overflow-hidden rounded-sm border border-ink bg-ink text-white">
          <div
            className="h-1 w-full"
            style={{ backgroundColor: style.dot }}
            aria-hidden
          />
          <div className="p-5">
            {/* Friend info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-xs">
                <AvatarFallback className="rounded-xs bg-white/20 font-display text-xs font-black text-white">
                  {initials(run.friend_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-display text-sm font-extrabold text-white">
                  {run.friend_name}
                </div>
                <div className="font-mono text-[9px] font-bold uppercase tracking-bib text-white/50">
                  @{run.friend_username}
                </div>
              </div>
              <div className="ml-auto">
                <WorkoutChip type={run.workout_type} label={style.label} />
              </div>
            </div>

            {/* Title */}
            <h2 className="mt-4 font-display text-2xl font-black leading-[0.95] tracking-tightest text-white">
              {run.title}
            </h2>

            {/* Description */}
            {run.description && (
              <p className="mt-2 text-sm leading-snug text-white/70">
                {run.description}
              </p>
            )}

            {/* Data row */}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3">
              <DataPill label="Dist" icon={<Route className="h-2.5 w-2.5" />}>
                {run.distance} mi
              </DataPill>
              <DataPill label="Time" icon={<Clock className="h-2.5 w-2.5" />}>
                {formatTime(run.time)}
              </DataPill>
              <DataPill label="Where" icon={<MapPin className="h-2.5 w-2.5" />}>
                {run.location}
              </DataPill>
            </div>

            {/* Date */}
            <div className="mt-3 font-mono text-[9px] font-bold uppercase tracking-bib text-white/40">
              {formatDate(run.date)}
            </div>
          </div>
        </div>

        {/* Workout breakdown */}
        {run.segments && run.segments.length > 0 && (
          <div className="rounded-sm border border-ink/10 bg-surface">
            <div className="border-b border-ink/10 px-4 py-3">
              <div className="label-bib">Full workout breakdown</div>
              <p className="mt-0.5 text-[10px] text-ink-muted">
                Everything you need to know to decide if you can join.
              </p>
            </div>
            <div className="divide-y divide-ink/10">
              {run.segments.map((segment, i) => (
                <SegmentRow key={i} segment={segment} index={i + 1} />
              ))}
            </div>
          </div>
        )}

        {/* Join CTA */}
        <div className="flex gap-2">
          <Button variant="flash" className="flex-1">
            <Users className="mr-1.5 h-4 w-4" />
            I&apos;m in
          </Button>
          <Button variant="outline" className="flex-1">
            Maybe
          </Button>
        </div>

        {/* Can I keep up? helper */}
        {run.segments && run.segments.some((s) => s.pace) && (
          <div className="rounded-sm border border-ink/10 bg-bone-soft/50 p-4">
            <div className="label-bib mb-2">Pace check</div>
            <div className="flex flex-col gap-1.5">
              {run.segments
                .filter((s) => s.pace && s.type !== "rest")
                .map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-display font-extrabold text-ink">
                      {s.label}
                      {s.reps && s.reps > 1 ? ` (×${s.reps})` : ""}
                    </span>
                    <span className="font-mono text-[10px] font-bold tabular-nums text-ink-muted">
                      {s.pace}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SegmentRow({
  segment,
  index,
}: {
  segment: WorkoutSegment;
  index: number;
}) {
  return (
    <div className="flex gap-3 px-4 py-3">
      {/* Index + type indicator */}
      <div className="flex w-7 shrink-0 flex-col items-center">
        <span className="font-mono text-[9px] font-bold tabular-nums text-ink-muted">
          {String(index).padStart(2, "0")}
        </span>
        <div
          className={`mt-1 h-2 w-2 rounded-full ${segmentDotColor(segment.type)}`}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-extrabold text-ink">
            {segment.label}
            {segment.reps && segment.reps > 1 ? ` ×${segment.reps}` : ""}
          </span>
          <span
            className={`rounded-xs px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide ${segmentTypeBadge(segment.type)}`}
          >
            {segment.type}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
          {segment.distance && (
            <span className="tabular-nums text-ink">{segment.distance}</span>
          )}
          {segment.duration && (
            <span className="tabular-nums">{segment.duration}</span>
          )}
          {segment.pace && <span>{segment.pace}</span>}
        </div>

        {segment.notes && (
          <p className="mt-1 text-[11px] leading-snug text-ink-muted">
            {segment.notes}
          </p>
        )}
      </div>
    </div>
  );
}

function DataPill({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[8px] font-bold uppercase tracking-bib text-white/40">
        {label}
      </span>
      <span className="flex items-center gap-1 font-mono text-xs font-bold tabular-nums text-white">
        {icon}
        {children}
      </span>
    </div>
  );
}

function segmentDotColor(type: string): string {
  switch (type) {
    case "warmup":
      return "bg-amber-400";
    case "interval":
      return "bg-red-500";
    case "rest":
      return "bg-gray-300";
    case "cooldown":
      return "bg-blue-400";
    case "steady":
      return "bg-green-400";
    case "recovery":
      return "bg-purple-400";
    default:
      return "bg-ink/20";
  }
}

function segmentTypeBadge(type: string): string {
  switch (type) {
    case "warmup":
      return "bg-amber-100 text-amber-800";
    case "interval":
      return "bg-red-100 text-red-800";
    case "rest":
      return "bg-gray-100 text-gray-600";
    case "cooldown":
      return "bg-blue-100 text-blue-800";
    case "steady":
      return "bg-green-100 text-green-800";
    case "recovery":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-ink/5 text-ink-muted";
  }
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
