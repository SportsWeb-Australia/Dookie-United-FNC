-- ============================================================================
-- SportsWeb One — Add member, role management & sport segmentation (Phase 1c)
--
-- • add_club_member            — create a person (admin-gated)
-- • add_person_role / end_person_role / delete_person_role — manage roles
-- • list_club_teams / list_club_seasons — dropdown helpers
-- • list_club_members          — recreated to also return sports[] (for the
--                                segmented counts: netballers, junior netballers…)
--
-- SAFETY: additive + idempotent. Only the list_club_members signature changes
--         (a new `sports` column is appended), so it is dropped + recreated.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add a member
-- ----------------------------------------------------------------------------
create or replace function public.add_club_member(p_club uuid, p_profile jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.is_platform_admin()
          or public.club_role(p_club) in ('club_senior_admin', 'club_admin')) then
    raise exception 'not authorised to add members for this club';
  end if;

  if coalesce(nullif(trim(p_profile->>'full_name'), ''), '') = '' then
    raise exception 'a member name is required';
  end if;

  insert into public.people (
    club_id, full_name, first_name, last_name, email, mobile,
    date_of_birth, status, member_since, created_by, created_at, updated_at
  ) values (
    p_club,
    trim(p_profile->>'full_name'),
    nullif(trim(p_profile->>'first_name'), ''),
    nullif(trim(p_profile->>'last_name'), ''),
    nullif(trim(p_profile->>'email'), ''),
    nullif(trim(p_profile->>'mobile'), ''),
    nullif(p_profile->>'date_of_birth', '')::date,
    coalesce(nullif(trim(p_profile->>'status'), ''), 'active'),
    nullif(p_profile->>'member_since', '')::date,
    auth.uid(), now(), now()
  ) returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.add_club_member(uuid, jsonb) to authenticated;


-- ----------------------------------------------------------------------------
-- 2. Role management
-- ----------------------------------------------------------------------------
create or replace function public.add_person_role(
  p_club uuid, p_person uuid, p_role text, p_sport text,
  p_team_id uuid, p_season_id uuid, p_committee_title text, p_start_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not (public.is_platform_admin()
          or public.club_role(p_club) in ('club_senior_admin', 'club_admin')) then
    raise exception 'not authorised to manage roles for this club';
  end if;
  if coalesce(nullif(trim(p_role), ''), '') = '' then
    raise exception 'a role is required';
  end if;

  insert into public.person_roles (
    club_id, person_id, role, sport, team_id, season_id,
    committee_title, start_date, status, created_by
  ) values (
    p_club, p_person, trim(p_role), nullif(trim(p_sport), ''),
    p_team_id, p_season_id, nullif(trim(p_committee_title), ''),
    p_start_date, 'active', auth.uid()
  ) returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.add_person_role(uuid, uuid, text, text, uuid, uuid, text, date) to authenticated;


create or replace function public.end_person_role(p_role_id uuid, p_end_date date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club uuid;
begin
  select club_id into v_club from public.person_roles where id = p_role_id;
  if v_club is null then raise exception 'role not found'; end if;
  if not (public.is_platform_admin()
          or public.club_role(v_club) in ('club_senior_admin', 'club_admin')) then
    raise exception 'not authorised';
  end if;

  update public.person_roles
     set status = 'ended', end_date = coalesce(p_end_date, current_date), updated_at = now()
   where id = p_role_id;
end;
$$;
grant execute on function public.end_person_role(uuid, date) to authenticated;


create or replace function public.delete_person_role(p_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club uuid;
begin
  select club_id into v_club from public.person_roles where id = p_role_id;
  if v_club is null then return; end if;
  if not (public.is_platform_admin()
          or public.club_role(v_club) in ('club_senior_admin', 'club_admin')) then
    raise exception 'not authorised';
  end if;

  delete from public.person_roles where id = p_role_id;
end;
$$;
grant execute on function public.delete_person_role(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- 3. Dropdown helpers for the role form
-- ----------------------------------------------------------------------------
create or replace function public.list_club_teams(p_club uuid)
returns table (id uuid, name text, sport text, age_group text, gender text)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.name, t.sport, t.age_group, t.gender
    from public.teams t
   where t.club_id = p_club
     and (public.is_platform_admin() or p_club in (select public.my_club_ids()))
   order by t.display_order nulls last, t.name;
$$;
grant execute on function public.list_club_teams(uuid) to authenticated;

create or replace function public.list_club_seasons(p_club uuid)
returns table (id uuid, name text, sport text, is_current boolean)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.sport, s.is_current
    from public.seasons s
   where s.club_id = p_club
     and (public.is_platform_admin() or p_club in (select public.my_club_ids()))
   order by s.is_current desc, s.start_date desc nulls last;
$$;
grant execute on function public.list_club_seasons(uuid) to authenticated;


-- ----------------------------------------------------------------------------
-- 4. list_club_members — recreated to also return sports[]
-- ----------------------------------------------------------------------------
drop function if exists public.list_club_members(uuid);

create function public.list_club_members(p_club uuid)
returns table (
  person_id              uuid,
  full_name              text,
  first_name             text,
  last_name              text,
  email                  text,
  mobile                 text,
  status                 text,
  date_of_birth          date,
  is_minor               boolean,
  roles                  text[],
  teams                  text[],
  sports                 text[],
  current_payment_status text,
  created_at             timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_platform_admin() or public.club_role(p_club) is not null) then
    raise exception 'not authorised to view members for this club';
  end if;

  return query
  select
    p.id, p.full_name, p.first_name, p.last_name, p.email, p.mobile, p.status,
    p.date_of_birth,
    (p.date_of_birth is not null and age(p.date_of_birth) < interval '18 years') as is_minor,
    coalesce(array(
      select distinct pr.role from public.person_roles pr
       where pr.person_id = p.id and pr.status = 'active' order by pr.role
    ), '{}') as roles,
    coalesce(array(
      select distinct t.name from public.person_roles pr
        join public.teams t on t.id = pr.team_id
       where pr.person_id = p.id and pr.status = 'active' and pr.team_id is not null
       order by t.name
    ), '{}') as teams,
    coalesce(array(
      select distinct pr.sport from public.person_roles pr
       where pr.person_id = p.id and pr.status = 'active' and pr.sport is not null
       order by pr.sport
    ), '{}') as sports,
    (
      select r.payment_status from public.registrations r
       where r.person_id = p.id
       order by r.registered_at desc nulls last, r.created_at desc
       limit 1
    ) as current_payment_status,
    p.created_at
  from public.people p
  where p.club_id = p_club
  order by p.full_name nulls last;
end;
$$;
grant execute on function public.list_club_members(uuid) to authenticated;

-- ============================================================================
-- End of Phase 1c.
-- ============================================================================
