# MFA recovery Edge Functions — deploy runbook

Two-factor (TOTP) enrolment, the login challenge, and backup-code generation all
work **without** these functions — they're handled in the app + Supabase Auth.

These two functions add the **recovery** paths and are deploy-gated (they need the
service role, so only you can deploy them from the Supabase dashboard):

| Function | What it does | Who calls it |
|---|---|---|
| `mfa-admin-reset` | A senior/platform admin clears another user's 2FA (lost phone) | Admin, from the app |
| `mfa-recovery` | A locked-out user clears their own 2FA with a backup code | Login screen |

## Prerequisites

1. Run `supabase/mfa.sql` in the SQL Editor (creates `mfa_backup_codes`, the
   store/remaining RPCs, and `mfa_recovery_consume`).
2. Confirm 2FA works on your own account first (enrol in Account → Security,
   sign out, sign back in, complete the code challenge).

## Deploy

In the Supabase dashboard → **Edge Functions** → **Deploy a new function**, create
each function and paste the matching `index.ts`:

- `mfa-admin-reset` → `supabase/functions/mfa-admin-reset/index.ts`
- `mfa-recovery` → `supabase/functions/mfa-recovery/index.ts`

Each function automatically has `SUPABASE_URL`, `SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY` available — no extra secrets needed.

## Test

- **Admin reset:** as a platform/senior admin, POST `{ "targetUserId": "...", "clubId": "..." }`.
  Expect `{ ok: true, removed: N }`. The target can then log in with their password.
- **Self-service:** POST `{ "email": "you@club.com.au", "code": "XXXX-XXXX" }` with a
  real backup code. Expect `{ ok: true }`; the code is then marked used.

## Make 2FA mandatory (after testing)

In `src/admin/MfaGate.tsx`, set `HARD_ENFORCE_SETUP = true`. Admins without 2FA
will then be required to set it up before reaching the dashboard (the per-session
code challenge is already enforced for anyone who has 2FA on).

## Safety notes

- The app never sees the service role; it lives only in these functions.
- Backup codes are stored as SHA-256 hashes — the plaintext is shown once at
  generation and never stored.
- `mfa_recovery_consume` is service-role only (revoked from anon/authenticated).
