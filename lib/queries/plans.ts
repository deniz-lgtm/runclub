import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TrainingPlan, TrainingPlanWorkout } from "@/lib/types";

/**
 * Get all training plans for the current user, ordered by status
 * (active first, then paused, then completed) and recency.
 */
export async function getMyPlans(): Promise<TrainingPlan[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (data ?? []) as TrainingPlan[];
}

/** The current user's single most-important plan: active, soonest race. */
export async function getActivePlan(): Promise<TrainingPlan | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("training_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("goal_race_date", { ascending: true, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  return (data as TrainingPlan | null) ?? null;
}

/** Fetch one plan by id (RLS does the ownership/visibility check). */
export async function getPlanById(
  id: string,
): Promise<{ plan: TrainingPlan; workouts: TrainingPlanWorkout[] } | null> {
  const supabase = createSupabaseServerClient();

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!plan) return null;

  const { data: workouts } = await supabase
    .from("training_plan_workouts")
    .select("*")
    .eq("plan_id", id)
    .order("scheduled_date", { ascending: true });

  return {
    plan: plan as TrainingPlan,
    workouts: (workouts ?? []) as TrainingPlanWorkout[],
  };
}

/** One workout by id, joined to its parent plan. */
export async function getWorkoutById(
  id: string,
): Promise<{
  workout: TrainingPlanWorkout;
  plan: TrainingPlan;
} | null> {
  const supabase = createSupabaseServerClient();

  const { data: workout } = await supabase
    .from("training_plan_workouts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!workout) return null;

  const { data: plan } = await supabase
    .from("training_plans")
    .select("*")
    .eq("id", (workout as TrainingPlanWorkout).plan_id)
    .maybeSingle();

  if (!plan) return null;

  return {
    workout: workout as TrainingPlanWorkout,
    plan: plan as TrainingPlan,
  };
}

/**
 * Progress summary for a plan: total workouts, completed, total miles
 * planned/completed, next upcoming workout.
 */
export async function getPlanProgress(planId: string): Promise<{
  totalWorkouts: number;
  completedWorkouts: number;
  plannedMiles: number;
  completedMiles: number;
  consistencyPct: number;
  nextWorkout: TrainingPlanWorkout | null;
}> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("training_plan_workouts")
    .select("*")
    .eq("plan_id", planId)
    .order("scheduled_date", { ascending: true });

  const workouts = (data ?? []) as TrainingPlanWorkout[];
  const nonRest = workouts.filter((w) => w.workout_type !== "rest");
  const completed = nonRest.filter((w) => w.is_completed);

  const plannedMiles = workouts.reduce(
    (sum, w) => sum + (w.target_distance_miles ?? 0),
    0,
  );
  const completedMiles = workouts
    .filter((w) => w.is_completed)
    .reduce((sum, w) => sum + (w.target_distance_miles ?? 0), 0);

  const today = new Date().toISOString().slice(0, 10);
  const nextWorkout =
    workouts.find((w) => !w.is_completed && w.scheduled_date >= today) ?? null;

  return {
    totalWorkouts: nonRest.length,
    completedWorkouts: completed.length,
    plannedMiles,
    completedMiles,
    consistencyPct:
      nonRest.length > 0
        ? Math.round((completed.length / nonRest.length) * 100)
        : 0,
    nextWorkout,
  };
}
