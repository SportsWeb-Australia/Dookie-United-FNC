-- SportsWeb One — Match data (fixtures, results, ladder)
-- Run once in the Supabase SQL editor (project: sportsweb-one).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY IF EXISTS.

-- Helper: club ids the signed-in user can manage (via club_users).
-- SECURITY DEFINER so it can read club_users without recursive RLS.
create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- matches: one row per fixture (scheduled) or result (completed)
-- ---------------------------------------------------------------------------
create table if not exists public.matches (
  id             uuid primary key default gen_random_uuid(),
  club_id        uuid not null references public.clubs(id) on delete cascade,
  grade          text not null default 'Seniors',
  round          text,
  match_date     timestamptz,
  opponent       text not null,
  opponent_logo  text,
  home_away      text default 'Home',         -- 'Home' | 'Away'
  our_score      integer,
  opponent_score integer,
  status         text not null default 'scheduled', -- 'scheduled' | 'completed'
  created_at     timestamptz not null default now()
);
create index if not exists matches_club_idx on public.matches (club_id, match_date);

-- ---------------------------------------------------------------------------
-- ladder: one row per team within a grade
-- ---------------------------------------------------------------------------
create table if not exists public.ladder (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  grade       text not null default 'Seniors',
  position    integer,
  team        text not null,
  logo        text,
  played      integer default 0,
  won         integer default 0,
  lost        integer default 0,
  drawn       integer default 0,
  points      integer default 0,
  percentage  numeric default 0,
  is_own      boolean default false,
  created_at  timestamptz not null default now()
);
create index if not exists ladder_club_idx on public.ladder (club_id, grade, position);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   read:  anyone (public site shows fixtures/results/ladder)
--   write: members of the owning club only
-- ---------------------------------------------------------------------------
alter table public.matches enable row level security;
alter table public.ladder  enable row level security;

drop policy if exists matches_public_read on public.matches;
create policy matches_public_read on public.matches
  for select using (true);

drop policy if exists matches_member_write on public.matches;
create policy matches_member_write on public.matches
  for all
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

drop policy if exists ladder_public_read on public.ladder;
create policy ladder_public_read on public.ladder
  for select using (true);

drop policy if exists ladder_member_write on public.ladder;
create policy ladder_member_write on public.ladder
  for all
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));
