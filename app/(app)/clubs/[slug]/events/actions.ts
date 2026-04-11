"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Create a new event for a club. Caller must be an admin or organizer
 * (RLS enforces this).
 */
export async function createClubEvent(
  clubId: string,
  slug: string,
  formData: FormData,
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim() || null;
  const meetupLocation =
    String(formData.get("meetup_location") ?? "").trim() || null;
  const distanceRaw = String(formData.get("distance_miles") ?? "").trim();
  const pace = String(formData.get("pace_description") ?? "").trim() || null;
  const eventType = String(formData.get("event_type") ?? "group_run");
  const isRecurring = formData.get("is_recurring") === "on";
  const recurrenceRule =
    String(formData.get("recurrence_rule") ?? "").trim() || null;

  if (!title) return { error: "Title is required." };
  if (!eventDate) return { error: "Date is required." };

  const distance = distanceRaw ? Number(distanceRaw) : null;

  const { data: event, error } = await supabase
    .from("run_club_events")
    .insert({
      club_id: clubId,
      created_by: user.id,
      title,
      description,
      event_date: eventDate,
      start_time: startTime,
      meetup_location: meetupLocation,
      distance_miles: distance,
      pace_description: pace,
      event_type: eventType,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring ? recurrenceRule : null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/clubs/${slug}`);
  revalidatePath("/calendar");
  redirect(`/clubs/${slug}/events/${event.id}`);
}

/** RSVP to a club event. */
export async function rsvpToEvent(
  eventId: string,
  slug: string,
  status: "going" | "maybe" | "not_going",
) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase.from("run_club_event_rsvps").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
    },
    { onConflict: "event_id,user_id" },
  );

  if (error) return { error: error.message };
  revalidatePath(`/clubs/${slug}/events/${eventId}`);
  revalidatePath("/calendar");
  return { ok: true };
}
