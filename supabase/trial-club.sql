-- ============================================================
-- SportsWeb One - Trial club engine (Phase 1)
-- Creates a trial club + full starter content + assigned template,
-- callable publicly (self-serve signup) and by the team.
-- Pure ASCII. Safe to re-run (CREATE OR REPLACE).
-- ============================================================

-- 1) Trial metadata on clubs (no-op if already present) ------
alter table public.clubs add column if not exists is_trial        boolean      not null default false;
alter table public.clubs add column if not exists trial_started_at timestamptz;
alter table public.clubs add column if not exists trial_ends_at    timestamptz;

-- 2) The engine ----------------------------------------------
create or replace function public.create_trial_club(
  p_name      text,
  p_sport     text default 'afl',
  p_variant   text default 'leaguefooty',
  p_email     text default null,
  p_primary   text default '#1F2A44',
  p_secondary text default '#C8102E'
) returns json
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_club  uuid;
  v_base  text;
  v_slug  text;
  v_n     int := 1;
  v_sport sport_type;
begin
  -- Minimal validation (public endpoint).
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'A club name is required';
  end if;
  if length(p_name) > 80 then
    raise exception 'That club name is too long';
  end if;
  if p_email is null or position('@' in p_email) = 0 or position('.' in p_email) = 0 then
    raise exception 'A valid email is required';
  end if;

  -- Sport must be a real enum value; fall back to other if unknown.
  begin
    v_sport := p_sport::sport_type;
  exception when others then
    v_sport := 'other'::sport_type;
  end;

  -- Unique slug from the club name.
  v_base := regexp_replace(lower(trim(p_name)), '[^a-z0-9]+', '-', 'g');
  v_base := trim(both '-' from v_base);
  if v_base = '' then v_base := 'club'; end if;
  v_slug := v_base;
  while exists (select 1 from public.clubs where slug = v_slug) loop
    v_n := v_n + 1;
    v_slug := v_base || '-' || v_n;
  end loop;

  -- Create the club, flagged as a 7-day trial.
  insert into public.clubs (name, slug, sport_type, primary_colour, secondary_colour, contact_email,
                            is_trial, trial_started_at, trial_ends_at)
  values (trim(p_name), v_slug, v_sport, coalesce(p_primary,'#1F2A44'), coalesce(p_secondary,'#C8102E'),
          nullif(trim(coalesce(p_email,'')),''),
          true, now(), now() + interval '7 days')
  returning id into v_club;

  -- Assigned template variant (read by loadClub via club_content).
  insert into public.club_content (club_id, content_key, value)
  values (v_club, 'site.variant', coalesce(nullif(trim(p_variant),''),'leaguefooty'))
  on conflict (club_id, content_key) do update set value = excluded.value;

  -- Volunteer Manager on trial, consistent with admin_create_club.
  insert into public.club_modules (club_id, module_key, status)
  values (v_club, 'volunteers', 'trial')
  on conflict (club_id, module_key) do update set status = excluded.status;

  -- ---- Full starter content so the trial site looks alive ----
  insert into public.news (club_id, status, title, slug, author, summary, content, published_at) values
    (v_club,'published', trim(p_name) || ' open the season with a win', 'season-opener', 'Match Committee',
     'A strong all-round effort got the new season off to a flying start.',
     '<p>A strong all-round effort got the new season off to a flying start.</p>', now() - interval '2 days'),
    (v_club,'published', 'Registrations now open for the new season', 'rego-open', 'Club',
     'Sign-on is live for players of all ages - new faces always welcome.',
     '<p>Sign-on is live for players of all ages - new faces always welcome.</p>', now() - interval '6 days'),
    (v_club,'published', 'Our volunteers and sponsors power the club', 'volunteers-sponsors', 'Club',
     'A big thank you to everyone who makes match day happen.',
     '<p>A big thank you to everyone who makes match day happen.</p>', now() - interval '10 days');

  insert into public.events (club_id, status, title, slug, event_date, location, description, featured) values
    (v_club,'published', 'Season Launch Night', 'season-launch', now() + interval '9 days',
     trim(p_name) || ' Clubrooms', 'Join us to kick off the year with the whole club.', true),
    (v_club,'published', 'Family Fun Day', 'family-fun-day', now() + interval '23 days',
     'Club Grounds', 'A relaxed day for players, families and supporters.', false);

  insert into public.sponsors (club_id, status, name, sponsor_level, blurb, display_order, in_carousel) values
    (v_club,'published', 'Local Motors', 'platinum', 'Proud major partner of the club.', 1, true),
    (v_club,'published', 'The Corner Cafe', 'gold', 'Fuelling the team all season long.', 2, true);

  insert into public.teams (club_id, status, name, slug, age_group, gender, grade, display_order) values
    (v_club,'published', 'Seniors',  v_slug || '-seniors',  'Open', 'Men',   'Seniors',  1),
    (v_club,'published', 'Reserves', v_slug || '-reserves', 'Open', 'Men',   'Reserves', 2),
    (v_club,'published', 'Womens',   v_slug || '-womens',   'Open', 'Women', 'Womens',   3),
    (v_club,'published', 'Juniors',  v_slug || '-juniors',  'U16',  'Mixed', 'Juniors',  4);

  insert into public.matches (club_id, status, grade, round, match_date, opponent, home_away, our_score, opponent_score) values
    (v_club,'completed','Seniors','Round 1', now() - interval '2 days','Westvale Hawks','Home',88,72),
    (v_club,'scheduled','Seniors','Round 2', now() + interval '5 days','Riverbend Saints','Away',null,null),
    (v_club,'scheduled','Seniors','Round 3', now() + interval '12 days','Hillcrest Tigers','Home',null,null),
    (v_club,'scheduled','Seniors','Round 4', now() + interval '19 days','Eastlake Crows','Away',null,null);

  insert into public.ladder (club_id, grade, position, team, played, won, lost, drawn, points, percentage, is_own) values
    (v_club,'Seniors',1, trim(p_name),         1,1,0,0,4,1.40,true),
    (v_club,'Seniors',2,'Westvale Hawks',      1,1,0,0,4,1.22,false),
    (v_club,'Seniors',3,'Riverbend Saints',    1,1,0,0,4,1.10,false),
    (v_club,'Seniors',4,'Hillcrest Tigers',    1,0,1,0,0,0.85,false),
    (v_club,'Seniors',5,'Eastlake Crows',      1,0,1,0,0,0.70,false);

  return json_build_object('club_id', v_club, 'slug', v_slug, 'variant',
                           coalesce(nullif(trim(p_variant),''),'leaguefooty'));
end
$fn$;

-- 3) Allow the public signup page and signed-in team to call it
grant execute on function public.create_trial_club(text, text, text, text, text, text) to anon;
grant execute on function public.create_trial_club(text, text, text, text, text, text) to authenticated;

-- 4) Refresh PostgREST schema cache
notify pgrst, 'reload schema';
