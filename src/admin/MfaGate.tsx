import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getMfaStatus, verifyCode, type MfaStatus } from "../lib/mfa";
import { MfaSettings } from "./MfaSettings";

/**
 * Account-access gate for two-factor authentication.
 *
 * - If the user has 2FA on but this session isn't elevated yet → ask for a code
 *   (hard — but Sign out is always available, and an admin can reset 2FA).
 * - If 2FA is REQUIRED for their role but they haven't set it up → prompt them.
 *   While HARD_ENFORCE_SETUP is false this is SKIPPABLE, so nobody can be locked
 *   out during rollout. Flip it to true once you've confirmed 2FA works on your
 *   own account and you want it mandatory for admins.
 * - Any error checking status → fail open (render the app). Never lock out.
 */
const HARD_ENFORCE_SETUP = false;

type GateState = "checking" | "ok" | "challenge" | "setup";

export function MfaGate({
  required,
  email,
  onSignOut,
  children,
}: {
  required: boolean;
  email: string | null;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const [state, setState] = useState<GateState>("checking");
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const evaluate = useCallback(async () => {
    const s = await getMfaStatus();
    setStatus(s);
    if (s.needsChallenge) {
      setState("challenge");
    } else if (required && s.available && !s.enrolled) {
      setState("setup");
    } else {
      setState("ok");
    }
  }, [required]);

  useEffect(() => {
    evaluate();
  }, [evaluate]);

  const submitChallenge = async () => {
    if (!status?.factorId) return;
    setBusy(true);
    setErr(null);
    const msg = await verifyCode(status.factorId, code);
    setBusy(false);
    if (msg) {
      setErr(msg);
      return;
    }
    setCode("");
    setState("checking");
    await evaluate();
  };

  if (state === "ok") return <>{children}</>;

  if (state === "checking") {
    return <div className="sw-admin-loading">Checking your security…</div>;
  }

  // Challenge: user has 2FA, needs to confirm this session.
  if (state === "challenge") {
    return (
      <div className="sw-entry sw-brandwrap">
        <div className="sw-entry-card">
          <div className="sw-login-brand">
            <span className="sw-login-mark">S1</span>
            <span className="sw-login-word">SportsWeb <span className="sw-login-one">One</span></span>
          </div>
          <h1>Verify it&apos;s you</h1>
          <p>Enter the 6-digit code from your authenticator app to continue.</p>

          {err && <p className="sw-admin-error">{err}</p>}

          <label className="sw-admin-field">
            <span>Authentication code</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && code.length === 6 && submitChallenge()}
            />
          </label>
          <button className="sw-btn" onClick={submitChallenge} disabled={busy || code.length < 6}>
            {busy ? "Verifying…" : "Verify"}
          </button>

          <p className="sw-login-sub">
            Lost your device? Ask a club admin to reset your 2FA, then set it up again.
          </p>
          <button className="sw-login-magic" onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    );
  }

  // Setup prompt: role requires 2FA but it isn't on yet.
  return (
    <div className="sw-entry sw-brandwrap">
      <div className="sw-entry-card sw-entry-card--wide">
        <div className="sw-login-brand">
          <span className="sw-login-mark">S1</span>
          <span className="sw-login-word">SportsWeb <span className="sw-login-one">One</span></span>
        </div>
        <h1>Protect your admin account</h1>
        <p>
          Your account ({email}) can manage the club, so we strongly recommend turning on two-factor
          authentication. It takes about a minute with an authenticator app.
        </p>

        {!setupOpen ? (
          <div className="sw-entry-actions">
            <button className="sw-btn" onClick={() => setSetupOpen(true)}>Set up two-factor now</button>
            {!HARD_ENFORCE_SETUP && (
              <button className="sw-login-magic" onClick={() => setState("ok")}>Remind me later</button>
            )}
          </div>
        ) : (
          <>
            <MfaSettings />
            <div className="sw-entry-actions">
              <button className="sw-btn" onClick={evaluate}>I&apos;ve set it up — continue</button>
              {!HARD_ENFORCE_SETUP && (
                <button className="sw-login-magic" onClick={() => setState("ok")}>Skip for now</button>
              )}
            </div>
          </>
        )}

        <button className="sw-login-magic" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}
