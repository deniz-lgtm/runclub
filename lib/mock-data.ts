import { addDays, startOfWeek, toISODate } from "@/lib/date-utils";
import type { TrainingPlanWorkout, WorkoutType } from "@/lib/types";

/**
 * Dev-mode fixtures.
 *
 * Phase 1C renders the calendar against real Supabase data whenever the
 * user is signed in, but we also want the calendar to look alive the
 * moment someone opens the app — before they've built a plan, synced
 * TP, or added friends. These fixtures fill that gap.
 *
 * Dates are computed *relative to today* so the current week always
 * has something in it, regardless of when you open the app.
 */

const today = new Date();
const mondayThisWeek = startOfWeek(today);

interface WorkoutSeed {
  dayOffset: number; // days from monday
  type: WorkoutType;
  title: string;
  description?: string;
  distance?: number;
  time?: string;
  location?: string;
}

// A week of marathon-plan workouts in the spirit of Sarah's profile.
const CURRENT_WEEK_SEEDS: WorkoutSeed[] = [
  {
    dayOffset: 0, // Monday
    type: "easy",
    title: "Easy 5 mi",
    description: "Conversational pace — keep it chill.",
    distance: 5,
    time: "06:30",
    location: "Silver Lake Reservoir",
  },
  {
    dayOffset: 1, // Tuesday
    type: "intervals",
    title: "6×800m @ 5K pace",
    description: "Warm up 2mi, then 6×800m with 400m float recovery, cool down 1mi.",
    distance: 7,
    time: "18:00",
    location: "Santa Monica HS Track",
  },
  {
    dayOffset: 2, // Wednesday
    type: "easy",
    title: "Easy 4 mi + strides",
    description: "Recovery-effort miles, finish with 6×100m strides.",
    distance: 4,
    time: "06:30",
  },
  {
    dayOffset: 3, // Thursday
    type: "tempo",
    title: "Tempo 6 mi",
    description: "1mi warm, 4mi @ marathon pace, 1mi cool.",
    distance: 6,
    time: "06:15",
    location: "Griffith Park loop",
  },
  {
    dayOffset: 4, // Friday
    type: "rest",
    title: "Rest day",
    description: "No running. Hydrate, foam roll, sleep.",
  },
  {
    dayOffset: 5, // Saturday
    type: "long_run",
    title: "Long run 14 mi",
    description: "Steady effort. Last 3mi progression, ending at goal MP.",
    distance: 14,
    time: "07:00",
    location: "Griffith Park → Los Feliz",
  },
  {
    dayOffset: 6, // Sunday
    type: "recovery",
    title: "Recovery 3 mi",
    description: "Shake the legs out. All easy, all smiles.",
    distance: 3,
    time: "08:30",
  },
];

// Next week — lighter, because we're in a cutback week.
const NEXT_WEEK_SEEDS: WorkoutSeed[] = [
  { dayOffset: 0, type: "easy", title: "Easy 4 mi", distance: 4 },
  {
    dayOffset: 1,
    type: "hills",
    title: "Hill repeats 6×2min",
    distance: 6,
    time: "18:00",
  },
  { dayOffset: 2, type: "rest", title: "Rest day" },
  { dayOffset: 3, type: "tempo", title: "Tempo 5 mi", distance: 5 },
  { dayOffset: 4, type: "easy", title: "Easy 4 mi + strides", distance: 4 },
  {
    dayOffset: 5,
    type: "long_run",
    title: "Long run 10 mi (cutback)",
    distance: 10,
    time: "07:00",
  },
  { dayOffset: 6, type: "recovery", title: "Recovery 3 mi", distance: 3 },
];

// Last week — all completed.
const LAST_WEEK_SEEDS: WorkoutSeed[] = [
  { dayOffset: 0, type: "easy", title: "Easy 5 mi", distance: 5 },
  {
    dayOffset: 1,
    type: "intervals",
    title: "5×1000m @ 5K pace",
    distance: 7,
  },
  { dayOffset: 2, type: "easy", title: "Easy 4 mi", distance: 4 },
  { dayOffset: 3, type: "tempo", title: "Tempo 5 mi", distance: 5 },
  { dayOffset: 4, type: "rest", title: "Rest day" },
  { dayOffset: 5, type: "long_run", title: "Long run 13 mi", distance: 13 },
  { dayOffset: 6, type: "recovery", title: "Recovery 3 mi", distance: 3 },
];

/**
 * Build the mock workouts for three weeks: last, current, next.
 * Returns a flat array keyed by scheduled_date.
 */
function buildMockWorkouts(): TrainingPlanWorkout[] {
  const weeks = [
    { seeds: LAST_WEEK_SEEDS, weekStart: addDays(mondayThisWeek, -7), completed: true },
    { seeds: CURRENT_WEEK_SEEDS, weekStart: mondayThisWeek, completed: false },
    { seeds: NEXT_WEEK_SEEDS, weekStart: addDays(mondayThisWeek, 7), completed: false },
  ];

  const out: TrainingPlanWorkout[] = [];
  let idCounter = 1;

  for (const { seeds, weekStart, completed } of weeks) {
    for (const seed of seeds) {
      const date = addDays(weekStart, seed.dayOffset);
      out.push({
        id: `mock-workout-${idCounter++}`,
        plan_id: "mock-plan-chicago",
        scheduled_date: toISODate(date),
        workout_type: seed.type,
        title: seed.title,
        description: seed.description ?? null,
        target_distance_miles: seed.distance ?? null,
        scheduled_time: seed.time ?? null,
        location: seed.location ?? null,
        is_completed: completed,
      });
    }
  }

  return out;
}

export const MOCK_WORKOUTS: TrainingPlanWorkout[] = buildMockWorkouts();

/** A friend's scheduled run shown as a smaller indicator on the calendar. */
export interface FriendRun {
  id: string;
  friend_id: string;
  friend_name: string;
  friend_username: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  distance: number;
  workout_type: WorkoutType;
  title: string;
  location: string;
}

export const MOCK_FRIEND_RUNS: FriendRun[] = [
  {
    id: "friend-run-1",
    friend_id: "22222222-2222-2222-2222-222222222222",
    friend_name: "Marcus J.",
    friend_username: "marcusj",
    date: toISODate(addDays(mondayThisWeek, 2)),
    time: "07:00",
    distance: 4,
    workout_type: "easy",
    title: "Easy 4 mi",
    location: "Echo Park Lake loop",
  },
  {
    id: "friend-run-2",
    friend_id: "44444444-4444-4444-4444-444444444444",
    friend_name: "Deanna",
    friend_username: "deanna",
    date: toISODate(addDays(mondayThisWeek, 5)),
    time: "07:00",
    distance: 8,
    workout_type: "long_run",
    title: "Long run 8 mi",
    location: "Griffith Park",
  },
  {
    id: "friend-run-3",
    friend_id: "33333333-3333-3333-3333-333333333333",
    friend_name: "Coach Amy",
    friend_username: "coachamy",
    date: toISODate(addDays(mondayThisWeek, 1)),
    time: "18:00",
    distance: 7,
    workout_type: "intervals",
    title: "Track Tuesday — 6×800m",
    location: "Santa Monica HS",
  },
];

/** Club event fixtures — visible on the calendar as 🏁 markers. */
export interface ClubEvent {
  id: string;
  club_id: string;
  club_name: string;
  club_slug: string;
  date: string;
  time: string;
  title: string;
  location: string;
  distance: number;
}

export const MOCK_CLUB_EVENTS: ClubEvent[] = [
  {
    id: "event-1",
    club_id: "aaaaaaaa-0000-0000-0000-000000000001",
    club_name: "Friends Who Run",
    club_slug: "friends-who-run",
    date: toISODate(addDays(mondayThisWeek, 3)),
    time: "06:30",
    title: "Thursday Shakeout",
    location: "Silver Lake Reservoir",
    distance: 5,
  },
];

/**
 * Lookup helpers. These mirror the shape of the future Supabase query
 * results so swapping them out later is a tiny diff.
 */

export function mockWorkoutsByDate(
  isoDate: string,
): TrainingPlanWorkout | undefined {
  return MOCK_WORKOUTS.find((w) => w.scheduled_date === isoDate);
}

export function mockFriendRunsByDate(isoDate: string): FriendRun[] {
  return MOCK_FRIEND_RUNS.filter((r) => r.date === isoDate);
}

export function mockClubEventsByDate(isoDate: string): ClubEvent[] {
  return MOCK_CLUB_EVENTS.filter((e) => e.date === isoDate);
}
