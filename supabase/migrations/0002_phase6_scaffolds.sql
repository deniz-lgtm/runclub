-- Phase 6 scaffolds — future / premium features.
-- These tables are created empty; the UI pages reference them but
-- don't read or write meaningful data yet. When the features ship,
-- the columns here give us a head start.

-- ────────────────────────────────────────────────────────────────────────────
-- sponsored_content
-- Used by the Brand Partnerships feature: sponsored events, shoe brand
-- challenges, race promotions in the feed + a "Featured" section.
-- ────────────────────────────────────────────────────────────────────────────
create type sponsored_content_type as enum (
  'event', 'challenge', 'race_promo', 'product_drop'
);

create type sponsored_placement as enum (
  'feed_featured', 'clubs_featured', 'races_featured'
);

create table public.sponsored_content (
  id uuid primary key default uuid_generate_v4(),
  brand_name text not null,
  brand_logo_url text,
  title text not null,
  description text,
  cta_label text,
  cta_url text,
  hero_image_url text,
  content_type sponsored_content_type not null,
  placement sponsored_placement not null default 'feed_featured',
  target_cities text[] default '{}',
  starts_at timestamptz not null,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger sponsored_content_updated_at before update
  on public.sponsored_content
  for each row execute function public.set_updated_at();

create index sponsored_content_active_idx
  on public.sponsored_content (placement, is_active)
  where is_active = true;

alter table public.sponsored_content enable row level security;

-- Public read, admin write (no admin role yet — write policy is stubbed closed).
create policy "sponsored content visible to all"
  on public.sponsored_content for select using (true);

-- ────────────────────────────────────────────────────────────────────────────
-- races
-- Searchable database of upcoming races with direct signup links.
-- ────────────────────────────────────────────────────────────────────────────
create type race_distance as enum (
  '5k', '10k', 'half_marathon', 'marathon', 'ultra', 'other'
);

create table public.races (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  race_date date not null,
  distance race_distance not null,
  city text,
  state text,
  country text default 'USA',
  latitude double precision,
  longitude double precision,
  signup_url text,
  description text,
  logo_url text,
  is_sponsored boolean default false,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create trigger races_updated_at before update
  on public.races
  for each row execute function public.set_updated_at();

create index races_date_idx on public.races (race_date);
create index races_city_idx on public.races (city);

alter table public.races enable row level security;

create policy "races visible to all"
  on public.races for select using (true);

-- ────────────────────────────────────────────────────────────────────────────
-- Future: premium_subscriptions, coach_athlete_assignments, etc.
-- Scaffolded here when we ship Phase 6 for real.
-- ────────────────────────────────────────────────────────────────────────────
