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
import { MembersList } from "./MembersList";
import { MemberDetail } from "./MemberDetail";
import { TeamsSeasons } from "./TeamsSeasons";
import { Reports } from "./Reports";
import { MfaGate } from "./MfaGate";
import { AdminWebsite } from "./AdminWebsite";
import { AdminSiteEditor } from "./AdminSiteEditor";
import { AdminDashboard } from "./AdminDashboard";
import { ModulePrePage, COMING_SOON_MODULES, type ModulePre } from "./ModulePrePage";
import { getModule } from "../lib/modules";
import { AdminModules } from "./AdminModules";
import { Communications } from "./Communications";
import { SuperClubs } from "./SuperClubs";
import { AdminImport } from "./AdminImport";
import { ClubSetup } from "./ClubSetup";
import { SETUP_ROUTES } from "./setupRoutes";
import { SuperIntegrations } from "./SuperIntegrations";
import { SuperStudio } from "./SuperStudio";
import { SalesFormula } from "./SalesFormula";
import { LaunchTracker } from "./LaunchTracker";
import { AddPerson } from "./AddPerson";
import { StaffAccess } from "./StaffAccess";
import { PlatformDashboard } from "./PlatformDashboard";
import { Login } from "./Login";
import { ZohoWorkspace, WS_ICON, WORKSPACE } from "./ZohoWorkspace";
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

/** SETUP_ROUTES (cta_route → admin screen) now lives in ./setupRoutes,
 *  shared with SetupCard so the checklist and the dashboard card never drift. */

/** Zoho Partner sub-screens (placeholders until Carson supplies the deep links). */
const PARTNER_LABELS: Record<string, string> = {
  dashboard: "Partner Dashboard",
  topup: "Top up partner account",
  connect: "Add new Zoho connection",
  editclub: "Edit club Zoho account",
};

function AdminInner() {
  const { ready, resolving, email, platformRole, isPlatformAdmin, signOut, userId } = useAuth();
  const {
    clubId,
    clubName,
    clubSlug,
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
  const [webOpen, setWebOpen] = useState(false);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [swOfficeOpen, setSwOfficeOpen] = useState(false);
  const [previewPersona, setPreviewPersona] = useState<string | null>(null);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false); // mobile drawer
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const groupOpen = (k: string) => !!openGroups[k];
  const toggleGroup = (k: string) => setOpenGroups((g) => ({ ...g, [k]: !g[k] }));
  const [persona, setPersona] = useState<string>("general");
  const hasClub = !!clubId;
  // Scoped launch operator: SportsWeb staff, not a platform admin, no club.
  const [isOperator, setIsOperator] = useState(false);
  useEffect(() => {
    if (!userId || !supabase) { setIsOperator(false); return; }
    let alive = true;
    supabase.from("launch_operators").select("user_id").eq("user_id", userId).limit(1)
      .then(({ data }) => { if (alive) setIsOperator(!!(data && data.length)); });
    return () => { alive = false; };
  }, [userId]);
  // 2FA is required for accounts that can administer a club or the platform, and
  // for launch operators (they reach club data through the launch system).
  const mfaRequired =
    isPlatformAdmin || isOperator || activeRole === "club_senior_admin" || activeRole === "club_admin";

  // Back always returns to the dashboard home.
  const goBack = () => setActive("__dashboard");

  // Whenever the screen changes, close the mobile menu and jump content to top.
  useEffect(() => {
    setNavOpen(false);
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const main = document.querySelector(".sw-admin-main");
    if (main) main.scrollTop = 0;
  }, [active]);

  // When the active club changes (login, switch, or superadmin "open"), land on
  // that club's dashboard rather than whatever screen was open before.
  useEffect(() => {
    if (clubId) setActive("__dashboard");
  }, [clubId]);

  // Keep the browser tab title right for the admin: the platform/super-admin
  // view reads "SportsWeb One"; inside a club it's "{club} · SportsWeb One".
  useEffect(() => {
    document.title = hasClub && clubName ? `${clubName} · SportsWeb One` : "SportsWeb One";
  }, [hasClub, clubName]);

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
    // Admin chrome is always SportsWeb Electric Blue — the club's own accent is
    // NOT used to tint the admin UI. Club identity is carried by the logo.
    // (Public site still uses the club's real colours; this is admin-only.)
    "--club-accent": "#2F6BFF",
    "--club-silver": bc.silver,
    // Semantic aliases — how clubs think about their palette.
    "--club-primary": "#2F6BFF",
    "--club-secondary": bc.ink,
    "--club-tertiary": bc.tertiary ?? bc.paper,
  } as CSSProperties;

  // "View site" target:
  //  - platform / super context (no club) → the SportsWeb marketing site.
  //  - viewing a club → THAT club's public site. We key off the active club
  //    (clubSlug from useActiveClub), not the hostname-resolved club, which on
  //    the platform host defaults to the demo club (Dookie).
  const MARKETING_SITE = "https://sportsweb.com.au";
  const siteHref =
    hasClub && clubSlug
      ? isPlatformHost()
        ? `/?club=${clubSlug}`
        : "/"
      : MARKETING_SITE;

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

  if (!hasClub && !isPlatformAdmin && !isOperator) {
    const isBuilder = platformRole === "sportsweb_admin";
    return (
      <div className="sw-admin-login">
        <div className="sw-admin-login-card">
          <h1>{isBuilder ? "No club assigned yet" : "No club access"}</h1>
          <p>
            {isBuilder
              ? `You're signed in as ${email}. Your manager will assign you a club to build — once they do, it'll appear here and you can get started.`
              : `You're signed in as ${email}, but this account isn't linked to a club yet. Ask your club administrator to add you.`}
          </p>
          <button className="sw-btn sw-btn--ghost" onClick={signOut}>Sign out</button>
        </div>
      </div>
    );
  }

  const resource = RESOURCES.find((r) => r.key === active) ?? RESOURCES[0];
  // When a platform admin previews a club persona from the dashboard, scope the
  // whole shell to that persona: the SportsWeb (platform) menu hides and club
  // items gate on the previewed role, not the admin's real powers.
  const previewing = isPlatformAdmin && previewPersona != null;
  const effPersona = previewPersona ?? persona;
  // Zoho apps open straight in a new tab — deep links are always live; the
  // SportsWeb↔Zoho connection is a one-time thing handled in Integrations.
  const openZoho = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const isSuperView =
    active === "__biz" || active === "__super_clubs" || active === "__super_integrations" || active === "__super_studio" || active === "__sales" || active === "__super_import" || active === "__super_launches" || active === "__super_team" || active === "__staff" || active.startsWith("__partner_");
  // A scoped launch operator only ever sees the Launches screen.
  const operatorOnly = isOperator && !isPlatformAdmin && !hasClub;
  // A platform operator with no club of their own lands on the platform views.
  const effectiveActive = operatorOnly
    ? "__super_launches"
    : !hasClub && !isSuperView ? "__biz" : active;
  // The SportsWeb-branded console: platform admins and launch operators with no club.
  const operatorConsole = (isPlatformAdmin || isOperator) && !hasClub;

  return (
    <MfaGate required={mfaRequired} email={email} onSignOut={signOut}>
    <div className={`sw-admin${operatorConsole ? " sw-brandwrap" : ""}`} style={operatorConsole ? undefined : brandStyle}>
      <header className="sw-admin-topbar">
        <button
          className="sw-admin-burger"
          onClick={() => setNavOpen(true)}
          aria-label="Open menu"
          aria-expanded={navOpen}
        >
          <span /><span /><span />
        </button>
        <div className="sw-admin-topbar-title">
          {hasClub && club.identity.logo && (
            <img className="sw-admin-topbar-logo" src={club.identity.logo} alt="" />
          )}
          <strong>{hasClub ? clubName : "SportsWeb"}</strong>
        </div>
      </header>
      <div
        className="sw-admin-backdrop"
        data-open={navOpen}
        onClick={() => setNavOpen(false)}
        aria-hidden="true"
      />
      <aside className="sw-admin-side" data-open={navOpen}>
        <button
          className="sw-admin-drawerclose"
          onClick={() => setNavOpen(false)}
          aria-label="Close menu"
        >
          ✕
        </button>
        <div
          className={`sw-admin-brand${hasClub ? " sw-admin-brand--link" : ""}`}
          onClick={hasClub ? () => setActive("__dashboard") : undefined}
          role={hasClub ? "button" : undefined}
          tabIndex={hasClub ? 0 : undefined}
          title={hasClub ? "Back to dashboard" : undefined}
        >
          {hasClub && club.identity.logo ? (
            <img className="sw-admin-brandlogo" src={club.identity.logo} alt={`${clubName} logo`} />
          ) : !hasClub ? (
            <img className="sw-admin-brandlogo" src="/sw1-icon-512.png" alt="SportsWeb One" />
          ) : null}
          <div className="sw-admin-brandtext">
            <strong>{hasClub ? "Club Admin" : "Platform Admin"}</strong>
            <span>{hasClub ? clubName : "SportsWeb"}</span>
          </div>
          <a
            className="sw-admin-brand-sitelink"
            href={siteHref}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {hasClub ? "View live site →" : "View marketing site →"}
          </a>
        </div>
        <nav className="sw-admin-nav">
          {operatorOnly && (
            <button data-active={effectiveActive === "__super_launches"} onClick={() => setActive("__super_launches")}>
              Launches
            </button>
          )}
          {previewing && (
            <button
              type="button"
              onClick={() => setPreviewPersona(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                background: "#2F6BFF", color: "#fff", border: "none", borderRadius: 8,
                padding: "9px 12px", margin: "0 0 8px", cursor: "pointer", fontWeight: 600, fontSize: "0.86rem",
              }}
            >
              <span>Previewing as {previewPersona}</span>
              <span style={{ opacity: 0.9 }}>Exit ✕</span>
            </button>
          )}
          {hasClub && (
            <button data-active={active === "__dashboard"} onClick={() => setActive("__dashboard")}>
              Dashboard
            </button>
          )}
          {hasClub && (
            <button data-active={active === "__setup"} onClick={() => setActive("__setup")}>
              Get started
            </button>
          )}
          {hasClub && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("workspace")} onClick={() => toggleGroup("workspace")}>
                <span>Club Workspace</span>
                <span className="sw-admin-groupcaret">{groupOpen("workspace") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("workspace")}>
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
              {(effPersona === "president" || effPersona === "secretary" || (isPlatformAdmin && !previewing)) && (
                <button data-active={active === "__ws_vault"} onClick={() => setActive("__ws_vault")}><span className="sw-nav-ic">{WS_ICON.vault}</span>Vault</button>
              )}
              <button data-active={active === "__ws_todo"} onClick={() => setActive("__ws_todo")}><span className="sw-nav-ic">{WS_ICON.todo}</span>To-Do</button>
              <button data-active={active === "__ws_committee"} onClick={() => setActive("__ws_committee")}><span className="sw-nav-ic">{WS_ICON.committee}</span>Cliq</button>
              </div>
            </>
          )}
          {hasClub && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("modules")} onClick={() => toggleGroup("modules")}>
                <span>Modules</span>
                <span className="sw-admin-groupcaret">{groupOpen("modules") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("modules")}>
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
              </div>
            </>
          )}
          {hasClub && can("club.users") && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("club")} onClick={() => toggleGroup("club")}>
                <span>Membership</span>
                <span className="sw-admin-groupcaret">{groupOpen("club") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("club")}>
              <button data-active={active === "__members"} onClick={() => setActive("__members")}>
                Members
              </button>
              <button data-active={active === "__people"} onClick={() => setActive("__people")}>
                People &amp; committee
              </button>
              <button data-active={active === "__teams_seasons"} onClick={() => setActive("__teams_seasons")}>
                Teams &amp; seasons
              </button>
              <button data-active={active === "__reports_members"} onClick={() => setActive("__reports_members")}>
                Member reports
              </button>
              </div>
            </>
          )}
          {hasClub && can("club.comms") && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("comms")} onClick={() => toggleGroup("comms")}>
                <span>Communications</span>
                <span className="sw-admin-groupcaret">{groupOpen("comms") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("comms")}>
              <button data-active={active === "__comms"} onClick={() => setActive("__comms")}>
                Send a message
              </button>
              <button data-active={active === "__comms_reports"} onClick={() => setActive("__comms_reports")}>
                Communication reports
              </button>
              </div>
            </>
          )}
          {hasClub && (can("club.website") || can("club.content")) && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("website")} onClick={() => toggleGroup("website")}>
                <span>Your website</span>
                <span className="sw-admin-groupcaret">{groupOpen("website") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("website")}>
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
              </div>
            </>
          )}
          {hasClub && (effPersona === "president" || effPersona === "secretary" || effPersona === "treasurer" || (isPlatformAdmin && !previewing)) && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("account")} onClick={() => toggleGroup("account")}>
                <span>Account</span>
                <span className="sw-admin-groupcaret">{groupOpen("account") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("account")}>
              <button data-active={active === "__account"} onClick={() => setActive("__account")}>
                <span className="sw-nav-ic">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18M7 15h4" />
                  </svg>
                </span>
                SportsWeb One account
              </button>
              </div>
            </>
          )}
          {(can("platform.clubs") || can("platform.integrations")) && !previewing && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("platform")} onClick={() => toggleGroup("platform")}>
                <span>SportsWeb Admin</span>
                <span className="sw-admin-groupcaret">{groupOpen("platform") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("platform")}>
              {can("platform.clubs") && (
                <button data-active={active === "__biz"} onClick={() => setActive("__biz")}>
                  Dashboard
                </button>
              )}
              {can("platform.clubs") && (
                <button data-active={active === "__super_clubs"} onClick={() => setActive("__super_clubs")}>
                  Clubs &amp; modules
                </button>
              )}
              {/* Launches hidden from the nav (Carson's call) — internal go-live tracker,
                  kept for when club launches are handed to an operator. Flip `false` to restore. */}
              {false && can("platform.clubs") && (
                <button data-active={active === "__super_launches"} onClick={() => setActive("__super_launches")}>
                  Launches
                </button>
              )}
              {can("platform.clubs") && (
                <div className="sw-admin-parentrow">
                  <button
                    className="sw-admin-parent"
                    data-active={active === "__staff"}
                    onClick={() => { setActive("__staff"); setStaffOpen(true); }}
                  >
                    Staff &amp; access
                  </button>
                  <button
                    className="sw-admin-caret"
                    aria-label={staffOpen ? "Collapse staff & access" : "Expand staff & access"}
                    aria-expanded={staffOpen}
                    onClick={() => setStaffOpen((o) => !o)}
                  >
                    {staffOpen ? "▾" : "▸"}
                  </button>
                </div>
              )}
              {can("platform.clubs") && staffOpen && (
                <div className="sw-admin-subnav">
                  <button
                    data-active={active === "__super_team"}
                    onClick={() => setActive("__super_team")}
                  >
                    Add a person
                  </button>
                </div>
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
                <button data-active={active === "__sales"} onClick={() => setActive("__sales")}>
                  Sales
                </button>
              )}
              {can("platform.clubs") && (
                <button data-active={active === "__super_import"} onClick={() => setActive("__super_import")}>
                  Import a club
                </button>
              )}
              </div>
            </>
          )}
          {can("platform.clubs") && !previewing && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("swworkspace")} onClick={() => toggleGroup("swworkspace")}>
                <span>SportsWeb Workspace</span>
                <span className="sw-admin-groupcaret">{groupOpen("swworkspace") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("swworkspace")}>
                <button onClick={() => openZoho(WORKSPACE.email.url)}><span className="sw-nav-ic">{WS_ICON.email}</span>Email</button>
                <button onClick={() => openZoho(WORKSPACE.workdrive.url)}><span className="sw-nav-ic">{WS_ICON.workdrive}</span>WorkDrive</button>
                <button onClick={() => openZoho(WORKSPACE.intranet.url)}><span className="sw-nav-ic">{WS_ICON.intranet}</span>Intranet</button>
                <div className="sw-admin-parentrow">
                  <button className="sw-admin-parent" onClick={() => setSwOfficeOpen((o) => !o)} aria-expanded={swOfficeOpen}>
                    <span className="sw-nav-ic">{WS_ICON.office}</span>SportsWeb Office
                  </button>
                  <button className="sw-admin-caret" aria-label={swOfficeOpen ? "Collapse office" : "Expand office"} aria-expanded={swOfficeOpen} onClick={() => setSwOfficeOpen((o) => !o)}>
                    {swOfficeOpen ? "▾" : "▸"}
                  </button>
                </div>
                {swOfficeOpen && (
                  <div className="sw-admin-subnav">
                    <button onClick={() => openZoho(WORKSPACE.writer.url)}><span className="sw-nav-ic">{WS_ICON.writer}</span>Writer</button>
                    <button onClick={() => openZoho(WORKSPACE.sheets.url)}><span className="sw-nav-ic">{WS_ICON.sheets}</span>Sheets</button>
                    <button onClick={() => openZoho(WORKSPACE.show.url)}><span className="sw-nav-ic">{WS_ICON.show}</span>Show</button>
                  </div>
                )}
                <button onClick={() => openZoho(WORKSPACE.meeting.url)}><span className="sw-nav-ic">{WS_ICON.meeting}</span>Meeting</button>
                <button onClick={() => openZoho(WORKSPACE.calendar.url)}><span className="sw-nav-ic">{WS_ICON.calendar}</span>Calendar</button>
                <button onClick={() => openZoho(WORKSPACE.vault.url)}><span className="sw-nav-ic">{WS_ICON.vault}</span>Vault</button>
                <button onClick={() => openZoho(WORKSPACE.todo.url)}><span className="sw-nav-ic">{WS_ICON.todo}</span>To-Do</button>
                <button onClick={() => openZoho(WORKSPACE.committee.url)}><span className="sw-nav-ic">{WS_ICON.committee}</span>Cliq</button>
              </div>
            </>
          )}
          {can("platform.clubs") && !previewing && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("bizapps")} onClick={() => toggleGroup("bizapps")}>
                <span>Business Apps</span>
                <span className="sw-admin-groupcaret">{groupOpen("bizapps") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("bizapps")}>
                <button onClick={() => openZoho(WORKSPACE.crm.url)}><span className="sw-nav-ic">{WS_ICON.crm}</span>CRM</button>
                <button onClick={() => openZoho(WORKSPACE.books.url)}><span className="sw-nav-ic">{WS_ICON.books}</span>Financial</button>
                <button onClick={() => openZoho(WORKSPACE.analytics.url)}><span className="sw-nav-ic">{WS_ICON.analytics}</span>Analytics</button>
                <button onClick={() => openZoho(WORKSPACE.campaigns.url)}><span className="sw-nav-ic">{WS_ICON.campaigns}</span>Campaigns</button>
                <button onClick={() => openZoho(WORKSPACE.desk.url)}><span className="sw-nav-ic">{WS_ICON.desk}</span>Desk</button>
                <button onClick={() => openZoho(WORKSPACE.projects.url)}><span className="sw-nav-ic">{WS_ICON.projects}</span>Projects</button>
                <button onClick={() => openZoho(WORKSPACE.billing.url)}><span className="sw-nav-ic">{WS_ICON.billing}</span>Billing</button>
                <button onClick={() => openZoho(WORKSPACE.bookmarks.url)}><span className="sw-nav-ic">{WS_ICON.bookmarks}</span>Bookmarks</button>
              </div>
            </>
          )}
          {can("platform.clubs") && !previewing && (
            <>
              <button type="button" className="sw-admin-navgroup" data-open={groupOpen("partner")} onClick={() => toggleGroup("partner")}>
                <span>Zoho Partner</span>
                <span className="sw-admin-groupcaret">{groupOpen("partner") ? "▾" : "▸"}</span>
              </button>
              <div className="sw-admin-groupitems" data-open={groupOpen("partner")}>
                <button data-active={active === "__partner_dashboard"} onClick={() => setActive("__partner_dashboard")}><span className="sw-nav-ic">{WS_ICON.analytics}</span>Partner Dashboard</button>
                <button data-active={active === "__partner_topup"} onClick={() => setActive("__partner_topup")}><span className="sw-nav-ic">{WS_ICON.billing}</span>Top up partner account</button>
                <button data-active={active === "__partner_connect"} onClick={() => setActive("__partner_connect")}><span className="sw-nav-ic">{WS_ICON.crm}</span>Add new Zoho connection</button>
                <button data-active={active === "__partner_editclub"} onClick={() => setActive("__partner_editclub")}><span className="sw-nav-ic">{WS_ICON.office}</span>Edit club Zoho account</button>
              </div>
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
          <AdminDashboard
            go={setActive}
            canSwitchView={isPlatformAdmin || activeRole === "club_senior_admin"}
            previewPersona={previewPersona}
            setPreviewPersona={setPreviewPersona}
            realIsSuper={isPlatformAdmin}
          />
        ) : effectiveActive === "__setup" && hasClub ? (
          <ClubSetup
            clubId={clubId!}
            clubName={clubName}
            onGo={(route) => setActive(SETUP_ROUTES[route] ?? "__dashboard")}
          />
        ) : effectiveActive.startsWith("__ws_") && hasClub ? (
          <ZohoWorkspace appKey={effectiveActive.slice("__ws_".length)} />
        ) : effectiveActive.startsWith("__partner_") ? (
          <div className="sw-admin-panel">
            <h2 className="sw-admin-title">Zoho Partner</h2>
            <p style={{ color: "#5b6573", maxWidth: 560 }}>
              <strong>{PARTNER_LABELS[effectiveActive.slice("__partner_".length)] ?? "Partner tools"}</strong> lives here.
              This is the SportsWeb partner-account area (separate from the Zoho business apps). Send me the Zoho Partner
              deep link or the detail for this action and I'll wire it up — and add more partner menu items as you list them.
            </p>
          </div>
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
        ) : effectiveActive === "__members" && can("club.users") ? (
          <MembersList onOpen={(id) => setActive(`__member_${id}`)} />
        ) : effectiveActive.startsWith("__member_") && can("club.users") ? (
          (() => {
            const id = effectiveActive.slice("__member_".length);
            return <MemberDetail personId={id} onBack={() => setActive("__members")} />;
          })()
        ) : effectiveActive === "__people" && can("club.users") ? (
          <AdminPeople />
        ) : effectiveActive === "__teams_seasons" && can("club.users") ? (
          <TeamsSeasons />
        ) : effectiveActive === "__reports_members" && can("club.users") ? (
          <Reports section="members" />
        ) : effectiveActive === "__comms" && can("club.comms") ? (
          <Communications />
        ) : effectiveActive === "__comms_reports" && can("club.comms") ? (
          <Reports section="communications" />
        ) : effectiveActive === "__biz" && can("platform.clubs") ? (
          <PlatformDashboard go={setActive} platformRole={platformRole} />
        ) : effectiveActive === "__super_clubs" && can("platform.clubs") ? (
          <SuperClubs />
        ) : effectiveActive === "__super_launches" && (can("platform.clubs") || isOperator) ? (
          <LaunchTracker />
        ) : effectiveActive === "__super_team" && can("platform.clubs") ? (
          <AddPerson />
        ) : effectiveActive === "__staff" && can("platform.clubs") ? (
          <StaffAccess
            onAddPerson={() => setActive("__super_team")}
            canManageSuper={platformRole === "superadmin"}
            currentUserId={userId}
          />
        ) : effectiveActive === "__super_integrations" && can("platform.integrations") ? (
          <SuperIntegrations />
        ) : effectiveActive === "__super_studio" && can("platform.clubs") ? (
          <SuperStudio />
        ) : effectiveActive === "__sales" && can("platform.clubs") ? (
          <SalesFormula />
        ) : effectiveActive === "__super_import" && can("platform.clubs") ? (
          <AdminImport />
        ) : hasClub && can("club.content") ? (
          <ResourceManager resource={resource} />
        ) : (
          <div className="sw-admin-loading">You don't have access to this area.</div>
        )}
      </main>
    </div>
    </MfaGate>
  );
}

export function AdminApp() {
  return (
    <ActiveClubProvider>
      <AdminInner />
    </ActiveClubProvider>
  );
}
