import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ROLE_LABELS } from "../lib/roles";
import { usePermissions } from "../lib/permissions";
import { supabase } from "../lib/supabase";
import { RESOURCES } from "./resources";
import { ResourceManager } from "./ResourceManager";
import { AdminWebsite } from "./AdminWebsite";
import { AdminSiteEditor } from "./AdminSiteEditor";
import { AdminModules } from "./AdminModules";
import { Communications } from "./Communications";
import { SuperClubs } from "./SuperClubs";
import { SuperIntegrations } from "./SuperIntegrations";
import { SuperStudio } from "./SuperStudio";
import { Login } from "./Login";

function AdminInner() {
  const { ready, resolving, email, membership, platformRole, isPlatformAdmin, signOut } = useAuth();
  const { can } = usePermissions();
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
  const isSuperView =
    active === "__super_clubs" || active === "__super_integrations" || active === "__super_studio";
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
          {membership && can("club.content") && (
            <>
              {RESOURCES.map((r) => (
                <button key={r.key} data-active={r.key === active} onClick={() => setActive(r.key)}>
                  {r.label}
                </button>
              ))}
            </>
          )}
          {membership && can("club.website") && (
            <>
              <div className="sw-admin-navgroup">Your website</div>
              <button data-active={active === "__site"} onClick={() => setActive("__site")}>
                Edit website
              </button>
            </>
          )}
          {membership && can("club.comms") && (
            <>
              <div className="sw-admin-navgroup">Communicate</div>
              <button data-active={active === "__comms"} onClick={() => setActive("__comms")}>
                Send a message
              </button>
            </>
          )}
          {membership && (can("club.settings") || can("club.modules")) && (
            <>
              <div className="sw-admin-navgroup">Setup</div>
              {can("club.settings") && (
                <button data-active={active === "__website"} onClick={() => setActive("__website")}>
                  Website style
                </button>
              )}
              {can("club.modules") && (
                <button data-active={active === "__modules"} onClick={() => setActive("__modules")}>
                  Modules
                </button>
              )}
            </>
          )}
          {(can("platform.clubs") || can("platform.integrations")) && (
            <>
              <div className="sw-admin-navgroup">Platform · SportsWeb</div>
              {can("platform.clubs") && (
                <button data-active={active === "__super_clubs"} onClick={() => setActive("__super_clubs")}>
                  Clubs &amp; modules
                </button>
              )}
              {can("platform.integrations") && (
                <button data-active={active === "__super_integrations"} onClick={() => setActive("__super_integrations")}>
                  Integrations
                </button>
              )}
              {can("platform.clubs") && (
                <button data-active={active === "__super_studio"} onClick={() => setActive("__super_studio")}>
                  Template Studio
                </button>
              )}
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
          <span>
            {email}
            {platformRole
              ? ` · ${ROLE_LABELS[platformRole]}`
              : membership?.role === "super_admin"
                ? " · Club Senior Admin"
                : membership?.role === "club_admin"
                  ? " · Club Admin"
                  : membership?.role
                    ? ` · ${membership.role}`
                    : ""}
          </span>
        </div>
        {effectiveActive === "__site" && can("club.website") ? (
          <AdminSiteEditor />
        ) : effectiveActive === "__website" && can("club.settings") ? (
          <AdminWebsite />
        ) : effectiveActive === "__modules" && can("club.modules") ? (
          <AdminModules />
        ) : effectiveActive === "__comms" && can("club.comms") ? (
          <Communications />
        ) : effectiveActive === "__super_clubs" && can("platform.clubs") ? (
          <SuperClubs />
        ) : effectiveActive === "__super_integrations" && can("platform.integrations") ? (
          <SuperIntegrations />
        ) : effectiveActive === "__super_studio" && can("platform.clubs") ? (
          <SuperStudio />
        ) : membership && can("club.content") ? (
          <ResourceManager resource={resource} />
        ) : (
          <div className="sw-admin-loading">You don't have access to this area.</div>
        )}
      </main>
    </div>
  );
}

export function AdminApp() {
  return <AdminInner />;
}
