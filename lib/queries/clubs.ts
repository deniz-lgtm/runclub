import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { RunClub } from "@/lib/types";

export interface RunClubWithCount extends RunClub {
  member_count: number;
  is_member: boolean;
  my_role: "member" | "admin" | "organizer" | null;
}

/**
 * Fetch all clubs with a member count + whether the current user is
 * a member. Used on the Clubs discovery page.
 */
export async function getAllClubsWithMembership(
  search?: string,
): Promise<RunClubWithCount[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("run_clubs").select("*");
  if (search && search.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }
  const { data: clubs } = await query.order("name", { ascending: true });

  if (!clubs) return [];

  // Member counts
  const { data: counts } = await supabase
    .from("run_club_members")
    .select("club_id")
    .eq("status", "active");

  const countMap = new Map<string, number>();
  for (const row of (counts ?? []) as Array<{ club_id: string }>) {
    countMap.set(row.club_id, (countMap.get(row.club_id) ?? 0) + 1);
  }

  // My memberships
  const myMemberships = new Map<
    string,
    "member" | "admin" | "organizer"
  >();
  if (user) {
    const { data: mine } = await supabase
      .from("run_club_members")
      .select("club_id, role")
      .eq("user_id", user.id)
      .eq("status", "active");
    for (const row of (mine ?? []) as Array<{
      club_id: string;
      role: "member" | "admin" | "organizer";
    }>) {
      myMemberships.set(row.club_id, row.role);
    }
  }

  return (clubs as RunClub[]).map((c) => ({
    ...c,
    member_count: countMap.get(c.id) ?? 0,
    is_member: myMemberships.has(c.id),
    my_role: myMemberships.get(c.id) ?? null,
  }));
}

/** One club by slug, with full metadata. */
export async function getClubBySlug(slug: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: club } = await supabase
    .from("run_clubs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!club) return null;

  // Members
  const { data: members } = await supabase
    .from("run_club_members")
    .select(
      `
      id, role, status,
      profile:profiles ( id, username, display_name, avatar_url, city, is_coach )
    `,
    )
    .eq("club_id", (club as RunClub).id)
    .eq("status", "active");

  // Upcoming events
  const today = new Date().toISOString().slice(0, 10);
  const { data: events } = await supabase
    .from("run_club_events")
    .select("*")
    .eq("club_id", (club as RunClub).id)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(20);

  // My membership status
  let myRole: "member" | "admin" | "organizer" | null = null;
  if (user) {
    const { data: mine } = await supabase
      .from("run_club_members")
      .select("role, status")
      .eq("club_id", (club as RunClub).id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (
      mine &&
      (mine as { status: string }).status === "active"
    ) {
      myRole = (mine as { role: "member" | "admin" | "organizer" }).role;
    }
  }

  return {
    club: club as RunClub,
    members: (members ?? []) as Array<{
      id: string;
      role: "member" | "admin" | "organizer";
      profile: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
        city: string | null;
        is_coach: boolean;
      };
    }>,
    events: (events ?? []) as Array<{
      id: string;
      club_id: string;
      title: string;
      description: string | null;
      event_date: string;
      start_time: string | null;
      meetup_location: string | null;
      distance_miles: number | null;
      pace_description: string | null;
      event_type: string;
      max_attendees: number | null;
    }>,
    myRole,
  };
}

/** Fetch a single club event by id. */
export async function getClubEventById(eventId: string) {
  const supabase = createSupabaseServerClient();
  const { data: event } = await supabase
    .from("run_club_events")
    .select("*, run_clubs ( id, name, slug )")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return null;

  const { data: rsvps } = await supabase
    .from("run_club_event_rsvps")
    .select("user_id, status, profile:profiles ( id, username, display_name, avatar_url )")
    .eq("event_id", eventId);

  return { event, rsvps: rsvps ?? [] };
}
