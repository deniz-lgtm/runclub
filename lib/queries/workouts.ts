import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TrainingPlanWorkout } from "@/lib/types";
import { addDays, startOfWeek, toISODate } from "@/lib/date-utils";

/**
 * Fetch the current user's scheduled workouts within a date window.
 * Defaults to a 5-week window centered on today (2 back, 3 forward) —
 * enough to render a month view with a little padding.
 */
export async function getMyWorkoutsForRange(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<TrainingPlanWorkout[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Workout rows for any of my active plans in this date window.
  // RLS ensures we only see our own plans.
  const { data } = await supabase
    .from("training_plan_workouts")
    .select(
      `
      id, plan_id, scheduled_date, workout_type, title, description,
      target_distance_miles, scheduled_time, location, is_completed,
      training_plans!inner ( user_id, status )
    `,
    )
    .eq("training_plans.user_id", user.id)
    .eq("training_plans.status", "active")
    .gte("scheduled_date", toISODate(rangeStart))
    .lte("scheduled_date", toISODate(rangeEnd))
    .order("scheduled_date", { ascending: true });

  return (data ?? []) as unknown as TrainingPlanWorkout[];
}

/** Default 5-week window used by the calendar page. */
export function defaultCalendarWindow(today: Date = new Date()): {
  start: Date;
  end: Date;
} {
  const weekStart = startOfWeek(today);
  return {
    start: addDays(weekStart, -14),
    end: addDays(weekStart, 35),
  };
}
