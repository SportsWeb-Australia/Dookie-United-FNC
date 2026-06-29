-- SportsWeb One -- Needs Analysis Wizard: per-club needs record (Pass 1, table only).
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Prerequisites already in the database: public.is_platform_admin(), the clubs(id)
-- table, and club_users(user_id, club_id). public.my_club_ids() is re-declared
-- below to match the existing club-content.sql / club-modules.sql migrations.

create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

create table if not exists public.club_needs (
  id                  uuid primary key default gen_random_uuid(),
  club_id             uuid not null unique references public.clubs(id) on delete cascade,
  status              text not null default 'draft'
                        check (status in ('draft', 'complete')),
  filled_by           text
                        check (filled_by is null or filled_by in ('club', 'admin')),
  recommended_variant text,                                -- design steer result; Site Build reads this
  modules_interest    text[],                              -- module keys of interest (interest only, NOT entitlement)
  answers             jsonb not null default '{}'::jsonb,  -- all six sections' answers + free-text design note
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  completed_at        timestamptz                          -- set when status flips to 'complete'
);

-- updated_at: the repo has no generic updated_at trigger -- tables maintain it in
-- the writing code (e.g. people-role-edit.sql uses `set updated_at = now()`).
-- The Needs wizard will follow that same convention on write, so no trigger here.

alter table public.club_needs enable row level security;

grant select, insert, update, delete on public.club_needs to authenticated;

-- Platform admins reach every club's row; club users reach only their own club's
-- row (membership via club_users -> my_club_ids()). Not publicly readable (unlike
-- club_content / club_modules), since this is internal club data.
drop policy if exists club_needs_rw on public.club_needs;
create policy club_needs_rw on public.club_needs
  for all
  using      (public.is_platform_admin() or club_id in (select public.my_club_ids()))
  with check (public.is_platform_admin() or club_id in (select public.my_club_ids()));
