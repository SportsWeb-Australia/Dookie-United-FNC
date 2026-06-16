import { useState } from "react";
import { useAuth } from "../lib/auth";

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
    <div className="sw-admin-login sw-brandwrap">
      <div className="sw-admin-login-card">
        <div className="sw-login-brand">
          <span className="sw-login-mark">S1</span>
          <span className="sw-login-word">SportsWeb</span>
        </div>
        <h1>Club admin</h1>
        <p>Sign in to manage your club.</p>
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
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <p className="sw-login-sub">SportsWeb One · club management platform</p>
      </div>
    </div>
  );
}
