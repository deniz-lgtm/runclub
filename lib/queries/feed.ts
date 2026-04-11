import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, TrainingPlanWorkout } from "@/lib/types";

export type FeedItem =
  | {
      kind: "open_run_invite";
      id: string;
      host: Profile;
      workout: TrainingPlanWorkout;
      meetup_location: string | null;
      notes: string | null;
      priority: 1;
      created_at: string;
    }
  | {
      kind: "club_event";
      id: string;
      club_id: string;
      club_name: string;
      club_slug: string;
      title: string;
      event_date: string;
      start_time: string | null;
      meetup_location: string | null;
      priority: 2;
      created_at: string;
    }
  | {
      kind: "friend_workout_completed";
      id: string;
      friend: Profile;
      workout: TrainingPlanWorkout;
      priority: 3;
      created_at: string;
    };

/**
 * Build the home feed for the current user.
 *
 * Ordering (per spec):
 *   1. Open run invites from friends in the next 48 hours
 *   2. Club events in the next 7 days (from clubs I'm in)
 *   3. Friends' completed workouts (last 24 hours)
 *
 * All three queries run in parallel and are merged + sorted.
 */
export async function getFeed(): Promise<FeedItem[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Friends — both directions of accepted friendships.
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const friendIds = new Set<string>();
  for (const f of (friendships ?? []) as Array<{
    requester_id: string;
    addressee_id: string;
  }>) {
    const other = f.requester_id === user.id ? f.addressee_id : f.requester_id;
    friendIds.add(other);
  }

  if (friendIds.size === 0) return [];
  const friendIdList = Array.from(friendIds);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 2);
  const inAWeek = new Date(today);
  inAWeek.setDate(today.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  // 1. Open run invites in the next 48 hours hosted by friends.
  const { data: invites } = await supabase
    .from("run_invites")
    .select(
      `
      id, meetup_location, notes, created_at, is_open, host_user_id,
      host:profiles!run_invites_host_user_id_fkey (*),
      workout:training_plan_workouts (*)
    `,
    )
    .eq("is_open", true)
    .in("host_user_id", friendIdList)
    .order("created_at", { ascending: false })
    .limit(20);

  // 2. Club events in the next 7 days from clubs I'm in.
  const { data: myClubs } = await supabase
    .from("run_club_members")
    .select("club_id")
    .eq("user_id", user.id)
    .eq("status", "active");
  const clubIds = ((myClubs ?? []) as Array<{ club_id: string }>).map(
    (c) => c.club_id,
  );

  const { data: clubEvents } = clubIds.length
    ? await supabase
        .from("run_club_events")
        .select("id, title, event_date, start_time, meetup_location, club_id, run_clubs ( name, slug ), created_at")
        .in("club_id", clubIds)
        .gte("event_date", iso(today))
        .lte("event_date", iso(inAWeek))
        .order("event_date", { ascending: true })
    : { data: [] };

  // 3. Friends' completed workouts in the last 24 hours.
  const { data: recentCompleted } = await supabase
    .from("training_plan_workouts")
    .select(
      `
      id, scheduled_date, workout_type, title, description,
      target_distance_miles, scheduled_time, location, is_completed,
      actual_distance_miles, actual_duration_minutes, effort_rating, notes,
      updated_at, training_plans!inner ( user_id, profile:profiles ( * ) )
    `,
    )
    .in("training_plans.user_id", friendIdList)
    .eq("is_completed", true)
    .gte("updated_at", yesterday.toISOString())
    .order("updated_at", { ascending: false })
    .limit(20);

  // Shape everything into FeedItems.
  const items: FeedItem[] = [];

  for (const i of (invites ?? []) as Array<{
    id: string;
    meetup_location: string | null;
    notes: string | null;
    created_at: string;
    host: Profile;
    workout: TrainingPlanWorkout;
  }>) {
    // Filter to invites whose workout is in the next 48 hours.
    const d = new Date(i.workout.scheduled_date);
    if (d >= today && d <= tomorrow && i.workout.workout_type !== "rest") {
      items.push({
        kind: "open_run_invite",
        id: i.id,
        host: i.host,
        workout: i.workout,
        meetup_location: i.meetup_location,
        notes: i.notes,
        priority: 1,
        created_at: i.created_at,
      });
    }
  }

  for (const e of (clubEvents ?? []) as Array<{
    id: string;
    title: string;
    event_date: string;
    start_time: string | null;
    meetup_location: string | null;
    club_id: string;
    run_clubs: { name: string; slug: string };
    created_at: string;
  }>) {
    items.push({
      kind: "club_event",
      id: e.id,
      club_id: e.club_id,
      club_name: e.run_clubs.name,
      club_slug: e.run_clubs.slug,
      title: e.title,
      event_date: e.event_date,
      start_time: e.start_time,
      meetup_location: e.meetup_location,
      priority: 2,
      created_at: e.created_at,
    });
  }

  for (const w of (recentCompleted ?? []) as Array<
    TrainingPlanWorkout & {
      updated_at: string;
      training_plans: { profile: Profile };
    }
  >) {
    items.push({
      kind: "friend_workout_completed",
      id: w.id,
      friend: w.training_plans.profile,
      workout: w,
      priority: 3,
      created_at: w.updated_at,
    });
  }

  // Sort: priority ascending, then created_at descending.
  items.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.created_at.localeCompare(a.created_at);
  });

  return items;
}
