import { useState } from "react";
import { useAuth } from "../lib/auth";

/**
 * SportsWeb One platform entry page. SportsWeb-branded (not club-branded) —
 * the front door for every club. Log in resolves the account and lands them in
 * their own branded club admin. Sign up and Learn more go to the marketing
 * site, where a club chooses a plan and activates.
 */
const MARKETING_URL = "https://sportsweb.com.au";
const SIGNUP_URL = "https://sportsweb.com.au/#pricing";

export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="sw-entry sw-brandwrap">
      <div className="sw-entry-card">
        <div className="sw-login-brand">
          <span className="sw-login-mark">S1</span>
          <span className="sw-login-word">
            SportsWeb <span className="sw-login-one">One</span>
          </span>
        </div>

        <h1>Welcome back</h1>
        <p>Log in to manage your club.</p>

        {error && <p className="sw-admin-error">{error}</p>}

        <label className="sw-admin-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoComplete="username"
          />
        </label>
        <label className="sw-admin-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoComplete="current-password"
          />
        </label>
        <button className="sw-btn" onClick={submit} disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>

        <div className="sw-entry-divider"><span>New to SportsWeb One?</span></div>

        <div className="sw-entry-actions">
          <a className="sw-btn sw-btn--ghost" href={SIGNUP_URL}>Sign up &amp; choose a plan</a>
          <a className="sw-entry-link" href={MARKETING_URL}>Learn more about SportsWeb One →</a>
        </div>

        <p className="sw-login-sub">SportsWeb One · the operating system for community sport</p>
      </div>
    </div>
  );
}
