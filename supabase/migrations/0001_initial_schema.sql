-- Friends Who Run — Initial Schema
-- Phase 1 schema: profiles, friendships, training plans, run invites, clubs,
-- events, AI coaching threads, activity feed, generated routes, route ratings.

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────────────────
-- Enums
-- ────────────────────────────────────────────────────────────────────────────

create type preferred_distance as enum (
  'sprints', '5k', '10k', 'half_marathon', 'marathon', 'ultra'
);

create type friendship_status as enum ('pending', 'accepted', 'blocked');

create type plan_type as enum (
  'self_created',
  'coach_assigned',
  'ai_generated',
  'synced_trainingpeaks',
  'synced_finalsurge'
);

create type plan_status as enum ('active', 'completed', 'paused');

create type plan_visibility as enum ('public', 'friends_only', 'private');

create type sync_source as enum ('none', 'trainingpeaks', 'final_surge');

create type workout_type as enum (
  'easy',
  'long_run',
  'tempo',
  'intervals',
  'hills',
  'recovery',
  'race',
  'cross_training',
  'rest'
);

create type rsvp_status as enum ('going', 'maybe', 'not_going');

create type club_membership_type as enum (
  'open', 'request_to_join', 'invite_only'
);

create type club_member_role as enum ('member', 'admin', 'organizer');

create type club_member_status as enum ('active', 'pending', 'removed');

create type club_event_type as enum (
  'group_run', 'race', 'social', 'workout', 'volunteer'
);

create type feed_event_type as enum (
  'workout_completed',
  'plan_started',
  'joined_club',
  'race_result',
  'friend_added',
  'run_invite_created'
);

create type surface_type as enum ('road', 'trail', 'mixed', 'track');
create type route_shape as enum ('loop', 'out_and_back', 'point_to_point');
create type terrain_preference as enum ('flat', 'rolling', 'hilly', 'no_preference');

-- ────────────────────────────────────────────────────────────────────────────
-- Updated-at trigger helper
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  city text,
  state text,
  preferred_distance preferred_distance,
  weekly_mileage_goal numeric,
  current_shoe text,

  -- Strava
  strava_athlete_id text,
  strava_access_token text,
  strava_refresh_token text,
  strava_token_expires_at timestamptz,

  -- TrainingPeaks
  tp_athlete_id text,
  tp_access_token text,
  tp_refresh_token text,
  tp_token_expires_at timestamptz,

  -- Final Surge
  fs_athlete_id text,
  fs_access_token text,
  fs_refresh_token text,
  fs_token_expires_at timestamptz,

  is_coach boolean default false,
  is_public boolean default true,

  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create index profiles_city_idx on public.profiles (city);
create index profiles_username_idx on public.profiles (username);

-- ────────────────────────────────────────────────────────────────────────────
-- friendships
-- ────────────────────────────────────────────────────────────────────────────

create table public.friendships (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status friendship_status not null default 'pending',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint friendships_unique unique (requester_id, addressee_id),
  constraint friendships_not_self check (requester_id <> addressee_id)
);

create trigger friendships_updated_at before update on public.friendships
  for each row execute function public.set_updated_at();

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

-- ────────────────────────────────────────────────────────────────────────────
-- training_plans
-- ────────────────────────────────────────────────────────────────────────────

create table public.training_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  goal_race text,
  goal_race_date date,
  goal_time interval,
  plan_type plan_type not null default 'self_created',
  coach_id uuid references public.profiles(id),
  sync_source sync_source default 'none',
  external_plan_id text,
  last_synced_at timestamptz,
  auto_sync boolean default true,
  status plan_status not null default 'active',
  visibility plan_visibility not null default 'friends_only',
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger training_plans_updated_at before update on public.training_plans
  for each row execute function public.set_updated_at();

create index training_plans_user_idx on public.training_plans (user_id);
create index training_plans_status_idx on public.training_plans (status);

-- ────────────────────────────────────────────────────────────────────────────
-- training_plan_workouts
-- ────────────────────────────────────────────────────────────────────────────

create table public.training_plan_workouts (
  id uuid primary key default uuid_generate_v4(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  scheduled_date date not null,
  workout_type workout_type not null,
  title text not null,
  description text,
  target_distance_miles numeric,
  target_pace_per_mile interval,
  target_duration_minutes integer,
  scheduled_time time,
  location text,
  is_completed boolean default false,
  actual_distance_miles numeric,
  actual_pace_per_mile interval,
  actual_duration_minutes integer,
  strava_activity_id text,
  external_workout_id text,
  sync_source sync_source default 'none',
  effort_rating integer check (effort_rating between 1 and 10),
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger training_plan_workouts_updated_at before update
  on public.training_plan_workouts
  for each row execute function public.set_updated_at();

create index workouts_plan_idx on public.training_plan_workouts (plan_id);
create index workouts_scheduled_date_idx
  on public.training_plan_workouts (scheduled_date);

-- ────────────────────────────────────────────────────────────────────────────
-- run_invites
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_invites (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid not null references public.training_plan_workouts(id) on delete cascade,
  host_user_id uuid not null references public.profiles(id) on delete cascade,
  is_open boolean default true,
  max_joiners integer,
  meetup_location text,
  meetup_coordinates geography(Point, 4326),
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger run_invites_updated_at before update on public.run_invites
  for each row execute function public.set_updated_at();

create index run_invites_host_idx on public.run_invites (host_user_id);
create index run_invites_workout_idx on public.run_invites (workout_id);

-- ────────────────────────────────────────────────────────────────────────────
-- run_invite_responses
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_invite_responses (
  id uuid primary key default uuid_generate_v4(),
  invite_id uuid not null references public.run_invites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint invite_response_unique unique (invite_id, user_id)
);

create trigger run_invite_responses_updated_at before update
  on public.run_invite_responses
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- run_clubs
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_clubs (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  logo_url text,
  cover_image_url text,
  city text,
  state text,
  website_url text,
  instagram_handle text,
  strava_club_url text,
  is_verified boolean default false,
  membership_type club_membership_type default 'open',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger run_clubs_updated_at before update on public.run_clubs
  for each row execute function public.set_updated_at();

create index run_clubs_city_idx on public.run_clubs (city);

-- ────────────────────────────────────────────────────────────────────────────
-- run_club_members
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_club_members (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.run_clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role club_member_role not null default 'member',
  status club_member_status not null default 'active',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint club_member_unique unique (club_id, user_id)
);

create trigger run_club_members_updated_at before update
  on public.run_club_members
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- run_club_events
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_club_events (
  id uuid primary key default uuid_generate_v4(),
  club_id uuid not null references public.run_clubs(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  meetup_location text,
  meetup_coordinates geography(Point, 4326),
  route_url text,
  distance_miles numeric,
  pace_description text,
  event_type club_event_type default 'group_run',
  max_attendees integer,
  is_recurring boolean default false,
  recurrence_rule text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger run_club_events_updated_at before update
  on public.run_club_events
  for each row execute function public.set_updated_at();

create index events_club_idx on public.run_club_events (club_id);
create index events_date_idx on public.run_club_events (event_date);

-- ────────────────────────────────────────────────────────────────────────────
-- run_club_event_rsvps
-- ────────────────────────────────────────────────────────────────────────────

create table public.run_club_event_rsvps (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid not null references public.run_club_events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status rsvp_status not null default 'going',
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint event_rsvp_unique unique (event_id, user_id)
);

create trigger run_club_event_rsvps_updated_at before update
  on public.run_club_event_rsvps
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- ai_coaching_threads
-- ────────────────────────────────────────────────────────────────────────────

create table public.ai_coaching_threads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid references public.training_plans(id),
  title text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger ai_threads_updated_at before update
  on public.ai_coaching_threads
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- activity_feed
-- ────────────────────────────────────────────────────────────────────────────

create table public.activity_feed (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type feed_event_type not null,
  reference_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index activity_feed_user_idx on public.activity_feed (user_id);
create index activity_feed_created_idx on public.activity_feed (created_at desc);

-- ────────────────────────────────────────────────────────────────────────────
-- generated_routes
-- ────────────────────────────────────────────────────────────────────────────

create table public.generated_routes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  start_latitude double precision not null,
  start_longitude double precision not null,
  start_address text,
  target_distance_miles numeric not null,
  actual_distance_miles numeric,
  elevation_gain_ft numeric,
  elevation_loss_ft numeric,
  elevation_profile jsonb,
  route_geometry geometry(LineString, 4326),
  route_geojson jsonb,
  turn_by_turn jsonb,
  surface_type surface_type default 'road',
  route_type route_shape default 'loop',
  terrain_preference terrain_preference default 'no_preference',
  avoidances text[] default '{}',
  is_saved boolean default false,
  is_public boolean default false,
  times_used integer default 0,
  avg_rating numeric,
  linked_workout_id uuid references public.training_plan_workouts(id),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger generated_routes_updated_at before update
  on public.generated_routes
  for each row execute function public.set_updated_at();

create index routes_user_idx on public.generated_routes (user_id);
create index routes_public_idx on public.generated_routes (is_public)
  where is_public = true;
create index routes_geom_idx on public.generated_routes
  using gist (route_geometry);

-- ────────────────────────────────────────────────────────────────────────────
-- route_ratings
-- ────────────────────────────────────────────────────────────────────────────

create table public.route_ratings (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references public.generated_routes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  notes text,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  constraint route_rating_unique unique (route_id, user_id)
);

create trigger route_ratings_updated_at before update
  on public.route_ratings
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

alter table public.profiles                enable row level security;
alter table public.friendships             enable row level security;
alter table public.training_plans          enable row level security;
alter table public.training_plan_workouts  enable row level security;
alter table public.run_invites             enable row level security;
alter table public.run_invite_responses    enable row level security;
alter table public.run_clubs               enable row level security;
alter table public.run_club_members        enable row level security;
alter table public.run_club_events         enable row level security;
alter table public.run_club_event_rsvps    enable row level security;
alter table public.ai_coaching_threads     enable row level security;
alter table public.activity_feed           enable row level security;
alter table public.generated_routes        enable row level security;
alter table public.route_ratings           enable row level security;

-- profiles: public profiles are visible to everyone, private only to self
create policy "profiles readable when public"
  on public.profiles for select
  using (is_public = true or auth.uid() = id);

create policy "profiles editable by owner"
  on public.profiles for update using (auth.uid() = id);

create policy "profiles insertable by owner"
  on public.profiles for insert with check (auth.uid() = id);

-- friendships: only parties can see/manage
create policy "friendships visible to parties"
  on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "friendships created by requester"
  on public.friendships for insert with check (auth.uid() = requester_id);

create policy "friendships updatable by parties"
  on public.friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- training_plans: visibility driven by plan.visibility
create policy "training plans visible to self"
  on public.training_plans for select using (auth.uid() = user_id);

create policy "public training plans visible to all"
  on public.training_plans for select using (visibility = 'public');

create policy "friends-only training plans visible to accepted friends"
  on public.training_plans for select using (
    visibility = 'friends_only'
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_id) or
          (f.addressee_id = auth.uid() and f.requester_id = user_id)
        )
    )
  );

create policy "training plans writable by owner"
  on public.training_plans for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- workouts: inherit plan visibility (read via plan, write if you own the plan)
create policy "workouts readable if plan readable"
  on public.training_plan_workouts for select using (
    exists (
      select 1 from public.training_plans p
      where p.id = plan_id
        and (
          p.user_id = auth.uid()
          or p.visibility = 'public'
          or (
            p.visibility = 'friends_only'
            and exists (
              select 1 from public.friendships f
              where f.status = 'accepted'
                and (
                  (f.requester_id = auth.uid() and f.addressee_id = p.user_id) or
                  (f.addressee_id = auth.uid() and f.requester_id = p.user_id)
                )
            )
          )
        )
    )
  );

create policy "workouts writable by plan owner"
  on public.training_plan_workouts for all using (
    exists (
      select 1 from public.training_plans p
      where p.id = plan_id and p.user_id = auth.uid()
    )
  );

-- run invites: visible to host + friends
create policy "invites visible to host and friends"
  on public.run_invites for select using (
    auth.uid() = host_user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = host_user_id) or
          (f.addressee_id = auth.uid() and f.requester_id = host_user_id)
        )
    )
  );

create policy "invites writable by host"
  on public.run_invites for all using (auth.uid() = host_user_id);

create policy "invite responses visible to invited parties"
  on public.run_invite_responses for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.run_invites i
      where i.id = invite_id and i.host_user_id = auth.uid()
    )
  );

create policy "invite responses writable by user"
  on public.run_invite_responses for all using (auth.uid() = user_id);

-- clubs: public read, admin write
create policy "clubs readable by all" on public.run_clubs for select using (true);

create policy "clubs editable by admins"
  on public.run_clubs for update using (
    exists (
      select 1 from public.run_club_members m
      where m.club_id = id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'organizer')
        and m.status = 'active'
    )
  );

create policy "club members readable by all"
  on public.run_club_members for select using (true);

create policy "club membership managed by self or admin"
  on public.run_club_members for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.run_club_members m
      where m.club_id = run_club_members.club_id
        and m.user_id = auth.uid()
        and m.role = 'admin'
        and m.status = 'active'
    )
  );

create policy "club events readable by all"
  on public.run_club_events for select using (true);

create policy "club events writable by admins/organizers"
  on public.run_club_events for all using (
    exists (
      select 1 from public.run_club_members m
      where m.club_id = run_club_events.club_id
        and m.user_id = auth.uid()
        and m.role in ('admin', 'organizer')
        and m.status = 'active'
    )
  );

create policy "event rsvps readable by all"
  on public.run_club_event_rsvps for select using (true);

create policy "event rsvps writable by self"
  on public.run_club_event_rsvps for all using (auth.uid() = user_id);

-- ai coaching: private to owner
create policy "ai threads private to user"
  on public.ai_coaching_threads for all using (auth.uid() = user_id);

-- activity feed: friends of author can read
create policy "activity feed readable by friends"
  on public.activity_feed for select using (
    auth.uid() = user_id
    or exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and (
          (f.requester_id = auth.uid() and f.addressee_id = user_id) or
          (f.addressee_id = auth.uid() and f.requester_id = user_id)
        )
    )
  );

create policy "activity feed writable by author"
  on public.activity_feed for insert with check (auth.uid() = user_id);

-- routes: self always, public routes readable by all
create policy "routes readable by owner or public"
  on public.generated_routes for select
  using (auth.uid() = user_id or is_public = true);

create policy "routes writable by owner"
  on public.generated_routes for all using (auth.uid() = user_id);

create policy "route ratings readable by all"
  on public.route_ratings for select using (true);

create policy "route ratings writable by self"
  on public.route_ratings for all using (auth.uid() = user_id);
