import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { initials } from "@/lib/utils";
import { requireProfile } from "@/lib/auth";
import { MOCK_FRIEND_RUNS } from "@/lib/mock-data";
import { Clock, MapPin } from "lucide-react";

/**
 * Home feed.
 *
 * Phase 1C: reads the current user's profile so we can greet them by
 * name, and shows upcoming friends' runs from fixtures. Phase 5 swaps
 * in a real activity-feed query with joins across run_invites, club
 * events, and activity_feed.
 */
export default async function FeedPage() {
  const profile = await requireProfile();
  const upcoming = MOCK_FRIEND_RUNS.slice(0, 3);

  return (
    <>
      <PageHeader
        title={`Hey, ${profile.display_name ?? profile.username} 👋`}
        description="Here's what your crew is up to."
      />

      <div className="w-full px-4 space-y-4">
        {/* Hero card */}
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle className="text-lg">Ready to run?</CardTitle>
            <CardDescription>
              Your calendar has your plan for the week. Open a workout to
              friends and turn a solo run into a social one.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/calendar">Open calendar</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/coach">Ask your coach</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/friends">Find friends</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming friend runs */}
        <div className="pt-1">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Coming up from your crew
          </h2>

          {upcoming.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                No upcoming runs from friends yet. Add some people!
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {upcoming.map((run) => {
                const style = styleForWorkout(run.workout_type);
                return (
                  <Card key={run.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {initials(run.friend_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">
                              {run.friend_name}
                            </span>
                            <WorkoutChip
                              type={run.workout_type}
                              label={style.label}
                            />
                          </div>
                          <p className="mt-0.5 text-sm">{run.title}</p>
                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(run.time)} •{" "}
                              {formatRelDate(run.date)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {run.location}
                            </span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm">I&apos;m in</Button>
                            <Button size="sm" variant="outline">
                              Maybe
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <p className="py-6 text-center text-[11px] text-muted-foreground">
          Phase 5 wires this into the real activity feed.
        </p>
      </div>
    </>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = ((h + 11) % 12) + 1;
  return `${hr}:${String(m).padStart(2, "0")} ${suffix}`;
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
  if (deltaDays > 1 && deltaDays < 7)
    return target.toLocaleDateString("en-US", { weekday: "long" });
  return target.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
