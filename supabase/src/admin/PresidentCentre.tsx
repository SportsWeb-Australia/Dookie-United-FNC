import { useState, type ReactNode } from "react";
import type { Metrics } from "../lib/roleKpis";
import {
  buildHealth,
  buildRedFlags,
  buildTodos,
  type CentreLocal,
  type DataState,
  type Status,
} from "../lib/presidentCentre";

/** Collapsible dashboard section with a header bar + chevron. */
export function Collapsible({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="sw-collapse">
      <button className="sw-collapse-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="sw-collapse-title">
          {title}
          {badge}
        </span>
        <span className="sw-collapse-chev" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="sw-collapse-body">{children}</div>}
    </section>
  );
}

const STATE_LABEL: Record<DataState, string> = { live: "Live", mock: "Sample", setup: "Set up", manual: "Manual" };

function StateBadge({ state }: { state: DataState }) {
  return <span className={`sw-cc-state sw-cc-state--${state}`}>{STATE_LABEL[state]}</span>;
}
function dot(status: Status): ReactNode {
  return <span className={`sw-cc-dot sw-cc-dot--${status}`} aria-hidden="true" />;
}

const ai = (inner: ReactNode): ReactNode => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {inner}
  </svg>
);
const AREA_ICON: Record<string, ReactNode> = {
  financial: ai(<path d="M12 2v20M17 6H9a3 3 0 0 0 0 6h6a3 3 0 0 1 0 6H7" />),
  membership: ai(<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>),
  volunteers: ai(<><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><circle cx="17" cy="9" r="2" /></>),
  compliance: ai(<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" />),
  sponsorship: ai(<><path d="M3 12l9-9 9 9-9 9z" /><circle cx="9" cy="9" r="1.5" /></>),
  events: ai(<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M9 3v4M15 3v4" /></>),
  team: ai(<><path d="M6 4l3 1 3-1 3 1 3-1v4l-3 1v9H9v-9L6 8z" /></>),
  engagement: ai(<path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />),
  governance: ai(<><path d="M3 21h18M5 21V10M19 21V10M4 10l8-6 8 6" /></>),
};
function areaIcon(key: string, status: Status): ReactNode {
  const inner = AREA_ICON[key];
  if (!inner) return dot(status);
  return <span className={`sw-cc-area-ic sw-cc-area-ic--${status}`}>{inner}</span>;
}

type CentreProps = { metrics: Metrics; local: CentreLocal; go: (key: string) => void };

/* ── Club Health Score ─────────────────────────────── */
export function HealthScore({ metrics, local, go }: CentreProps) {
  const health = buildHealth(metrics, local);
  return (
    <Collapsible title="Club health score">
      <div className="sw-cc-health">
        <div className={`sw-cc-score sw-cc-score--${health.status}`}>
          <span className="sw-cc-score-num">{health.overall ?? "—"}</span>
          <span className="sw-cc-score-cap">Club health</span>
        </div>
        <div className="sw-cc-health-copy">
          <p>
            An at-a-glance read on the whole club. Areas marked <em>Set up</em> or <em>Sample</em> light up with real
            numbers as you connect modules and Zoho.
          </p>
        </div>
      </div>
      <div className="sw-cc-areas">
        {health.areas.map((a) => (
          <div key={a.key} className={`sw-cc-area sw-cc-area--${a.status}`}>
            <div className="sw-cc-area-top">
              {areaIcon(a.key, a.status)}
              <span className="sw-cc-area-label">{a.label}</span>
              <span className="sw-cc-area-score">{a.score == null ? "—" : `${a.score}`}</span>
            </div>
            <p className="sw-cc-area-reason">{a.reason}</p>
            <div className="sw-cc-area-foot">
              <span className="sw-cc-owner">{a.owner}</span>
              <StateBadge state={a.state} />
            </div>
            {a.action && (
              <button className="sw-cc-action" onClick={() => a.go && go(a.go)} disabled={!a.go}>
                {a.action} →
              </button>
            )}
          </div>
        ))}
      </div>
    </Collapsible>
  );
}

/* ── Red Flag Alerts ──────────────────────────────── */
export function RedFlags({ metrics, local, go }: CentreProps) {
  const flags = buildRedFlags(metrics, local);
  return (
    <Collapsible title="Red flag alerts" defaultOpen={false}>
      <div className="sw-cc-flags">
        {flags.map((f) => (
          <div key={f.id} className={`sw-cc-flag sw-cc-flag--${f.severity}`}>
            <div className="sw-cc-flag-main">
              <span className="sw-cc-flag-title">{f.title}</span>
              <span className="sw-cc-flag-meta">
                {f.category} · {f.severity} · {f.owner}
                {f.due ? ` · due ${f.due}` : ""}
              </span>
            </div>
            <div className="sw-cc-flag-side">
              <StateBadge state={f.state} />
              <button className="sw-cc-flag-btn" onClick={() => f.go && go(f.go)} disabled={!f.go}>
                {f.action} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </Collapsible>
  );
}

/* ── President To-Do Centre (incl. season planning) ── */
const BUCKETS: { key: "urgent" | "week" | "month" | "season"; label: string }[] = [
  { key: "urgent", label: "Urgent" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "season", label: "Season planning" },
];

export function TodoCentre({ metrics, local, go }: CentreProps) {
  const todos = buildTodos(metrics, local);
  return (
    <Collapsible title="President to-do centre" defaultOpen={false}>
      <div className="sw-cc-todos">
        {BUCKETS.map((b) => {
          const items = todos.filter((t) => t.bucket === b.key);
          return (
            <div key={b.key} className="sw-cc-todocol">
              <header className={`sw-cc-todohead sw-cc-todohead--${b.key}`}>
                {b.label} <span>{items.length}</span>
              </header>
              {items.length === 0 ? (
                <p className="sw-cc-todoempty">Nothing here.</p>
              ) : (
                items.map((t) => (
                  <button key={t.id} className="sw-cc-todo" onClick={() => t.go && go(t.go)} disabled={!t.go}>
                    <span className="sw-cc-todo-title">{t.title}</span>
                    <span className="sw-cc-todo-foot">
                      <span>{t.owner}</span>
                      <StateBadge state={t.state} />
                    </span>
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>
    </Collapsible>
  );
}

/* ── Communications summary ───────────────────────── */
export function CommsSummary({ memberCount, go }: { memberCount: number; go: (key: string) => void }) {
  return (
    <section className="sw-cc-block">
      <h3 className="sw-cc-h">Communications</h3>
      <div className="sw-cc-comms">
        <div className="sw-cc-comms-copy">
          <strong>{memberCount}</strong> people on file — reach them by email or SMS. Keep the club in the loop with a
          weekly update.
          <span className="sw-cc-comms-state"><StateBadge state="live" /></span>
        </div>
        <button className="sw-btn" onClick={() => go("__comms")}>
          Send a message
        </button>
      </div>
    </section>
  );
}

/* ── SportsWeb One footer (modules + support) ─────── */
export function SportsWebFooter({
  activeModules,
  activeCount,
  lockedCount,
  go,
}: {
  activeModules: string[];
  activeCount: number;
  lockedCount: number;
  go: (key: string) => void;
}) {
  return (
    <section className="sw-swf">
      <div className="sw-swf-head">
        <h3>SportsWeb One</h3>
        <button className="sw-dash-panellink" onClick={() => go("__account")}>
          View your account →
        </button>
      </div>
      <div className="sw-swf-card">
        <span className="sw-swf-cap">Active modules ({activeCount})</span>
        <div className="sw-swf-mods">
          {activeModules.length ? (
            activeModules.map((m) => (
              <span key={m} className="sw-swf-chip">
                {m}
              </span>
            ))
          ) : (
            <span className="sw-cc-area-reason">No modules active yet.</span>
          )}
        </div>
        {lockedCount > 0 && (
          <span className="sw-swf-locked">
            {lockedCount} more available ·{" "}
            <button className="sw-linklike" onClick={() => go("__modules")}>
              manage modules
            </button>
          </span>
        )}
      </div>
    </section>
  );
}

/* ── Sample trend charts (placeholder until modules/Zoho connected) ── */
const SAMPLE_FIN = [
  { m: "Jan", inc: 5.2, exp: 3.1 },
  { m: "Feb", inc: 3.4, exp: 3.6 },
  { m: "Mar", inc: 6.8, exp: 4.2 },
  { m: "Apr", inc: 4.1, exp: 3.0 },
  { m: "May", inc: 7.5, exp: 5.1 },
  { m: "Jun", inc: 5.9, exp: 3.8 },
];
const SAMPLE_MEM = [
  { m: "Jan", v: 142 },
  { m: "Feb", v: 158 },
  { m: "Mar", v: 171 },
  { m: "Apr", v: 176 },
  { m: "May", v: 189 },
  { m: "Jun", v: 203 },
];

export function SampleCharts() {
  const finMax = Math.max(...SAMPLE_FIN.flatMap((d) => [d.inc, d.exp]));
  const memMax = Math.max(...SAMPLE_MEM.map((d) => d.v));
  return (
    <Collapsible title="Trends" badge={<span className="sw-sample-badge">Sample data</span>}>
      <p className="sw-cc-sample-note">
        These graphs show example figures so you can see the shape of things at a glance. They fill with your club's real
        numbers once Club Finance and your modules are connected.
      </p>
      <div className="sw-chart-grid">
        <div className="sw-chart-card">
          <header>
            <span>Income vs expenses</span>
            <span className="sw-chart-unit">$ '000 / month</span>
          </header>
          <div className="sw-bars">
            {SAMPLE_FIN.map((d) => (
              <div key={d.m} className="sw-bars-col">
                <div className="sw-bars-pair">
                  <span className="sw-bar sw-bar--inc" style={{ height: `${(d.inc / finMax) * 100}%` }} />
                  <span className="sw-bar sw-bar--exp" style={{ height: `${(d.exp / finMax) * 100}%` }} />
                </div>
                <span className="sw-bars-lbl">{d.m}</span>
              </div>
            ))}
          </div>
          <div className="sw-chart-legend">
            <span className="sw-lg sw-lg--inc">Income</span>
            <span className="sw-lg sw-lg--exp">Expenses</span>
          </div>
        </div>
        <div className="sw-chart-card">
          <header>
            <span>Membership growth</span>
            <span className="sw-chart-unit">members</span>
          </header>
          <div className="sw-bars">
            {SAMPLE_MEM.map((d) => (
              <div key={d.m} className="sw-bars-col">
                <div className="sw-bars-pair">
                  <span className="sw-bar sw-bar--mem" style={{ height: `${(d.v / memMax) * 100}%` }} />
                </div>
                <span className="sw-bars-lbl">{d.m}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Collapsible>
  );
}
