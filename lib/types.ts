// Hand-authored types mirroring the Supabase schema.
// Until `supabase gen types typescript` is wired into CI, these are the
// source of truth that UI code imports from.

export type PreferredDistance =
  | "sprints"
  | "5k"
  | "10k"
  | "half_marathon"
  | "marathon"
  | "ultra";

export type WorkoutType =
  | "easy"
  | "long_run"
  | "tempo"
  | "intervals"
  | "hills"
  | "recovery"
  | "race"
  | "cross_training"
  | "rest";

export type PlanStatus = "active" | "completed" | "paused";
export type PlanVisibility = "public" | "friends_only" | "private";
export type SyncSource = "none" | "trainingpeaks" | "final_surge";
export type RsvpStatus = "going" | "maybe" | "not_going";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  preferred_distance: PreferredDistance | null;
  weekly_mileage_goal: number | null;
  current_shoe: string | null;
  is_coach: boolean;
  is_public: boolean;
}

export type PlanType =
  | "self_created"
  | "coach_assigned"
  | "ai_generated"
  | "synced_trainingpeaks"
  | "synced_finalsurge";

export interface TrainingPlan {
  id: string;
  user_id: string;
  title: string;
  goal_race: string | null;
  goal_race_date: string | null;
  status: PlanStatus;
  visibility: PlanVisibility;
  sync_source: SyncSource;
  plan_type: PlanType;
  notes: string | null;
}

export interface TrainingPlanWorkout {
  id: string;
  plan_id: string;
  scheduled_date: string; // ISO date
  workout_type: WorkoutType;
  title: string;
  description: string | null;
  target_distance_miles: number | null;
  scheduled_time: string | null; // HH:MM
  location: string | null;
  is_completed: boolean;
  actual_distance_miles: number | null;
  actual_duration_minutes: number | null;
  effort_rating: number | null;
  notes: string | null;
}

export interface RunClub {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  state: string | null;
  website_url: string | null;
  is_verified: boolean;
  membership_type: "open" | "request_to_join" | "invite_only";
}
