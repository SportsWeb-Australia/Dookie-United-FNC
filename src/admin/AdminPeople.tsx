import { useCallback, useEffect, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { roleLabel } from "../lib/roles";
import { toModelRole } from "../lib/permissions";
import { COMMITTEE_TITLES } from "../lib/committee";
import { listClubPeople, setMemberCommittee, type ClubPerson } from "../lib/people";

/**
 * People & committee — a club's senior ("Exec") admin or a SportsWeb admin
 * assigns each person a name and committee role (President, Treasurer, …).
 * Committee titles are assigned here, never self-claimed. Access roles are
 * shown read-only.
 */
export function AdminPeople() {
  const { clubId, clubName } = useActiveClub();
  const [people, setPeople] = useState<ClubPerson[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { name: string; title: string }>>({});
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    if (!clubId) return;
    setLoading(true);
    listClubPeople(clubId).then((ppl) => {
      setPeople(ppl);
      setDrafts(Object.fromEntries(ppl.map((p) => [p.userId, { name: p.displayName, title: p.committeeTitle }])));
      setLoading(false);
    });
  }, [clubId]);

  useEffect(reload, [reload]);

  const save = async (p: ClubPerson) => {
    const d = drafts[p.userId] ?? { name: "", title: "" };
    setMsg((m) => ({ ...m, [p.userId]: "Saving…" }));
    const err = await setMemberCommittee(p.userId, clubId, d.name, d.title);
    if (err) {
      setMsg((m) => ({ ...m, [p.userId]: "Couldn't save — has people-admin.sql been run?" }));
      return;
    }
    setMsg((m) => ({ ...m, [p.userId]: "Saved." }));
    setPeople((ps) =>
      ps.map((x) => (x.userId === p.userId ? { ...x, displayName: d.name.trim(), committeeTitle: d.title.trim() } : x))
    );
  };

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>People &amp; committee</h2>
      </div>
      <p className="sw-admin-note">
        Assign each admin at {clubName || "your club"} a name and committee role. These appear on their dashboard and
        across the club. Committee roles are assigned here — people can&apos;t set their own.
      </p>

      {loading ? (
        <p className="sw-admin-note">Loading people…</p>
      ) : people.length === 0 ? (
        <p className="sw-muted">No people found, or you don&apos;t have permission to manage them.</p>
      ) : (
        <div className="sw-people-admin">
          {people.map((p) => {
            const d = drafts[p.userId] ?? { name: "", title: "" };
            return (
              <div key={p.userId} className="sw-people-row">
                <div className="sw-people-id">
                  <strong>{p.displayName || p.email}</strong>
                  <span>
                    {p.email}
                    <span className="sw-people-rolechip">{roleLabel(toModelRole(p.role))}</span>
                  </span>
                </div>
                <div className="sw-people-fields">
                  <label className="sw-ed-l">
                    Name
                    <input
                      className="sw-input"
                      value={d.name}
                      placeholder="Full name"
                      onChange={(e) => setDrafts((s) => ({ ...s, [p.userId]: { ...d, name: e.target.value } }))}
                    />
                  </label>
                  <label className="sw-ed-l">
                    Committee role
                    <select
                      className="sw-input"
                      value={d.title}
                      onChange={(e) => setDrafts((s) => ({ ...s, [p.userId]: { ...d, title: e.target.value } }))}
                    >
                      <option value="">— none —</option>
                      {COMMITTEE_TITLES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="sw-people-actions">
                    <button className="sw-btn" onClick={() => save(p)}>
                      Save
                    </button>
                    <span className="sw-ed-status" aria-live="polite">
                      {msg[p.userId]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
