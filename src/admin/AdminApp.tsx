import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { RESOURCES } from "./resources";
import { ResourceManager } from "./ResourceManager";
import { AdminWebsite } from "./AdminWebsite";
import { AdminModules } from "./AdminModules";
import { Communications } from "./Communications";
import { SuperClubs } from "./SuperClubs";
import { SuperIntegrations } from "./SuperIntegrations";
import { Login } from "./Login";

function AdminInner() {
  const { ready, resolving, email, membership, isPlatformAdmin, signOut } = useAuth();
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

  if (!membership && !isPlatformAdmin) {
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
  const isSuperView = active === "__super_clubs" || active === "__super_integrations";
  // A platform operator with no club of their own lands on the platform views.
  const effectiveActive = !membership && !isSuperView ? "__super_clubs" : active;
  // The dedicated operator console (platform admin, no club) wears SportsWeb colours;
  // a club admin keeps their own club colours.
  const operatorConsole = isPlatformAdmin && !membership;

  return (
    <div className={`sw-admin${operatorConsole ? " sw-brandwrap" : ""}`}>
      <aside className="sw-admin-side">
        <div className="sw-admin-brand">
          <strong>{membership ? "Club Admin" : "Platform Admin"}</strong>
          <span>{membership?.clubName ?? "SportsWeb"}</span>
        </div>
        <nav className="sw-admin-nav">
          {membership && (
            <>
              {RESOURCES.map((r) => (
                <button key={r.key} data-active={r.key === active} onClick={() => setActive(r.key)}>
                  {r.label}
                </button>
              ))}
              <div className="sw-admin-navgroup">Communicate</div>
              <button data-active={active === "__comms"} onClick={() => setActive("__comms")}>
                Send a message
              </button>
              <div className="sw-admin-navgroup">Setup</div>
              <button data-active={active === "__website"} onClick={() => setActive("__website")}>
                Website style
              </button>
              <button data-active={active === "__modules"} onClick={() => setActive("__modules")}>
                Modules
              </button>
            </>
          )}
          {isPlatformAdmin && (
            <>
              <div className="sw-admin-navgroup">Platform · SportsWeb</div>
              <button data-active={active === "__super_clubs"} onClick={() => setActive("__super_clubs")}>
                Clubs &amp; modules
              </button>
              <button data-active={active === "__super_integrations"} onClick={() => setActive("__super_integrations")}>
                Integrations
              </button>
            </>
          )}
        </nav>
        <div className="sw-admin-side-foot">
          <Link to="/" className="sw-link-arrow">View site →</Link>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="sw-admin-main">
        <div className="sw-admin-userbar">
          <span>{email}{membership?.role ? ` · ${membership.role}` : isPlatformAdmin ? " · platform" : ""}</span>
        </div>
        {effectiveActive === "__website" ? (
          <AdminWebsite />
        ) : effectiveActive === "__modules" ? (
          <AdminModules />
        ) : effectiveActive === "__comms" ? (
          <Communications />
        ) : effectiveActive === "__super_clubs" && isPlatformAdmin ? (
          <SuperClubs />
        ) : effectiveActive === "__super_integrations" && isPlatformAdmin ? (
          <SuperIntegrations />
        ) : membership ? (
          <ResourceManager resource={resource} />
        ) : (
          <SuperClubs />
        )}
      </main>
    </div>
  );
}

export function AdminApp() {
  return <AdminInner />;
}
