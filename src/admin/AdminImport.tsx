import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useActiveClub } from "./ActiveClub";

/**
 * Import a club (SportsWeb admin tool).
 * Pastes an existing club website, asks the import-club Edge Function to fetch
 * and read it, then lets the admin pre-fill the *active* club's website editor.
 * Applying writes club_content through the same path the website editor uses,
 * so it respects the normal row-level security.
 */

type ImportResult = {
  sourceUrl: string;
  name: string;
  heroTitle: string;
  heroSubtitle: string;
  description: string;
  logo: string;
  accent: string;
  email: string;
  phone: string;
  instagram: string;
  facebook: string;
};

// Fields we can write straight into the website editor (content_key → public site).
const FIELDS: { key: keyof ImportResult; label: string; ck: string }[] = [
  { key: "heroTitle", label: "Homepage title", ck: "hero.title" },
  { key: "heroSubtitle", label: "Homepage subtitle", ck: "hero.subtitle" },
  { key: "logo", label: "Logo / main image URL", ck: "branding.logo" },
  { key: "email", label: "Contact email", ck: "contact.email" },
  { key: "phone", label: "Contact phone", ck: "contact.phone" },
  { key: "instagram", label: "Instagram link", ck: "contact.instagram" },
  { key: "facebook", label: "Facebook link", ck: "contact.facebook" },
];

export function AdminImport() {
  const { clubId, clubName } = useActiveClub();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [vals, setVals] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [detected, setDetected] = useState<{ name: string; accent: string } | null>(null);
  const [applyMsg, setApplyMsg] = useState("");

  async function fetchPreview() {
    if (!url.trim() || !supabase) return;
    setBusy(true);
    setError("");
    setApplyMsg("");
    setDetected(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-club", { body: { url: url.trim() } });
      if (error) throw error;
      if (!data?.ok || !data?.result) {
        setError(data?.error || "Couldn't read that site.");
        return;
      }
      const r = data.result as ImportResult;
      const nextVals: Record<string, string> = {};
      const nextPicked: Record<string, boolean> = {};
      for (const f of FIELDS) {
        const v = (r[f.key] as string) || "";
        nextVals[f.key] = v;
        nextPicked[f.key] = v.length > 0; // pre-tick the ones we actually found
      }
      setVals(nextVals);
      setPicked(nextPicked);
      setDetected({ name: r.name || "", accent: r.accent || "" });
    } catch (e: any) {
      setError(e?.message || "Import failed. Make sure the import-club function is deployed.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!clubId || !supabase) return;
    const rows = FIELDS.filter((f) => picked[f.key] && (vals[f.key] || "").trim()).map((f) => ({
      club_id: clubId,
      content_key: f.ck,
      value: vals[f.key].trim(),
    }));
    if (!rows.length) {
      setApplyMsg("Tick at least one field to apply.");
      return;
    }
    setApplyMsg("Applying…");
    const { error } = await supabase.from("club_content").upsert(rows, { onConflict: "club_id,content_key" });
    setApplyMsg(error ? `Couldn't save: ${error.message}` : `Applied ${rows.length} field(s) to ${clubName}. Reload the public site to see them.`);
  }

  const hasPreview = Object.keys(vals).length > 0;

  return (
    <div className="sw-admin-panel sw-import">
      <div className="sw-admin-formhead">
        <h2>Import a club</h2>
      </div>
      <p className="sw-admin-note">
        Paste a club's existing website and SportsWeb will read its homepage to pre-fill the website editor. It only reads public
        pages — review everything before applying, and tweak any field by hand.
      </p>

      {!clubId ? (
        <div className="sw-import-empty">
          Open a club first (<strong>Platform · SportsWeb → Clubs → Open admin</strong>), then come back here to import into it.
        </div>
      ) : (
        <>
          <div className="sw-import-target">
            Importing into: <strong>{clubName}</strong>
          </div>

          <div className="sw-import-bar">
            <input
              className="sw-input"
              placeholder="https://theirclub.com.au"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchPreview()}
            />
            <button className="sw-btn" onClick={fetchPreview} disabled={busy || !url.trim()}>
              {busy ? "Reading…" : "Fetch & preview"}
            </button>
          </div>

          {error && <div className="sw-import-error">{error}</div>}

          {hasPreview && (
            <div className="sw-import-preview">
              {detected && (detected.name || detected.accent) && (
                <p className="sw-ed-hint">
                  Detected{detected.name ? ` name “${detected.name}”` : ""}
                  {detected.accent ? ` · brand colour ${detected.accent} (set this under Branding if you want it)` : ""}.
                </p>
              )}

              {FIELDS.map((f) => (
                <div className="sw-import-row" key={f.key}>
                  <label className="sw-import-check">
                    <input
                      type="checkbox"
                      checked={!!picked[f.key]}
                      onChange={(e) => setPicked((p) => ({ ...p, [f.key]: e.target.checked }))}
                    />
                    <span>{f.label}</span>
                  </label>
                  <input
                    className="sw-input"
                    value={vals[f.key] ?? ""}
                    placeholder="(nothing found — type a value)"
                    onChange={(e) => setVals((v) => ({ ...v, [f.key]: e.target.value }))}
                  />
                </div>
              ))}

              <div className="sw-ed-foot">
                <button className="sw-btn" onClick={apply}>
                  Apply to {clubName}
                </button>
                <span className="sw-ed-status" aria-live="polite">{applyMsg}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
