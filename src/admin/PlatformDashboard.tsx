import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type AtRisk = {
  club_id: string;
  club_name: string;
  slug: string;
  pct: number;
  reason: string;
};

type Dash = {
  scope: string;
  clubs_total: number;
  clubs_new_month: number | null;
  clubs_live: number;
  clubs_in_setup: number;
  staff_platform: number | null;
  staff_club: number | null;
  modules_enabled: number;
  at_risk: AtRisk[];
};

type Persona = "super" | "manager" | "admin";
type Tone = "plain" | "good" | "warn" | "bad" | "info";

const TABS: { key: Persona; label: string }[] = [
  { key: "super", label: "Super Admin" },
  { key: "manager", label: "Manager" },
  { key: "admin", label: "Admin" },
];
const personaLabel = (p: Persona) => TABS.find((t) => t.key === p)?.label ?? "Super Admin";

function personaFromRole(role?: string | null): Persona {
  if (role === "sportsweb_manager") return "manager";
  if (role === "sportsweb_admin") return "admin";
  return "super";
}

const INTRO: Record<Persona, { eyebrow: string; title: string; blurb: string }> = {
  super: {
    eyebrow: "SportsWeb · Super Admin",
    title: "Business at a glance",
    blurb:
      "The whole platform in one view — clubs, setup progress, staff and module adoption, plus the clubs that need a nudge.",
  },
  manager: {
    eyebrow: "SportsWeb · Manager",
    title: "Operations at a glance",
    blurb:
      "Clubs, setup progress and module adoption across the platform — and which clubs need attention this week.",
  },
  admin: {
    eyebrow: "SportsWeb · Admin",
    title: "My build queue",
    blurb: "The clubs assigned to you, where each one is up to, and what needs doing next.",
  },
};

function Kpi({
  value,
  label,
  tone = "plain",
  onClick,
}: {
  value: number | null;
  label: string;
  tone?: Tone;
  onClick?: () => void;
}) {
  return (
    <div
      className={`sw-kpi-card sw-kpi-${tone}${onClick ? " sw-kpi-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="sw-kpi-val">{value === null || value === undefined ? "—" : value}</span>
      <span className="sw-kpi-label">{label}</span>
    </div>
  );
}

export function PlatformDashboard({
  go,
  platformRole,
}: {
  go: (key: string) => void;
  platformRole?: string | null;
}) {
  const resolvedPersona = useMemo(() => personaFromRole(platformRole), [platformRole]);
  const canSwitchView = resolvedPersona === "super";
  const [viewAs, setViewAs] = useState<Persona | null>(null);
  const persona: Persona = canSwitchView && viewAs ? viewAs : resolvedPersona;
  const scope = persona === "admin" ? "mine" : "all";

  const [d, setD] = useState<Dash | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setD(null);
    setErr(null);
    (async () => {
      const { data, error } = await supabase.rpc("platform_dashboard", { p_scope: scope });
      if (!live) return;
      if (error) {
        setErr(
          error.message + " — if this mentions a missing function, run platform-dashboard.sql."
        );
        return;
      }
      setD(data as Dash);
    })();
    return () => {
      live = false;
    };
  }, [scope]);

  const intro = INTRO[persona];

  // KPI tiles per persona.
  const tiles =
    persona === "admin"
      ? [
          { value: d?.clubs_total ?? null, label: "My clubs", onClick: () => go("__super_launches") },
          { value: d?.clubs_in_setup ?? null, label: "In setup", tone: "info" as Tone },
          {
            value: d ? d.at_risk.length : null,
            label: "Need attention",
            tone: (d && d.at_risk.length > 0 ? "warn" : "plain") as Tone,
          },
          { value: d?.clubs_live ?? null, label: "Live", tone: "good" as Tone },
        ]
      : persona === "manager"
      ? [
          { value: d?.clubs_total ?? null, label: "Clubs on the platform", onClick: () => go("__super_clubs") },
          { value: d?.clubs_live ?? null, label: "Live", tone: "good" as Tone },
          { value: d?.clubs_in_setup ?? null, label: "In setup", tone: "info" as Tone, onClick: () => go("__super_launches") },
          {
            value: d ? d.at_risk.length : null,
            label: "Need attention",
            tone: (d && d.at_risk.length > 0 ? "warn" : "plain") as Tone,
          },
          { value: d?.clubs_new_month ?? null, label: "New this month" },
          { value: d?.modules_enabled ?? null, label: "Modules enabled" },
        ]
      : [
          { value: d?.clubs_total ?? null, label: "Clubs on the platform", onClick: () => go("__super_clubs") },
          { value: d?.clubs_live ?? null, label: "Live", tone: "good" as Tone },
          { value: d?.clubs_in_setup ?? null, label: "In setup", tone: "info" as Tone, onClick: () => go("__super_launches") },
          {
            value: d ? d.at_risk.length : null,
            label: "Need attention",
            tone: (d && d.at_risk.length > 0 ? "warn" : "plain") as Tone,
          },
          { value: d?.clubs_new_month ?? null, label: "New this month" },
          { value: d?.modules_enabled ?? null, label: "Modules enabled" },
          { value: d?.staff_platform ?? null, label: "Platform staff", onClick: () => go("__staff") },
          { value: d?.staff_club ?? null, label: "Club staff" },
        ];

  const actions =
    persona === "admin"
      ? [
          { label: "Launches", desc: "Track your clubs' setup", key: "__super_launches" },
          { label: "Import a club", desc: "Pull from an existing site", key: "__super_import" },
        ]
      : [
          { label: "New club", desc: "Create a club from scratch", key: "__super_clubs" },
          { label: "Import a club", desc: "Pull from an existing site", key: "__super_import" },
          { label: "Add a person", desc: "Grant platform or club access", key: "__super_team" },
          { label: "Launches", desc: "Track every club's setup", key: "__super_launches" },
        ];

  const card: React.CSSProperties = {
    border: "1px solid #e6e8ec",
    borderRadius: 14,
    background: "#fff",
    padding: "1.1rem 1.2rem",
  };

  return (
    <div className="sw-bizdash">
      <p
        style={{
          color: "#667085",
          fontSize: "0.62rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 0.3rem",
          fontFamily: "var(--font-mono, monospace)",
        }}
      >
        {intro.eyebrow}
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display, inherit)",
          fontSize: "clamp(1.9rem, 1.3rem + 1.8vw, 2.8rem)",
          margin: "0 0 0.35rem",
        }}
      >
        {intro.title}
      </h1>
      <p style={{ color: "#475467", maxWidth: "62ch", margin: "0 0 1.3rem" }}>{intro.blurb}</p>

      {/* View-as switcher (Super Admin only) */}
      {canSwitchView && (
        <div className="sw-dash-viewas" style={{ marginBottom: "1.4rem" }}>
          <span className="sw-dash-viewas-cap">View dashboard as</span>
          <div className="sw-dash-viewas-pills">
            {TABS.map((t) => (
              <button
                key={t.key}
                className="sw-dash-viewas-pill"
                data-active={persona === t.key}
                onClick={() => setViewAs(t.key === resolvedPersona ? null : t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {viewAs && viewAs !== resolvedPersona && (
            <span className="sw-dash-viewas-note">
              Previewing the {personaLabel(viewAs)} view — your own role is {personaLabel(resolvedPersona)}.
            </span>
          )}
        </div>
      )}

      {err && (
        <div
          style={{
            border: "1px solid #f3c2c2",
            background: "#fdecec",
            color: "#8a1c1c",
            borderRadius: 10,
            padding: "0.7rem 0.9rem",
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {err}
        </div>
      )}

      {/* KPIs */}
      <div className="sw-kpi-grid" style={{ marginBottom: "1.9rem" }}>
        {tiles.map((t, i) => (
          <Kpi key={i} value={t.value} label={t.label} tone={t.tone} onClick={t.onClick} />
        ))}
      </div>

      {/* Clubs needing attention */}
      <h2 style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.3rem", margin: "0 0 0.7rem" }}>
        Clubs needing attention
      </h2>
      <div style={{ ...card, marginBottom: "1.9rem" }}>
        {!d ? (
          <div style={{ color: "#667085" }}>Loading…</div>
        ) : d.at_risk.length === 0 ? (
          <div style={{ color: "#667085" }}>
            {persona === "admin"
              ? "Nothing flagged on your clubs — all moving along. 🎉"
              : "Nothing flagged — every active setup is moving along. 🎉"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {d.at_risk.map((r) => (
              <div
                key={r.club_id}
                onClick={() => go("__super_clubs")}
                role="button"
                tabIndex={0}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  borderBottom: "1px solid #f1f2f5",
                  paddingBottom: "0.85rem",
                  cursor: "pointer",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700 }}>{r.club_name}</div>
                  <div style={{ color: "#a12727", fontSize: "0.85rem" }}>{r.reason}</div>
                </div>
                <div style={{ width: 120 }}>
                  <div style={{ height: 8, borderRadius: 999, background: "#eef0f3", overflow: "hidden" }}>
                    <div style={{ width: `${r.pct}%`, height: "100%", background: "var(--accent, #2F6BFF)" }} />
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#98a2b3", marginTop: "0.2rem", textAlign: "right" }}>
                    {r.pct}% set up
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.3rem", margin: "0 0 0.7rem" }}>
        Quick actions
      </h2>
      <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {actions.map((q) => (
          <button
            key={q.key}
            onClick={() => go(q.key)}
            style={{
              textAlign: "left",
              border: "1px solid #e6e8ec",
              borderLeft: "4px solid var(--accent, #2F6BFF)",
              borderRadius: 12,
              background: "#fff",
              padding: "1rem 1.1rem",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "0.2rem" }}>{q.label}</div>
            <div style={{ color: "#667085", fontSize: "0.86rem" }}>{q.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
