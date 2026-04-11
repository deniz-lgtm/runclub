"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create a run_invite for a workout, opening it to friends.
 *
 * Setting is_open=true makes the invite visible on friends' feeds
 * and calendars. The host can include a meetup location, cap the
 * number of joiners, and add a note ("conversational pace, all
 * welcome").
 */
export async function openToFriends(
  workoutId: string,
  formData: FormData,
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const meetupLocation =
    String(formData.get("meetup_location") ?? "").trim() || null;
  const maxJoinersRaw = String(formData.get("max_joiners") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const maxJoiners = maxJoinersRaw ? Number(maxJoinersRaw) : null;
  if (maxJoiners != null && (!Number.isFinite(maxJoiners) || maxJoiners < 1)) {
    return { error: "Max joiners must be 1 or more." };
  }

  // Upsert — if an invite already exists for this workout, update it.
  const { data: existing } = await supabase
    .from("run_invites")
    .select("id")
    .eq("workout_id", workoutId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("run_invites")
      .update({
        is_open: true,
        meetup_location: meetupLocation,
        max_joiners: maxJoiners,
        notes,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("run_invites").insert({
      workout_id: workoutId,
      host_user_id: user.id,
      is_open: true,
      meetup_location: meetupLocation,
      max_joiners: maxJoiners,
      notes,
    });
    if (error) return { error: error.message };
  }

  revalidatePath(`/workout/${workoutId}`);
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

/** Close an invite (stops showing up on friends' feeds). */
export async function closeInvite(workoutId: string) {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase
    .from("run_invites")
    .update({ is_open: false })
    .eq("workout_id", workoutId);

  if (error) return { error: error.message };
  revalidatePath(`/workout/${workoutId}`);
  revalidatePath("/calendar");
  return { ok: true };
}

/** Join (or decline) a friend's open run. */
export async function respondToInvite(
  inviteId: string,
  status: "going" | "maybe" | "not_going",
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("run_invite_responses").upsert(
    {
      invite_id: inviteId,
      user_id: user.id,
      status,
    },
    { onConflict: "invite_id,user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}
