import { useEffect, useMemo, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { listClubMembers, addClubMember, type ClubMember } from "../lib/people";

function humanRole(role: string): string {
  const s = role.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function payTone(status: string | null): string {
  const s = (status ?? "").toLowerCase();
  if (s === "paid") return "ok";
  if (s === "partial" || s === "pending") return "warn";
  if (s === "unpaid" || s === "overdue") return "bad";
  return "muted";
}

const EMPTY_ADD = { full_name: "", email: "", mobile: "", date_of_birth: "", member_since: "", status: "active" };

// Canonical filter segments — always shown so they're discoverable even before
// anyone holds that role. "sponsor" is a placeholder for the upcoming sponsor module.
const ROLE_SEGMENTS = ["player", "guardian", "coach", "volunteer", "committee", "sponsor"];

export function MembersList({ onOpen }: { onOpen: (personId: string) => void }) {
  const { clubId } = useActiveClub();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");
  const [team, setTeam] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [add, setAdd] = useState({ ...EMPTY_ADD });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    if (!clubId) return;
    setLoading(true);
    listClubMembers(clubId).then((rows) => {
      setMembers(rows);
      setLoading(false);
    });
  };
  useEffect(load, [clubId]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.roles.forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [members]);

  // Canonical segments first, then any other roles that exist in the data.
  const roleSegments = useMemo(() => {
    const extra = allRoles.filter((r) => !ROLE_SEGMENTS.includes(r));
    return [...ROLE_SEGMENTS, ...extra];
  }, [allRoles]);
  const roleCount = (r: string) => members.filter((m) => m.roles.includes(r)).length;

  const allTeams = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.teams.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (role !== "all" && !m.roles.includes(role)) return false;
      if (team !== "all" && !m.teams.includes(team)) return false;
      if (!q) return true;
      return (
        m.fullName.toLowerCase().includes(q) ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.mobile ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, query, role, team]);

  const counts = useMemo(() => {
    const sport = (m: ClubMember, s: string) => m.sports.includes(s);
    const byTeam: Record<string, number> = {};
    members.forEach((m) => m.teams.forEach((t) => { byTeam[t] = (byTeam[t] ?? 0) + 1; }));
    return {
      total: members.length,
      players: members.filter((m) => m.roles.includes("player")).length,
      volunteers: members.filter((m) => m.roles.includes("volunteer")).length,
      juniors: members.filter((m) => m.isMinor).length,
      footballers: members.filter((m) => sport(m, "football")).length,
      netballers: members.filter((m) => sport(m, "netball")).length,
      juniorNetballers: members.filter((m) => m.isMinor && sport(m, "netball")).length,
      byTeam: Object.entries(byTeam).sort((a, b) => b[1] - a[1]),
    };
  }, [members]);

  async function saveAdd() {
    if (!clubId) return;
    if (!add.full_name.trim()) { setMsg("A member name is required."); return; }
    setSaving(true);
    setMsg(null);
    const res = await addClubMember(clubId, add);
    setSaving(false);
    if (res.error) { setMsg(res.error); return; }
    setAdd({ ...EMPTY_ADD });
    setAdding(false);
    if (res.id) onOpen(res.id); // jump to the new profile to add roles
  }

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead sw-mem-head">
        <h2>Members</h2>
        <button className="sw-btn sw-btn--sm" onClick={() => { setAdding((a) => !a); setMsg(null); }}>
          {adding ? "Close" : "+ Add member"}
        </button>
      </div>
      <p className="sw-admin-note">
        Everyone on the club&apos;s books — players, parents, volunteers, coaches and committee — in one place. Each
        person appears once, with every role they hold. Tap anyone to open their full profile.
      </p>

      {msg && <p className="sw-admin-note sw-md-msg">{msg}</p>}

      {adding && (
        <div className="sw-mem-addform">
          <h3 className="sw-people-add-h">Add a member</h3>
          <div className="sw-mem-addgrid">
            <label><span>Full name *</span><input value={add.full_name} onChange={(e) => setAdd({ ...add, full_name: e.target.value })} /></label>
            <label><span>Email</span><input value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} /></label>
            <label><span>Mobile</span><input value={add.mobile} onChange={(e) => setAdd({ ...add, mobile: e.target.value })} /></label>
            <label><span>Date of birth</span><input type="date" value={add.date_of_birth} onChange={(e) => setAdd({ ...add, date_of_birth: e.target.value })} /></label>
            <label><span>Member since</span><input type="date" value={add.member_since} onChange={(e) => setAdd({ ...add, member_since: e.target.value })} /></label>
          </div>
          <div className="sw-mem-addactions">
            <button className="sw-btn" onClick={saveAdd} disabled={saving}>{saving ? "Adding…" : "Add & open profile"}</button>
            <button className="sw-btn sw-btn--ghost" onClick={() => { setAdding(false); setAdd({ ...EMPTY_ADD }); }} disabled={saving}>Cancel</button>
          </div>
          <p className="sw-mem-addhint">Add the person here, then assign their roles, teams and season on the profile.</p>
        </div>
      )}

      {/* Segmented counts */}
      <div className="sw-mem-stats">
        <div className="sw-mem-stat"><strong>{counts.total}</strong><span>Total members</span></div>
        <div className="sw-mem-stat"><strong>{counts.players}</strong><span>Players</span></div>
        <div className="sw-mem-stat"><strong>{counts.volunteers}</strong><span>Volunteers</span></div>
        <div className="sw-mem-stat"><strong>{counts.juniors}</strong><span>Under 18</span></div>
        <div className="sw-mem-stat"><strong>{counts.footballers}</strong><span>Footballers</span></div>
        <div className="sw-mem-stat"><strong>{counts.netballers}</strong><span>Netballers</span></div>
        <div className="sw-mem-stat"><strong>{counts.juniorNetballers}</strong><span>Junior netballers</span></div>
      </div>

      {counts.byTeam.length > 0 && (
        <div className="sw-mem-teamcounts">
          <span className="sw-mem-teamcounts-lbl">By team:</span>
          {counts.byTeam.map(([name, n]) => (
            <button key={name} className="sw-mem-teamcount" data-on={team === name} onClick={() => setTeam(team === name ? "all" : name)}>
              {name} <strong>{n}</strong>
            </button>
          ))}
        </div>
      )}

      {/* Manilla folder */}
      <div className="sw-folder">
        <div className="sw-folder-tab">Member files</div>
        <div className="sw-folder-body">
          <div className="sw-mem-controls">
            <input
              className="sw-mem-search"
              type="search"
              placeholder="Search name, email or mobile…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="sw-mem-roles">
              <button data-on={role === "all"} onClick={() => setRole("all")}>All <strong>{members.length}</strong></button>
              {roleSegments.map((r) => (
                <button
                  key={r}
                  data-on={role === r}
                  onClick={() => setRole(r)}
                  title={r === "sponsor" ? "Sponsors arrive with the upcoming sponsor module" : undefined}
                >
                  {humanRole(r)} <strong>{roleCount(r)}</strong>
                </button>
              ))}
            </div>
            {allTeams.length > 0 && (
              <select className="sw-mem-teamfilter" value={team} onChange={(e) => setTeam(e.target.value)}>
                <option value="all">All teams</option>
                {allTeams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <p className="sw-admin-note">Loading members…</p>
          ) : filtered.length === 0 ? (
            <div className="sw-mem-empty">
              <p>
                {members.length === 0
                  ? "No members yet. Add one above, or they'll appear as people register or are imported."
                  : "No members match that search."}
              </p>
            </div>
          ) : (
            <div className="sw-mem-list">
              {filtered.map((m) => (
                <div
                  className="sw-mem-card sw-mem-card--click"
                  key={m.personId}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(m.personId)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(m.personId); } }}
                >
                  <div className="sw-mem-main">
                    <div className="sw-mem-name">
                      {m.fullName || "—"}
                      {m.isMinor && <span className="sw-mem-minor">Junior</span>}
                      {m.status && m.status.toLowerCase() !== "active" && (
                        <span className="sw-mem-inactive">{m.status}</span>
                      )}
                    </div>
                    <div className="sw-mem-badges">
                      {m.roles.length === 0 ? (
                        <span className="sw-mem-badge sw-mem-badge--none">No role yet</span>
                      ) : (
                        m.roles.map((r) => (
                          <span key={r} className="sw-mem-badge">{humanRole(r)}</span>
                        ))
                      )}
                    </div>
                    {m.teams.length > 0 && (
                      <div className="sw-mem-teams">{m.teams.join(" · ")}</div>
                    )}
                  </div>
                  <div className="sw-mem-side">
                    <div className="sw-mem-contact">
                      {m.email && <a href={`mailto:${m.email}`} onClick={(e) => e.stopPropagation()}>{m.email}</a>}
                      {m.mobile && <span>{m.mobile}</span>}
                      {!m.email && !m.mobile && <span className="sw-mem-muted">No contact</span>}
                    </div>
                    {m.paymentStatus && (
                      <span className={`sw-mem-pay sw-mem-pay--${payTone(m.paymentStatus)}`}>
                        {humanRole(m.paymentStatus)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
