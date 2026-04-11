"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Service = "strava" | "tp" | "fs";

/**
 * Disconnect a third-party integration by nulling its tokens on the
 * profile row. The Strava webhook handler will no longer find a
 * matching profile, so activities stop syncing automatically.
 */
export async function disconnectService(service: Service) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const updates: Record<string, null> = {};
  if (service === "strava") {
    updates.strava_athlete_id = null;
    updates.strava_access_token = null;
    updates.strava_refresh_token = null;
    updates.strava_token_expires_at = null;
  } else if (service === "tp") {
    updates.tp_athlete_id = null;
    updates.tp_access_token = null;
    updates.tp_refresh_token = null;
    updates.tp_token_expires_at = null;
  } else if (service === "fs") {
    updates.fs_athlete_id = null;
    updates.fs_access_token = null;
    updates.fs_refresh_token = null;
    updates.fs_token_expires_at = null;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile/settings/connections");
  revalidatePath("/profile");
  return { ok: true };
}
