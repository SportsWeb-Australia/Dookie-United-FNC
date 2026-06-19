-- ============================================================
-- SportsWeb One - Trial nurture: email log + daily schedule
-- Pairs with the trial-nurture Edge Function. Pure ASCII, safe to re-run.
-- ============================================================

-- 1) Records which journey emails each trial club has been sent, so the
--    scheduler never sends the same stage twice. Written by the Edge Function
--    using the service role (which bypasses RLS).
create table if not exists public.trial_email_log (
  club_id uuid not null references public.clubs(id) on delete cascade,
  stage   text not null,
  sent_at timestamptz not null default now(),
  primary key (club_id, stage)
);
alter table public.trial_email_log enable row level security;
-- No policies: only the service role (Edge Function) reads/writes this table.

-- 2) Extensions used to call the Edge Function on a schedule.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 3) Schedule the nurture run.
-- EDIT the two placeholders below, then run this block:
--   <PROJECT_REF>  -> uzibfawcwoapfbigpzum
--   <ANON_OR_SERVICE_KEY> -> your project anon key (Project Settings > API)
-- Runs every 4 hours so the welcome email goes out promptly after signup.
-- Re-running unschedule first keeps it idempotent.
select cron.unschedule('trial-nurture') where exists (
  select 1 from cron.job where jobname = 'trial-nurture'
);
select cron.schedule(
  'trial-nurture',
  '0 */4 * * *',
  $cron$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/trial-nurture',
    headers := jsonb_build_object(
                 'Content-Type','application/json',
                 'Authorization','Bearer <ANON_OR_SERVICE_KEY>'
               ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- To stop the journey later:  select cron.unschedule('trial-nurture');
