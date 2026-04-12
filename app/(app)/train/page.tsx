import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanCard } from "@/components/training/plan-card";
import { TodayCard } from "@/components/calendar/today-card";
import { MyWeekStrip } from "@/components/training/my-week-strip";
import { ShareToggle } from "@/components/training/share-toggle";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { getMyPlans } from "@/lib/queries/plans";
import {
  defaultCalendarWindow,
  getMyWorkoutsForRange,
} from "@/lib/queries/workouts";
import { requireProfile } from "@/lib/auth";
import { styleForWorkout } from "@/lib/workout-colors";
import { toISODate, startOfDay, startOfWeek, addDays } from "@/lib/date-utils";
import { MOCK_WORKOUTS } from "@/lib/mock-data";
import { Plus, Lock } from "lucide-react";

/**
 * Train tab — your personal training hub.
 *
 * This is your private view. Shows:
 *  - Today's workout (the hero card)
 *  - This week's schedule strip
 *  - Your upcoming workouts with share toggles
 *  - Your training plans
 *
 * What you choose to share here is what appears on your profile
 * and in friends' feed calendars.
 */
export default async function TrainPage() {
  await requireProfile();
  const plans = await getMyPlans();

  const { start, end } = defaultCalendarWindow();
  const realWorkouts = await getMyWorkoutsForRange(start, end);
  const workouts = realWorkouts.length > 0 ? realWorkouts : MOCK_WORKOUTS;

  const today = startOfDay(new Date());
  const todayIso = toISODate(today);
  const todaysWorkout =
    workouts.find((w) => w.scheduled_date === todayIso) ?? null;

  // Week workouts for the strip
  const weekStart = startOfWeek(today);
  const weekDates = new Set(
    Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i))),
  );
  const weekWorkouts = workouts.filter((w) => weekDates.has(w.scheduled_date));

  // Upcoming workouts for the share list (next 7 days, excluding today)
  const upcomingWorkouts = workouts
    .filter(
      (w) =>
        w.scheduled_date > todayIso &&
        w.scheduled_date <= toISODate(addDays(today, 7)) &&
        w.workout_type !== "rest",
    )
    .sort((a, b) => a.scheduled_date.localeCompare(b.scheduled_date));

  return (
    <>
      <PageHeader
        title="Train"
        description="Your workouts, your eyes only."
      >
        <Button size="sm" asChild>
          <Link href="/train/new">
            <Plus className="h-4 w-4" />
            New plan
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Private indicator */}
        <div className="flex items-center gap-1.5 rounded-xs bg-ink/5 px-3 py-2">
          <Lock className="h-3 w-3 text-ink-muted" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
            Private view — choose what to share with friends below
          </span>
        </div>

        {/* Today's workout */}
        <TodayCard date={today} workout={todaysWorkout} />

        {/* Week strip */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-ink/20" />
            <span className="label-bib">This week</span>
            <div className="h-px flex-1 bg-ink/20" />
          </div>
          <MyWeekStrip workouts={weekWorkouts} />
        </div>

        {/* Upcoming workouts with share toggles */}
        {upcomingWorkouts.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-px flex-1 bg-ink/20" />
              <span className="label-bib">Upcoming · Share with friends</span>
              <div className="h-px flex-1 bg-ink/20" />
            </div>
            <div className="flex flex-col gap-1.5">
              {upcomingWorkouts.map((w) => {
                const style = styleForWorkout(w.workout_type);
                return (
                  <div
                    key={w.id}
                    className="relative flex items-center gap-3 overflow-hidden rounded-sm border border-ink/10 bg-surface p-3"
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ backgroundColor: style.dot }}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1 pl-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold uppercase tracking-bib text-ink-muted">
                          {formatShortDate(w.scheduled_date)}
                        </span>
                        <WorkoutChip
                          type={w.workout_type}
                          label={style.label}
                        />
                      </div>
                      <div className="mt-0.5 truncate font-display text-sm font-extrabold tracking-tight text-ink">
                        {w.title}
                      </div>
                      {w.target_distance_miles != null && (
                        <div className="mt-0.5 font-mono text-[9px] font-bold tabular-nums text-ink-muted">
                          {w.target_distance_miles}MI
                          {w.scheduled_time ? ` · ${w.scheduled_time}` : ""}
                        </div>
                      )}
                    </div>
                    <ShareToggle workoutId={w.id} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Plans list */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-ink/20" />
            <span className="label-bib">Your plans</span>
            <div className="h-px flex-1 bg-ink/20" />
          </div>

          {plans.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-base font-semibold">No plans yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Build a plan around your next goal race, or sync one in from
                  TrainingPeaks or Final Surge.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/train/new">Create a plan</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile/settings/connections">
                      Sync from TrainingPeaks / Final Surge
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {plans.map((p) => (
                <PlanCard key={p.id} plan={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delta = Math.round(
    (date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (delta === 1) return "TMR";
  return date
    .toLocaleDateString("en-US", { weekday: "short" })
    .toUpperCase();
}
