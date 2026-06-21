import type { ReactNode } from "react";
import type { Metrics } from "../lib/roleKpis";
import {
  buildHealth,
  buildRedFlags,
  buildTodos,
  type CentreLocal,
  type DataState,
  type Status,
} from "../lib/presidentCentre";

const STATE_LABEL: Record<DataState, string> = { live: "Live", mock: "Sample", setup: "Set up", manual: "Manual" };

function StateBadge({ state }: { state: DataState }) {
  return <span className={`sw-cc-state sw-cc-state--${state}`}>{STATE_LABEL[state]}</span>;
}
function dot(status: Status): ReactNode {
  return <span className={`sw-cc-dot sw-cc-dot--${status}`} aria-hidden="true" />;
}

type CentreProps = { metrics: Metrics; local: CentreLocal; go: (key: string) => void };

/* ── Club Health Score ─────────────────────────────── */
export function HealthScore({ metrics, local, go }: CentreProps) {
  const health = buildHealth(metrics, local);
  return (
    <section className="sw-cc-block">
      <div className="sw-cc-health">
        <div className={`sw-cc-score sw-cc-score--${health.status}`}>
          <span className="sw-cc-score-num">{health.overall ?? "—"}</span>
          <span className="sw-cc-score-cap">Club health</span>
        </div>
        <div className="sw-cc-health-copy">
          <h3>Club health score</h3>
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
              {dot(a.status)}
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
    </section>
  );
}

/* ── Red Flag Alerts ──────────────────────────────── */
export function RedFlags({ metrics, local, go }: CentreProps) {
  const flags = buildRedFlags(metrics, local);
  return (
    <section className="sw-cc-block">
      <h3 className="sw-cc-h">Red flag alerts</h3>
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
    </section>
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
    <section className="sw-cc-block">
      <h3 className="sw-cc-h">President to-do centre</h3>
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
    </section>
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
        <button className="sw-dash-panellink" onClick={() => go("__modules")}>
          Manage modules →
        </button>
      </div>
      <div className="sw-swf-grid">
        <div className="sw-swf-card">
          <span className="sw-swf-cap">Active modules ({activeCount})</span>
          <div className="sw-swf-mods">
            {activeModules.length ? (
              activeModules.map((m) => <span key={m} className="sw-swf-chip">{m}</span>)
            ) : (
              <span className="sw-cc-area-reason">No modules active yet.</span>
            )}
          </div>
          {lockedCount > 0 && <span className="sw-swf-locked">{lockedCount} more available to add</span>}
        </div>
        <div className="sw-swf-card">
          <span className="sw-swf-cap">Your support team</span>
          <div className="sw-swf-support">
            <p><strong>Account manager</strong><br />Carson Brooks · carson@sportsweb.com.au</p>
            <p><strong>Support</strong><br />support@sportsweb.com.au · Mon–Fri</p>
            <p><strong>Plan</strong><br />SportsWeb One · Club</p>
          </div>
        </div>
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
    <section className="sw-cc-block">
      <h3 className="sw-cc-h">
        Trends <span className="sw-sample-badge">Sample data</span>
      </h3>
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
    </section>
  );
}
