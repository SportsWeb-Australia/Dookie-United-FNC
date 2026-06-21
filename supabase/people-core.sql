-- ============================================================================
-- SportsWeb One — People-Core foundation (Phase 1)
--
-- Turns the flat `people.roles` array into a proper, time-bounded, relational
-- model and adds the family + compliance scaffolding the club-operating-system
-- model needs — WITHOUT disturbing anything that already exists.
--
-- SAFETY: This script is ADDITIVE and IDEMPOTENT.
--   • It only CREATEs new tables/columns/functions and BACKFILLS data.
--   • It does NOT drop `people.roles` (that happens later, once the UI reads
--     person_roles instead — a deliberate, separate step).
--   • It does NOT change RLS on any existing table.
--   • Re-running it is safe.
--
-- Run AFTER: committee-roles.sql (provides my_club_ids(), club_role(),
--            is_platform_admin()).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Sport dimension (Dookie is Football & Netball; model must be per-sport)
--    Free text for now ('football' | 'netball' | ...). A per-sport on/off
--    registry can come later; this column is all we need to tag by sport.
-- ----------------------------------------------------------------------------
alter table public.seasons add column if not exists sport text;
alter table public.teams   add column if not exists sport text;


-- ----------------------------------------------------------------------------
-- 2. person_roles — the relational replacement for people.roles[]
--    One row per role a person holds, optionally bound to a sport, team and
--    season, with start/end dates and status so history is preserved.
-- ----------------------------------------------------------------------------
create table if not exists public.person_roles (
  id              uuid primary key default gen_random_uuid(),
  club_id         uuid not null references public.clubs(id)  on delete cascade,
  person_id       uuid not null references public.people(id) on delete cascade,
  role            text not null,            -- player, past_player, parent, guardian,
                                            -- coach, assistant_coach, team_manager,
                                            -- volunteer, committee, sponsor_contact,
                                            -- official, trainer, life_member, administrator
  sport           text,                     -- football / netball / null = all
  team_id         uuid references public.teams(id)   on delete set null,
  season_id       uuid references public.seasons(id) on delete set null,
  committee_title text,                     -- when role = 'committee' (President, Treasurer...)
  start_date      date,
  end_date        date,
  status          text not null default 'active',  -- active / inactive / ended
  notes           text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists person_roles_person_idx on public.person_roles (person_id);
create index if not exists person_roles_club_idx   on public.person_roles (club_id, role);
create index if not exists person_roles_team_idx   on public.person_roles (team_id)   where team_id   is not null;
create index if not exists person_roles_season_idx on public.person_roles (season_id) where season_id is not null;

-- Backfill from the existing flat array (idempotent: only inserts what's missing).
-- These come across as plain active roles with no team/season — history can be
-- enriched later; nothing is lost.
insert into public.person_roles (club_id, person_id, role, status, created_at)
select p.club_id, p.id, r.role, 'active', now()
  from public.people p
  cross join lateral unnest(coalesce(p.roles, '{}')) as r(role)
 where r.role is not null and length(trim(r.role)) > 0
   and not exists (
     select 1 from public.person_roles pr
      where pr.person_id = p.id
        and pr.role      = r.role
        and pr.team_id   is null
        and pr.season_id is null
   );


-- ----------------------------------------------------------------------------
-- 3. person_relationships — family / guardian / emergency links
--    person_id is the "owner" of the link (e.g. the parent), related_person_id
--    is the other party (e.g. the child). Both are real people records.
-- ----------------------------------------------------------------------------
create table if not exists public.person_relationships (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references public.clubs(id)  on delete cascade,
  person_id         uuid not null references public.people(id) on delete cascade,
  related_person_id uuid not null references public.people(id) on delete cascade,
  relationship      text not null,   -- parent_of, guardian_of, child_of, sibling_of,
                                      -- partner_of, emergency_contact_for
  notes             text,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  unique (person_id, related_person_id, relationship),
  check (person_id <> related_person_id)
);

create index if not exists person_rel_person_idx  on public.person_relationships (person_id);
create index if not exists person_rel_related_idx on public.person_relationships (related_person_id);


-- ----------------------------------------------------------------------------
-- 4. compliance_records — person-level, generalised compliance
--    Generalises volunteer_compliance_records (which is volunteer-only) so
--    coaches, trainers, committee and players can all carry WWCC / RSA /
--    first-aid / accreditation records against their person profile.
--    (The existing volunteer_compliance_records table is left untouched.)
-- ----------------------------------------------------------------------------
create table if not exists public.compliance_records (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id)  on delete cascade,
  person_id    uuid not null references public.people(id) on delete cascade,
  check_type   text not null,        -- wwcc, rsa, first_aid, coach_accreditation,
                                      -- trainer_accreditation, police_check, other
  reference_no text,
  document_id  uuid,
  issued_on    date,
  expires_on   date,
  verified_by  uuid,
  verified_at  timestamptz,
  status       text not null default 'pending',  -- pending / valid / expiring / expired / rejected
  notes        text,
  created_by   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists compliance_person_idx on public.compliance_records (person_id);
create index if not exists compliance_expiry_idx on public.compliance_records (club_id, expires_on);


-- ----------------------------------------------------------------------------
-- 5. Row Level Security
--    • person_roles / person_relationships: any member of the owning club
--      (matches your existing club-scoped pattern).
--    • compliance_records: SENSITIVE — admins/committee of the club only.
--      (Coach-scoped read of their own team's records will be added when team
--       membership is wired in a later phase.)
-- ----------------------------------------------------------------------------
alter table public.person_roles         enable row level security;
alter table public.person_relationships enable row level security;
alter table public.compliance_records   enable row level security;

grant select, insert, update, delete on public.person_roles         to authenticated;
grant select, insert, update, delete on public.person_relationships to authenticated;
grant select, insert, update, delete on public.compliance_records   to authenticated;

drop policy if exists person_roles_member_rw on public.person_roles;
create policy person_roles_member_rw on public.person_roles
  for all
  using      (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

drop policy if exists person_rel_member_rw on public.person_relationships;
create policy person_rel_member_rw on public.person_relationships
  for all
  using      (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

drop policy if exists compliance_admin_rw on public.compliance_records;
create policy compliance_admin_rw on public.compliance_records
  for all
  using      (public.is_platform_admin() or public.club_role(club_id) in ('club_senior_admin','club_admin'))
  with check (public.is_platform_admin() or public.club_role(club_id) in ('club_senior_admin','club_admin'));


-- ----------------------------------------------------------------------------
-- 6. list_club_members(p_club) — the clean members list (Phase 1 outcome)
--    One row per person with their derived roles, teams, minor flag and most
--    recent payment status. Gated to club committee/admin (or platform admin).
-- ----------------------------------------------------------------------------
create or replace function public.list_club_members(p_club uuid)
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
    p.id,
    p.full_name,
    p.first_name,
    p.last_name,
    p.email,
    p.mobile,
    p.status,
    p.date_of_birth,
    (p.date_of_birth is not null and age(p.date_of_birth) < interval '18 years') as is_minor,
    coalesce(array(
      select distinct pr.role
        from public.person_roles pr
       where pr.person_id = p.id and pr.status = 'active'
       order by pr.role
    ), '{}') as roles,
    coalesce(array(
      select distinct t.name
        from public.person_roles pr
        join public.teams t on t.id = pr.team_id
       where pr.person_id = p.id and pr.status = 'active' and pr.team_id is not null
       order by t.name
    ), '{}') as teams,
    (
      select r.payment_status
        from public.registrations r
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
-- End of People-Core foundation (Phase 1).
-- Next (separate, sequenced steps — NOT in this file):
--   • Wire the Members screen to list_club_members + person_roles.
--   • Migrate every code path that reads people.roles → person_roles.
--   • Only then: drop people.roles.
--   • Identity unification + role-scoped RLS on existing tables.
-- ============================================================================
