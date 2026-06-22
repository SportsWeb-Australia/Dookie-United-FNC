/**
 * Two-factor authentication (TOTP) helpers, wrapping Supabase Auth MFA plus
 * hashed backup codes. Everything here fails SAFE: if the MFA API is missing or
 * a status check errors, we report "not enrolled / no challenge needed" rather
 * than risk locking anyone out. Enforcement decisions live in MfaGate.
 */
import { supabase } from "./supabase";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mfa = () => (supabase as any)?.auth?.mfa ?? null;

export interface MfaStatus {
  available: boolean; // is the MFA API present at all
  enrolled: boolean; // has a verified TOTP factor
  factorId: string | null;
  aalCurrent: string | null; // 'aal1' | 'aal2'
  aalNext: string | null;
  needsChallenge: boolean; // verified factor exists but this session is only aal1
}

const EMPTY: MfaStatus = {
  available: false,
  enrolled: false,
  factorId: null,
  aalCurrent: null,
  aalNext: null,
  needsChallenge: false,
};

export async function getMfaStatus(): Promise<MfaStatus> {
  const api = mfa();
  if (!api) return EMPTY;
  try {
    const [factorsRes, aalRes] = await Promise.all([
      api.listFactors(),
      api.getAuthenticatorAssuranceLevel(),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totp = ((factorsRes?.data?.totp ?? []) as any[]).filter((f) => f.status === "verified");
    const factorId = totp[0]?.id ?? null;
    const aalCurrent = aalRes?.data?.currentLevel ?? null;
    const aalNext = aalRes?.data?.nextLevel ?? null;
    return {
      available: true,
      enrolled: !!factorId,
      factorId,
      aalCurrent,
      aalNext,
      needsChallenge: !!factorId && aalNext === "aal2" && aalCurrent === "aal1",
    };
  } catch {
    return EMPTY; // fail-safe
  }
}

export interface EnrollResult {
  factorId: string;
  qrCode: string; // SVG markup or data URI
  secret: string;
  uri: string;
}

export async function enrollTotp(): Promise<{ data?: EnrollResult; error?: string }> {
  const api = mfa();
  if (!api) return { error: "Two-factor isn't available on this connection." };
  try {
    // Clear any half-finished (unverified) factors first so re-enrolling is clean.
    try {
      const list = await api.listFactors();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stale = ((list?.data?.all ?? list?.data?.totp ?? []) as any[]).filter(
        (f) => f.status === "unverified",
      );
      for (const f of stale) {
        try {
          await api.unenroll({ factorId: f.id });
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    const { data, error } = await api.enroll({
      factorType: "totp",
      friendlyName: `SportsWeb One ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data) return { error: error?.message ?? "Could not start setup." };
    return {
      data: {
        factorId: data.id,
        qrCode: data.totp?.qr_code ?? "",
        secret: data.totp?.secret ?? "",
        uri: data.totp?.uri ?? "",
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not start setup." };
  }
}

/** Challenge a factor and verify a code. Used for both enrolment and the gate. */
export async function verifyCode(factorId: string, code: string): Promise<string | null> {
  const api = mfa();
  if (!api) return "Two-factor isn't available on this connection.";
  try {
    const { data: ch, error: chErr } = await api.challenge({ factorId });
    if (chErr || !ch) return chErr?.message ?? "Could not verify the code.";
    const { error } = await api.verify({ factorId, challengeId: ch.id, code: code.trim() });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not verify the code.";
  }
}

export async function removeMfa(factorId: string): Promise<string | null> {
  const api = mfa();
  if (!api) return "Two-factor isn't available on this connection.";
  try {
    const { error } = await api.unenroll({ factorId });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not turn off two-factor.";
  }
}

/* ---------------- Backup codes ---------------- */

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function randomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

/** Generate fresh backup codes, store their hashes, and return the plaintext once. */
export async function generateBackupCodes(count = 10): Promise<{ codes: string[]; error?: string }> {
  if (!supabase) return { codes: [], error: "Not connected." };
  const codes = Array.from({ length: count }, randomCode);
  const hashes = await Promise.all(codes.map(sha256Hex));
  const { error } = await supabase.rpc("mfa_store_backup_codes", { p_hashes: hashes });
  if (error) return { codes: [], error: error.message };
  return { codes };
}

export async function backupCodesRemaining(): Promise<number> {
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase.rpc("mfa_backup_codes_remaining");
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
