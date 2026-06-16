import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthProvider, useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { RESOURCES } from "./resources";
import { ResourceManager } from "./ResourceManager";
import { AdminWebsite } from "./AdminWebsite";
import { AdminModules } from "./AdminModules";
import { Login } from "./Login";

function AdminInner() {
  const { ready, resolving, email, membership, signOut } = useAuth();
  const [active, setActive] = useState(RESOURCES[0].key);

  if (!supabase) {
    return (
      <div className="sw-admin-login">
        <div className="sw-admin-login-card">
          <h1>Admin unavailable</h1>
          <p>Supabase isn't configured for this deployment. Set the environment variables and redeploy.</p>
          <Link to="/" className="sw-link-arrow">Back to site →</Link>
        </div>
      </div>
    );
  }

  if (!ready) return <div className="sw-admin-loading">Loading…</div>;
  if (!email) return <Login />;
  if (resolving) return <div className="sw-admin-loading">Loading…</div>;

  if (!membership) {
    return (
      <div className="sw-admin-login">
        <div className="sw-admin-login-card">
          <h1>No club access</h1>
          <p>
            You're signed in as {email}, but this account isn't linked to a club yet. Ask an
            administrator to add you to <code>club_users</code>.
          </p>
          <button className="sw-btn sw-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  const resource = RESOURCES.find((r) => r.key === active) ?? RESOURCES[0];

  return (
    <div className="sw-admin">
      <aside className="sw-admin-side">
        <div className="sw-admin-brand">
          <strong>Club Admin</strong>
          <span>{membership.clubName ?? "Your club"}</span>
        </div>
        <nav className="sw-admin-nav">
          {RESOURCES.map((r) => (
            <button key={r.key} data-active={r.key === active} onClick={() => setActive(r.key)}>
              {r.label}
            </button>
          ))}
          <div className="sw-admin-navgroup">Setup</div>
          <button data-active={active === "__website"} onClick={() => setActive("__website")}>
            Website style
          </button>
          <button data-active={active === "__modules"} onClick={() => setActive("__modules")}>
            Modules
          </button>
        </nav>
        <div className="sw-admin-side-foot">
          <Link to="/" className="sw-link-arrow">View site →</Link>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="sw-admin-main">
        <div className="sw-admin-userbar">
          <span>{email}{membership.role ? ` · ${membership.role}` : ""}</span>
        </div>
        {active === "__website" ? (
          <AdminWebsite />
        ) : active === "__modules" ? (
          <AdminModules />
        ) : (
          <ResourceManager resource={resource} />
        )}
      </main>
    </div>
  );
}

export function AdminApp() {
  return (
    <AuthProvider>
      <AdminInner />
    </AuthProvider>
  );
}
