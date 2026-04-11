"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PlanVisibility, WorkoutType } from "@/lib/types";

const VALID_VISIBILITIES: PlanVisibility[] = [
  "public",
  "friends_only",
  "private",
];

const VALID_WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "long_run",
  "tempo",
  "intervals",
  "hills",
  "recovery",
  "race",
  "cross_training",
  "rest",
];

/**
 * Create a new training plan for the current user.
 * Redirects to the new plan detail page on success.
 */
export async function createPlan(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const goalRace = String(formData.get("goal_race") ?? "").trim() || null;
  const goalDate = String(formData.get("goal_race_date") ?? "").trim() || null;
  const visibility = String(formData.get("visibility") ?? "friends_only");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title) return { error: "Plan title is required." };
  if (!VALID_VISIBILITIES.includes(visibility as PlanVisibility)) {
    return { error: "Invalid visibility." };
  }

  const { data, error } = await supabase
    .from("training_plans")
    .insert({
      user_id: user.id,
      title,
      goal_race: goalRace,
      goal_race_date: goalDate,
      visibility: visibility as PlanVisibility,
      notes,
      plan_type: "self_created",
      status: "active",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/train");
  revalidatePath("/calendar");
  redirect(`/train/${data.id}`);
}

/** Delete a plan (cascades to its workouts via FK). */
export async function deletePlan(planId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("training_plans")
    .delete()
    .eq("id", planId);

  if (error) return { error: error.message };
  revalidatePath("/train");
  revalidatePath("/calendar");
  redirect("/train");
}

/** Pause or resume a plan. */
export async function setPlanStatus(
  planId: string,
  status: "active" | "paused" | "completed",
) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("training_plans")
    .update({ status })
    .eq("id", planId);

  if (error) return { error: error.message };
  revalidatePath("/train");
  revalidatePath(`/train/${planId}`);
  return { ok: true };
}

/** Add a new workout row to an existing plan. */
export async function createWorkout(planId: string, formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const scheduledDate = String(formData.get("scheduled_date") ?? "").trim();
  const workoutType = String(formData.get("workout_type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const distanceRaw = String(formData.get("target_distance_miles") ?? "").trim();
  const timeRaw = String(formData.get("scheduled_time") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;

  if (!scheduledDate) return { error: "Date is required." };
  if (!title) return { error: "Title is required." };
  if (!VALID_WORKOUT_TYPES.includes(workoutType as WorkoutType)) {
    return { error: "Invalid workout type." };
  }

  const distance = distanceRaw ? Number(distanceRaw) : null;
  if (distance != null && (!Number.isFinite(distance) || distance < 0)) {
    return { error: "Distance must be a positive number." };
  }

  const { error } = await supabase.from("training_plan_workouts").insert({
    plan_id: planId,
    scheduled_date: scheduledDate,
    workout_type: workoutType as WorkoutType,
    title,
    description,
    target_distance_miles: distance,
    scheduled_time: timeRaw,
    location,
  });

  if (error) return { error: error.message };

  revalidatePath(`/train/${planId}`);
  revalidatePath("/calendar");
  return { ok: true };
}

/** Mark a workout complete (or undo). */
export async function toggleWorkoutComplete(
  workoutId: string,
  isCompleted: boolean,
) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("training_plan_workouts")
    .update({ is_completed: isCompleted })
    .eq("id", workoutId);

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/train");
  revalidatePath(`/workout/${workoutId}`);
  return { ok: true };
}

/** Log actual distance / pace / duration / effort / notes after a run. */
export async function logWorkoutCompletion(
  workoutId: string,
  formData: FormData,
) {
  const supabase = createSupabaseServerClient();
  const distance = Number(formData.get("actual_distance_miles") ?? 0) || null;
  const duration = Number(formData.get("actual_duration_minutes") ?? 0) || null;
  const effort = Number(formData.get("effort_rating") ?? 0) || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("training_plan_workouts")
    .update({
      actual_distance_miles: distance,
      actual_duration_minutes: duration,
      effort_rating: effort,
      notes,
      is_completed: true,
    })
    .eq("id", workoutId);

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath(`/workout/${workoutId}`);
  return { ok: true };
}

/** Delete a single workout. */
export async function deleteWorkout(workoutId: string, planId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("training_plan_workouts")
    .delete()
    .eq("id", workoutId);

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath(`/train/${planId}`);
  return { ok: true };
}
