-- SportsWeb One — RLS policies for club self-serve content editing.
-- Run in the Supabase SQL editor. Adjust table/column names if yours differ.
--
-- Model: a signed-in user may read/write rows for the club(s) they belong to,
-- via club_users(user_id, club_id, role). The public site reads published rows
-- anonymously. The service-role key bypasses RLS (used by SportsWeb One backend).

-- Helper: clubs the current auth user belongs to.
create or replace function public.my_club_ids()
returns setof uuid
language sql stable security definer set search_path = public as $$
  select club_id from club_users where user_id = auth.uid()
$$;

-- Apply the same pattern to: news, events, sponsors, teams.
-- Example shown for "news"; repeat for the others.

alter table public.news enable row level security;

-- Public can read published content (anon key).
drop policy if exists news_public_read on public.news;
create policy news_public_read on public.news
  for select using (status = 'published');

-- Club members can read all their club's rows (incl. drafts).
drop policy if exists news_member_read on public.news;
create policy news_member_read on public.news
  for select to authenticated
  using (club_id in (select public.my_club_ids()));

-- Club members can insert/update/delete their own club's rows.
drop policy if exists news_member_write on public.news;
create policy news_member_write on public.news
  for all to authenticated
  using (club_id in (select public.my_club_ids()))
  with check (club_id in (select public.my_club_ids()));

-- Repeat the three policies above for events, sponsors, teams,
-- changing the table name each time. Also ensure club_users itself is
-- readable by the signed-in user for their own membership:

alter table public.club_users enable row level security;
drop policy if exists club_users_self_read on public.club_users;
create policy club_users_self_read on public.club_users
  for select to authenticated
  using (user_id = auth.uid());
