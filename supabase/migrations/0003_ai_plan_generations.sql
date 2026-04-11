-- AI plan generation rate-limit log.
--
-- Each row is one attempt to generate a plan via Claude, whether or
-- not the user ultimately accepted it. We enforce a free-tier limit
-- of 3 generations per 24-hour rolling window to keep Anthropic API
-- costs predictable.
--
-- Premium users (Phase 6) bypass this by skipping the rate-limit
-- check in the server action.

create type ai_plan_generation_status as enum ('success', 'failed', 'accepted');

create table public.ai_plan_generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status ai_plan_generation_status not null default 'success',
  methodology text,
  goal_race text,
  total_weeks integer,
  plan_id uuid references public.training_plans(id) on delete set null,
  error_message text,
  created_at timestamptz default timezone('utc', now())
);

create index ai_plan_generations_user_created_idx
  on public.ai_plan_generations (user_id, created_at desc);

alter table public.ai_plan_generations enable row level security;

create policy "ai plan generations visible to self"
  on public.ai_plan_generations for select using (auth.uid() = user_id);

create policy "ai plan generations writable by self"
  on public.ai_plan_generations for insert with check (auth.uid() = user_id);
