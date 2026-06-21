-- ============================================================================
-- SportsWeb One — Edit a role (Phase 1d)
-- Adds update_person_role so existing roles can be edited (not just added/ended).
-- SAFETY: additive + idempotent. One new function.
-- ============================================================================

create or replace function public.update_person_role(
  p_role_id         uuid,
  p_role            text,
  p_sport           text,
  p_team_id         uuid,
  p_season_id       uuid,
  p_committee_title text,
  p_start_date      date,
  p_status          text
)
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
    raise exception 'not authorised to manage roles for this club';
  end if;

  update public.person_roles set
    role            = coalesce(nullif(trim(p_role), ''), role),
    sport           = nullif(trim(p_sport), ''),
    team_id         = p_team_id,
    season_id       = p_season_id,
    committee_title = nullif(trim(p_committee_title), ''),
    start_date      = p_start_date,
    status          = coalesce(nullif(trim(p_status), ''), status),
    updated_at      = now()
  where id = p_role_id;
end;
$$;

grant execute on function public.update_person_role(uuid, text, text, uuid, uuid, text, date, text) to authenticated;

-- ----------------------------------------------------------------------------
-- Refresh get_member_detail so role rows also carry team_id / season_id
-- (needed to pre-fill the Edit-role form). Re-runnable.
-- ----------------------------------------------------------------------------
create or replace function public.get_member_detail(p_club uuid, p_person uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_admin  boolean;
  v_result json;
begin
  if not (public.is_platform_admin() or public.club_role(p_club) is not null) then
    raise exception 'not authorised to view this member';
  end if;

  v_admin := public.is_platform_admin()
             or public.club_role(p_club) in ('club_senior_admin', 'club_admin');

  select json_build_object(
    'profile', (
      select to_json(x) from (
        select p.id, p.full_name, p.first_name, p.last_name, p.email, p.mobile,
               p.date_of_birth, p.status, p.avatar_url, p.address, p.suburb,
               p.state, p.postcode, p.member_since, p.emergency_name,
               p.emergency_phone, p.notes, p.created_at,
               (p.date_of_birth is not null
                 and age(p.date_of_birth) < interval '18 years') as is_minor
          from public.people p
         where p.id = p_person and p.club_id = p_club
      ) x
    ),
    'roles', coalesce((
      select json_agg(r) from (
        select pr.id, pr.role, pr.sport, pr.committee_title, pr.status,
               pr.start_date, pr.end_date, pr.team_id, pr.season_id,
               t.name as team_name, s.name as season_name
          from public.person_roles pr
          left join public.teams   t on t.id = pr.team_id
          left join public.seasons s on s.id = pr.season_id
         where pr.person_id = p_person and pr.club_id = p_club
         order by pr.status, pr.role
      ) r
    ), '[]'::json),
    'relationships', coalesce((
      select json_agg(rel) from (
        select prl.id, prl.relationship,
               rp.id as related_id, rp.full_name as related_name,
               (rp.date_of_birth is not null
                 and age(rp.date_of_birth) < interval '18 years') as related_is_minor
          from public.person_relationships prl
          join public.people rp on rp.id = prl.related_person_id
         where prl.person_id = p_person and prl.club_id = p_club
         order by prl.relationship
      ) rel
    ), '[]'::json),
    'compliance', case when v_admin then coalesce((
      select json_agg(c) from (
        select cr.id, cr.check_type, cr.reference_no, cr.issued_on,
               cr.expires_on, cr.status
          from public.compliance_records cr
         where cr.person_id = p_person and cr.club_id = p_club
         order by cr.expires_on nulls last
      ) c
    ), '[]'::json) else null end,
    'registrations', case when v_admin then coalesce((
      select json_agg(reg) from (
        select rg.id, rg.membership_label, rg.status, rg.payment_status,
               rg.amount_cents, rg.amount_paid_cents, rg.registered_at,
               se.name as season_name
          from public.registrations rg
          left join public.seasons se on se.id = rg.season_id
         where rg.person_id = p_person and rg.club_id = p_club
         order by rg.registered_at desc nulls last
      ) reg
    ), '[]'::json) else null end,
    'can_edit',            v_admin,
    'can_view_sensitive',  v_admin
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.get_member_detail(uuid, uuid) to authenticated;
