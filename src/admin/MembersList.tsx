import { useEffect, useMemo, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { listClubMembers, type ClubMember } from "../lib/people";

/** Turn a role token ("assistant_coach") into a label ("Assistant coach"). */
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

export function MembersList({ onOpen }: { onOpen: (personId: string) => void }) {
  const { clubId } = useActiveClub();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("all");
  const [team, setTeam] = useState<string>("all");

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    listClubMembers(clubId).then((rows) => {
      setMembers(rows);
      setLoading(false);
    });
  }, [clubId]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => m.roles.forEach((r) => set.add(r)));
    return Array.from(set).sort();
  }, [members]);

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

  const stats = useMemo(() => {
    const players = members.filter((m) => m.roles.includes("player")).length;
    const volunteers = members.filter((m) => m.roles.includes("volunteer")).length;
    const minors = members.filter((m) => m.isMinor).length;
    return { total: members.length, players, volunteers, minors };
  }, [members]);

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Members</h2>
      </div>
      <p className="sw-admin-note">
        Everyone on the club&apos;s books — players, parents, volunteers, coaches and committee — in one place. Each
        person appears once, with every role they hold. Filter by role or search by name, email or mobile.
      </p>

      <div className="sw-mem-stats">
        <div className="sw-mem-stat"><strong>{stats.total}</strong><span>Total people</span></div>
        <div className="sw-mem-stat"><strong>{stats.players}</strong><span>Players</span></div>
        <div className="sw-mem-stat"><strong>{stats.volunteers}</strong><span>Volunteers</span></div>
        <div className="sw-mem-stat"><strong>{stats.minors}</strong><span>Under 18</span></div>
      </div>

      <div className="sw-mem-controls">
        <input
          className="sw-mem-search"
          type="search"
          placeholder="Search name, email or mobile…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="sw-mem-roles">
          <button data-on={role === "all"} onClick={() => setRole("all")}>All</button>
          {allRoles.map((r) => (
            <button key={r} data-on={role === r} onClick={() => setRole(r)}>{humanRole(r)}</button>
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
              ? "No members yet. They'll appear here as people register, are added, or are imported."
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
  );
}
