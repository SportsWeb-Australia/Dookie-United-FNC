-- SportsWeb One -- club_content write policy: add the platform-admin arm.
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Why: club_content previously had only a member-write policy
-- (club_id in my_club_ids()), with no is_platform_admin() arm -- so a platform
-- admin acting on a club they are not a member of could not save site content
-- ("new row violates row-level security policy for table club_content"). This
-- brings club_content into line with the rest of SW1's club-scoped tables
-- (club_needs, compliance_records, people_*): platform admins OR club members
-- may write. Public read is unchanged.
--
-- Prerequisite helpers already in the database: public.is_platform_admin(),
-- public.my_club_ids(). Supersedes the club_content_member_write policy defined
-- in supabase/club-content.sql.

drop policy if exists club_content_member_write on public.club_content;
create policy club_content_member_write on public.club_content
  for all
  using      (public.is_platform_admin() or club_id in (select public.my_club_ids()))
  with check (public.is_platform_admin() or club_id in (select public.my_club_ids()));
