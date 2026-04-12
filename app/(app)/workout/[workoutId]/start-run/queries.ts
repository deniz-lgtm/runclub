import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SavedRoute } from "@/lib/queries/routes";

/**
 * Find a route linked to a workout. We check if the user has a saved
 * route that matches the workout's target distance (within 20%), falling
 * back to the user's most-recently-used route at that distance.
 *
 * In the future this could be an explicit workout→route FK, but for
 * now proximity-match keeps it simple.
 */
export async function getLinkedRoute(
  workoutId: string,
): Promise<SavedRoute | null> {
  const supabase = createSupabaseServerClient();

  // Get the workout to know its target distance.
  const { data: workout } = await supabase
    .from("training_plan_workouts")
    .select("target_distance_miles, plan_id")
    .eq("id", workoutId)
    .maybeSingle();

  if (!workout || !workout.target_distance_miles) return null;

  // Get the plan owner.
  const { data: plan } = await supabase
    .from("training_plans")
    .select("user_id")
    .eq("id", workout.plan_id)
    .maybeSingle();

  if (!plan) return null;

  const target = workout.target_distance_miles as number;
  const lower = target * 0.8;
  const upper = target * 1.2;

  // Find a saved route within ±20% of the target distance.
  const { data: route } = await supabase
    .from("generated_routes")
    .select("*")
    .eq("user_id", plan.user_id)
    .eq("is_saved", true)
    .gte("target_distance_miles", lower)
    .lte("target_distance_miles", upper)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (route as SavedRoute | null) ?? null;
}
