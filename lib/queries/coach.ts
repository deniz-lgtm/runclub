import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Profile,
  TrainingPlan,
  TrainingPlanWorkout,
} from "@/lib/types";
import { getActivePlan } from "@/lib/queries/plans";
import type { CoachContext, CoachMessage } from "@/lib/ai";

/**
 * Build the full context block injected into every coach request.
 *
 * Fetches:
 *   - The current user's profile
 *   - Their active plan (if any)
 *   - Their last 14 days of workouts
 *   - Their next 14 days of scheduled workouts
 */
export async function buildCoachContext(): Promise<CoachContext | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const activePlan = await getActivePlan();

  const today = new Date();
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const twoWeeksAhead = new Date(today);
  twoWeeksAhead.setDate(today.getDate() + 14);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // Recent
  const { data: recentRaw } = await supabase
    .from("training_plan_workouts")
    .select("*, training_plans!inner(user_id)")
    .eq("training_plans.user_id", user.id)
    .gte("scheduled_date", iso(twoWeeksAgo))
    .lt("scheduled_date", iso(today))
    .order("scheduled_date", { ascending: true });

  // Upcoming
  const { data: upcomingRaw } = await supabase
    .from("training_plan_workouts")
    .select("*, training_plans!inner(user_id)")
    .eq("training_plans.user_id", user.id)
    .gte("scheduled_date", iso(today))
    .lte("scheduled_date", iso(twoWeeksAhead))
    .order("scheduled_date", { ascending: true });

  return {
    profile: profile as Profile,
    activePlan: activePlan as TrainingPlan | null,
    recentWorkouts: (recentRaw ?? []) as unknown as TrainingPlanWorkout[],
    upcomingWorkouts: (upcomingRaw ?? []) as unknown as TrainingPlanWorkout[],
  };
}

export interface CoachThread {
  id: string;
  user_id: string;
  title: string | null;
  messages: CoachMessage[];
  updated_at: string;
  created_at: string;
}

/** List the current user's coach threads (most recent first). */
export async function getMyCoachThreads(): Promise<CoachThread[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("ai_coaching_threads")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (data ?? []) as CoachThread[];
}

/** Fetch a single thread. */
export async function getCoachThread(id: string): Promise<CoachThread | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("ai_coaching_threads")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as CoachThread | null) ?? null;
}
