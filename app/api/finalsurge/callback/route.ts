import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { exchangeFSCode } from "@/lib/finalsurge";

/**
 * Final Surge OAuth callback. Same shape as the TP callback — swap
 * the helper and the token column names.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(
      new URL(
        `/profile/settings/connections?fs_error=${error ?? "no_code"}`,
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
    const redirectUri = `${url.origin}/api/finalsurge/callback`;
    const tokens = await exchangeFSCode(code, redirectUri);

    await supabase
      .from("profiles")
      .update({
        fs_access_token: tokens.access_token,
        fs_refresh_token: tokens.refresh_token,
        fs_token_expires_at: new Date(
          Date.now() + tokens.expires_in * 1000,
        ).toISOString(),
      })
      .eq("id", user.id);

    return NextResponse.redirect(
      new URL("/profile/settings/connections?fs=connected", url.origin),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(
        `/profile/settings/connections?fs_error=${encodeURIComponent(message)}`,
        url.origin,
      ),
    );
  }
}
