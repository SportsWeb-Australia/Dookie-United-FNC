-- SportsWeb One — per-club module entitlement
-- Run once in the Supabase SQL editor. Safe to re-run.

create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

create table if not exists public.club_modules (
  club_id       uuid not null references public.clubs(id) on delete cascade,
  module_key    text not null,                 -- matches keys in src/lib/modules.ts
  status        text not null default 'enabled', -- 'enabled' | 'trial' | 'locked'
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now(),
  primary key (club_id, module_key)
);

alter table public.club_modules enable row level security;

drop policy if exists club_modules_public_read on public.club_modules;
create policy club_modules_public_read on public.club_modules
  for select using (true);

drop policy if exists club_modules_member_write on public.club_modules;
create policy club_modules_member_write on public.club_modules
  for all
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

-- Example: enable the Learn module for a club (replace the UUID):
-- insert into public.club_modules (club_id, module_key, status)
-- values ('<your-club-id>', 'learn', 'enabled')
-- on conflict (club_id, module_key) do update set status = excluded.status;
