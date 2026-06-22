import { useCallback, useEffect, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { roleLabel } from "../lib/roles";
import { toModelRole } from "../lib/permissions";
import { COMMITTEE_TITLES } from "../lib/committee";
import { listClubPeople, setMemberCommittee, inviteClubMember, listClubInvites, cancelClubInvite, type ClubPerson, type ClubInvite } from "../lib/people";

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

  const [invites, setInvites] = useState<ClubInvite[]>([]);
  const [add, setAdd] = useState({ name: "", email: "", role: "club_admin", title: "" });
  const [addMsg, setAddMsg] = useState("");
  const [adding, setAdding] = useState(false);

  const reload = useCallback(() => {
    if (!clubId) return;
    setLoading(true);
    Promise.all([listClubPeople(clubId), listClubInvites(clubId)]).then(([ppl, inv]) => {
      setPeople(ppl);
      setInvites(inv);
      setDrafts(Object.fromEntries(ppl.map((p) => [p.userId, { name: p.displayName, title: p.committeeTitle }])));
      setLoading(false);
    });
  }, [clubId]);

  useEffect(reload, [reload]);

  const submitInvite = async () => {
    if (!clubId) return;
    if (!add.email.trim() || !add.email.includes("@")) {
      setAddMsg("Enter a valid email.");
      return;
    }
    setAdding(true);
    setAddMsg("Adding…");
    const res = await inviteClubMember(clubId, add.email, add.name, add.role, add.title);
    setAdding(false);
    if (res.error) {
      setAddMsg(res.error.includes("function") ? "Couldn't add — has member-invites.sql been run?" : res.error);
      return;
    }
    setAddMsg(
      res.status === "granted"
        ? "Added — they already had an account, so access is on now."
        : "Invited — they'll get access the first time they log in with that email."
    );
    setAdd({ name: "", email: "", role: "club_admin", title: "" });
    reload();
  };

  const removeInvite = async (id: string) => {
    await cancelClubInvite(id);
    setInvites((xs) => xs.filter((x) => x.id !== id));
  };

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
        This is where you add the committee members who get access to SportsWeb One. Give each person a name and
        committee role — these appear on their dashboard and across the club. Committee roles are assigned here; people
        can&apos;t set their own.
      </p>

      <div className="sw-people-add">
        <h3 className="sw-people-add-h">Add a committee member</h3>
        <p className="sw-people-add-sub">
          Invite someone by email and set their access level and committee role. If they already have a SportsWeb
          account they get access straight away; otherwise they&apos;re granted access the first time they log in with
          that email.
        </p>
        <div className="sw-people-add-grid">
          <label className="sw-ed-l">
            Name
            <input
              className="sw-input"
              value={add.name}
              placeholder="Full name"
              onChange={(e) => setAdd((a) => ({ ...a, name: e.target.value }))}
            />
          </label>
          <label className="sw-ed-l">
            Email
            <input
              className="sw-input"
              type="email"
              value={add.email}
              placeholder="name@example.com"
              onChange={(e) => setAdd((a) => ({ ...a, email: e.target.value }))}
            />
          </label>
          <label className="sw-ed-l">
            Access level
            <select className="sw-input" value={add.role} onChange={(e) => setAdd((a) => ({ ...a, role: e.target.value }))}>
              <option value="club_admin">Admin</option>
              <option value="club_senior_admin">Exec Admin</option>
            </select>
          </label>
          <label className="sw-ed-l">
            Committee role
            <select className="sw-input" value={add.title} onChange={(e) => setAdd((a) => ({ ...a, title: e.target.value }))}>
              <option value="">— none —</option>
              {COMMITTEE_TITLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sw-people-actions">
          <button className="sw-btn" onClick={submitInvite} disabled={adding}>
            Add committee member
          </button>
          <span className="sw-ed-status" aria-live="polite">
            {addMsg}
          </span>
        </div>
      </div>

      {invites.length > 0 && (
        <div className="sw-people-invites">
          <h3 className="sw-people-add-h">Pending invites ({invites.length})</h3>
          {invites.map((iv) => (
            <div key={iv.id} className="sw-people-invite">
              <div className="sw-people-id">
                <strong>{iv.displayName || iv.email}</strong>
                <span>
                  {iv.email}
                  <span className="sw-people-rolechip">{iv.role === "club_senior_admin" ? "Exec Admin" : "Admin"}</span>
                  {iv.committeeTitle ? <span className="sw-people-rolechip">{iv.committeeTitle}</span> : null}
                </span>
              </div>
              <button className="sw-btn sw-btn--ghost" onClick={() => removeInvite(iv.id)}>
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}

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
