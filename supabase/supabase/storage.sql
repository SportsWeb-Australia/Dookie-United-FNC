-- SportsWeb One — Storage bucket for club media (logos, images, video)
-- Run once in the Supabase SQL editor (project: sportsweb-one).
-- Safe to re-run.

-- Helper (also created by match-data.sql / admin-policies.sql). Repeated here
-- so this file is standalone.
create or replace function public.my_club_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select club_id from public.club_users where user_id = auth.uid()
$$;

-- Public bucket: anyone can read (it serves the public website), only club
-- members can write into their own club's folder.
insert into storage.buckets (id, name, public)
values ('club-media', 'club-media', true)
on conflict (id) do update set public = true;

-- READ: public
drop policy if exists "club-media read" on storage.objects;
create policy "club-media read" on storage.objects
  for select using (bucket_id = 'club-media');

-- WRITE (insert/update/delete): members only, and only inside their club folder.
-- Path convention: {club_id}/{folder}/{file}. The first path segment must be a
-- club the signed-in user belongs to.
drop policy if exists "club-media member insert" on storage.objects;
create policy "club-media member insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "club-media member update" on storage.objects;
create policy "club-media member update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );

drop policy if exists "club-media member delete" on storage.objects;
create policy "club-media member delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-media'
    and exists (
      select 1 from public.my_club_ids() cid
      where cid::text = (storage.foldername(name))[1]
    )
  );
