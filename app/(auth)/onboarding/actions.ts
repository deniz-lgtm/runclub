"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PreferredDistance } from "@/lib/types";

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
const VALID_DISTANCES: PreferredDistance[] = [
  "sprints",
  "5k",
  "10k",
  "half_marathon",
  "marathon",
  "ultra",
];

/**
 * Create (or upsert) the current user's profile row.
 *
 * Called from the onboarding form. Requires an authenticated user —
 * RLS will reject the insert otherwise.
 */
export async function createProfile(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a profile." };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const preferredDistance = String(formData.get("preferred_distance") ?? "");
  const weeklyRaw = String(formData.get("weekly") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim() || null;

  if (!displayName) {
    return { error: "Display name is required." };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return {
      error:
        "Username must be 3–24 characters: lowercase letters, numbers, and underscores.",
    };
  }
  if (bio && bio.length > 280) {
    return { error: "Bio must be 280 characters or fewer." };
  }

  const distance = VALID_DISTANCES.includes(
    preferredDistance as PreferredDistance,
  )
    ? (preferredDistance as PreferredDistance)
    : null;

  const weekly = weeklyRaw ? Number(weeklyRaw) : null;
  if (weekly != null && (!Number.isFinite(weekly) || weekly < 0)) {
    return { error: "Weekly mileage must be a positive number." };
  }

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      username,
      display_name: displayName,
      city,
      state,
      preferred_distance: distance,
      weekly_mileage_goal: weekly,
      bio,
      is_public: true,
    },
    { onConflict: "id" },
  );

  if (error) {
    // Surface unique-constraint violations with a nicer message.
    if (error.code === "23505") {
      return { error: "That username is already taken — try another." };
    }
    return { error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/");
  redirect("/");
}
