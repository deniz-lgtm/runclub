import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import type { FeedItem as FeedItemType } from "@/lib/queries/feed";
import { Clock, MapPin, Trophy } from "lucide-react";

/**
 * Single item in the home feed. Switches on the item.kind discriminator.
 */
export function FeedItem({ item }: { item: FeedItemType }) {
  if (item.kind === "open_run_invite") {
    const style = styleForWorkout(item.workout.workout_type);
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar>
              {item.host.avatar_url && <AvatarImage src={item.host.avatar_url} />}
              <AvatarFallback>
                {initials(item.host.display_name ?? item.host.username)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold">
                  {item.host.display_name ?? item.host.username}
                </span>
                <WorkoutChip
                  type={item.workout.workout_type}
                  label={style.label}
                />
              </div>
              <p className="mt-0.5 text-sm">
                is doing {item.workout.title}
                {item.workout.target_distance_miles != null &&
                  ` · ${item.workout.target_distance_miles}mi`}
              </p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                {item.workout.scheduled_time && (
                  <span className="inline-flex items-center gap-0.5">
                    <Clock className="h-2.5 w-2.5" />
                    {item.workout.scheduled_time.slice(0, 5)} ·{" "}
                    {formatRelDate(item.workout.scheduled_date)}
                  </span>
                )}
                {item.meetup_location && (
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {item.meetup_location}
                  </span>
                )}
              </div>
              {item.notes && (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  &ldquo;{item.notes}&rdquo;
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" asChild>
                  <Link href={`/workout/${item.workout.id}`}>I&apos;m in</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/workout/${item.workout.id}`}>Maybe</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (item.kind === "club_event") {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/30 text-xl">
              🏁
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/clubs/${item.club_slug}/events/${item.id}`}
                className="truncate text-sm font-semibold hover:text-primary"
              >
                {item.title}
              </Link>
              <div className="text-[11px] text-muted-foreground">
                <Link
                  href={`/clubs/${item.club_slug}`}
                  className="hover:text-primary"
                >
                  {item.club_name}
                </Link>
                {" · "}
                {formatRelDate(item.event_date)}
                {item.start_time && ` · ${item.start_time.slice(0, 5)}`}
              </div>
              {item.meetup_location && (
                <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {item.meetup_location}
                </div>
              )}
              <Button size="sm" variant="outline" className="mt-2" asChild>
                <Link href={`/clubs/${item.club_slug}/events/${item.id}`}>
                  View event
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Friend workout completed
  const style = styleForWorkout(item.workout.workout_type);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            {item.friend.avatar_url && (
              <AvatarImage src={item.friend.avatar_url} />
            )}
            <AvatarFallback>
              {initials(item.friend.display_name ?? item.friend.username)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {item.friend.display_name ?? item.friend.username}
              </span>
              <WorkoutChip type={item.workout.workout_type} label={style.label} />
              <Trophy className="h-3 w-3 text-accent" />
            </div>
            <p className="mt-0.5 text-sm">
              finished {item.workout.title}
              {item.workout.actual_distance_miles != null &&
                ` · ${item.workout.actual_distance_miles}mi`}
              {item.workout.actual_duration_minutes != null &&
                ` in ${item.workout.actual_duration_minutes} min`}
            </p>
            {item.workout.notes && (
              <p className="mt-1 text-xs italic text-muted-foreground">
                &ldquo;{item.workout.notes}&rdquo;
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
  if (deltaDays === 0) return "today";
  if (deltaDays === 1) return "tomorrow";
  if (deltaDays === -1) return "yesterday";
  if (deltaDays > 1 && deltaDays < 7)
    return target.toLocaleDateString("en-US", { weekday: "long" });
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
