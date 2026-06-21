-- ============================================================================
-- Committee member invites.
-- Lets a club's senior ("Exec") admin invite a new committee member by email
-- and assign their access role + committee title up front. If the email already
-- belongs to a SportsWeb user, access is granted immediately; otherwise a
-- pending invite is stored and claimed automatically the first time that person
-- logs in with the invited email.
--
-- Additive + idempotent. Run after people-admin.sql.
-- All functions are SECURITY DEFINER and do their own authorisation check.
-- ============================================================================

create table if not exists public.club_member_invites (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id) on delete cascade,
  email           text not null,
  role            text not null default 'club_admin' check (role in ('club_senior_admin', 'club_admin')),
  display_name    text,
  committee_title text,
  invited_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  claimed_at      timestamptz
);

-- One live (unclaimed) invite per email per club.
create unique index if not exists club_member_invites_unique_pending
  on public.club_member_invites (club_id, lower(email))
  where claimed_at is null;

alter table public.club_member_invites enable row level security;
-- No permissive policies: the SECURITY DEFINER functions below are the only path.

-- Invite (or directly grant, if the user already exists) a committee member.
create or replace function public.invite_club_member(
  p_club  uuid,
  p_email text,
  p_name  text,
  p_role  text,
  p_title text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_role  text := case when p_role = 'club_senior_admin' then 'club_senior_admin' else 'club_admin' end;
  v_uid   uuid;
begin
  if not public.can_manage_club_people(p_club) then
    raise exception 'not authorised to manage people for this club';
  end if;
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'a valid email is required';
  end if;

  select id into v_uid from auth.users where lower(email) = v_email limit 1;

  if v_uid is not null then
    -- User already exists → grant access straight away.
    insert into public.user_club_roles (user_id, club_id, role, display_name, committee_title)
    values (v_uid, p_club, v_role, nullif(trim(p_name), ''), nullif(trim(p_title), ''))
    on conflict (user_id, club_id) do update
      set role            = excluded.role,
          display_name    = coalesce(excluded.display_name, public.user_club_roles.display_name),
          committee_title = coalesce(excluded.committee_title, public.user_club_roles.committee_title);
    return 'granted';
  end if;

  -- Otherwise store a pending invite (refresh it if one already exists).
  insert into public.club_member_invites (club_id, email, role, display_name, committee_title, invited_by)
  values (p_club, v_email, v_role, nullif(trim(p_name), ''), nullif(trim(p_title), ''), auth.uid())
  on conflict (club_id, lower(email)) where claimed_at is null do update
    set role            = excluded.role,
        display_name    = excluded.display_name,
        committee_title = excluded.committee_title,
        invited_by      = excluded.invited_by,
        created_at      = now();
  return 'invited';
end;
$$;

grant execute on function public.invite_club_member(uuid, text, text, text, text) to authenticated;

-- List a club's pending (unclaimed) invites.
create or replace function public.list_club_invites(p_club uuid)
returns table (id uuid, email text, role text, display_name text, committee_title text, created_at timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club_people(p_club) then
    return;
  end if;
  return query
    select i.id, i.email, i.role, i.display_name, i.committee_title, i.created_at
      from public.club_member_invites i
     where i.club_id = p_club and i.claimed_at is null
     order by i.created_at desc;
end;
$$;

grant execute on function public.list_club_invites(uuid) to authenticated;

-- Cancel a pending invite.
create or replace function public.cancel_club_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club uuid;
begin
  select club_id into v_club from public.club_member_invites where id = p_id;
  if v_club is null then
    return;
  end if;
  if not public.can_manage_club_people(v_club) then
    raise exception 'not authorised';
  end if;
  delete from public.club_member_invites where id = p_id and claimed_at is null;
end;
$$;

grant execute on function public.cancel_club_invite(uuid) to authenticated;

-- Claim any invites addressed to the caller's email (run on login). Grants the
-- access role + committee title from each matching pending invite.
create or replace function public.claim_member_invites()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text;
  v_count int := 0;
  r       record;
begin
  if v_uid is null then
    return 0;
  end if;
  select lower(email) into v_email from auth.users where id = v_uid;
  if v_email is null then
    return 0;
  end if;

  for r in
    select * from public.club_member_invites
     where claimed_at is null and lower(email) = v_email
  loop
    insert into public.user_club_roles (user_id, club_id, role, display_name, committee_title)
    values (v_uid, r.club_id, r.role, r.display_name, r.committee_title)
    on conflict (user_id, club_id) do update
      set role            = excluded.role,
          display_name    = coalesce(excluded.display_name, public.user_club_roles.display_name),
          committee_title = coalesce(excluded.committee_title, public.user_club_roles.committee_title);

    update public.club_member_invites set claimed_at = now() where id = r.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.claim_member_invites() to authenticated;
