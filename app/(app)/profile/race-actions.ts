"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Log a race result. Stored in the `activity_feed` table with
 * event_type='race_result' and the details in metadata jsonb.
 * No migration needed — race_result is already in the enum.
 */
export async function logRaceResult(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const raceName = String(formData.get("race_name") ?? "").trim();
  const raceDate = String(formData.get("race_date") ?? "").trim();
  const distance = String(formData.get("distance") ?? "").trim();
  const finishTime = String(formData.get("finish_time") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!raceName) return { error: "Race name is required." };
  if (!raceDate) return { error: "Race date is required." };
  if (!distance) return { error: "Distance is required." };

  const { error } = await supabase.from("activity_feed").insert({
    user_id: user.id,
    event_type: "race_result",
    metadata: {
      race_name: raceName,
      race_date: raceDate,
      distance,
      finish_time: finishTime,
      notes,
    },
  });

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { ok: true };
}

export interface RaceResult {
  id: string;
  race_name: string;
  race_date: string;
  distance: string;
  finish_time: string | null;
  notes: string | null;
  created_at: string;
}

/** Fetch the current user's logged race results. */
export async function getMyRaceResults(): Promise<RaceResult[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("activity_feed")
    .select("*")
    .eq("user_id", user.id)
    .eq("event_type", "race_result")
    .order("created_at", { ascending: false });

  return ((data ?? []) as Array<{
    id: string;
    metadata: {
      race_name: string;
      race_date: string;
      distance: string;
      finish_time: string | null;
      notes: string | null;
    };
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    race_name: row.metadata.race_name,
    race_date: row.metadata.race_date,
    distance: row.metadata.distance,
    finish_time: row.metadata.finish_time,
    notes: row.metadata.notes,
    created_at: row.created_at,
  }));
}
