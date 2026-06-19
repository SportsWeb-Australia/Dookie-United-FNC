-- SportsWeb One — Bucket 1 content fields
-- Adds the richer admin fields for news, events, sponsors, teams.
-- Run once in the Supabase SQL editor (project: sportsweb-one). Safe to re-run.

-- News: byline + media
alter table public.news add column if not exists author    text;
alter table public.news add column if not exists image_url text;
alter table public.news add column if not exists video_url text;

-- Events: highlight, tag, tickets, map, media
alter table public.events add column if not exists featured    boolean default false;
alter table public.events add column if not exists tag         text;
alter table public.events add column if not exists tickets_url text;
alter table public.events add column if not exists map_url     text;
alter table public.events add column if not exists image_url   text;
alter table public.events add column if not exists video_url   text;

-- Sponsors: hi-res logo, blurb, carousel toggle (display_order already = priority)
alter table public.sponsors add column if not exists logo_url    text;
alter table public.sponsors add column if not exists blurb       text;
alter table public.sponsors add column if not exists in_carousel boolean default true;

-- Teams: media
alter table public.teams add column if not exists image_url text;
alter table public.teams add column if not exists video_url text;
