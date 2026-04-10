-- Friends Who Run — Dev seed data
-- Seeds four fixture users (Sarah, Marcus, Amy, Deanna) with plans,
-- workouts, clubs, and route data so the app feels alive in development.
--
-- NOTE: Seeding into auth.users requires running this as service role in
-- a local Supabase instance. In production, these rows would come from
-- the normal sign-up flow.

-- ────────────────────────────────────────────────────────────────────────────
-- Fixture user UUIDs
-- ────────────────────────────────────────────────────────────────────────────
-- Sarah K.  : 11111111-1111-1111-1111-111111111111
-- Marcus J. : 22222222-2222-2222-2222-222222222222
-- Coach Amy : 33333333-3333-3333-3333-333333333333
-- Deanna    : 44444444-4444-4444-4444-444444444444

-- Create auth.users rows (service-role only).
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
values
  ('11111111-1111-1111-1111-111111111111', 'sarah@example.com', '', now(), '{}'),
  ('22222222-2222-2222-2222-222222222222', 'marcus@example.com', '', now(), '{}'),
  ('33333333-3333-3333-3333-333333333333', 'amy@example.com',    '', now(), '{}'),
  ('44444444-4444-4444-4444-444444444444', 'deanna@example.com', '', now(), '{}')
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- profiles
-- ────────────────────────────────────────────────────────────────────────────
insert into public.profiles (
  id, username, display_name, bio, city, state,
  preferred_distance, weekly_mileage_goal, current_shoe, is_coach
) values
  (
    '11111111-1111-1111-1111-111111111111',
    'sarahk', 'Sarah K.',
    'Chicago Marathon 2026. 3:45 or bust. Early morning miles > everything.',
    'Los Angeles', 'CA', 'marathon', 45, 'Saucony Endorphin Speed 4', false
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'marcusj', 'Marcus J.',
    'Running for the donut after. Always down for an easy social run.',
    'Los Angeles', 'CA', '10k', 18, 'Hoka Clifton 9', false
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'coachamy', 'Coach Amy',
    'USATF-certified coach. I build plans that build runners, not break them.',
    'Los Angeles', 'CA', 'marathon', 55, 'Nike Pegasus 41', true
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'deanna', 'Deanna',
    'Making running social, one group run at a time. LA Marathon 2027. ✨',
    'Los Angeles', 'CA', 'marathon', 35, 'On Cloudmonster', false
  )
on conflict (id) do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- friendships (all four are friends with each other)
-- ────────────────────────────────────────────────────────────────────────────
insert into public.friendships (requester_id, addressee_id, status) values
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'accepted'),
  ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'accepted'),
  ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'accepted'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted'),
  ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'accepted')
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────────────────
-- run_clubs
-- ────────────────────────────────────────────────────────────────────────────
insert into public.run_clubs (id, name, slug, description, city, state, is_verified, membership_type) values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'Friends Who Run',
    'friends-who-run',
    'The flagship FWR club. Weekly social runs, all paces welcome.',
    'Los Angeles', 'CA', true, 'open'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'Downtown LA Run Collective',
    'dtla-run-collective',
    'DTLA''s tightest-knit run club. Tuesday tempos, Saturday long runs.',
    'Los Angeles', 'CA', true, 'open'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'Griffith Park Runners',
    'griffith-park-runners',
    'Trails, hills, and the observatory at sunrise.',
    'Los Angeles', 'CA', false, 'open'
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000004',
    'Westside Track Club',
    'westside-track',
    'Track Tuesdays at Santa Monica HS. Bring your spikes.',
    'Santa Monica', 'CA', true, 'request_to_join'
  )
on conflict (id) do nothing;

insert into public.run_club_members (club_id, user_id, role, status) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 'admin', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'member', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'member', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'member', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'member', 'active'),
  ('aaaaaaaa-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333333', 'admin',  'active')
on conflict do nothing;
