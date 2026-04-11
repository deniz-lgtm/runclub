import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeCode } from "@/lib/strava";

/**
 * Strava OAuth callback.
 *
 * After the user authorizes FWR on strava.com, Strava redirects here
 * with ?code=... We exchange it for a token bundle and persist it on
 * the profile row.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/profile/settings/connections?strava_error=${error}`, url.origin),
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/profile/settings/connections?strava_error=no_code", url.origin),
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", url.origin));
  }

  try {
    const tokens = await exchangeCode(code);

    await supabase
      .from("profiles")
      .update({
        strava_athlete_id: String(tokens.athlete.id),
        strava_access_token: tokens.access_token,
        strava_refresh_token: tokens.refresh_token,
        strava_token_expires_at: new Date(
          tokens.expires_at * 1000,
        ).toISOString(),
      })
      .eq("id", user.id);

    // TODO(phase 4): kick off an initial activity backfill job here.

    return NextResponse.redirect(
      new URL("/profile/settings/connections?strava=connected", url.origin),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/profile/settings/connections?strava_error=${encodeURIComponent(message)}`,
        url.origin,
      ),
    );
  }
}
