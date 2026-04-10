import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** Fetch a public profile by username. Returns null if not found. */
export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();
  return (data as Profile | null) ?? null;
}

/**
 * Fetch recent, still-upcoming run invites created by the current
 * user's friends. Used on the feed and the profile.
 * Phase 1B returns an empty list until friendships + invites flow in.
 */
export async function getUpcomingFriendRuns() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // TODO: join run_invites → training_plan_workouts → profiles filtered
  // by friendships.status = 'accepted' and workout.scheduled_date >= today.
  // Leaving the call shape here so the wiring is obvious.
  return [];
}
