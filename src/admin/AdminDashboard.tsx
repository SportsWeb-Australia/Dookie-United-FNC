import { useEffect, useState, type ReactNode } from "react";
import { useClub } from "../components/ClubContext";
import { useActiveClub } from "./ActiveClub";
import { useAuth } from "../lib/auth";
import { usePermissions, toModelRole } from "../lib/permissions";
import { roleLabel } from "../lib/roles";
import { supabase } from "../lib/supabase";
import { MODULE_CATALOG } from "../lib/modules";
import { COMING_SOON_MODULES } from "./ModulePrePage";
import {
  COMMITTEE_TITLES,
  loadCommitteeProfile,
  saveCommitteeProfile,
  firstNameFrom,
  type CommitteeProfile,
} from "../lib/committee";
import { getDashboardMetrics, buildKpis, personaFromTitle, type Metrics } from "../lib/roleKpis";
import { HealthScore, RedFlags, TodoCentre, SampleCharts, Collapsible } from "./PresidentCentre";

/* ---- tiny dependency-free charts -------------------------------------- */

function Bars({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="sw-bars">
      {data.map((d) => (
        <div key={d.label} className="sw-bar">
          <span className="sw-bar-val">{d.value}</span>
          <div className="sw-bar-track">
            <div className="sw-bar-fill" style={{ height: `${Math.round((d.value / max) * 100)}%`, background: d.color }} />
          </div>
          <span className="sw-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = 42;
  const C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="sw-donut-wrap">
      <svg viewBox="0 0 120 120" className="sw-donut" role="img" aria-label="Modules breakdown">
        <circle cx={60} cy={60} r={r} fill="none" stroke="var(--border)" strokeWidth={14} opacity={0.35} />
        <g transform="rotate(-90 60 60)">
          {segments.map((s, i) => {
            const len = (s.value / total) * C;
            const node = (
              <circle
                key={i}
                cx={60}
                cy={60}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={14}
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                strokeLinecap="butt"
              />
            );
            acc += len;
            return node;
          })}
        </g>
        <text x={60} y={56} textAnchor="middle" className="sw-donut-num">
          {segments[0]?.value ?? 0}
        </text>
        <text x={60} y={74} textAnchor="middle" className="sw-donut-cap">
          active
        </text>
      </svg>
      <ul className="sw-donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            {s.label} <strong>{s.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---- quick-action icons (inline, no deps) ----------------------------- */

const ICONS: Record<string, ReactNode> = {
  news: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  ladder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  ),
  message: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
    </svg>
  ),
};

/**
 * Admin landing dashboard — a personalised, role-aware snapshot of the club
 * with quick shortcuts to the jobs people do most.
 */
export function AdminDashboard({ go }: { go: (key: string) => void }) {
  const { club } = useClub();
  const { can } = usePermissions();
  const { clubId, role: activeRole, isActingAs } = useActiveClub();
  const { userId, email, platformRole } = useAuth();

  const [counts, setCounts] = useState<Record<string, number | null>>({
    news: null,
    events: null,
    teams: null,
    sponsors: null,
    ladder: null,
  });

  const [profile, setProfile] = useState<CommitteeProfile>({ displayName: "", committeeTitle: "" });
  const [metrics, setMetrics] = useState<Metrics>({ zohoConnected: false });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", title: "" });
  const [saveMsg, setSaveMsg] = useState("");

  // Only a SportsWeb admin or the club's senior (signup) admin assigns committee
  // titles. A regular club admin can correct their display name, not their title.
  const canAssignTitle = can("club.users");

  useEffect(() => {
    if (!clubId || !supabase) return;
    let alive = true;
    const tables: Record<string, string> = {
      news: "news",
      events: "events",
      teams: "teams",
      sponsors: "sponsors",
      ladder: "ladder",
    };
    (async () => {
      const entries = await Promise.all(
        Object.entries(tables).map(async ([key, table]) => {
          try {
            const { count } = await supabase!
              .from(table)
              .select("id", { count: "exact", head: true })
              .eq("club_id", clubId);
            return [key, count ?? 0] as const;
          } catch {
            return [key, null] as const;
          }
        })
      );
      if (alive) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [clubId]);

  useEffect(() => {
    if (!clubId || !userId) return;
    let alive = true;
    loadCommitteeProfile(clubId, userId).then((p) => {
      if (!alive) return;
      setProfile(p);
      setForm({ name: p.displayName, title: p.committeeTitle });
    });
    return () => {
      alive = false;
    };
  }, [clubId, userId]);

  useEffect(() => {
    if (!clubId) return;
    let alive = true;
    getDashboardMetrics(clubId).then((m) => {
      if (alive) setMetrics(m);
    });
    return () => {
      alive = false;
    };
  }, [clubId]);

  const clubName = club.identity.shortName || "your club";
  const firstName = firstNameFrom(profile.displayName, email);
  const roleFallback = roleLabel(platformRole ?? toModelRole(activeRole));
  const greetingRole = profile.committeeTitle || (roleFallback !== "—" ? roleFallback : "");

  const saveProfile = async () => {
    setSaveMsg("Saving…");
    const err = await saveCommitteeProfile(clubId, form.name, canAssignTitle ? form.title : profile.committeeTitle);
    if (err) {
      setSaveMsg("Couldn't save — has the committee-roles migration been run?");
      return;
    }
    setProfile({ displayName: form.name.trim(), committeeTitle: (canAssignTitle ? form.title : profile.committeeTitle).trim() });
    setSaveMsg("Saved.");
    setEditing(false);
  };

  const n = (k: string) => counts[k] ?? 0;

  const persona = personaFromTitle(profile.committeeTitle);
  const kpi = buildKpis(
    persona,
    { events: n("events"), sponsors: n("sponsors"), teams: n("teams"), news: n("news") },
    metrics
  );

  // Modules breakdown (real): active vs locked vs coming-soon.
  const enabled = new Set(club.enabledModules ?? []);
  const activeCount = MODULE_CATALOG.filter((m) => enabled.has(m.key)).length;
  const lockedCount = MODULE_CATALOG.filter((m) => !enabled.has(m.key)).length;
  const soonCount = COMING_SOON_MODULES.length;

  const accent = "var(--accent)";
  const bars = [
    { label: "News", value: n("news"), color: accent },
    { label: "Events", value: n("events"), color: "#6366f1" },
    { label: "Teams", value: n("teams"), color: "#0ea5e9" },
    { label: "Sponsors", value: n("sponsors"), color: "#f59e0b" },
    { label: "Ladder", value: n("ladder"), color: "#10b981" },
  ];

  const quick: { title: string; sub: string; key: string; show: boolean; icon: ReactNode; tone: string }[] = [
    { title: "Write a news post", sub: "Share an update with your members", key: "news", show: can("club.content"), icon: ICONS.news, tone: "a" },
    { title: "Add an event", sub: "Put a date on the calendar", key: "events", show: can("club.content"), icon: ICONS.events, tone: "b" },
    { title: "Update the ladder", sub: "Add or edit a ladder row", key: "ladder", show: can("club.content"), icon: ICONS.ladder, tone: "c" },
    { title: "Edit your website", sub: "Hero, logo, text, images and video", key: "__site", show: can("club.website"), icon: ICONS.website, tone: "d" },
    { title: "Send a message", sub: "Email or SMS your members", key: "__comms", show: can("club.comms"), icon: ICONS.message, tone: "e" },
  ];

  const activeNames = MODULE_CATALOG.filter((m) => enabled.has(m.key)).map((m) => m.name);
  const presLocal = { events: n("events"), sponsors: n("sponsors"), teams: n("teams"), news: n("news") };

  const svg = (inner: ReactNode): ReactNode => (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {inner}
    </svg>
  );
  const iconFor = (label: string): ReactNode => {
    const l = label.toLowerCase();
    if (l.includes("member") || l.includes("new ")) return svg(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>);
    if (l.includes("budget") || l.includes("position")) return svg(<path d="M12 2v20M17 6H9a3 3 0 000 6h6a3 3 0 010 6H7" />);
    if (l.includes("registration")) return svg(<><rect x="6" y="3" width="12" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>);
    if (l.includes("volunteer")) return svg(<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2" /></>);
    if (l.includes("compliance") || l.includes("risk")) return svg(<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />);
    if (l.includes("event")) return svg(<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M9 3v4M15 3v4" /></>);
    if (l.includes("sponsor")) return svg(<><path d="M3 12l9-9 9 9-9 9z" /><circle cx="9" cy="9" r="1.5" /></>);
    if (l.includes("task")) return svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12l3 3 5-5" /></>);
    return svg(<circle cx="12" cy="12" r="8" />);
  };

  const kpiBlock = (
    <Collapsible title={kpi.heading}>
      <div className="sw-kpi-grid">
        {kpi.cards.map((c, i) => {
          const clickable = !!c.go;
          return (
            <div
              key={i}
              className={`sw-kpi-card sw-kpi-${c.tone ?? "plain"}${clickable ? " sw-kpi-clickable" : ""}`}
              onClick={clickable ? () => go(c.go!) : undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
            >
              <span className="sw-kpi-ic">{iconFor(c.label)}</span>
              <span className="sw-kpi-val">{c.value === null ? "—" : c.value}</span>
              <span className="sw-kpi-label">{c.label}</span>
              {c.value === null ? (
                c.source === "zoho" ? (
                  <span className="sw-kpi-connect">Connect Zoho</span>
                ) : (
                  <span className="sw-kpi-hint">Not set up yet</span>
                )
              ) : c.hint ? (
                <span className="sw-kpi-hint">{c.hint}</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </Collapsible>
  );

  return (
    <div className="sw-admin-panel sw-dash">
      <div className="sw-dash-hero">
        <div>
          <h2 className="sw-dash-greet">
            Welcome {firstName}
            {greetingRole && (
              <>
                {" — "}
                <span className="sw-dash-role">{greetingRole}</span>
              </>
            )}
          </h2>
          <p className="sw-dash-strap">Here's {clubName} at a glance. Jump straight into whatever you need.</p>
        </div>
      </div>

      {persona === "president" ? (
        <>
          <SampleCharts />
          <HealthScore metrics={metrics} local={presLocal} go={go} />
          {kpiBlock}
          <RedFlags metrics={metrics} local={presLocal} go={go} />
          <TodoCentre metrics={metrics} local={presLocal} go={go} />
        </>
      ) : (
        <>
          {kpiBlock}
          {persona === "general" && (
            <div className="sw-dash-charts">
              <section className="sw-dash-panel">
                <header className="sw-dash-panelhead">
                  <h3>Content on your site</h3>
                  <span className="sw-dash-panelnote">Live counts</span>
                </header>
                <Bars data={bars} />
              </section>
            </div>
          )}

          <h3 className="sw-dash-subhead">Quick actions</h3>
          <div className="sw-dash-grid">
            {quick
              .filter((q) => q.show)
              .map((q) => (
                <button key={q.key} className={`sw-qcard sw-qcard--${q.tone}`} onClick={() => go(q.key)}>
                  <span className="sw-qcard-icon">{q.icon}</span>
                  <span className="sw-qcard-body">
                    <span className="sw-qcard-title">{q.title}</span>
                    <span className="sw-qcard-sub">{q.sub}</span>
                  </span>
                  <span className="sw-qcard-go" aria-hidden="true">→</span>
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
