-- ============================================================================
-- SportsWeb One — Member detail & edit (Phase 1b)
--
-- Adds profile fields (photo, address, member-since) and two RPCs:
--   • get_member_detail(club, person)  — full profile + roles + family, plus
--     sensitive blocks (compliance, registrations) ONLY for admins/committee.
--   • update_member_profile(club, person, patch) — admin-gated edit.
--
-- SAFETY: additive + idempotent. Adds nullable columns and functions only.
-- Member photos reuse the existing public 'club-media' bucket at
--   {club_id}/members/{person_id}.<ext>
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Profile fields on people
-- ----------------------------------------------------------------------------
alter table public.people add column if not exists avatar_url   text;
alter table public.people add column if not exists address      text;
alter table public.people add column if not exists suburb       text;
alter table public.people add column if not exists state        text;
alter table public.people add column if not exists postcode     text;
alter table public.people add column if not exists member_since date;


-- ----------------------------------------------------------------------------
-- 2. get_member_detail — one call returns everything the profile screen needs.
--    Sensitive blocks (compliance, registrations/financial) are returned only
--    to admins/committee; everyone else gets null for those keys.
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
               pr.start_date, pr.end_date,
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


-- ----------------------------------------------------------------------------
-- 3. update_member_profile — admin-gated patch of the editable core fields.
--    Patch is jsonb; only keys present are touched (full_name/status never
--    blanked). Roles, relationships, compliance are managed separately.
-- ----------------------------------------------------------------------------
create or replace function public.update_member_profile(
  p_club   uuid,
  p_person uuid,
  p_patch  jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_platform_admin()
          or public.club_role(p_club) in ('club_senior_admin', 'club_admin')) then
    raise exception 'not authorised to edit members for this club';
  end if;

  update public.people p set
    full_name       = coalesce(nullif(trim(p_patch->>'full_name'), ''), p.full_name),
    email           = case when p_patch ? 'email'           then nullif(trim(p_patch->>'email'), '')           else p.email end,
    mobile          = case when p_patch ? 'mobile'          then nullif(trim(p_patch->>'mobile'), '')          else p.mobile end,
    date_of_birth   = case when p_patch ? 'date_of_birth'   then nullif(p_patch->>'date_of_birth', '')::date    else p.date_of_birth end,
    status          = coalesce(nullif(trim(p_patch->>'status'), ''), p.status),
    address         = case when p_patch ? 'address'         then nullif(trim(p_patch->>'address'), '')         else p.address end,
    suburb          = case when p_patch ? 'suburb'          then nullif(trim(p_patch->>'suburb'), '')          else p.suburb end,
    state           = case when p_patch ? 'state'           then nullif(trim(p_patch->>'state'), '')           else p.state end,
    postcode        = case when p_patch ? 'postcode'        then nullif(trim(p_patch->>'postcode'), '')        else p.postcode end,
    member_since    = case when p_patch ? 'member_since'    then nullif(p_patch->>'member_since', '')::date     else p.member_since end,
    emergency_name  = case when p_patch ? 'emergency_name'  then nullif(trim(p_patch->>'emergency_name'), '')  else p.emergency_name end,
    emergency_phone = case when p_patch ? 'emergency_phone' then nullif(trim(p_patch->>'emergency_phone'), '') else p.emergency_phone end,
    notes           = case when p_patch ? 'notes'           then nullif(trim(p_patch->>'notes'), '')           else p.notes end,
    avatar_url      = case when p_patch ? 'avatar_url'      then nullif(trim(p_patch->>'avatar_url'), '')      else p.avatar_url end,
    updated_at      = now()
  where p.id = p_person and p.club_id = p_club;
end;
$$;

grant execute on function public.update_member_profile(uuid, uuid, jsonb) to authenticated;

-- ============================================================================
-- End of Member detail & edit (Phase 1b).
-- ============================================================================
