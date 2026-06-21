import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useClub } from "../components/ClubContext";
import { useActiveClub, ActiveClubProvider } from "./ActiveClub";
import { ROLE_LABELS } from "../lib/roles";
import { usePermissions } from "../lib/permissions";
import { supabase, isPlatformHost } from "../lib/supabase";
import { RESOURCES } from "./resources";
import { ResourceManager } from "./ResourceManager";
import { AdminPeople } from "./AdminPeople";
import { AdminWebsite } from "./AdminWebsite";
import { AdminSiteEditor } from "./AdminSiteEditor";
import { AdminDashboard } from "./AdminDashboard";
import { ModulePrePage, COMING_SOON_MODULES, type ModulePre } from "./ModulePrePage";
import { getModule } from "../lib/modules";
import { AdminModules } from "./AdminModules";
import { Communications } from "./Communications";
import { SuperClubs } from "./SuperClubs";
import { AdminImport } from "./AdminImport";
import { SuperIntegrations } from "./SuperIntegrations";
import { SuperStudio } from "./SuperStudio";
import { Login } from "./Login";
import { ZohoWorkspace, WS_ICON } from "./ZohoWorkspace";
import { SportsWebAccount } from "./SportsWebAccount";
import { loadCommitteeProfile } from "../lib/committee";
import { personaFromTitle } from "../lib/roleKpis";

/** Editable site pages shown under "Edit website" (alongside the content collections). */
const SITE_PAGES: { key: string; label: string }[] = [
  { key: "__page_home", label: "Home" },
  { key: "__page_about", label: "About" },
  { key: "__page_contact", label: "Contact" },
  { key: "__page_register", label: "Register" },
  { key: "__page_footer", label: "Footer & site-wide" },
];

function AdminInner() {
  const { ready, resolving, email, platformRole, isPlatformAdmin, signOut, userId } = useAuth();
  const {
    clubId,
    clubName,
    role: activeRole,
    clubs,
    ready: clubReady,
    loading: clubLoading,
    isActingAs,
    setActiveClub,
    exitActingAs,
  } = useActiveClub();
  const { club } = useClub();
  const { can } = usePermissions();
  const [active, setActive] = useState("__dashboard");
  const [webOpen, setWebOpen] = useState(true);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(true);
  const [persona, setPersona] = useState<string>("general");
  const hasClub = !!clubId;

  // Back always returns to the dashboard home.
  const goBack = () => setActive("__dashboard");

  // Whenever the screen changes, jump the content back to the top.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const main = document.querySelector(".sw-admin-main");
    if (main) main.scrollTop = 0;
  }, [active]);

  // When the active club changes (login, switch, or superadmin "open"), land on
  // that club's dashboard rather than whatever screen was open before.
  useEffect(() => {
    if (clubId) setActive("__dashboard");
  }, [clubId]);

  // Resolve the committee persona (President / Secretary / …) so the sidebar can
  // gate role-specific items like Vault.
  useEffect(() => {
    if (!clubId || !userId) {
      setPersona("general");
      return;
    }
    let alive = true;
    loadCommitteeProfile(clubId, userId).then((p) => {
      if (alive) setPersona(personaFromTitle(p.committeeTitle));
    });
    return () => {
      alive = false;
    };
  }, [clubId, userId]);

  // The club switcher lists the user's clubs; when acting-as a club they don't
  // belong to, include it as the current option so the dropdown still shows it.
  const switchOptions = useMemo<{ id: string; name: string }[]>(() => {
    const opts: { id: string; name: string }[] = clubs.map((c) => ({ id: c.id, name: c.name }));
    if (clubId && !opts.some((o) => o.id === clubId)) opts.unshift({ id: clubId, name: clubName || "This club" });
    return opts;
  }, [clubs, clubId, clubName]);
  const showSwitcher = switchOptions.length > 1 || isActingAs;

  // Scope the active club's colours to the admin chrome (no :root pollution, so
  // leaving the admin never leaks one club's palette onto another's public site).
  const bc = club.identity.colours;
  const brandStyle = {
    "--club-ink": bc.ink,
    "--club-paper": bc.paper,
    "--club-accent": bc.accent,
    "--club-silver": bc.silver,
  } as CSSProperties;

  // "View site" must open the club's *public* site. On a platform host, the bare
  // root redirects a logged-in admin back here, so we add the club preview param
  // and open in a new tab — the admin never navigates away.
  const siteSlug = club.identity.slug ?? "";
  const siteHref = isPlatformHost() && siteSlug ? `/?club=${siteSlug}` : "/";

  // Modules group: the club's switched-on modules, plus the ones we haven't
  // wired into this dashboard yet (shown as "Coming soon").
  const enabledMods: ModulePre[] = (club.enabledModules ?? [])
    .map((k) => getModule(k))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));
  const enabledKeys = new Set(enabledMods.map((m) => m.key));
  const soonMods: ModulePre[] = COMING_SOON_MODULES.filter((m) => !enabledKeys.has(m.key));
  const moduleNav: { def: ModulePre; status: "open" | "soon" }[] = [
    ...enabledMods.map((def) => ({ def, status: (def.appUrl ? "open" : "soon") as "open" | "soon" })),
    ...soonMods.map((def) => ({ def, status: "soon" as const })),
  ];

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
  if (resolving || !clubReady) return <div className="sw-admin-loading">Loading…</div>;

  if (!hasClub && !isPlatformAdmin) {
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
    active === "__super_clubs" || active === "__super_integrations" || active === "__super_studio" || active === "__super_import";
  // A platform operator with no club of their own lands on the platform views.
  const effectiveActive = !hasClub && !isSuperView ? "__super_clubs" : active;
  // The dedicated operator console (platform admin, no club) wears SportsWeb colours;
  // a club admin keeps their own club colours.
  const operatorConsole = isPlatformAdmin && !hasClub;

  return (
    <div className={`sw-admin${operatorConsole ? " sw-brandwrap" : ""}`} style={operatorConsole ? undefined : brandStyle}>
      <aside className="sw-admin-side">
        <div
          className={`sw-admin-brand${hasClub ? " sw-admin-brand--link" : ""}`}
          onClick={hasClub ? () => setActive("__dashboard") : undefined}
          role={hasClub ? "button" : undefined}
          tabIndex={hasClub ? 0 : undefined}
          title={hasClub ? "Back to dashboard" : undefined}
        >
          {hasClub && club.identity.logo && (
            <img className="sw-admin-brandlogo" src={club.identity.logo} alt={`${clubName} logo`} />
          )}
          <div className="sw-admin-brandtext">
            <strong>{hasClub ? "Club Admin" : "Platform Admin"}</strong>
            <span>{hasClub ? clubName : "SportsWeb"}</span>
          </div>
        </div>
        <nav className="sw-admin-nav">
          {hasClub && (
            <button data-active={active === "__dashboard"} onClick={() => setActive("__dashboard")}>
              Dashboard
            </button>
          )}
          {hasClub && (
            <>
              <div className="sw-admin-navgroup">Club Workspace</div>
              <button data-active={active === "__ws_email"} onClick={() => setActive("__ws_email")}><span className="sw-nav-ic">{WS_ICON.email}</span>Email</button>
              <button data-active={active === "__ws_workdrive"} onClick={() => setActive("__ws_workdrive")}><span className="sw-nav-ic">{WS_ICON.workdrive}</span>WorkDrive</button>
              <button data-active={active === "__ws_intranet"} onClick={() => setActive("__ws_intranet")}><span className="sw-nav-ic">{WS_ICON.intranet}</span>Intranet</button>
              <div className="sw-admin-parentrow">
                <button
                  className="sw-admin-parent"
                  data-active={active === "__ws_office"}
                  onClick={() => { setActive("__ws_office"); setOfficeOpen(true); }}
                >
                  <span className="sw-nav-ic">{WS_ICON.office}</span>Club Office
                </button>
                <button
                  className="sw-admin-caret"
                  aria-label={officeOpen ? "Collapse office" : "Expand office"}
                  aria-expanded={officeOpen}
                  onClick={() => setOfficeOpen((o) => !o)}
                >
                  {officeOpen ? "▾" : "▸"}
                </button>
              </div>
              {officeOpen && (
                <div className="sw-admin-subnav">
                  <button data-active={active === "__ws_writer"} onClick={() => setActive("__ws_writer")}><span className="sw-nav-ic">{WS_ICON.writer}</span>Writer</button>
                  <button data-active={active === "__ws_sheets"} onClick={() => setActive("__ws_sheets")}><span className="sw-nav-ic">{WS_ICON.sheets}</span>Sheets</button>
                  <button data-active={active === "__ws_show"} onClick={() => setActive("__ws_show")}><span className="sw-nav-ic">{WS_ICON.show}</span>Show</button>
                </div>
              )}
              <button data-active={active === "__ws_meeting"} onClick={() => setActive("__ws_meeting")}><span className="sw-nav-ic">{WS_ICON.meeting}</span>Meeting</button>
              <button data-active={active === "__ws_calendar"} onClick={() => setActive("__ws_calendar")}><span className="sw-nav-ic">{WS_ICON.calendar}</span>Calendar</button>
              {(persona === "president" || persona === "secretary" || isPlatformAdmin) && (
                <button data-active={active === "__ws_vault"} onClick={() => setActive("__ws_vault")}><span className="sw-nav-ic">{WS_ICON.vault}</span>Vault</button>
              )}
              <button data-active={active === "__ws_todo"} onClick={() => setActive("__ws_todo")}><span className="sw-nav-ic">{WS_ICON.todo}</span>To-Do</button>
              <button data-active={active === "__ws_committee"} onClick={() => setActive("__ws_committee")}><span className="sw-nav-ic">{WS_ICON.committee}</span>Committee Room</button>
            </>
          )}
          {hasClub && (
            <>
              <div className="sw-admin-navgroup">Modules</div>
              <div className="sw-admin-parentrow">
                <button
                  className="sw-admin-parent"
                  data-active={active === "__modules"}
                  onClick={() => { setActive("__modules"); setModulesOpen(true); }}
                >
                  All modules
                </button>
                <button
                  className="sw-admin-caret"
                  aria-label={modulesOpen ? "Collapse modules" : "Expand modules"}
                  aria-expanded={modulesOpen}
                  onClick={() => setModulesOpen((o) => !o)}
                >
                  {modulesOpen ? "▾" : "▸"}
                </button>
              </div>
              {modulesOpen && enabledMods.length > 0 && (
                <div className="sw-admin-subnav">
                  {enabledMods.map((m) => (
                    <button
                      key={m.key}
                      data-active={active === `__mod_${m.key}`}
                      onClick={() => setActive(`__mod_${m.key}`)}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {hasClub && can("club.users") && (
            <>
              <div className="sw-admin-navgroup">Club</div>
              <button data-active={active === "__people"} onClick={() => setActive("__people")}>
                People & committee
              </button>
            </>
          )}
          {hasClub && can("club.comms") && (
            <>
              <div className="sw-admin-navgroup">Communications</div>
              <button data-active={active === "__comms"} onClick={() => setActive("__comms")}>
                Send a message
              </button>
            </>
          )}
          {hasClub && (can("club.website") || can("club.content")) && (
            <>
              <div className="sw-admin-navgroup">Your website</div>
              <div className="sw-admin-parentrow">
                <button
                  className="sw-admin-parent"
                  data-active={active === "__site"}
                  onClick={() => { setActive("__site"); setWebOpen(true); }}
                >
                  Edit website
                </button>
                <button
                  className="sw-admin-caret"
                  aria-label={webOpen ? "Collapse pages" : "Expand pages"}
                  aria-expanded={webOpen}
                  onClick={() => setWebOpen((o) => !o)}
                >
                  {webOpen ? "▾" : "▸"}
                </button>
              </div>
              {webOpen && (
                <div className="sw-admin-subnav">
                  {can("club.website") &&
                    SITE_PAGES.map((p) => (
                      <button key={p.key} data-active={p.key === active} onClick={() => setActive(p.key)}>
                        {p.label}
                      </button>
                    ))}
                  {can("club.content") &&
                    RESOURCES.map((r) => (
                      <button key={r.key} data-active={r.key === active} onClick={() => setActive(r.key)}>
                        {r.label}
                      </button>
                    ))}
                </div>
              )}
              {can("club.settings") && (
                <button
                  className="sw-admin-stylebtn"
                  data-active={active === "__website"}
                  onClick={() => setActive("__website")}
                >
                  Website style
                </button>
              )}
            </>
          )}
          {hasClub && (persona === "president" || persona === "secretary" || persona === "treasurer" || isPlatformAdmin) && (
            <>
              <div className="sw-admin-navgroup">Account</div>
              <button data-active={active === "__account"} onClick={() => setActive("__account")}>
                <span className="sw-nav-ic">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18M7 15h4" />
                  </svg>
                </span>
                SportsWeb One account
              </button>
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
              {can("platform.clubs") && (
                <button data-active={active === "__super_import"} onClick={() => setActive("__super_import")}>
                  Import a club
                </button>
              )}
            </>
          )}
        </nav>
        <div className="sw-admin-side-foot">
          <a href={siteHref} target="_blank" rel="noreferrer" className="sw-link-arrow">View site →</a>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="sw-admin-main">
        {hasClub && effectiveActive !== "__dashboard" && (
          <button className="sw-admin-back" onClick={goBack}>
            ← Dashboard
          </button>
        )}
        {isActingAs && (
          <div className="sw-actas">
            <span>
              Viewing <strong>{clubName}</strong> as platform admin{clubLoading ? " · loading…" : ""}
            </span>
            <button className="sw-actas-exit" onClick={exitActingAs}>
              Exit to platform →
            </button>
          </div>
        )}
        <div className="sw-admin-userbar">
          <span>
            {email}
            {platformRole
              ? ` · ${ROLE_LABELS[platformRole]}`
              : activeRole === "super_admin"
                ? " · Exec Admin"
                : activeRole === "club_admin"
                  ? " · Club Admin"
                  : activeRole
                    ? ` · ${activeRole}`
                    : ""}
          </span>
          {showSwitcher && (
            <label className="sw-clubswitch">
              <span>Club</span>
              <select value={clubId} onChange={(e) => setActiveClub(e.target.value)}>
                {switchOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {effectiveActive === "__dashboard" && hasClub ? (
          <AdminDashboard go={setActive} />
        ) : effectiveActive.startsWith("__ws_") && hasClub ? (
          <ZohoWorkspace appKey={effectiveActive.slice("__ws_".length)} />
        ) : effectiveActive === "__account" && hasClub ? (
          <SportsWebAccount />
        ) : effectiveActive.startsWith("__mod_") && hasClub ? (
          (() => {
            const key = effectiveActive.slice("__mod_".length);
            const item = moduleNav.find((m) => m.def.key === key);
            return item ? (
              <ModulePrePage mod={item.def} status={item.status} />
            ) : (
              <div className="sw-admin-loading">That module isn't available.</div>
            );
          })()
        ) : effectiveActive === "__site" && can("club.website") ? (
          <AdminSiteEditor key="__site" />
        ) : effectiveActive.startsWith("__page_") && can("club.website") ? (
          <AdminSiteEditor
            key={effectiveActive}
            page={effectiveActive.slice("__page_".length) as "home" | "about" | "contact" | "register" | "footer"}
          />
        ) : effectiveActive === "__website" && can("club.settings") ? (
          <AdminWebsite />
        ) : effectiveActive === "__modules" && hasClub ? (
          <AdminModules />
        ) : effectiveActive === "__people" && can("club.users") ? (
          <AdminPeople />
        ) : effectiveActive === "__comms" && can("club.comms") ? (
          <Communications />
        ) : effectiveActive === "__super_clubs" && can("platform.clubs") ? (
          <SuperClubs />
        ) : effectiveActive === "__super_integrations" && can("platform.integrations") ? (
          <SuperIntegrations />
        ) : effectiveActive === "__super_studio" && can("platform.clubs") ? (
          <SuperStudio />
        ) : effectiveActive === "__super_import" && can("platform.clubs") ? (
          <AdminImport />
        ) : hasClub && can("club.content") ? (
          <ResourceManager resource={resource} />
        ) : (
          <div className="sw-admin-loading">You don't have access to this area.</div>
        )}
      </main>
    </div>
  );
}

export function AdminApp() {
  return (
    <ActiveClubProvider>
      <AdminInner />
    </ActiveClubProvider>
  );
}
