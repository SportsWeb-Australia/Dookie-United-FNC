import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { SETUP_ROUTES } from "./setupRoutes";

/**
 * SetupCard — a compact "Get started" summary for the club dashboard, so setup
 * lives where the admin lands (Shopify-style). Shows overall progress and the
 * next unfinished step with a one-tap action, plus a link into the full
 * checklist. Renders nothing once setup is complete (or before data loads).
 *
 * Reads the same sources as ClubSetup: launch_step_catalog (audience='club')
 * for the step list, club_setup_status for auto-detection, and manual ticks.
 *
 * Props:
 *   clubId — the active club.
 *   go     — admin navigator (screen key). go('__setup') opens the full
 *            checklist; the next-step button maps the step's cta_route via
 *            SETUP_ROUTES and jumps straight to that screen.
 */

type Step = { step_key: string; title: string; cta_route: string | null; sort: number };

export function SetupCard({ clubId, go }: { clubId: string; go: (key: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<Step[]>([]);
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!clubId) return;
    let alive = true;
    (async () => {
      try {
        const { data: cat } = await supabase
          .from("launch_step_catalog")
          .select("step_key,title,cta_route,sort")
          .eq("active", true)
          .in("audience", ["club", "both"])
          .order("sort");
        const catalog = (cat ?? []) as Step[];

        const done = new Set<string>();
        // Auto-detected completion.
        try {
          const { data: a } = await supabase.rpc("club_setup_status", { p_club_id: clubId });
          if (a && typeof a === "object") {
            for (const [k, v] of Object.entries(a as Record<string, unknown>)) if (v) done.add(k);
          }
        } catch {
          /* detection optional */
        }
        // Fold in manual ticks.
        try {
          const { data: lid } = await supabase.rpc("start_club_launch", { p_club_id: clubId });
          if (lid) {
            const { data: prog } = await supabase
              .from("launch_step_progress")
              .select("step_key,status")
              .eq("launch_id", lid as string);
            for (const r of prog ?? []) {
              const row = r as { step_key: string; status: string };
              if (row.status === "done") done.add(row.step_key);
            }
          }
        } catch {
          /* manual optional */
        }

        if (!alive) return;
        setSteps(catalog);
        setDoneKeys(done);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [clubId]);

  if (loading || steps.length === 0) return null;

  const total = steps.length;
  const done = steps.filter((s) => doneKeys.has(s.step_key)).length;
  if (done >= total) return null; // setup complete — hide the card

  const pct = Math.round((done / total) * 100);
  const next = steps.find((s) => !doneKeys.has(s.step_key)) ?? null;
  const nextScreen = next && next.cta_route ? SETUP_ROUTES[next.cta_route] ?? "__setup" : "__setup";

  return (
    <div
      style={{
        border: "1px solid #e3e7ee",
        borderRadius: 14,
        padding: "16px 18px",
        background: "linear-gradient(180deg,#f7f9ff,#ffffff)",
        margin: "0 0 18px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15.5, color: "#11161f" }}>Finish setting up your club</strong>
        <span style={{ fontSize: 12.5, color: "#5b6573" }}>
          {done} of {total} done · {pct}%
        </span>
      </div>

      <div style={{ height: 8, borderRadius: 999, background: "#e7e9ee", overflow: "hidden", margin: "10px 0 14px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "var(--club-accent, #2F6BFF)", transition: "width .3s ease" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {next && (
          <>
            <span style={{ fontSize: 13.5, color: "#11161f" }}>
              <span style={{ color: "#7b8494" }}>Next:</span> {next.title}
            </span>
            <button
              onClick={() => go(nextScreen)}
              style={{
                border: "none",
                color: "#fff",
                background: "var(--club-accent, #2F6BFF)",
                borderRadius: 8,
                padding: "7px 13px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Do this →
            </button>
          </>
        )}
        <button
          onClick={() => go("__setup")}
          style={{
            border: "none",
            background: "transparent",
            color: "var(--club-accent, #2F6BFF)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            padding: 0,
            marginLeft: "auto",
          }}
        >
          Open checklist
        </button>
      </div>
    </div>
  );
}
