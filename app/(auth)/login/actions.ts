"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Send a passwordless magic-link email to the given address.
 * The link redirects back to /auth/callback, which exchanges the code
 * for a session and pushes the user into the app.
 */
export async function signInWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "Email is required" };
  }

  const origin = headers().get("origin") ?? "";
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}

/**
 * Start the Google OAuth flow. Supabase handles the provider handshake
 * and redirects the browser to Google; Google then redirects back to
 * /auth/callback with the code.
 */
export async function signInWithGoogle() {
  const origin = headers().get("origin") ?? "";
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=/`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sign the current user out and redirect to /login.
 */
export async function signOut() {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
