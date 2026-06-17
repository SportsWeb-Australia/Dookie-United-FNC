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
-- 9. Role hierarchy (RBAC foundation)
-- ============================================================
-- Two scopes:
--   platform_user_roles : superadmin, sportsweb_admin   (global, no club)
--   user_club_roles     : club_senior_admin, club_admin  (one role per club)
-- A user may appear in user_club_roles for many clubs, with a different role
-- in each. Platform roles are separate from club roles by design.

create table if not exists public.platform_user_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('superadmin', 'sportsweb_admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.user_club_roles (
  user_id    uuid not null references auth.users(id) on delete cascade,
  club_id    uuid not null references public.clubs(id) on delete cascade,
  role       text not null check (role in ('club_senior_admin', 'club_admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, club_id)
);

-- Migrate what already exists into the new model (safe to re-run):
--  platform_admins        -> superadmin
--  club_users.super_admin -> club_senior_admin (senior of that club, NOT platform)
--  club_users.club_admin  -> club_admin
insert into public.platform_user_roles (user_id, role)
  select user_id, 'superadmin' from public.platform_admins
  on conflict (user_id, role) do nothing;

insert into public.user_club_roles (user_id, club_id, role)
  select user_id, club_id,
         case role::text when 'super_admin' then 'club_senior_admin' else 'club_admin' end
  from public.club_users
  on conflict (user_id, club_id) do nothing;

-- Safeguard: the final Superadmin can never be removed or demoted.
create or replace function public.protect_last_superadmin()
returns trigger language plpgsql security definer set search_path = public as $$
declare others int;
begin
  if tg_op = 'DELETE' and old.role = 'superadmin' then
    select count(*) into others from public.platform_user_roles
      where role = 'superadmin' and user_id <> old.user_id;
    if others = 0 then raise exception 'Cannot remove the final Superadmin.'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.role = 'superadmin' and new.role <> 'superadmin' then
    select count(*) into others from public.platform_user_roles
      where role = 'superadmin' and user_id <> old.user_id;
    if others = 0 then raise exception 'Cannot demote the final Superadmin.'; end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_protect_last_superadmin on public.platform_user_roles;
create trigger trg_protect_last_superadmin
  before update or delete on public.platform_user_roles
  for each row execute function public.protect_last_superadmin();

-- Role-check helpers (SECURITY DEFINER so they bypass RLS cleanly).
create or replace function public.my_platform_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.platform_user_roles
  where user_id = auth.uid()
  order by case role when 'superadmin' then 1 else 2 end
  limit 1
$$;

create or replace function public.is_superadmin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_user_roles
                 where user_id = auth.uid() and role = 'superadmin')
$$;

-- A platform admin is the SportsWeb operator layer: superadmin OR sportsweb_admin.
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_user_roles where user_id = auth.uid())
$$;

create or replace function public.club_role(p_club uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.user_club_roles where user_id = auth.uid() and club_id = p_club limit 1
$$;

-- Widen club membership to include the new table. This is a UNION, so it can
-- only ADD access, never remove it — existing club access is unaffected.
create or replace function public.my_club_ids()
returns setof uuid language sql security definer set search_path = public as $$
  select club_id from public.club_users where user_id = auth.uid()
  union
  select club_id from public.user_club_roles where user_id = auth.uid()
$$;

alter table public.platform_user_roles enable row level security;
alter table public.user_club_roles enable row level security;

drop policy if exists pur_read on public.platform_user_roles;
create policy pur_read on public.platform_user_roles
  for select using (user_id = auth.uid() or public.is_superadmin());

drop policy if exists pur_write on public.platform_user_roles;
create policy pur_write on public.platform_user_roles
  for all using (public.is_superadmin()) with check (public.is_superadmin());

drop policy if exists ucr_read on public.user_club_roles;
create policy ucr_read on public.user_club_roles
  for select using (
    user_id = auth.uid()
    or public.is_platform_admin()
    or club_id in (select public.my_club_ids())
  );

drop policy if exists ucr_write on public.user_club_roles;
create policy ucr_write on public.user_club_roles
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

grant execute on function public.my_platform_role() to authenticated;
grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.club_role(uuid) to authenticated;

-- >>> Optional: add a SportsWeb Admin (staff/contractor) later. <<<
-- insert into public.platform_user_roles (user_id, role)
-- select id, 'sportsweb_admin' from auth.users where email = 'staff@sportsweb.com.au'
-- on conflict do nothing;

-- ============================================================
-- ============================================================
-- 10. RBAC enforcement (database-level, not just UI)
-- ============================================================
-- Senior-vs-operational helper. True for platform admins, the club's senior
-- admin (new model), or a legacy club_users 'super_admin' for that club.
create or replace function public.is_club_senior(p_club uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin()
    or exists (select 1 from public.user_club_roles
               where user_id = auth.uid() and club_id = p_club and role = 'club_senior_admin')
    or exists (select 1 from public.club_users
               where user_id = auth.uid() and club_id = p_club and role::text = 'super_admin')
$$;
grant execute on function public.is_club_senior(uuid) to authenticated;

-- Module entitlement is a paid/commercial surface: only the platform may change
-- it. (Operational and senior club admins can no longer write club_modules
-- directly — closing the hole where any member could grant their own modules.)
drop policy if exists club_modules_member_write on public.club_modules;
drop policy if exists club_modules_platform_write on public.club_modules;
create policy club_modules_platform_write on public.club_modules
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Role assignment within a club: a Club Senior Admin may manage only the
-- operational (club_admin) rows of their own club — never create or remove
-- another senior (that stays with the platform). Platform writes already
-- covered by ucr_write above.
drop policy if exists ucr_senior_write on public.user_club_roles;
create policy ucr_senior_write on public.user_club_roles
  for all to authenticated
  using (public.is_club_senior(club_id) and role = 'club_admin')
  with check (public.is_club_senior(club_id) and role = 'club_admin');

-- ------------------------------------------------------------
-- OPTIONAL — lock club settings/branding to senior admins.
-- The clubs table predates this migration, so its existing write policy isn't
-- managed here. To see what's currently allowed, run:
--     select polname, polcmd from pg_policy
--     where polrelid = 'public.clubs'::regclass;
-- If you see a broad "members can write" style policy, drop it by name, then
-- enable the senior-only policy below:
--
-- drop policy if exists clubs_senior_write on public.clubs;
-- create policy clubs_senior_write on public.clubs
--   for update to authenticated
--   using (public.is_club_senior(id))
--   with check (public.is_club_senior(id));
-- ------------------------------------------------------------

-- ============================================================
-- 11. Tell PostgREST to refresh its schema cache
-- ============================================================
notify pgrst, 'reload schema';
