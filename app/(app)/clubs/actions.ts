"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Create a new run club. The creator becomes the admin. */
export async function createClub(formData: FormData) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const state = String(formData.get("state") ?? "").trim() || null;
  const website = String(formData.get("website_url") ?? "").trim() || null;
  const membershipType = String(formData.get("membership_type") ?? "open");

  if (!name) return { error: "Club name is required." };

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: club, error } = await supabase
    .from("run_clubs")
    .insert({
      name,
      slug,
      description,
      city,
      state,
      website_url: website,
      membership_type: membershipType,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "A club with that name already exists." };
    }
    return { error: error.message };
  }

  // Creator becomes admin automatically.
  await supabase.from("run_club_members").insert({
    club_id: club.id,
    user_id: user.id,
    role: "admin",
    status: "active",
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.slug}`);
}

/** Join a club as an active member (open clubs only). */
export async function joinClub(clubId: string, slug: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: club } = await supabase
    .from("run_clubs")
    .select("membership_type")
    .eq("id", clubId)
    .maybeSingle();

  const status =
    (club as { membership_type: string } | null)?.membership_type === "open"
      ? "active"
      : "pending";

  const { error } = await supabase.from("run_club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "member",
    status,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You're already part of this club." };
    }
    return { error: error.message };
  }

  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/clubs");
  return { ok: true };
}

/** Leave a club. */
export async function leaveClub(clubId: string, slug: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("run_club_members")
    .delete()
    .eq("club_id", clubId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/clubs");
  return { ok: true };
}
