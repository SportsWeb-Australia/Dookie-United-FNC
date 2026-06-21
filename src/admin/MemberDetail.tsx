import { useEffect, useMemo, useRef, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { useClub } from "../components/ClubContext";
import {
  getMemberDetail,
  updateMemberProfile,
  uploadMemberAvatar,
  addPersonRole,
  updatePersonRole,
  endPersonRole,
  deletePersonRole,
  listClubTeams,
  listClubSeasons,
  type MemberDetail as Detail,
  type MemberRole,
  type ClubTeam,
  type ClubSeason,
} from "../lib/people";

const ROLE_OPTIONS = [
  "player", "past_player", "parent", "guardian", "coach", "assistant_coach",
  "team_manager", "volunteer", "committee", "sponsor_contact", "official",
  "trainer", "life_member", "administrator",
];

function humanRole(role: string): string {
  const s = role.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
function fmtDate(d: string | null): string {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? d : dt.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}
function money(cents: number | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toLocaleString("en-AU", { minimumFractionDigits: 2 })}`;
}

type TabKey = "overview" | "roles" | "family" | "compliance" | "activity" | "medical";

const EDITABLE = [
  "full_name", "email", "mobile", "date_of_birth", "status", "member_since",
  "address", "suburb", "state", "postcode", "emergency_name", "emergency_phone", "notes",
] as const;

const EMPTY_ROLE = { role: "player", sport: "", team_id: "", season_id: "", committee_title: "", start_date: "" };

export function MemberDetail({ personId, onBack }: { personId: string; onBack: () => void }) {
  const { clubId } = useActiveClub();
  const { club } = useClub();
  const logo = club?.identity?.logo ?? null;

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [teams, setTeams] = useState<ClubTeam[]>([]);
  const [seasons, setSeasons] = useState<ClubSeason[]>([]);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({ ...EMPTY_ROLE });
  const [roleBusy, setRoleBusy] = useState(false);

  const load = () => {
    if (!clubId || !personId) return;
    setLoading(true);
    getMemberDetail(clubId, personId).then((d) => {
      setDetail(d);
      setLoading(false);
    });
  };
  useEffect(load, [clubId, personId]);

  useEffect(() => {
    if (!clubId) return;
    listClubTeams(clubId).then(setTeams);
    listClubSeasons(clubId).then(setSeasons);
  }, [clubId]);

  const p = detail?.profile ?? null;
  const sensitive = detail?.can_view_sensitive ?? false;
  const canEdit = detail?.can_edit ?? false;
  const currentSeasonId = useMemo(() => seasons.find((s) => s.isCurrent)?.id ?? "", [seasons]);
  const seasonRequired = seasons.length > 0;

  const teamsForSport = useMemo(
    () => teams.filter((t) => !roleForm.sport || !t.sport || t.sport === roleForm.sport),
    [teams, roleForm.sport],
  );

  const tabs = useMemo(() => {
    const base: { key: TabKey; label: string }[] = [
      { key: "overview", label: "Overview" },
      { key: "roles", label: "Roles & teams" },
      { key: "family", label: "Family" },
    ];
    if (sensitive) {
      base.push({ key: "compliance", label: "Compliance" });
      base.push({ key: "activity", label: "Activity" });
      base.push({ key: "medical", label: "Medical" });
    }
    return base;
  }, [sensitive]);

  function startEdit() {
    if (!p) return;
    const f: Record<string, string> = {};
    EDITABLE.forEach((k) => { f[k] = (p as any)[k] ?? ""; });
    setForm(f);
    setMsg(null);
    setEditing(true);
  }

  async function save() {
    if (!clubId) return;
    setSaving(true);
    setMsg(null);
    const patch: Record<string, any> = {};
    EDITABLE.forEach((k) => { patch[k] = form[k] ?? ""; });
    const err = await updateMemberProfile(clubId, personId, patch);
    setSaving(false);
    if (err) { setMsg(err); return; }
    setEditing(false);
    load();
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clubId) return;
    setUploading(true);
    setMsg(null);
    const res = await uploadMemberAvatar(clubId, personId, file);
    if (res.error) { setMsg(res.error); setUploading(false); return; }
    await updateMemberProfile(clubId, personId, { avatar_url: res.url });
    setUploading(false);
    load();
  }

  function startAddRole() {
    setEditingRoleId(null);
    setRoleForm({ ...EMPTY_ROLE, season_id: currentSeasonId });
    setMsg(null);
    setShowRoleForm(true);
  }
  function startEditRole(r: MemberRole) {
    setEditingRoleId(r.id);
    setRoleForm({
      role: r.role,
      sport: r.sport ?? "",
      team_id: r.team_id ?? "",
      season_id: r.season_id ?? currentSeasonId,
      committee_title: r.committee_title ?? "",
      start_date: r.start_date ?? "",
    });
    setMsg(null);
    setShowRoleForm(true);
  }
  function onSportChange(sport: string) {
    setRoleForm((rf) => {
      const t = teams.find((x) => x.id === rf.team_id);
      const keepTeam = t && (!t.sport || !sport || t.sport === sport);
      return { ...rf, sport, team_id: keepTeam ? rf.team_id : "" };
    });
  }
  function onTeamChange(teamId: string) {
    const t = teams.find((x) => x.id === teamId);
    setRoleForm((rf) => ({ ...rf, team_id: teamId, sport: t?.sport ? t.sport : rf.sport }));
  }

  async function saveRole() {
    if (!clubId) return;
    if (seasonRequired && !roleForm.season_id) { setMsg("Every role needs a season."); return; }
    setRoleBusy(true);
    setMsg(null);
    const payload = {
      role: roleForm.role,
      sport: roleForm.sport || null,
      teamId: roleForm.team_id || null,
      seasonId: roleForm.season_id || null,
      committeeTitle: roleForm.committee_title || null,
      startDate: roleForm.start_date || null,
    };
    const err = editingRoleId
      ? await updatePersonRole(editingRoleId, { ...payload, status: "active" })
      : await addPersonRole(clubId, personId, payload);
    setRoleBusy(false);
    if (err) { setMsg(err); return; }
    setRoleForm({ ...EMPTY_ROLE });
    setShowRoleForm(false);
    setEditingRoleId(null);
    load();
  }

  async function onEndRole(r: MemberRole) {
    if (!window.confirm(`Mark "${humanRole(r.role)}" as ended? It stays on the profile as history with an end date — it won't be deleted.`)) return;
    setRoleBusy(true);
    const err = await endPersonRole(r.id);
    setRoleBusy(false);
    if (err) { setMsg(err); return; }
    load();
  }
  async function onRemoveRole(r: MemberRole) {
    if (!window.confirm(`Permanently remove the "${humanRole(r.role)}" role? This deletes it entirely — use End instead if you want to keep the history.`)) return;
    setRoleBusy(true);
    const err = await deletePersonRole(r.id);
    setRoleBusy(false);
    if (err) { setMsg(err); return; }
    load();
  }

  return (
    <div className="sw-admin-panel">
      <button className="sw-admin-back" onClick={onBack}>← Members</button>

      {loading ? (
        <p className="sw-admin-note">Loading profile…</p>
      ) : !p ? (
        <p className="sw-admin-note">This member couldn&apos;t be found.</p>
      ) : (
        <div className="sw-folder sw-folder--member">
          <div className="sw-folder-tab">Member file</div>
          {logo && <img className="sw-folder-logo" src={logo} alt="" />}
          <div className="sw-folder-body">
            <div className="sw-md-head">
              <div className="sw-md-avatar">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name} />
                ) : (
                  <span>{initials(p.full_name) || "?"}</span>
                )}
                {canEdit && (
                  <>
                    <button className="sw-md-avatar-btn" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? "…" : "Photo"}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickPhoto} />
                  </>
                )}
              </div>
              <div className="sw-md-headmain">
                <h2>
                  {p.full_name}
                  {p.is_minor && <span className="sw-mem-minor">Junior</span>}
                </h2>
                <div className="sw-md-headmeta">
                  {p.status && <span>{humanRole(p.status)}</span>}
                  {p.member_since && <span>Member since {fmtDate(p.member_since)}</span>}
                  <span>Added {fmtDate(p.created_at)}</span>
                </div>
              </div>
              {canEdit && !editing && (
                <button className="sw-btn sw-btn--sm" onClick={startEdit}>Edit</button>
              )}
            </div>

            <div className="sw-md-tabs">
              {tabs.map((t) => (
                <button key={t.key} data-on={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </div>

            {msg && <p className="sw-admin-note sw-md-msg">{msg}</p>}

            {/* OVERVIEW */}
            {tab === "overview" && (
              editing ? (
                <div className="sw-md-form">
                  <Field label="Full name"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></Field>
                  <Field label="Status"><input value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} placeholder="active" /></Field>
                  <Field label="Email"><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
                  <Field label="Mobile"><input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></Field>
                  <Field label="Date of birth"><input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
                  <Field label="Member since"><input type="date" value={form.member_since} onChange={(e) => setForm({ ...form, member_since: e.target.value })} /></Field>
                  <Field label="Address" wide><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
                  <Field label="Suburb"><input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} /></Field>
                  <Field label="State"><input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></Field>
                  <Field label="Postcode"><input value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} /></Field>
                  <Field label="Emergency contact"><input value={form.emergency_name} onChange={(e) => setForm({ ...form, emergency_name: e.target.value })} /></Field>
                  <Field label="Emergency phone"><input value={form.emergency_phone} onChange={(e) => setForm({ ...form, emergency_phone: e.target.value })} /></Field>
                  <Field label="Notes" wide><textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                  <div className="sw-md-formactions">
                    <button className="sw-btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
                    <button className="sw-btn sw-btn--ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                  </div>
                </div>
              ) : (
                <dl className="sw-md-grid">
                  <Row label="Email" value={p.email} />
                  <Row label="Mobile" value={p.mobile} />
                  <Row label="Date of birth" value={fmtDate(p.date_of_birth)} />
                  <Row label="Address" value={[p.address, p.suburb, p.state, p.postcode].filter(Boolean).join(", ") || null} />
                  <Row label="Emergency contact" value={[p.emergency_name, p.emergency_phone].filter(Boolean).join(" · ") || null} />
                  <Row label="Notes" value={p.notes} />
                </dl>
              )
            )}

            {/* ROLES & TEAMS */}
            {tab === "roles" && (
              <>
                {canEdit && (
                  <div className="sw-md-roleadd">
                    {!showRoleForm ? (
                      <button className="sw-btn sw-btn--sm" onClick={startAddRole}>+ Add role</button>
                    ) : (
                      <div className="sw-md-roleform">
                        <label><span>Role</span>
                          <select value={roleForm.role} onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}>
                            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{humanRole(r)}</option>)}
                          </select>
                        </label>
                        <label><span>Sport</span>
                          <select value={roleForm.sport} onChange={(e) => onSportChange(e.target.value)}>
                            <option value="">Any / all</option>
                            <option value="football">Football</option>
                            <option value="netball">Netball</option>
                          </select>
                        </label>
                        <label><span>Team</span>
                          <select value={roleForm.team_id} onChange={(e) => onTeamChange(e.target.value)}>
                            <option value="">No team</option>
                            {teamsForSport.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </label>
                        <label><span>Season{seasonRequired ? " *" : ""}</span>
                          <select value={roleForm.season_id} onChange={(e) => setRoleForm({ ...roleForm, season_id: e.target.value })}>
                            <option value="">{seasonRequired ? "Select a season" : "No season"}</option>
                            {seasons.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? " (current)" : ""}</option>)}
                          </select>
                        </label>
                        {roleForm.role === "committee" && (
                          <label><span>Committee title</span><input value={roleForm.committee_title} onChange={(e) => setRoleForm({ ...roleForm, committee_title: e.target.value })} placeholder="e.g. Treasurer" /></label>
                        )}
                        <label><span>Start date</span><input type="date" value={roleForm.start_date} onChange={(e) => setRoleForm({ ...roleForm, start_date: e.target.value })} /></label>
                        {seasons.length === 0 && (
                          <p className="sw-md-rolehint">No seasons set up yet — add seasons in the site editor so roles can be tied to a season.</p>
                        )}
                        <div className="sw-md-roleformactions">
                          <button className="sw-btn sw-btn--sm" onClick={saveRole} disabled={roleBusy}>{roleBusy ? "Saving…" : editingRoleId ? "Save role" : "Add role"}</button>
                          <button className="sw-btn sw-btn--sm sw-btn--ghost" onClick={() => { setShowRoleForm(false); setEditingRoleId(null); setRoleForm({ ...EMPTY_ROLE }); }} disabled={roleBusy}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {detail!.roles.length === 0 ? (
                  <p className="sw-admin-note">No roles recorded yet.</p>
                ) : (
                  <div className="sw-md-list">
                    {detail!.roles.map((r) => (
                      <div className="sw-md-rolecard" key={r.id} data-ended={r.status !== "active"}>
                        <div className="sw-md-roletop">
                          <strong>{humanRole(r.role)}{r.committee_title ? ` — ${r.committee_title}` : ""}</strong>
                          <span className={`sw-md-rolestate sw-md-rolestate--${r.status === "active" ? "on" : "off"}`}>{humanRole(r.status)}</span>
                        </div>
                        <div className="sw-md-rolemeta">
                          {[r.team_name, r.season_name, r.sport ? humanRole(r.sport) : null].filter(Boolean).join(" · ") || "Club-wide"}
                          {(r.start_date || r.end_date) && (
                            <span> · {fmtDate(r.start_date)}{r.end_date ? ` → ${fmtDate(r.end_date)}` : ""}</span>
                          )}
                        </div>
                        {canEdit && (
                          <div className="sw-md-roleactions">
                            <button className="sw-linklike" onClick={() => startEditRole(r)} disabled={roleBusy} title="Change this role's team, season, sport or dates">Edit</button>
                            {r.status === "active" && (
                              <button className="sw-linklike" onClick={() => onEndRole(r)} disabled={roleBusy} title="Close off this role with an end date — kept as history, not deleted">End</button>
                            )}
                            <button className="sw-linklike sw-linklike--danger" onClick={() => onRemoveRole(r)} disabled={roleBusy} title="Delete this role entirely — use End instead to keep the history">Remove</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* FAMILY */}
            {tab === "family" && (
              detail!.relationships.length === 0 ? (
                <p className="sw-admin-note">No family or guardian links recorded yet.</p>
              ) : (
                <div className="sw-md-list">
                  {detail!.relationships.map((rel) => (
                    <div className="sw-md-relcard" key={rel.id}>
                      <span className="sw-mem-badge">{humanRole(rel.relationship)}</span>
                      <strong>{rel.related_name}</strong>
                      {rel.related_is_minor && <span className="sw-mem-minor">Junior</span>}
                    </div>
                  ))}
                </div>
              )
            )}

            {/* COMPLIANCE (sensitive) */}
            {tab === "compliance" && sensitive && (
              (detail!.compliance ?? []).length === 0 ? (
                <p className="sw-admin-note">No compliance records (WWCC, accreditations) recorded yet.</p>
              ) : (
                <div className="sw-md-list">
                  {detail!.compliance!.map((c) => (
                    <div className="sw-md-compcard" key={c.id}>
                      <div className="sw-md-roletop">
                        <strong>{humanRole(c.check_type)}</strong>
                        <span className={`sw-md-rolestate sw-md-rolestate--${c.status === "valid" ? "on" : c.status === "expired" ? "off" : "warn"}`}>{humanRole(c.status)}</span>
                      </div>
                      <div className="sw-md-rolemeta">
                        {c.reference_no ? `Ref ${c.reference_no} · ` : ""}
                        {c.expires_on ? `Expires ${fmtDate(c.expires_on)}` : "No expiry recorded"}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ACTIVITY / FINANCIAL (sensitive) */}
            {tab === "activity" && sensitive && (
              (detail!.registrations ?? []).length === 0 ? (
                <p className="sw-admin-note">No registrations or payments recorded yet.</p>
              ) : (
                <div className="sw-md-list">
                  {detail!.registrations!.map((rg) => (
                    <div className="sw-md-regcard" key={rg.id}>
                      <div className="sw-md-roletop">
                        <strong>{rg.membership_label || rg.season_name || "Registration"}</strong>
                        <span className={`sw-mem-pay sw-mem-pay--${(rg.payment_status ?? "").toLowerCase() === "paid" ? "ok" : "warn"}`}>{humanRole(rg.payment_status ?? "—")}</span>
                      </div>
                      <div className="sw-md-rolemeta">
                        {rg.season_name ? `${rg.season_name} · ` : ""}
                        {money(rg.amount_paid_cents)} of {money(rg.amount_cents)}
                        {rg.registered_at ? ` · ${fmtDate(rg.registered_at)}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* MEDICAL (gated placeholder) */}
            {tab === "medical" && sensitive && (
              <div className="sw-md-restricted">
                <span className="sw-mem-inactive">Restricted</span>
                <p>
                  Injury and concussion records will live here. Access is limited to medical / high-performance staff,
                  senior admins, and the member&apos;s active-season coach — we&apos;ll switch this on with the health
                  module.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`sw-md-field${wide ? " sw-md-field--wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="sw-md-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}
