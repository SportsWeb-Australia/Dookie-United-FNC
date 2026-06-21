import { useEffect, useMemo, useState } from "react";
import { MODULE_CATALOG } from "../lib/modules";
import { slugify } from "../lib/slug";
import { useActiveClub } from "./ActiveClub";
import {
  listClubs,
  listModuleStatuses,
  setModuleStatus,
  createClub,
  type AdminClub,
  type AdminModuleRow,
} from "../lib/superAdmin";

/** Platform operator view: every club, with per-module enable/disable. */
export function SuperClubs() {
  const { setActiveClub } = useActiveClub();
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [rows, setRows] = useState<AdminModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create-club form
  const [creating, setCreating] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", primary: "#1F8CA7", secondary: "#111111", contact: "", adminEmail: "" });
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "", slug: "", primary: "#1F8CA7", secondary: "#111111", contact: "", adminEmail: "" });
    setSlugDirty(false);
  };

  const submitCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      setCreateMsg("A club name and address are both required.");
      return;
    }
    setCreateBusy(true);
    setCreateMsg(null);
    const { result, error: err } = await createClub(form);
    setCreateBusy(false);
    if (err || !result) {
      setCreateMsg(err ?? "Couldn't create the club.");
      return;
    }
    const adminNote =
      result.admin === "linked"
        ? " First admin linked."
        : result.admin === "no_account"
          ? " That admin email has no account yet — they'll be linked once they sign up, or assign them later."
          : "";
    setCreateMsg(`Created ${result.slug}.sportsweb.com.au.${adminNote}`);
    setCreating(false);
    resetForm();
    refresh();
  };

  const refresh = async () => {
    setLoading(true);
    const [c, m] = await Promise.all([listClubs(), listModuleStatuses()]);
    setClubs(c);
    setRows(m);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // status lookup: clubId -> moduleKey -> status
  const statusMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    for (const r of rows) {
      (map[r.club_id] ??= {})[r.module_key] = r.status;
    }
    return map;
  }, [rows]);

  const statusFor = (clubId: string, key: string): string => statusMap[clubId]?.[key] ?? "default";

  const toggle = async (clubId: string, key: string, currentlyOn: boolean) => {
    const cell = `${clubId}:${key}`;
    setBusy(cell);
    setError(null);
    const err = await setModuleStatus(clubId, key, currentlyOn ? "locked" : "enabled");
    if (err) setError(err);
    else {
      // optimistic local update
      setRows((rs) => {
        const without = rs.filter((r) => !(r.club_id === clubId && r.module_key === key));
        return [...without, { club_id: clubId, module_key: key, status: currentlyOn ? "locked" : "enabled" }];
      });
    }
    setBusy(null);
  };

  return (
    <div className="sw-admin-page">
      <header className="sw-admin-head">
        <div>
          <h1>Clubs &amp; modules</h1>
          <p>Every club on the platform. Switch modules on or off per club.</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="sw-btn" onClick={() => { setCreating((v) => !v); setCreateMsg(null); }}>
            {creating ? "Close" : "+ New club"}
          </button>
          <button className="sw-btn sw-btn--ghost" onClick={refresh}>
            Refresh
          </button>
        </div>
      </header>

      {createMsg && <div className={`sw-comms-result${createMsg.startsWith("Created") ? " ok" : " err"}`}>{createMsg}</div>}

      {creating && (
        <div className="sw-super-create">
          <h3>Create a club</h3>
          <div className="sw-create-grid">
            <label className="sw-admin-field">
              <span>Club name</span>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugDirty ? f.slug : slugify(name) }));
                }}
                placeholder="Eastside United SC"
              />
            </label>
            <label className="sw-admin-field">
              <span>Web address (subdomain)</span>
              <input
                value={form.slug}
                onChange={(e) => { setSlugDirty(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
                placeholder="eastside-united"
              />
              <small>{form.slug || "your-club"}.sportsweb.com.au</small>
            </label>
            <label className="sw-admin-field">
              <span>Primary colour</span>
              <input type="color" value={form.primary} onChange={(e) => setForm((f) => ({ ...f, primary: e.target.value }))} />
            </label>
            <label className="sw-admin-field">
              <span>Secondary colour</span>
              <input type="color" value={form.secondary} onChange={(e) => setForm((f) => ({ ...f, secondary: e.target.value }))} />
            </label>
            <label className="sw-admin-field">
              <span>Contact email</span>
              <input type="email" value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="info@club.com.au" />
            </label>
            <label className="sw-admin-field">
              <span>First admin email (optional)</span>
              <input type="email" value={form.adminEmail} onChange={(e) => setForm((f) => ({ ...f, adminEmail: e.target.value }))} placeholder="president@club.com.au" />
            </label>
          </div>
          <p className="sw-comms-note">
            New clubs start with the core website plus Volunteer Manager on trial. If the first admin already has a
            SportsWeb login, they're linked as Club Senior Admin straight away.
          </p>
          <div className="sw-comms-actions">
            <button className="sw-btn" disabled={createBusy} onClick={submitCreate}>
              {createBusy ? "Creating…" : "Create club"}
            </button>
          </div>
        </div>
      )}


      {error && <div className="sw-comms-result err">{error}</div>}

      {loading ? (
        <p>Loading clubs…</p>
      ) : clubs.length === 0 ? (
        <p className="sw-muted">No clubs found, or you're not a platform admin.</p>
      ) : (
        <div className="sw-super-table-wrap">
          <table className="sw-admin-table sw-super-table">
            <thead>
              <tr>
                <th>Club</th>
                {MODULE_CATALOG.map((m) => (
                  <th key={m.key}>{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.id}>
                  <td className="sw-super-clubcell">
                    <strong>{club.name}</strong>
                    <small>{club.slug}</small>
                    <button className="sw-openadmin" onClick={() => setActiveClub(club.id)}>
                      Open admin →
                    </button>
                  </td>
                  {MODULE_CATALOG.map((m) => {
                    const st = statusFor(club.id, m.key);
                    const on = st === "enabled" || st === "trial";
                    const cell = `${club.id}:${m.key}`;
                    return (
                      <td key={m.key} className="sw-super-cell">
                        <button
                          type="button"
                          className={`sw-switch sw-switch--sm${on ? " on" : ""}`}
                          aria-pressed={on}
                          disabled={busy === cell}
                          title={st === "default" ? "Using site default" : st}
                          onClick={() => toggle(club.id, m.key, on)}
                        >
                          <i />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="sw-comms-note" style={{ marginTop: "1rem" }}>
        A switch left untouched uses the site's built-in default. Turning it on records an explicit
        “enabled”; turning it off records “locked”, which overrides any default.
      </p>
    </div>
  );
}
