-- =====================================================================
-- Two-factor authentication: hashed backup codes
-- TOTP enrolment/verification itself is handled by Supabase Auth (no schema
-- needed). This adds recovery backup codes: we store only SHA-256 hashes, never
-- the codes themselves. Safe / additive. Run in the Supabase SQL Editor.
-- =====================================================================

create table if not exists public.mfa_backup_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  code_hash text not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mfa_backup_codes_user_idx on public.mfa_backup_codes(user_id);

alter table public.mfa_backup_codes enable row level security;

-- A user can see only their own codes (hashes only — never the plaintext).
drop policy if exists "own backup codes" on public.mfa_backup_codes;
create policy "own backup codes" on public.mfa_backup_codes
  for select using (user_id = auth.uid());

grant select on public.mfa_backup_codes to authenticated;

-- Replace the current user's backup codes with a fresh hashed set.
create or replace function public.mfa_store_backup_codes(p_hashes text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from public.mfa_backup_codes where user_id = auth.uid();
  insert into public.mfa_backup_codes (user_id, code_hash)
  select auth.uid(), h from unnest(p_hashes) as h where coalesce(h, '') <> '';
end;
$$;
grant execute on function public.mfa_store_backup_codes(text[]) to authenticated;

-- How many unused backup codes the current user has left.
create or replace function public.mfa_backup_codes_remaining()
returns int
language sql
security definer
set search_path = public
as $$
  select count(*)::int
    from public.mfa_backup_codes
   where user_id = auth.uid() and used_at is null;
$$;
grant execute on function public.mfa_backup_codes_remaining() to authenticated;

-- Consume a backup code during account recovery. Runs as the service role from
-- the mfa-recovery Edge Function (never called from the browser). Returns the
-- matching user's id if a valid, unused code is found, and marks it used.
create or replace function public.mfa_recovery_consume(p_email text, p_code_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_code uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then
    return null;
  end if;

  select id into v_code
    from public.mfa_backup_codes
   where user_id = v_user and code_hash = p_code_hash and used_at is null
   limit 1;
  if v_code is null then
    return null;
  end if;

  update public.mfa_backup_codes set used_at = now() where id = v_code;
  return v_user;
end;
$$;
-- Not granted to anon/authenticated on purpose — service role only.
revoke all on function public.mfa_recovery_consume(text, text) from anon, authenticated;
