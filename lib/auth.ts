import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Get the current Supabase user, or null if not signed in.
 * Safe to call from any Server Component or Route Handler.
 */
export async function getCurrentUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current user's profile row, or null if either the user isn't
 * signed in OR they haven't completed onboarding yet.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

/**
 * Require a fully onboarded user. Redirects to /login if unauth, or to
 * /onboarding if they haven't completed the profile setup flow yet.
 * Returns the Profile row so callers can use it directly.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) {
    redirect("/onboarding");
  }

  return data as Profile;
}
