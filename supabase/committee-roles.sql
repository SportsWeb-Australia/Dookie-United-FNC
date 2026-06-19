-- ============================================================================
-- Committee roles + display names for club admins.
-- Additive and idempotent — safe to run on the sportsweb-one project anytime.
--
-- A "committee role" (President, Treasurer, Secretary, …) is the person's
-- position on the club committee. It is separate from their ACCESS role
-- (club_admin / club_senior_admin), which stays platform/senior-controlled.
-- ============================================================================

alter table public.user_club_roles add column if not exists display_name    text;
alter table public.user_club_roles add column if not exists committee_title text;
alter table public.club_users      add column if not exists display_name    text;
alter table public.club_users      add column if not exists committee_title text;

-- Let a signed-in user set THEIR OWN name + committee title for a club they
-- belong to — without being able to change their access role. SECURITY DEFINER
-- so it bypasses the role-restricted RLS write policies, but it only ever
-- touches the caller's own row (auth.uid()) and only the two safe columns.
create or replace function public.set_my_committee_profile(
  p_club uuid,
  p_display_name text,
  p_title text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_club_roles
     set display_name    = nullif(trim(p_display_name), ''),
         committee_title = nullif(trim(p_title), '')
   where user_id = auth.uid() and club_id = p_club;

  update public.club_users
     set display_name    = nullif(trim(p_display_name), ''),
         committee_title = nullif(trim(p_title), '')
   where user_id = auth.uid() and club_id = p_club;
end;
$$;

grant execute on function public.set_my_committee_profile(uuid, text, text) to authenticated;

-- ----------------------------------------------------------------------------
-- OPTIONAL: assign a committee title (and/or promote to the club's senior /
-- "Exec Admin" role) directly, until the admin "assign to people" screen ships.
-- Uncomment and edit the email + club slug, then run.
-- ----------------------------------------------------------------------------
-- update public.user_club_roles
--    set committee_title = 'President',
--        display_name    = 'Carson'
--  where user_id = (select id from auth.users where email = 'you@example.com')
--    and club_id = (select id from public.clubs where slug = 'dookie-united');

-- Promote the club's signup administrator to senior (can assign others' titles):
-- update public.user_club_roles
--    set role = 'club_senior_admin'
--  where user_id = (select id from auth.users where email = 'you@example.com')
--    and club_id = (select id from public.clubs where slug = 'dookie-united');
