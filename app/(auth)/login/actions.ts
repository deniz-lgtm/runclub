"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Sign an existing user in with email + password.
 * On success the Supabase SSR client sets the auth cookie and the
 * caller can redirect into the app.
 */
export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) {
    return { error: "Email is required" };
  }
  if (!password) {
    return { error: "Password is required" };
  }

  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { ok: true };
}

/**
 * Create a new auth user with email + password. Does not create the
 * profile row — that happens in the onboarding step once a session
 * exists.
 */
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email) {
    return { error: "Email is required" };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // If the project requires email confirmation, no session is returned
  // yet — tell the caller so they can show a "check your email" state.
  if (!data.session) {
    return { ok: true, needsConfirmation: true };
  }

  return { ok: true, needsConfirmation: false };
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
