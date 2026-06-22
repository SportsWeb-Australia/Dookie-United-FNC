import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import "../styles/launch.css";

/* ----------------------------------------------------------------------------
   Launch Tracker -- the operator checklist surface (Milestone 2).
   Reads the launch tracker tables created by sportsweb_launch_tracker.sql:
   launch_phases, launch_step_catalog, club_launches, launch_step_progress,
   v_club_launch_status, and the launch-evidence storage bucket.

   Access: platform admins for now. The DB (RLS) already blocks operators from
   admin-only steps and scopes them to their region, so the same screen will
   serve scoped operators once their sign-in path is wired.
---------------------------------------------------------------------------- */

type Phase = { phase_no: number; key: string; title: string; summary: string | null; sort: number };
type Step = {
  step_key: string; phase_no: number; title: string; help_md: string | null;
  is_critical: boolean; access_level: "admin_only" | "operator"; sort: number;
};
type Progress = {
  step_key: string; status: "pending" | "done" | "skipped" | "blocked";
  checked_by: string | null; checked_at: string | null; screenshot_path: string | null;
};
type LaunchRow = {
  launch_id: string; club_id: string; club_name: string; club_slug: string;
  status: string; region: string; started_at: string; went_live_at: string | null;
  steps_total: number; steps_done: number; last_activity: string | null;
  current_phase: number; days_to_live: number | null;
};
type ClubRow = { id: string; name: string; slug: string };

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" }) : "";

export function LaunchTracker() {
  const { isPlatformAdmin, userId } = useAuth();

  const [phases, setPhases] = useState<Phase[]>([]);
  const [catalog, setCatalog] = useState<Step[]>([]);
  const [launches, setLaunches] = useState<LaunchRow[]>([]);
  const [clubs, setClubs] = useState<ClubRow[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [progress, setProgress] = useState<Progress[]>([]);
  const [startClubId, setStartClubId] = useState("");
  const [operators, setOperators] = useState<{ user_id: string; region: string; email: string | null }[]>([]);
  const [empEmail, setEmpEmail] = useState("");
  const [empRegion, setEmpRegion] = useState("national");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadAll = useCallback(async () => {
    if (!supabase) return;
    const [ph, cat, lz, cl, op] = await Promise.all([
      supabase.from("launch_phases").select("*").order("sort"),
      supabase.from("launch_step_catalog").select("*").eq("active", true).order("phase_no").order("sort"),
      supabase.from("v_club_launch_status").select("*"),
      supabase.from("clubs").select("id, name, slug").order("name"),
      supabase.from("launch_operators").select("user_id, region, email").order("email"),
    ]);
    setPhases((ph.data as Phase[]) ?? []);
    setCatalog((cat.data as Step[]) ?? []);
    setLaunches((lz.data as LaunchRow[]) ?? []);
    setClubs((cl.data as ClubRow[]) ?? []);
    setOperators((op.data as { user_id: string; region: string; email: string | null }[]) ?? []);
  }, []);

  const loadProgress = useCallback(async (launchId: string) => {
    if (!supabase || !launchId) { setProgress([]); return; }
    const { data } = await supabase
      .from("launch_step_progress").select("step_key,status,checked_by,checked_at,screenshot_path")
      .eq("launch_id", launchId);
    setProgress((data as Progress[]) ?? []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadProgress(selected); }, [selected, loadProgress]);

  const refresh = useCallback(async () => {
    await Promise.all([loadProgress(selected), loadAll()]);
  }, [selected, loadProgress, loadAll]);

  async function startLaunch() {
    if (!supabase || !startClubId) return;
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("start_club_launch", { p_club_id: startClubId, p_region: "national" });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setStartClubId("");
    await loadAll();
    setSelected(data as string);
  }

  // Opening a launch re-syncs its steps, so any phase steps added since it
  // started are backfilled (start_club_launch is idempotent).
  async function openLaunch(l: LaunchRow) {
    if (supabase) await supabase.rpc("start_club_launch", { p_club_id: l.club_id, p_region: l.region });
    setSelected(l.launch_id);
  }

  async function addEmployee() {
    if (!supabase || !empEmail.trim()) return;
    setBusy(true); setMsg("");
    const { data, error } = await supabase.functions.invoke("add-operator", {
      body: { email: empEmail.trim(), region: empRegion.trim() || "national" },
    });
    setBusy(false);
    const errText = error?.message || (data as { error?: string } | null)?.error;
    if (errText) { setMsg(errText); return; }
    const invited = (data as { invited?: boolean } | null)?.invited;
    setMsg(invited
      ? `Invite sent to ${empEmail.trim()} — they set a password, then see only Launches.`
      : `${empEmail.trim()} added as an operator.`);
    setEmpEmail("");
    await loadAll();
  }

  async function toggleStep(step: Step, row: Progress | undefined) {
    if (!supabase || !selected || busy) return;
    const isDone = row?.status === "done";
    if (!isDone && step.is_critical && !row?.screenshot_path) {
      setMsg(`"${step.title}" is critical -- add a screenshot before completing it.`);
      return;
    }
    setBusy(true); setMsg("");
    const { error } = await supabase.from("launch_step_progress")
      .update({ status: isDone ? "pending" : "done" })
      .eq("launch_id", selected).eq("step_key", step.step_key);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    await refresh();
  }

  async function uploadEvidence(step: Step, file: File) {
    if (!supabase || !selected) return;
    setBusy(true); setMsg("");
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${selected}/${step.step_key}-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("launch-evidence").upload(path, file, { upsert: true });
    if (up.error) { setBusy(false); setMsg(up.error.message); return; }
    const { error } = await supabase.from("launch_step_progress")
      .update({ screenshot_path: path }).eq("launch_id", selected).eq("step_key", step.step_key);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    await loadProgress(selected);
  }

  async function viewEvidence(path: string) {
    if (!supabase) return;
    const { data } = await supabase.storage.from("launch-evidence").createSignedUrl(path, 120);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  async function markLive() {
    if (!supabase || !selected) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("club_launches")
      .update({ status: "live", went_live_at: new Date().toISOString() }).eq("id", selected);
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    await refresh();
  }

  const progressByKey = useMemo(() => {
    const m: Record<string, Progress> = {};
    progress.forEach((p) => { m[p.step_key] = p; });
    return m;
  }, [progress]);

  const phaseTitle = (no: number) => phases.find((p) => p.phase_no === no)?.title ?? `Phase ${no}`;
  const launchedClubIds = new Set(launches.map((l) => l.club_id));
  const startable = clubs.filter((c) => !launchedClubIds.has(c.id));
  const current = launches.find((l) => l.launch_id === selected);

  if (!isPlatformAdmin) {
    return <div className="sw-launch"><p className="lx-sub">This area is for SportsWeb platform staff.</p></div>;
  }

  // ---- Board view -----------------------------------------------------------
  if (!selected) {
    return (
      <div className="sw-launch">
        <h2>Club Launches</h2>
        <p className="lx-sub">Every club going live, and exactly where it's up to. Tick steps as you go;
          critical steps need a screenshot, and each tick records who did it and when.</p>
        {msg && <div className="lx-msg">{msg}</div>}

        <div className="sw-launch-board">
          {launches.map((l) => {
            const pct = l.steps_total ? Math.round((l.steps_done / l.steps_total) * 100) : 0;
            return (
              <button key={l.launch_id} className="sw-launch-card" onClick={() => openLaunch(l)}>
                <h3>{l.club_name}</h3>
                <div className="lx-phase">
                  {l.status === "live"
                    ? <span className="sw-launch-live">● Live{l.days_to_live != null ? ` · ${l.days_to_live} days` : ""}</span>
                    : <>Phase {l.current_phase} · {phaseTitle(l.current_phase)}</>}
                </div>
                <div className="sw-launch-bar"><i style={{ width: `${pct}%` }} /></div>
                <div className="sw-launch-barlabel">{l.steps_done}/{l.steps_total} steps · started {fmt(l.started_at)}</div>
              </button>
            );
          })}
          {launches.length === 0 && <p className="lx-sub">No launches yet. Start one below.</p>}
        </div>

        <div className="sw-launch-start">
          <select value={startClubId} onChange={(e) => setStartClubId(e.target.value)}>
            <option value="">Start a launch for…</option>
            {startable.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="sw-launch-btn" disabled={!startClubId || busy} onClick={startLaunch}>
            {busy ? "Starting…" : "Start launch"}
          </button>
        </div>

        {isPlatformAdmin && (
          <div className="sw-launch-emp">
            <h3>Employees</h3>
            <p className="lx-sub" style={{ margin: "0 0 .8rem" }}>
              Add a SportsWeb operator by email. They get a scoped login that shows only Launches —
              never the database or other clubs' areas. Region limits which clubs they see; use
              "national" for all.
            </p>
            <ul className="sw-launch-emplist">
              {operators.map((o) => (
                <li key={`${o.user_id}-${o.region}`}>
                  <span>{o.email ?? o.user_id}</span>
                  <span className="sw-launch-tag">{o.region}</span>
                </li>
              ))}
              {operators.length === 0 && <li className="lx-sub">No operators yet.</li>}
            </ul>
            <div className="sw-launch-start" style={{ marginTop: ".6rem", paddingTop: 0, borderTop: "none" }}>
              <input className="sw-launch-input" type="email" placeholder="employee@sportsweb.com.au"
                value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} />
              <input className="sw-launch-input" type="text" placeholder="region (national)"
                value={empRegion} onChange={(e) => setEmpRegion(e.target.value)} style={{ maxWidth: 160, minWidth: 120 }} />
              <button className="sw-launch-btn" disabled={!empEmail.trim() || busy} onClick={addEmployee}>
                {busy ? "Adding…" : "Add employee"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- Detail view ----------------------------------------------------------
  const activePhases = phases.filter((ph) => catalog.some((s) => s.phase_no === ph.phase_no));
  const doneCount = progress.filter((p) => p.status === "done").length;
  const total = catalog.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="sw-launch">
      <button className="sw-launch-back" onClick={() => setSelected("")}>← All launches</button>

      <div className="sw-launch-head">
        <div style={{ flex: "1 1 240px" }}>
          <h2>{current?.club_name ?? "Launch"}</h2>
          <div className="sw-launch-bar" style={{ marginTop: ".6rem" }}><i style={{ width: `${pct}%` }} /></div>
          <div className="sw-launch-barlabel">
            {doneCount}/{total} steps
            {current?.status === "live" && <span className="sw-launch-live"> · Live</span>}
          </div>
        </div>
        {current?.status !== "live" && (
          <button className="sw-launch-btn sw-launch-btn--live" disabled={busy} onClick={markLive}>Mark live</button>
        )}
      </div>

      {msg && <div className="lx-msg">{msg}</div>}

      {activePhases.map((ph) => (
        <div key={ph.phase_no} className="sw-launch-phase">
          <div className="lx-ph-title"><span className="lx-ph-no">{ph.phase_no}</span>{ph.title}</div>
          {catalog.filter((s) => s.phase_no === ph.phase_no).map((step) => {
            const row = progressByKey[step.step_key];
            const done = row?.status === "done";
            const locked = step.access_level === "admin_only" && !isPlatformAdmin;
            return (
              <div key={step.step_key} className="sw-launch-step" data-done={done}>
                <button className="sw-launch-check" data-done={done} disabled={locked || busy}
                  onClick={() => toggleStep(step, row)} aria-label={done ? "Mark not done" : "Mark done"}>
                  {done ? "✓" : ""}
                </button>
                <div className="sw-launch-stepbody">
                  <span className="sw-launch-steptitle">{step.title}</span>
                  <span className="sw-launch-tags">
                    {step.is_critical && <span className="sw-launch-tag sw-launch-tag--crit">Screenshot</span>}
                    {step.access_level === "admin_only" && <span className="sw-launch-tag sw-launch-tag--admin">Admin</span>}
                  </span>
                  {done && row?.checked_at && (
                    <div className="sw-launch-stamp">
                      Done {fmt(row.checked_at)}{row.checked_by === userId ? " · by you" : ""}
                    </div>
                  )}
                  {step.help_md && (
                    <details className="sw-launch-help"><summary>How to do this</summary><p>{step.help_md}</p></details>
                  )}
                  {step.is_critical && (
                    <div className="sw-launch-evi">
                      <label className="sw-launch-up">
                        {row?.screenshot_path ? "Replace screenshot" : "Add screenshot"}
                        <input type="file" accept="image/*"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadEvidence(step, f); e.currentTarget.value = ""; }} />
                      </label>
                      {row?.screenshot_path
                        ? <button className="lx-link" onClick={() => viewEvidence(row.screenshot_path!)}>View evidence</button>
                        : <span className="lx-need">required to complete</span>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
