import { useEffect, useMemo, useState } from "react";
import { MODULE_CATALOG } from "../lib/modules";
import { slugify } from "../lib/slug";
import { useActiveClub } from "./ActiveClub";
import {
  listClubs,
  listModuleStatuses,
  setModuleStatus,
  setClubAccount,
  createClub,
  ACCOUNT_STATUSES,
  PLAN_TIERS,
  type AdminClub,
  type AdminModuleRow,
} from "../lib/superAdmin";

const SPORT_LABELS: Record<string, string> = {
  afl: "Australian Rules", afl_netball: "AFL / Netball", soccer: "Soccer", cricket: "Cricket",
  netball: "Netball", basketball: "Basketball", rugby_union: "Rugby Union", rugby_league: "Rugby League", other: "Other",
};
const titleCase = (s?: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "—");

/** Platform operator view: every club, with per-module enable/disable. */
export function SuperClubs() {
  const { setActiveClub } = useActiveClub();
  const [clubs, setClubs] = useState<AdminClub[]>([]);
  const [rows, setRows] = useState<AdminModuleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Search + grouping for the clubs list.
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "account_status" | "plan" | "sport">(() => {
    try {
      const v = localStorage.getItem("sw1.clubs.groupBy");
      return v === "account_status" || v === "plan" || v === "sport" ? v : "none";
    } catch {
      return "none";
    }
  });
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("sw1.clubs.collapsed") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("sw1.clubs.groupBy", groupBy);
    } catch {
      /* ignore */
    }
  }, [groupBy]);
  useEffect(() => {
    try {
      localStorage.setItem("sw1.clubs.collapsed", JSON.stringify(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);
  const [savingAccount, setSavingAccount] = useState<string | null>(null);

  // Create-club form
  const [creating, setCreating] = useState(false);
  const [slugDirty, setSlugDirty] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", sport: "afl", primary: "#1F8CA7", secondary: "#111111", tertiary: "#FFFFFF", contact: "", adminEmail: "" });
  const [createBusy, setCreateBusy] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ name: "", slug: "", sport: "afl", primary: "#1F8CA7", secondary: "#111111", tertiary: "#FFFFFF", contact: "", adminEmail: "" });
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

  // Set a club's account_status / plan (optimistic).
  const saveAccount = async (clubId: string, field: "account_status" | "plan", value: string) => {
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;
    const next = {
      account_status: field === "account_status" ? value : club.account_status ?? "demo",
      plan: field === "plan" ? value : club.plan ?? "",
    };
    setSavingAccount(`${clubId}:${field}`);
    setError(null);
    const err = await setClubAccount(clubId, next.account_status, next.plan);
    if (err) setError(err);
    else setClubs((cs) => cs.map((c) => (c.id === clubId ? { ...c, account_status: next.account_status, plan: next.plan || null } : c)));
    setSavingAccount(null);
  };

  // Search filter.
  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? clubs.filter((c) => `${c.name} ${c.slug}`.toLowerCase().includes(q)) : clubs),
    [clubs, q]
  );

  // Grouping.
  const groupKeyOf = (c: AdminClub): string => {
    if (groupBy === "account_status") return c.account_status || "demo";
    if (groupBy === "plan") return c.plan || "unset";
    if (groupBy === "sport") return c.sport_type || "other";
    return "all";
  };
  const groupLabelOf = (key: string): string => {
    if (groupBy === "sport") return SPORT_LABELS[key] ?? titleCase(key);
    return titleCase(key);
  };
  const groups = useMemo(() => {
    const map: Record<string, AdminClub[]> = {};
    for (const c of filtered) (map[groupKeyOf(c)] ??= []).push(c);
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [filtered, groupBy]);

  const clubRow = (club: AdminClub) => (
    <tr key={club.id}>
      <td className="sw-super-clubcell">
        <strong>{club.name}</strong>
        <small>{club.slug}</small>
        <div style={{ display: "flex", gap: 6, margin: "6px 0 4px", flexWrap: "wrap" }}>
          <select
            value={club.account_status ?? "demo"}
            disabled={savingAccount === `${club.id}:account_status`}
            onChange={(e) => saveAccount(club.id, "account_status", e.target.value)}
            title="Account status"
            style={{ fontSize: 12, padding: "2px 4px", borderRadius: 6 }}
          >
            {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
          <select
            value={club.plan ?? ""}
            disabled={savingAccount === `${club.id}:plan`}
            onChange={(e) => saveAccount(club.id, "plan", e.target.value)}
            title="Plan"
            style={{ fontSize: 12, padding: "2px 4px", borderRadius: 6 }}
          >
            <option value="">No plan</option>
            {PLAN_TIERS.map((p) => <option key={p} value={p}>{titleCase(p)}</option>)}
          </select>
        </div>
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
  );

  const tableFor = (list: AdminClub[]) => (
    <div className="sw-super-table-wrap">
      <table className="sw-admin-table sw-super-table">
        <thead>
          <tr>
            <th>Club</th>
            {MODULE_CATALOG.map((m) => <th key={m.key}>{m.name}</th>)}
          </tr>
        </thead>
        <tbody>{list.map(clubRow)}</tbody>
      </table>
    </div>
  );

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
              <span>Sport</span>
              <select value={form.sport} onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value }))}>
                <option value="afl">Australian Rules (AFL)</option>
                <option value="afl_netball">AFL / Netball (FNC)</option>
                <option value="soccer">Soccer / Football</option>
                <option value="cricket">Cricket</option>
                <option value="netball">Netball</option>
                <option value="basketball">Basketball</option>
                <option value="rugby_union">Rugby Union</option>
                <option value="rugby_league">Rugby League</option>
                <option value="other">Other (lacrosse, oztag, touch, etc.)</option>
              </select>
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
              <span>Tertiary colour</span>
              <input type="color" value={form.tertiary} onChange={(e) => setForm((f) => ({ ...f, tertiary: e.target.value }))} />
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

      {/* Search + grouping controls */}
      {!loading && clubs.length > 0 && (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", margin: "0 0 1rem" }}>
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs…"
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 30px 8px 12px", borderRadius: 8, border: "1px solid #d7dbe3", fontSize: 14 }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", border: "none", background: "none", color: "#8a94a6", cursor: "pointer", fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#667085" }}>
            Group by
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as typeof groupBy)}
              style={{ padding: "7px 10px", borderRadius: 8, border: "1px solid #d7dbe3", fontSize: 14 }}
            >
              <option value="none">None</option>
              <option value="account_status">Account status</option>
              <option value="plan">Plan</option>
              <option value="sport">Sport</option>
            </select>
          </label>
          {groupBy !== "none" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" onClick={() => setCollapsed({})} style={{ border: "1px solid #d7dbe3", background: "#fff", color: "#475467", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, cursor: "pointer" }}>
                Expand all
              </button>
              <button type="button" onClick={() => setCollapsed(Object.fromEntries(groups.map(([k]) => [k, true])))} style={{ border: "1px solid #d7dbe3", background: "#fff", color: "#475467", borderRadius: 8, padding: "6px 10px", fontSize: 12.5, cursor: "pointer" }}>
                Collapse all
              </button>
            </div>
          )}
          <span style={{ fontSize: 12.5, color: "#8a94a6", marginLeft: "auto" }}>
            {search ? `Showing ${filtered.length} of ${clubs.length}` : `${clubs.length} ${clubs.length === 1 ? "club" : "clubs"}`}
          </span>
        </div>
      )}

      {loading ? (
        <p>Loading clubs…</p>
      ) : clubs.length === 0 ? (
        <p className="sw-muted">No clubs found, or you're not a platform admin.</p>
      ) : filtered.length === 0 ? (
        <p className="sw-muted">No clubs match “{search}”.</p>
      ) : groupBy === "none" ? (
        tableFor(filtered)
      ) : (
        <div style={{ display: "grid", gap: "1.1rem" }}>
          {groups.map(([key, list]) => {
            const isCollapsed = collapsed[key];
            return (
              <section key={key}>
                <button
                  type="button"
                  onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "4px 0", fontFamily: "var(--font-display, inherit)", fontSize: "1.05rem", fontWeight: 700, color: "#11161f" }}
                >
                  <span style={{ display: "inline-block", transition: "transform .15s", transform: isCollapsed ? "rotate(-90deg)" : "none" }}>▾</span>
                  {groupLabelOf(key)}
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#8a94a6" }}>{list.length}</span>
                </button>
                {!isCollapsed && tableFor(list)}
              </section>
            );
          })}
        </div>
      )}
      <p className="sw-comms-note" style={{ marginTop: "1rem" }}>
        A switch left untouched uses the site's built-in default. Turning it on records an explicit
        “enabled”; turning it off records “locked”, which overrides any default.
      </p>
    </div>
  );
}
