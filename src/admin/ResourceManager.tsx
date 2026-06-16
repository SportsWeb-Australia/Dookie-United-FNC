import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { uploadToStorage } from "../lib/upload";
import { useAuth } from "../lib/auth";
import { slugify, type Field, type ResourceDef } from "./resources";

type Row = Record<string, unknown> & { id?: string };

function toInputDateTime(value: unknown): string {
  if (!value) return "";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromInputDateTime(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function ResourceManager({ resource }: { resource: ResourceDef }) {
  const { membership } = useAuth();
  const clubId = membership?.clubId;

  const [rows, setRows] = useState<Row[]>([]);
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase || !clubId) return;
    setError(null);
    const { data, error: e } = await supabase
      .from(resource.table)
      .select("*")
      .eq("club_id", clubId)
      .order(resource.order.col, { ascending: resource.order.asc });
    if (e) setError(e.message);
    else setRows((data as Row[]) ?? []);
  }, [clubId, resource]);

  useEffect(() => {
    setEditing(null);
    load();
  }, [load]);

  const openNew = () => {
    const v: Record<string, string> = {};
    for (const f of resource.fields) {
      const d = resource.defaults[f.name];
      v[f.name] = d != null ? String(d) : "";
    }
    setValues(v);
    setEditing("new");
  };

  const openEdit = (row: Row) => {
    const v: Record<string, string> = {};
    for (const f of resource.fields) {
      const raw = row[f.name];
      if (f.type === "datetime") v[f.name] = toInputDateTime(raw);
      else if (f.type === "boolean") v[f.name] = raw === true ? "true" : "false";
      else v[f.name] = raw != null ? String(raw) : "";
    }
    setValues(v);
    setEditing(row);
  };

  const save = async () => {
    if (!supabase || !clubId) return;
    setBusy(true);
    setError(null);
    const payload: Record<string, unknown> = { club_id: clubId };
    for (const f of resource.fields) {
      const val = values[f.name] ?? "";
      if (f.type === "datetime") payload[f.name] = fromInputDateTime(val);
      else if (f.type === "number") payload[f.name] = val === "" ? null : Number(val);
      else if (f.type === "boolean") payload[f.name] = val === "true";
      else payload[f.name] = val === "" ? null : val;
    }
    if (resource.slugFrom && (!payload.slug || payload.slug === "")) {
      payload.slug = slugify(String(values[resource.slugFrom] ?? ""));
    }

    const isNew = editing === "new";
    const query = isNew
      ? supabase.from(resource.table).insert(payload)
      : supabase.from(resource.table).update(payload).eq("id", (editing as Row).id).eq("club_id", clubId);

    const { error: e } = await query;
    setBusy(false);
    if (e) {
      setError(e.message);
      return;
    }
    setEditing(null);
    load();
  };

  const runImport = async () => {
    if (!supabase || !clubId) return;
    setBusy(true);
    setImportMsg(null);
    setError(null);
    try {
      const records = parseCsv(importText);
      if (!records.length) {
        setImportMsg("No rows found. Include a header row, then one row per line.");
        setBusy(false);
        return;
      }
      const fieldByName = new Map(resource.fields.map((f) => [f.name, f]));
      const payloads = records.map((rec) => {
        const out: Record<string, unknown> = { club_id: clubId, ...resource.defaults };
        for (const [col, raw] of Object.entries(rec)) {
          const f = fieldByName.get(col);
          if (!f) continue; // ignore unknown columns
          out[col] = coerceCsv(f, raw);
        }
        return out;
      });
      const { error: e } = await supabase.from(resource.table).insert(payloads);
      if (e) {
        setError(e.message);
      } else {
        setImportMsg(`Imported ${payloads.length} row${payloads.length === 1 ? "" : "s"}.`);
        setImportText("");
        setImporting(false);
        load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not parse CSV.");
    }
    setBusy(false);
  };

  const remove = async (row: Row) => {
    if (!supabase || !clubId || !row.id) return;
    if (!window.confirm("Delete this item? This can't be undone.")) return;
    const { error: e } = await supabase
      .from(resource.table)
      .delete()
      .eq("id", row.id)
      .eq("club_id", clubId);
    if (e) setError(e.message);
    else load();
  };

  if (importing) {
    const template = csvTemplate(resource);
    return (
      <div className="sw-admin-panel">
        <div className="sw-admin-formhead">
          <h2>Import {resource.label}</h2>
          <button className="sw-btn sw-btn--ghost" onClick={() => { setImporting(false); setImportMsg(null); }}>
            Cancel
          </button>
        </div>
        {error && <p className="sw-admin-error">{error}</p>}
        {importMsg && <p className="sw-admin-note">{importMsg}</p>}
        <div className="sw-admin-form">
          <label className="sw-admin-field">
            <span>Paste CSV</span>
            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={template}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            />
            <small>
              First row must be the column headers below. One match/row per line. Unknown columns are ignored;
              missing ones use defaults.
            </small>
          </label>
          <div className="sw-admin-field">
            <span>Columns</span>
            <code className="sw-admin-code">{resource.fields.map((f) => f.name).join(", ")}</code>
            <button
              type="button"
              className="sw-btn sw-btn--ghost"
              style={{ marginTop: 8, alignSelf: "flex-start" }}
              onClick={() => setImportText(template)}
            >
              Insert example
            </button>
          </div>
        </div>
        <button className="sw-btn" onClick={runImport} disabled={busy || !importText.trim()}>
          {busy ? "Importing…" : "Import rows"}
        </button>
      </div>
    );
  }

  if (editing !== null) {
    return (
      <div className="sw-admin-panel">
        <div className="sw-admin-formhead">
          <h2>{editing === "new" ? `New ${resource.singular}` : `Edit ${resource.singular}`}</h2>
          <button className="sw-btn sw-btn--ghost" onClick={() => setEditing(null)}>
            Cancel
          </button>
        </div>
        {error && <p className="sw-admin-error">{error}</p>}
        <div className="sw-admin-form">
          {resource.fields.map((f) => (
            <FieldInput key={f.name} field={f} value={values[f.name] ?? ""} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} clubId={clubId} folder={resource.table} />
          ))}
        </div>
        <button className="sw-btn" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    );
  }

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>{resource.label}</h2>
        <div className="sw-admin-headactions">
          {resource.bulkImport && (
            <button className="sw-btn sw-btn--ghost" onClick={() => { setImporting(true); setImportMsg(null); }}>
              Import CSV
            </button>
          )}
          <button className="sw-btn" onClick={openNew}>
            New {resource.singular}
          </button>
        </div>
      </div>
      {error && <p className="sw-admin-error">{error}</p>}
      {importMsg && <p className="sw-admin-note">{importMsg}</p>}
      {rows.length === 0 ? (
        <p className="sw-admin-empty">Nothing here yet. Create your first {resource.singular.toLowerCase()}.</p>
      ) : (
        <table className="sw-table sw-admin-table">
          <thead>
            <tr>
              {resource.listColumns.map((c) => (
                <th key={c.name}>{c.label}</th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row.id)}>
                {resource.listColumns.map((c) => (
                  <td key={c.name}>{formatCell(row[c.name])}</td>
                ))}
                <td className="sw-admin-rowactions">
                  <button onClick={() => openEdit(row)}>Edit</button>
                  <button className="danger" onClick={() => remove(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "—";
  if (v === true) return "Yes";
  if (v === false) return "No";
  const s = String(v);
  // Tidy ISO timestamps in list view.
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  }
  return s;
}

function coerceCsv(field: Field, raw: string): unknown {
  const v = (raw ?? "").trim();
  if (v === "") return null;
  if (field.type === "number") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  if (field.type === "boolean") return /^(true|yes|y|1)$/i.test(v);
  if (field.type === "datetime") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return v;
}

/** Minimal RFC-4180-ish CSV parser: header row + records, handles quoted commas. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n").trim();
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(cell); cell = "";
    } else if (c === "\n") {
      row.push(cell); rows.push(row); row = []; cell = "";
    } else {
      cell += c;
    }
  }
  row.push(cell);
  rows.push(row);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim() !== ""))
    .map((r) => {
      const rec: Record<string, string> = {};
      headers.forEach((h, idx) => { rec[h] = (r[idx] ?? "").trim(); });
      return rec;
    });
}

function csvTemplate(resource: ResourceDef): string {
  const cols = resource.fields.map((f) => f.name);
  const header = cols.join(",");
  if (resource.key === "matches") {
    return [
      header,
      "Seniors,Round 1,2026-04-04T14:00,Benalla,,Home,,,scheduled",
      "Seniors,Round 2,2026-04-11T14:00,Euroa,,Away,,,scheduled",
    ].join("\n");
  }
  if (resource.key === "ladder") {
    return [
      header,
      "Seniors,1,Dookie United,,8,7,1,0,28,142.5,true",
      "Seniors,2,Benalla,,8,6,2,0,24,128.0,false",
    ].join("\n");
  }
  const example = cols.map((c) => (c === "status" ? "published" : "")).join(",");
  return [header, example].join("\n");
}

function FieldInput({ field, value, onChange, clubId, folder }: { field: Field; value: string; onChange: (v: string) => void; clubId?: string; folder?: string }) {
  if (field.type === "image" || field.type === "video") {
    return <UploadField field={field} value={value} onChange={onChange} clubId={clubId} folder={folder ?? "media"} />;
  }
  const common = { id: field.name, value, onChange: (e: { target: { value: string } }) => onChange(e.target.value) };
  return (
    <label className="sw-admin-field">
      <span>
        {field.label}
        {field.required && <i aria-hidden="true"> *</i>}
      </span>
      {field.type === "textarea" ? (
        <textarea rows={4} {...common} />
      ) : field.type === "boolean" ? (
        <select {...common}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      ) : field.type === "select" ? (
        <select {...common}>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type === "datetime" ? "datetime-local" : field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
          {...common}
        />
      )}
      {field.help && <small>{field.help}</small>}
    </label>
  );
}

function UploadField({ field, value, onChange, clubId, folder }: { field: Field; value: string; onChange: (v: string) => void; clubId?: string; folder: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isImage = field.type === "image";

  const onPick = async (e: { target: { files: FileList | null; value: string } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!clubId) {
      setErr("Your account isn't linked to a club yet, so uploads are disabled.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const url = await uploadToStorage(file, clubId, folder);
      onChange(url);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Upload failed.");
    }
    setBusy(false);
    e.target.value = "";
  };

  return (
    <label className="sw-admin-field">
      <span>
        {field.label}
        {field.required && <i aria-hidden="true"> *</i>}
      </span>
      {value &&
        (isImage ? (
          <img src={value} alt="" className="sw-admin-thumb" />
        ) : (
          <video src={value} className="sw-admin-thumb" controls preload="metadata" />
        ))}
      <div className="sw-admin-uploadrow">
        <input type="file" accept={isImage ? "image/*" : "video/*"} onChange={onPick} disabled={busy} />
        {busy && <span className="sw-admin-uploadbusy">Uploading…</span>}
        {value && !busy && (
          <button type="button" className="sw-admin-clear" onClick={() => onChange("")}>
            Remove
          </button>
        )}
      </div>
      <input type="url" value={value} placeholder="…or paste a URL" onChange={(e) => onChange(e.target.value)} />
      {err && <small className="sw-admin-error">{err}</small>}
      {field.help && <small>{field.help}</small>}
      {!clubId && <small>Sign in to upload files.</small>}
    </label>
  );
}
