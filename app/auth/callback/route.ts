import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback.
 *
 * This is the redirect target for:
 *   - OAuth sign-in (Google, Apple, etc.)
 *   - Email confirmation links (if Supabase project has confirmation enabled)
 *
 * Supabase redirects the browser here with a `?code=...` query param.
 * We exchange the code for a session (which writes the auth cookie)
 * and then push the user forward — either to the URL they were trying
 * to reach before login, or to the feed.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Send the user back into the app.
  return NextResponse.redirect(new URL(next, url.origin));
}
