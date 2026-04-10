"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PreferredDistance } from "@/lib/types";

const VALID_DISTANCES: PreferredDistance[] = [
  "sprints",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
  "ultra",
];

/**
 * Update the current user's profile from the settings form.
 * Username + id are immutable here; to change username the user would
 * need to hit a separate dedicated flow (rate-limited so they can't
 * squat handles).
 */
export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const preferredDistance = String(formData.get("preferred_distance") ?? "");
  const weeklyRaw = String(formData.get("weekly") ?? "").trim();
  const shoe = String(formData.get("current_shoe") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const isPublic = formData.get("is_public") === "on";

  if (!displayName) return { error: "Display name is required." };
  if (bio && bio.length > 280)
    return { error: "Bio must be 280 characters or fewer." };

  const distance = VALID_DISTANCES.includes(
    preferredDistance as PreferredDistance,
  )
    ? (preferredDistance as PreferredDistance)
    : null;

  const weekly = weeklyRaw ? Number(weeklyRaw) : null;
  if (weekly != null && (!Number.isFinite(weekly) || weekly < 0)) {
    return { error: "Weekly mileage must be a positive number." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      city,
      state,
      preferred_distance: distance,
      weekly_mileage_goal: weekly,
      current_shoe: shoe,
      bio,
      is_public: isPublic,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  revalidatePath("/profile/settings");
  return { ok: true };
}
