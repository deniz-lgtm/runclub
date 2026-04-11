import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeTPCode } from "@/lib/trainingpeaks";

/**
 * TrainingPeaks OAuth callback.
 *
 * Exchanges the code for tokens and persists them on the profile row.
 * Phase 2E+ adds an initial workout sync immediately after connection.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(
        `/profile/settings/connections?tp_error=${error ?? "no_code"}`,
        url.origin,
      ),
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", url.origin));

  try {
    const redirectUri = `${url.origin}/api/trainingpeaks/callback`;
    const tokens = await exchangeTPCode(code, redirectUri);

    await supabase
      .from("profiles")
      .update({
        tp_access_token: tokens.access_token,
        tp_refresh_token: tokens.refresh_token,
        tp_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
      })
      .eq("id", user.id);

    // TODO(phase 2E): trigger an initial workout sync here.

    return NextResponse.redirect(
      new URL("/profile/settings/connections?tp=connected", url.origin),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/profile/settings/connections?tp_error=${encodeURIComponent(message)}`,
        url.origin,
      ),
    );
  }
}
