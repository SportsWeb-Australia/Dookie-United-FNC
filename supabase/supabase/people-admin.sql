-- ============================================================================
-- People & committee admin.
-- Lets a club's senior ("Exec") admin or a SportsWeb (platform) admin see the
-- club's people and assign each person a display name + committee title.
-- Additive + idempotent. Run after committee-roles.sql.
--
-- Both functions are SECURITY DEFINER and do their OWN authorisation check, so
-- they bypass row-level policies safely while never leaking other clubs' data.
-- Neither can change a person's ACCESS role — only their name + committee title.
-- ============================================================================

-- True if the caller may manage people for this club.
create or replace function public.can_manage_club_people(p_club uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin() or public.club_role(p_club) = 'club_senior_admin';
$$;

grant execute on function public.can_manage_club_people(uuid) to authenticated;

-- List a club's admin people (deduped across the legacy + new RBAC tables),
-- with their email, access role, and committee profile.
create or replace function public.list_club_people(p_club uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  display_name text,
  committee_title text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club_people(p_club) then
    return; -- not authorised → empty result
  end if;

  return query
  with merged as (
    select ucr.user_id,
           ucr.role::text as role,
           ucr.display_name,
           ucr.committee_title,
           2 as pref
      from public.user_club_roles ucr
     where ucr.club_id = p_club
    union all
    select cu.user_id,
           case cu.role::text when 'super_admin' then 'club_senior_admin' else 'club_admin' end as role,
           cu.display_name,
           cu.committee_title,
           1 as pref
      from public.club_users cu
     where cu.club_id = p_club
  ),
  best as (
    select distinct on (m.user_id)
           m.user_id, m.role, m.display_name, m.committee_title
      from merged m
     order by m.user_id, m.pref desc
  )
  select b.user_id, u.email::text, b.role, b.display_name, b.committee_title
    from best b
    join auth.users u on u.id = b.user_id
   order by u.email;
end;
$$;

grant execute on function public.list_club_people(uuid) to authenticated;

-- Assign a person's display name + committee title (name + title only).
create or replace function public.set_member_committee(
  p_user uuid,
  p_club uuid,
  p_display_name text,
  p_title text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club_people(p_club) then
    raise exception 'not authorised to manage people for this club';
  end if;

  update public.user_club_roles
     set display_name    = nullif(trim(p_display_name), ''),
         committee_title = nullif(trim(p_title), '')
   where user_id = p_user and club_id = p_club;

  update public.club_users
     set display_name    = nullif(trim(p_display_name), ''),
         committee_title = nullif(trim(p_title), '')
   where user_id = p_user and club_id = p_club;
end;
$$;

grant execute on function public.set_member_committee(uuid, uuid, text, text) to authenticated;
