import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import type { FeedItem as FeedItemType } from "@/lib/queries/feed";
import { Clock, MapPin } from "lucide-react";

/**
 * Feed item — editorial card treatment. Three variants:
 *   - open_run_invite  : a friend's invite you can join
 *   - club_event       : an upcoming club event
 *   - friend_workout_completed : a trophy entry from a friend
 *
 * All rendered as flat ink-border cards with a left accent stripe
 * and mono meta rows.
 */
export function FeedItem({ item }: { item: FeedItemType }) {
  if (item.kind === "open_run_invite") {
    const style = styleForWorkout(item.workout.workout_type);
    return (
      <div className="relative overflow-hidden rounded-sm border border-ink/15 bg-surface">
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: style.dot }}
          aria-hidden
        />
        <div className="p-4 pl-5">
          <div className="flex items-center justify-between">
            <span className="label-bib">Invite · Open</span>
            <WorkoutChip type={item.workout.workout_type} label={style.label} />
          </div>

          <div className="mt-3 flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {item.host.avatar_url && (
                <AvatarImage src={item.host.avatar_url} />
              )}
              <AvatarFallback>
                {initials(item.host.display_name ?? item.host.username)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-display text-sm font-extrabold text-ink">
                {item.host.display_name ?? item.host.username}
              </div>
              <div className="mt-0.5 font-display text-base font-black leading-tight tracking-tight text-ink">
                {item.workout.title}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
                {item.workout.target_distance_miles != null && (
                  <span className="tabular-nums text-ink">
                    {item.workout.target_distance_miles}MI
                  </span>
                )}
                {item.workout.scheduled_time && (
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {item.workout.scheduled_time.slice(0, 5)}
                  </span>
                )}
                <span>{formatRelDate(item.workout.scheduled_date)}</span>
                {item.meetup_location && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {item.meetup_location}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="mt-2 border-l-2 border-ink/15 pl-2 text-xs italic leading-snug text-ink-muted">
                  {item.notes}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button variant="flash" size="sm" className="flex-1" asChild>
              <Link href={`/workout/${item.workout.id}`}>I&apos;m in</Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/workout/${item.workout.id}`}>Maybe</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (item.kind === "club_event") {
    return (
      <Link
        href={`/clubs/${item.club_slug}/events/${item.id}`}
        className="group relative block overflow-hidden rounded-sm border border-ink/15 bg-surface transition-colors hover:border-ink"
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-flash" aria-hidden />
        <div className="p-4 pl-5">
          <div className="flex items-center justify-between">
            <span className="label-bib">Club event</span>
            <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-flash">
              {item.club_name}
            </span>
          </div>
          <div className="mt-2 font-display text-base font-black leading-tight tracking-tight text-ink">
            {item.title}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
            <span>{formatRelDate(item.event_date)}</span>
            {item.start_time && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" />
                {item.start_time.slice(0, 5)}
              </span>
            )}
            {item.meetup_location && (
              <span className="inline-flex items-center gap-0.5">
                <MapPin className="h-2.5 w-2.5" />
                {item.meetup_location}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Friend workout completed
  const style = styleForWorkout(item.workout.workout_type);
  return (
    <div className="relative overflow-hidden rounded-sm border border-ink/15 bg-surface">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: style.dot }}
        aria-hidden
      />
      <div className="p-4 pl-5">
        <div className="flex items-center justify-between">
          <span className="label-bib">Done · {style.label}</span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
            ✓ Completed
          </span>
        </div>
        <div className="mt-3 flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {item.friend.avatar_url && (
              <AvatarImage src={item.friend.avatar_url} />
            )}
            <AvatarFallback>
              {initials(item.friend.display_name ?? item.friend.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate font-display text-sm font-extrabold text-ink">
              {item.friend.display_name ?? item.friend.username}
            </div>
            <div className="mt-0.5 font-display text-base font-black leading-tight tracking-tight text-ink">
              {item.workout.title}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] font-bold uppercase tracking-bib text-ink-muted">
              {item.workout.actual_distance_miles != null && (
                <span className="tabular-nums text-ink">
                  {item.workout.actual_distance_miles}MI
                </span>
              )}
              {item.workout.actual_duration_minutes != null && (
                <span className="tabular-nums">
                  {item.workout.actual_duration_minutes}MIN
                </span>
              )}
              {item.workout.effort_rating && (
                <span className="tabular-nums">
                  RPE {item.workout.effort_rating}
                </span>
              )}
            </div>
            {item.workout.notes && (
              <p className="mt-2 border-l-2 border-ink/15 pl-2 text-xs italic leading-snug text-ink-muted">
                {item.workout.notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const target = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deltaDays = Math.round(
    (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (deltaDays === 0) return "TODAY";
  if (deltaDays === 1) return "TOMORROW";
  if (deltaDays === -1) return "YESTERDAY";
  if (deltaDays > 1 && deltaDays < 7)
    return target.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();
  return target
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}
