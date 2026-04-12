"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  generatePlan,
  METHODOLOGY_PRESETS,
  type GeneratedPlan,
  type Methodology,
  type PlanInput,
} from "@/lib/ai-plan";
import { canGenerateNewPlan, recordGeneration } from "@/lib/queries/ai-plans";
import type { PlanVisibility, WorkoutType } from "@/lib/types";
import { addDays, fromISODate, startOfWeek, toISODate } from "@/lib/date-utils";

// ────────────────────────────────────────────────────────────────────────────
// Generate: form input → Claude → GeneratedPlan (not yet persisted)
// ────────────────────────────────────────────────────────────────────────────

export interface GenerateResult {
  ok?: boolean;
  plan?: GeneratedPlan;
  input?: PlanInput; // echoed back so the accept step has it
  startDate?: string; // computed plan start date (ISO)
  error?: string;
  remaining?: number;
}

export async function generateTrainingPlan(
  formData: FormData,
): Promise<GenerateResult> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Rate limit check
  const rate = await canGenerateNewPlan();
  if (!rate.allowed) {
    return {
      error: `Daily limit reached (${rate.limit}/day). Come back tomorrow or upgrade to premium.`,
      remaining: 0,
    };
  }

  // Parse + validate input
  const input = parseInput(formData);
  if ("error" in input) return { error: input.error };

  // Call Claude
  try {
    const plan = await generatePlan(input);

    await recordGeneration({
      status: "success",
      methodology: input.methodology,
      goal_race: input.goal_race,
      total_weeks: plan.total_weeks,
    });

    // Compute the actual start date so the preview can show it.
    const raceDateObj = fromISODate(input.goal_race_date);
    const raceWeekMon = startOfWeek(raceDateObj);
    const planStartMon = addDays(raceWeekMon, -(plan.total_weeks - 1) * 7);

    return {
      ok: true,
      plan,
      input,
      startDate: toISODate(planStartMon),
      remaining: rate.remaining - 1,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    await recordGeneration({
      status: "failed",
      methodology: input.methodology,
      goal_race: input.goal_race,
      error_message: message,
    });
    return { error: message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Accept: commit a previewed plan into the DB
// ────────────────────────────────────────────────────────────────────────────

export async function acceptGeneratedPlan(args: {
  plan: GeneratedPlan;
  input: PlanInput;
  visibility: PlanVisibility;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Insert the plan row first.
  const { data: planRow, error: planErr } = await supabase
    .from("training_plans")
    .insert({
      user_id: user.id,
      title: args.plan.title,
      goal_race: args.input.goal_race,
      goal_race_date: args.input.goal_race_date,
      plan_type: "ai_generated",
      visibility: args.visibility,
      status: "active",
      notes: `${args.plan.summary}\n\nMethodology: ${METHODOLOGY_PRESETS[args.input.methodology].name}`,
    })
    .select("id")
    .single();

  if (planErr) return { error: planErr.message };
  const planId = (planRow as { id: string }).id;

  // Build all the workout rows. Dates are computed BACKWARDS from
  // race day — exactly like a real coach does. Race week is the last
  // week; we subtract (total_weeks - 1) * 7 to find week 1's Monday.
  const raceDateObj = fromISODate(args.input.goal_race_date);
  const raceWeekMonday = startOfWeek(raceDateObj);
  const planStartMonday = addDays(
    raceWeekMonday,
    -(args.plan.total_weeks - 1) * 7,
  );

  const workoutRows: Array<{
    plan_id: string;
    scheduled_date: string;
    workout_type: WorkoutType;
    title: string;
    description: string | null;
    target_distance_miles: number | null;
    target_duration_minutes: number | null;
  }> = [];

  for (const week of args.plan.weeks) {
    const weekStart = addDays(planStartMonday, (week.week_number - 1) * 7);
    for (const w of week.workouts) {
      const date = addDays(weekStart, w.day_offset);
      workoutRows.push({
        plan_id: planId,
        scheduled_date: toISODate(date),
        workout_type: w.type,
        title: w.title,
        description: w.target_pace
          ? `${w.description}\n\nPace: ${w.target_pace}`
          : w.description,
        target_distance_miles: w.target_distance_miles,
        target_duration_minutes: w.target_duration_minutes,
      });
    }
  }

  // Bulk insert. Supabase chunks this under the hood.
  const { error: workoutErr } = await supabase
    .from("training_plan_workouts")
    .insert(workoutRows);

  if (workoutErr) {
    // Best-effort cleanup of the plan if workouts failed.
    await supabase.from("training_plans").delete().eq("id", planId);
    return { error: workoutErr.message };
  }

  await recordGeneration({
    status: "accepted",
    methodology: args.input.methodology,
    goal_race: args.input.goal_race,
    total_weeks: args.plan.total_weeks,
    plan_id: planId,
  });

  revalidatePath("/train");
  revalidatePath("/calendar");
  redirect(`/train/${planId}`);
}

// ────────────────────────────────────────────────────────────────────────────
// Input parsing / validation
// ────────────────────────────────────────────────────────────────────────────

const VALID_METHODOLOGIES: Methodology[] = [
  "generalist",
  "pfitzinger",
  "hansons",
  "daniels",
  "couch_to_race",
  "minimalist",
];

function parseInput(formData: FormData): PlanInput | { error: string } {
  const goalRace = String(formData.get("goal_race") ?? "").trim();
  const goalDistance = String(formData.get("goal_distance") ?? "");
  const goalRaceDate = String(formData.get("goal_race_date") ?? "").trim();
  const goalTime = String(formData.get("goal_time") ?? "").trim() || null;
  const currentMiles = Number(formData.get("current_weekly_miles") ?? 0);
  const longestRun = Number(formData.get("longest_recent_run_miles") ?? 0);
  const daysPerWeek = Number(formData.get("days_per_week") ?? 5);
  const injuries = String(formData.get("injuries_or_notes") ?? "").trim() || null;
  const methodology = String(formData.get("methodology") ?? "generalist");
  const paceStyle = String(formData.get("pace_style") ?? "both");

  // Protected rest days come as multiple "protected_rest_days" entries
  const protectedRestDays = formData
    .getAll("protected_rest_days")
    .map((v) => String(v));

  // Recent race (all or nothing)
  const recentRaceDistance = String(
    formData.get("recent_race_distance") ?? "",
  ).trim();
  const recentRaceTime = String(
    formData.get("recent_race_time") ?? "",
  ).trim();
  const recentRace =
    recentRaceDistance && recentRaceTime
      ? { distance: recentRaceDistance, time: recentRaceTime }
      : null;

  if (!goalRace) return { error: "Goal race is required." };
  if (!goalRaceDate) return { error: "Goal race date is required." };
  if (!["5k", "10k", "half_marathon", "marathon", "ultra", "other"].includes(goalDistance)) {
    return { error: "Pick a goal distance." };
  }
  if (!Number.isFinite(currentMiles) || currentMiles < 0) {
    return { error: "Current weekly mileage must be a non-negative number." };
  }
  if (!Number.isFinite(longestRun) || longestRun < 0) {
    return { error: "Longest recent run must be a non-negative number." };
  }
  if (!Number.isFinite(daysPerWeek) || daysPerWeek < 3 || daysPerWeek > 7) {
    return { error: "Days per week must be between 3 and 7." };
  }
  if (!VALID_METHODOLOGIES.includes(methodology as Methodology)) {
    return { error: "Invalid methodology." };
  }
  if (!["conversational", "specific", "both"].includes(paceStyle)) {
    return { error: "Invalid pace style." };
  }

  // Race date sanity check — must be in the future
  const raceDate = new Date(goalRaceDate);
  if (isNaN(raceDate.getTime()) || raceDate <= new Date()) {
    return { error: "Race date must be in the future." };
  }

  return {
    goal_race: goalRace,
    goal_distance: goalDistance as PlanInput["goal_distance"],
    goal_race_date: goalRaceDate,
    goal_time: goalTime,
    current_weekly_miles: currentMiles,
    longest_recent_run_miles: longestRun,
    recent_race: recentRace,
    days_per_week: daysPerWeek,
    protected_rest_days: protectedRestDays,
    injuries_or_notes: injuries,
    methodology: methodology as Methodology,
    pace_style: paceStyle as PlanInput["pace_style"],
  };
}
