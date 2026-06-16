-- SportsWeb One — RUN THIS ONE FILE in the Supabase SQL editor.
-- It applies every migration the current admin needs, and is safe to re-run.
-- Project must be the one the site connects to (VITE_SUPABASE_URL).

-- ============================================================
-- 1. Helper used by all the policies below
-- ============================================================
create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

-- ============================================================
-- 2. Bucket-1 content fields (news / events / sponsors / teams)
-- ============================================================
alter table public.news add column if not exists author    text;
alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists video_url text;
alter table public.events add column if not exists featured    boolean default false;
alter table public.events add column if not exists tag         text;
alter table public.events add column if not exists tickets_url text;
alter table public.events add column if not exists map_url     text;
alter table public.events add column if not exists image_url   text;
alter table public.events add column if not exists video_url   text;
alter table public.sponsors add column if not exists logo_url    text;
alter table public.sponsors add column if not exists blurb       text;
alter table public.sponsors add column if not exists in_carousel boolean default true;
alter table public.teams add column if not exists image_url text;
alter table public.teams add column if not exists video_url text;

-- ============================================================
-- 3. Match data (fixtures/results + ladder) tables & RLS
-- ============================================================
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

-- ============================================================
-- 4. Storage bucket for uploads (logos, images, video)
-- ============================================================
-- Public bucket: anyone can read (it serves the public website), only club
-- members can write into their own club's folder.
insert into storage.buckets (id, name, public)
values ('club-media', 'club-media', true)
on conflict (id) do update set public = true;

-- READ: public
drop policy if exists "club-media read" on storage.objects;
create policy "club-media read" on storage.objects
  for select using (bucket_id = 'club-media');

-- WRITE (insert/update/delete): members only, and only inside their club folder.
-- Path convention: {club_id}/{folder}/{file}. The first path segment must be a
-- club the signed-in user belongs to.
drop policy if exists "club-media member insert" on storage.objects;
create policy "club-media member insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "club-media member update" on storage.objects;
create policy "club-media member update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "club-media member delete" on storage.objects;
create policy "club-media member delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );

-- ============================================================
-- 5. Per-club module entitlement
-- ============================================================
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

-- ============================================================
-- 6. Inline page-content overrides (live-site text + image edits)
-- ============================================================
create table if not exists public.club_content (
  club_id     uuid not null references public.clubs(id) on delete cascade,
  content_key text not null,
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

-- ============================================================
-- 7. Communications — sent-message history
-- ============================================================
create table if not exists public.club_messages (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  channels        text[] not null default '{}',
  subject         text,
  body            text not null,
  audience        text,
  recipient_count int not null default 0,
  status          text not null default 'sent',
  created_by      uuid default auth.uid(),
  created_at      timestamptz not null default now()
);

alter table public.club_messages enable row level security;

drop policy if exists club_messages_member_read on public.club_messages;
create policy club_messages_member_read on public.club_messages
  for select using (club_id in (select public.my_club_ids()));

drop policy if exists club_messages_member_write on public.club_messages;
create policy club_messages_member_write on public.club_messages
  for all
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

-- ============================================================
-- 8. Platform (super) admin — the SportsWeb operator layer
-- ============================================================
-- Global operators who can manage every club. This is separate from
-- club_users.role: a club_admin runs one club; a platform admin runs the platform.
create table if not exists public.platform_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

drop policy if exists platform_admins_self_read on public.platform_admins;
create policy platform_admins_self_read on public.platform_admins
  for select using (user_id = auth.uid());

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid())
$$;

-- Cross-club operations. SECURITY DEFINER so they can see every club, but each
-- one refuses unless the caller is a platform admin.
create or replace function public.admin_list_clubs()
returns table (id uuid, name text, slug text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'not authorised'; end if;
  return query select c.id, c.name, c.slug from public.clubs c order by c.name;
end $$;

create or replace function public.admin_list_modules()
returns table (club_id uuid, module_key text, status text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'not authorised'; end if;
  return query select m.club_id, m.module_key, m.status from public.club_modules m;
end $$;

create or replace function public.admin_set_module(p_club uuid, p_key text, p_status text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then raise exception 'not authorised'; end if;
  insert into public.club_modules (club_id, module_key, status)
  values (p_club, p_key, p_status)
  on conflict (club_id, module_key) do update set status = excluded.status;
end $$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.admin_list_clubs() to authenticated;
grant execute on function public.admin_list_modules() to authenticated;
grant execute on function public.admin_set_module(uuid, text, text) to authenticated;

-- >>> RUN ONCE to make yourself the platform admin. <<<
-- The account must already exist in Supabase Auth (create it first — see notes).
-- insert into public.platform_admins (user_id)
-- select id from auth.users where email = 'info@sportsweb.com.au'
-- on conflict do nothing;

-- ============================================================
-- 9. Tell PostgREST to refresh its schema cache
-- ============================================================
notify pgrst, 'reload schema';
