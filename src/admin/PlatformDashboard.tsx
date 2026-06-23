import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { recentMessages, messagingBalance, type RecentMessage, type SmsBalance } from "../lib/superAdmin";
import { checkProviders, type ProviderStatus } from "../lib/comms";

const MSG_PROVIDERS: { key: keyof ProviderStatus; name: string; manage: string; manageLabel: string; report: string }[] = [
  { key: "sms", name: "SMS · ClickSend", manage: "https://dashboard.clicksend.com/account/billing", manageLabel: "Add credit ↗", report: "https://dashboard.clicksend.com/reports/sms" },
  { key: "email", name: "Email · ZeptoMail", manage: "https://zeptomail.zoho.com.au/", manageLabel: "Add credit ↗", report: "https://zeptomail.zoho.com.au/" },
  { key: "push", name: "Push · WebPushr", manage: "https://dashboard.webpushr.com/", manageLabel: "Manage plan ↗", report: "https://dashboard.webpushr.com/" },
];

const favicon = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

const AI_TOOLS = [
  { name: "ChatGPT", url: "https://chatgpt.com/", domain: "chatgpt.com" },
  { name: "Claude", url: "https://claude.ai/", domain: "claude.ai" },
  { name: "Canva", url: "https://www.canva.com/", domain: "canva.com" },
];

const INFRA_TOOLS = [
  { name: "Supabase", url: "https://supabase.com/dashboard/project/uzibfawcwoapfbigpzum", domain: "supabase.com" },
  { name: "Vercel", url: "https://vercel.com/dashboard", domain: "vercel.com" },
  { name: "GitHub", url: "https://github.com/SportsWeb-Australia/SportsWeb-One", domain: "github.com" },
  { name: "VentraIP", url: "https://vip.ventraip.com.au/", domain: "ventraip.com.au" },
  { name: "Pixefy (device preview)", url: "https://www.pixefy.io/", domain: "pixefy.io" },
];

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
  clubs_by_plan?: Record<string, number> | null;
  clubs_paying?: number | null;
  clubs_trial?: number | null;
  clubs_demo?: number | null;
  clubs_churned?: number | null;
  avg_modules_per_club?: number | null;
  total_members?: number | null;
  total_teams?: number | null;
  avg_members_per_club?: number | null;
  activation_rate?: number | null;
  conversion_rate?: number | null;
  messages_month?: number | null;
  members_new_month?: number | null;
  at_risk: AtRisk[];
};

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: tone, fontFamily: "var(--font-display, inherit)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#667085", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function PlanBars({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return <div style={{ color: "#667085", fontSize: 13 }}>No clubs yet.</div>;
  const max = Math.max(1, ...entries.map(([, n]) => n));
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {entries.map(([plan, n]) => (
        <div key={plan} style={{ display: "grid", gridTemplateColumns: "96px 1fr 34px", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, textTransform: "capitalize", color: "#11161f" }}>{plan}</span>
          <span style={{ height: 8, borderRadius: 999, background: "#eef1f6", overflow: "hidden" }}>
            <span style={{ display: "block", height: "100%", width: `${Math.round((n / max) * 100)}%`, background: "var(--accent, #2F6BFF)" }} />
          </span>
          <span style={{ fontSize: 13, color: "#667085", textAlign: "right" }}>{n}</span>
        </div>
      ))}
    </div>
  );
}

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

  // Messaging oversight (platform view only).
  const [providers, setProviders] = useState<ProviderStatus | null>(null);
  const [balance, setBalance] = useState<SmsBalance | null>(null);
  const [recent, setRecent] = useState<RecentMessage[]>([]);

  useEffect(() => {
    if (scope === "mine") return;
    let live = true;
    (async () => {
      const [p, b, r] = await Promise.all([checkProviders(), messagingBalance(), recentMessages(8)]);
      if (!live) return;
      setProviders(p);
      setBalance(b);
      setRecent(r);
    })();
    return () => {
      live = false;
    };
  }, [scope]);

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
          { value: d?.total_members ?? null, label: "Total members · all clubs" },
          { value: d?.total_teams ?? null, label: "Total teams · all clubs" },
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
          { value: d?.total_members ?? null, label: "Total members · all clubs" },
          { value: d?.total_teams ?? null, label: "Total teams · all clubs" },
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

      {/* Accounts & upgrade opportunities — platform-wide view only */}
      {d && d.scope !== "mine" && (
        <div style={{ marginBottom: "1.9rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.3rem", margin: "0 0 0.7rem" }}>
            Accounts &amp; upgrade opportunities
          </h2>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))" }}>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <Stat label="Paying" value={d.clubs_paying ?? 0} tone="#1f9d57" />
                <Stat label="On trial" value={d.clubs_trial ?? 0} tone="#2F6BFF" />
                <Stat label="Demo" value={d.clubs_demo ?? 0} tone="#8a94a6" />
                <Stat label="Churned" value={d.clubs_churned ?? 0} tone="#d64545" />
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#667085" }}>
                {(d.clubs_trial ?? 0) + (d.clubs_demo ?? 0)} trial/demo{" "}
                {(d.clubs_trial ?? 0) + (d.clubs_demo ?? 0) === 1 ? "club is a potential upgrade" : "clubs are potential upgrades"}.
              </p>
            </div>
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <Stat label="Activation" value={d.activation_rate ?? 0} tone="#11161f" />
                <Stat label="Trial → paid" value={d.conversion_rate ?? 0} tone="#7a3df5" />
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#667085" }}>
                Activation = % of clubs live; conversion = paying ÷ (paying + trial). Shown as %.
              </p>
            </div>
            <div style={card}>
              <Stat label="Avg modules / club" value={d.avg_modules_per_club ?? 0} tone="#11161f" />
              <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#667085" }}>
                {d.modules_enabled} enabled across {d.clubs_total} {d.clubs_total === 1 ? "club" : "clubs"}.
              </p>
            </div>
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, color: "#667085", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 10 }}>
                Clubs by plan
              </div>
              <PlanBars data={d.clubs_by_plan ?? {}} />
            </div>
            <div style={{ ...card, gridColumn: "1 / -1" }}>
              <div style={{ fontSize: 12, color: "#667085", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12 }}>
                Growth &amp; engagement (this month)
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", gap: 12, flexWrap: "wrap" }}>
                <Stat label="New members" value={d.members_new_month ?? 0} tone="#1f9d57" />
                <Stat label="Avg members / club" value={d.avg_members_per_club ?? 0} tone="#11161f" />
                <Stat label="Messages sent" value={d.messages_month ?? 0} tone="#2F6BFF" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messaging & credits — platform-wide view only */}
      {d && d.scope !== "mine" && (
        <div style={{ marginBottom: "1.9rem" }}>
          <h2 style={{ fontFamily: "var(--font-display, inherit)", fontSize: "1.3rem", margin: "0 0 0.7rem" }}>
            Messaging &amp; credits
          </h2>
          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))" }}>
            {MSG_PROVIDERS.map((p) => {
              const on = providers ? providers[p.key] : null;
              return (
                <div key={p.key} style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 999, display: "inline-block", background: on == null ? "#cbd2dc" : on ? "#1f9d57" : "#d64545" }} />
                    <strong style={{ fontSize: 14 }}>{p.name}</strong>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#667085", minHeight: 18 }}>
                    {on == null ? "Checking…" : on ? "Connected" : "Not connected"}
                    {p.key === "sms" && balance?.connected && balance.balance != null && (
                      <> · Balance {balance.currency ?? ""} {Number(balance.balance).toFixed(2)}</>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
                    <a href={p.manage} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--accent, #2F6BFF)", textDecoration: "none", fontWeight: 600 }}>{p.manageLabel}</a>
                    <a href={p.report} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#667085", textDecoration: "none" }}>Reporting ↗</a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent sends across all clubs — failures highlighted */}
          <div style={{ ...card, marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "#667085", textTransform: "uppercase", letterSpacing: ".04em" }}>Recent sends across all clubs</span>
              <button onClick={() => go("__super_integrations")} style={{ fontSize: 12.5, background: "none", border: "none", color: "var(--accent, #2F6BFF)", cursor: "pointer", fontWeight: 600 }}>Integrations →</button>
            </div>
            {recent.length === 0 ? (
              <div style={{ color: "#667085", fontSize: 13 }}>No sends logged yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {recent.map((m) => {
                  const failed = m.status === "failed";
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "6px 8px", borderRadius: 8, background: failed ? "#fdecec" : "#f6f8fb" }}>
                      <span style={{ fontWeight: 600, minWidth: 52, color: failed ? "#b42318" : "#1f9d57" }}>{failed ? "Failed" : "Sent"}</span>
                      <span style={{ flex: 1, color: "#11161f", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.club_name ?? "—"} · {(m.channels ?? []).join("/")} · {m.recipient_count} {m.recipient_count === 1 ? "person" : "people"}
                      </span>
                      <span style={{ color: "#8a94a6", whiteSpace: "nowrap" }}>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Zoho connection action folded in */}
          <div style={{ ...card, marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ fontSize: 13, color: "#475467" }}>
              <strong style={{ color: "#11161f" }}>Zoho connection</strong> — powers live data, billing top-ups and the Workspace deep links.
            </div>
            <button onClick={() => go("__super_integrations")} className="sw-btn sw-btn--ghost" style={{ fontSize: 13 }}>Manage / reconnect</button>
          </div>

          {/* Creative & AI — logos with pill buttons underneath */}
          <div style={{ ...card, marginTop: "1rem" }}>
            <div style={{ fontSize: 12, color: "#667085", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12 }}>Creative &amp; AI</div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              {AI_TOOLS.map((t) => (
                <div key={t.name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <img src={favicon(t.domain)} alt={t.name} width={36} height={36} style={{ borderRadius: 8 }} />
                  <a href={t.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent, #2F6BFF)", textDecoration: "none", padding: "5px 14px", border: "1px solid #e3e8ef", borderRadius: 999 }}>{t.name} ↗</a>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#8a94a6", display: "block", marginTop: 10 }}>Opens your account in a new tab.</span>
          </div>

          {/* Dev & infrastructure shortcuts */}
          <div style={{ ...card, marginTop: "1rem", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#667085", textTransform: "uppercase", letterSpacing: ".04em", marginRight: 4 }}>Dev &amp; infrastructure</span>
            {INFRA_TOOLS.map((t) => (
              <a key={t.name} href={t.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "#11161f", textDecoration: "none", padding: "5px 12px", border: "1px solid #e3e8ef", borderRadius: 999 }}>
                <img src={favicon(t.domain)} alt="" width={16} height={16} style={{ borderRadius: 4 }} />
                {t.name} ↗
              </a>
            ))}
          </div>
        </div>
      )}

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
