import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

/**
 * ClubSetup — the club-facing "Get started" checklist, Shopify-style.
 *
 * Steps tick THEMSELVES from real data (club_setup_status RPC): add a logo and
 * the branding step goes green on your next visit — no manual ticking needed.
 * The first unfinished step opens automatically; finished steps collapse. A
 * manual override stays available for anything detection can't see.
 *
 * Engine: shared launch_step_catalog / launch_step_progress (audience='club')
 * for the step list + manual overrides; club_setup_status for auto-detection.
 *
 * Props:
 *   clubId   — the active club.
 *   clubName — for the heading.
 *   onGo     — (cta_route) => navigate the admin to that screen.
 */

type CatalogStep = {
  step_key: string;
  title: string;
  help_md: string | null;
  expected_label: string | null;
  cta_route: string | null;
  sort: number;
};

type StepStatus = "pending" | "done" | "skipped" | "blocked";

export function ClubSetup({
  clubId,
  clubName,
  onGo,
}: {
  clubId: string;
  clubName?: string;
  onGo: (route: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchId, setLaunchId] = useState<string | null>(null);
  const [steps, setSteps] = useState<CatalogStep[]>([]);
  const [status, setStatus] = useState<Record<string, StepStatus>>({});
  const [auto, setAuto] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1) Ensure a launch exists (idempotent; back-fills new steps).
      const { data: lid, error: lerr } = await supabase.rpc("start_club_launch", { p_club_id: clubId });
      if (lerr) throw lerr;
      const launch = lid as string;
      setLaunchId(launch);

      // 2) Club steps from the shared catalog, in checklist order.
      const { data: cat, error: cerr } = await supabase
        .from("launch_step_catalog")
        .select("step_key,title,help_md,expected_label,cta_route,sort")
        .eq("active", true)
        .in("audience", ["club", "both"])
        .order("sort");
      if (cerr) throw cerr;
      const catalog = (cat ?? []) as CatalogStep[];
      setSteps(catalog);

      // 3) Manual overrides for this launch.
      const { data: prog, error: perr } = await supabase
        .from("launch_step_progress")
        .select("step_key,status")
        .eq("launch_id", launch);
      if (perr) throw perr;
      const map: Record<string, StepStatus> = {};
      for (const r of prog ?? []) map[r.step_key as string] = r.status as StepStatus;
      setStatus(map);

      // 4) Auto-detection — best effort; never blocks the checklist.
      let autoMap: Record<string, boolean> = {};
      try {
        const { data: a } = await supabase.rpc("club_setup_status", { p_club_id: clubId });
        if (a && typeof a === "object") autoMap = a as Record<string, boolean>;
      } catch {
        /* detection is optional — run club-setup-status.sql to enable it */
      }
      setAuto(autoMap);

      // 5) Auto-advance: open the first step that isn't done yet.
      const firstOpen = catalog.find((s) => !(autoMap[s.step_key] || map[s.step_key] === "done"));
      setOpenKey(firstOpen ? firstOpen.step_key : null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Couldn't load the setup checklist.");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (clubId) load();
  }, [clubId, load]);

  const isDone = (key: string) => auto[key] || status[key] === "done";

  async function toggle(stepKey: string) {
    if (!launchId) return;
    const next: StepStatus = status[stepKey] === "done" ? "pending" : "done";
    setBusy(stepKey);
    const prev = status[stepKey];
    setStatus((s) => ({ ...s, [stepKey]: next })); // optimistic
    const { error: uerr } = await supabase
      .from("launch_step_progress")
      .update({ status: next })
      .eq("launch_id", launchId)
      .eq("step_key", stepKey);
    if (uerr) {
      setStatus((s) => ({ ...s, [stepKey]: prev })); // revert
      setError(uerr.message);
    }
    setBusy(null);
  }

  const total = steps.length;
  const done = steps.filter((s) => isDone(s.step_key)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  if (loading) {
    return (
      <div className="sw-admin-screen">
        <h2 className="sw-admin-title">Get started</h2>
        <p>Loading your setup checklist…</p>
      </div>
    );
  }

  return (
    <div className="sw-admin-screen">
      <h2 className="sw-admin-title">Get started</h2>
      <p style={{ color: "#5b6573", marginTop: -4 }}>
        {clubName ? `${clubName} — ` : ""}work through these to get your club ready. Steps tick themselves as you go,
        and the next one opens automatically. DNS &amp; go-live are handled by SportsWeb.
      </p>

      {error && (
        <div style={{ background: "#fdecee", color: "#9b1c2b", padding: "10px 12px", borderRadius: 8, margin: "12px 0" }}>
          {error}
          {steps.length === 0 && (
            <div style={{ marginTop: 6, fontSize: 13 }}>
              If this is the first run, make sure <code>club-setup-steps.sql</code> and{" "}
              <code>club-setup-status.sql</code> have been run in Supabase.
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      <div style={{ margin: "14px 0 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#5b6573", marginBottom: 6 }}>
          <span>{done} of {total} done</span>
          <span>{pct}%</span>
        </div>
        <div style={{ height: 10, borderRadius: 999, background: "#e7e9ee", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: pct === 100 ? "#1f9d57" : "var(--club-accent, #2F6BFF)",
              transition: "width .3s ease",
            }}
          />
        </div>
        {pct === 100 && (
          <p style={{ color: "#1f9d57", fontWeight: 600, marginTop: 10 }}>
            🎉 All set — the club is ready for SportsWeb to take live.
          </p>
        )}
      </div>

      {/* Steps — accordion, one open at a time, auto-advancing */}
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {steps.map((s, i) => {
          const stepDone = isDone(s.step_key);
          const open = openKey === s.step_key;
          const autoDone = !!auto[s.step_key];
          return (
            <li
              key={s.step_key}
              style={{
                border: "1px solid #e7e9ee",
                borderRadius: 12,
                background: stepDone ? "#f4faf6" : "#fff",
                overflow: "hidden",
              }}
            >
              {/* Header — click to expand / collapse */}
              <button
                onClick={() => setOpenKey(open ? null : s.step_key)}
                style={{
                  width: "100%",
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 16px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flex: "0 0 auto",
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    border: stepDone ? "none" : "2px solid #c2c8d2",
                    background: stepDone ? "#1f9d57" : "#fff",
                    color: "#fff",
                    fontSize: 15,
                    lineHeight: "26px",
                    textAlign: "center",
                  }}
                >
                  {stepDone ? "✓" : ""}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontWeight: 700,
                    color: stepDone ? "#5b6573" : "#11161f",
                    textDecoration: stepDone ? "line-through" : "none",
                  }}
                >
                  {i + 1}. {s.title}
                </span>
                {s.expected_label && !stepDone && (
                  <span style={{ fontSize: 12, color: "#7b8494", background: "#f1f3f6", padding: "2px 8px", borderRadius: 999 }}>
                    {s.expected_label}
                  </span>
                )}
                <span style={{ flex: "0 0 auto", color: "#9aa3b2", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>
                  ›
                </span>
              </button>

              {/* Body */}
              {open && (
                <div style={{ padding: "0 16px 16px 56px" }}>
                  {s.help_md && <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "#5b6573" }}>{s.help_md}</p>}
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    {s.cta_route && (
                      <button
                        onClick={() => onGo(s.cta_route!)}
                        style={{
                          border: "none",
                          color: "#fff",
                          background: "var(--club-accent, #2F6BFF)",
                          borderRadius: 8,
                          padding: "8px 14px",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontSize: 13.5,
                        }}
                      >
                        {stepDone ? "Open again" : "Go there"} →
                      </button>
                    )}
                    {autoDone ? (
                      <span style={{ fontSize: 12.5, color: "#1f9d57" }}>✓ Detected automatically</span>
                    ) : (
                      <button
                        onClick={() => toggle(s.step_key)}
                        disabled={busy === s.step_key}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#7b8494",
                          cursor: "pointer",
                          fontSize: 12.5,
                          textDecoration: "underline",
                          padding: 0,
                        }}
                      >
                        {status[s.step_key] === "done" ? "Mark as not done" : "Mark as done"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
