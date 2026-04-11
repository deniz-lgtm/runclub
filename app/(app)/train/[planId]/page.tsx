import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PlanProgress } from "@/components/training/plan-progress";
import { WorkoutBuilder } from "@/components/training/workout-builder";
import { WorkoutChip } from "@/components/calendar/workout-chip";
import { styleForWorkout } from "@/lib/workout-colors";
import { getPlanById, getPlanProgress } from "@/lib/queries/plans";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft, Clock, MapPin } from "lucide-react";
import { daysBetween, fromISODate, formatLongDate } from "@/lib/date-utils";

export default async function PlanDetailPage({
  params,
}: {
  params: { planId: string };
}) {
  await requireProfile();
  const result = await getPlanById(params.planId);
  if (!result) notFound();

  const { plan, workouts } = result;
  const progress = await getPlanProgress(plan.id);

  const daysToGoal = plan.goal_race_date
    ? daysBetween(new Date(), fromISODate(plan.goal_race_date)) *
      (new Date() < fromISODate(plan.goal_race_date) ? 1 : -1)
    : null;

  const isAiGenerated = plan.plan_type === "ai_generated";

  return (
    <>
      <PageHeader title={plan.title} description={plan.goal_race ?? undefined}>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/train">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        {/* Status row */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={plan.status === "active" ? "default" : "muted"}>
            {plan.status}
          </Badge>
          {isAiGenerated && <Badge variant="flash">AI generated</Badge>}
          {plan.sync_source !== "none" && (
            <Badge variant="secondary">
              Synced from{" "}
              {plan.sync_source === "trainingpeaks"
                ? "TrainingPeaks"
                : "Final Surge"}
            </Badge>
          )}
          {plan.goal_race_date && (
            <Badge variant="outline">
              Goal: {formatLongDate(fromISODate(plan.goal_race_date))}
            </Badge>
          )}
        </div>

        {/* AI coach adjust button */}
        {isAiGenerated && (
          <Button variant="outline" asChild>
            <Link href={`/coach?plan=${plan.id}`}>
              Ask coach to adjust this plan
            </Link>
          </Button>
        )}

        {/* Progress dashboard */}
        <PlanProgress
          plannedMiles={progress.plannedMiles}
          completedMiles={progress.completedMiles}
          totalWorkouts={progress.totalWorkouts}
          completedWorkouts={progress.completedWorkouts}
          consistencyPct={progress.consistencyPct}
          daysToGoal={daysToGoal}
        />

        {/* Workouts list */}
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workouts ({workouts.length})
          </h2>

          {workouts.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-center text-sm text-muted-foreground">
                No workouts yet. Add your first below.
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {workouts.map((w) => {
                const style = styleForWorkout(w.workout_type);
                return (
                  <Link
                    key={w.id}
                    href={`/workout/${w.id}`}
                    className="group relative overflow-hidden rounded-lg border border-border bg-surface p-3 shadow-sm transition-colors hover:border-primary/40"
                  >
                    <div
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ backgroundColor: style.dot }}
                    />
                    <div className="flex items-start gap-3 pl-2">
                      <div className="w-16 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {formatShortDate(w.scheduled_date)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              w.is_completed
                                ? "truncate text-sm font-semibold text-muted-foreground line-through"
                                : "truncate text-sm font-semibold"
                            }
                          >
                            {w.title}
                          </span>
                          <WorkoutChip type={w.workout_type} label={style.label} />
                        </div>
                        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {w.target_distance_miles != null && (
                            <span className="tabular-nums">
                              {w.target_distance_miles} mi
                            </span>
                          )}
                          {w.scheduled_time && (
                            <span className="inline-flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {w.scheduled_time.slice(0, 5)}
                            </span>
                          )}
                          {w.location && (
                            <span className="inline-flex items-center gap-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              {w.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {w.is_completed && (
                        <span className="ml-auto shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
                          DONE
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Add workout */}
        <WorkoutBuilder planId={plan.id} />

        {plan.notes && (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <p className="mt-1 text-sm">{plan.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}

function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
}
