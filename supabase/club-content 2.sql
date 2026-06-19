-- SportsWeb One — inline page-content overrides (text + images)
-- Run once in the Supabase SQL editor. Safe to re-run.

create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

create table if not exists public.club_content (
  club_id     uuid not null references public.clubs(id) on delete cascade,
  content_key text not null,          -- e.g. 'hero.title', 'president.portrait'
  value       text,
  updated_at  timestamptz not null default now(),
  primary key (club_id, content_key)
);

alter table public.club_content enable row level security;

drop policy if exists club_content_public_read on public.club_content;
create policy club_content_public_read on public.club_content
  for select using (true);

drop policy if exists club_content_member_write on public.club_content;
create policy club_content_member_write on public.club_content
  for all
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));
