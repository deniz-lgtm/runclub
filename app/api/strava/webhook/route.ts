import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  fetchActivity,
  matchesWorkout,
  refreshAccessToken,
} from "@/lib/strava";

/**
 * Strava webhook endpoint.
 *
 * Two methods:
 *   GET  — Strava subscription verification handshake
 *   POST — Activity event notification (new/update/delete)
 *
 * On a new activity, we:
 *   1. Look up the athlete's profile by strava_athlete_id
 *   2. Refresh the access token if expired
 *   3. Fetch the full activity details
 *   4. Find the matching scheduled workout (same day, ± distance)
 *   5. Write actual_* fields onto that workout
 *
 * Use a service-role Supabase client in production — webhooks don't
 * carry a user session. The current impl uses the SSR client, which
 * will work when RLS is off on the relevant tables during sync.
 */

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN ?? "fwr-webhook";

// GET — verification handshake.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

// POST — activity event.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      object_type: "activity" | "athlete";
      object_id: number;
      aspect_type: "create" | "update" | "delete";
      owner_id: number; // strava athlete id
      event_time: number;
    };

    // We only care about activity creates for now.
    if (body.object_type !== "activity" || body.aspect_type !== "create") {
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseServerClient();

    // Find the profile by strava_athlete_id.
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("strava_athlete_id", String(body.owner_id))
      .maybeSingle();

    if (
      !profile ||
      !(profile as { strava_access_token?: string }).strava_access_token
    ) {
      return NextResponse.json({ ok: true, skipped: "no matching profile" });
    }

    // Refresh the token if expired.
    const p = profile as {
      id: string;
      strava_access_token: string;
      strava_refresh_token: string;
      strava_token_expires_at: string;
    };
    let accessToken = p.strava_access_token;
    if (new Date(p.strava_token_expires_at) < new Date()) {
      const refreshed = await refreshAccessToken(p.strava_refresh_token);
      accessToken = refreshed.access_token;
      await supabase
        .from("profiles")
        .update({
          strava_access_token: refreshed.access_token,
          strava_refresh_token: refreshed.refresh_token,
          strava_token_expires_at: new Date(
            refreshed.expires_at * 1000,
          ).toISOString(),
        })
        .eq("id", p.id);
    }

    // Fetch the activity and find a matching scheduled workout.
    const activity = await fetchActivity(accessToken, body.object_id);
    const activityDate = activity.start_date_local.slice(0, 10);

    const { data: candidates } = await supabase
      .from("training_plan_workouts")
      .select("id, target_distance_miles, scheduled_date, training_plans!inner(user_id)")
      .eq("training_plans.user_id", p.id)
      .eq("scheduled_date", activityDate);

    const match = (candidates ?? []).find((c) =>
      matchesWorkout(
        activity,
        (c as { scheduled_date: string }).scheduled_date,
        (c as { target_distance_miles: number | null }).target_distance_miles,
      ),
    );

    if (match) {
      const milesActual = activity.distance / 1609.344;
      const durationMin = activity.moving_time / 60;

      await supabase
        .from("training_plan_workouts")
        .update({
          is_completed: true,
          actual_distance_miles: Math.round(milesActual * 100) / 100,
          actual_duration_minutes: Math.round(durationMin),
          strava_activity_id: String(activity.id),
        })
        .eq("id", (match as { id: string }).id);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
