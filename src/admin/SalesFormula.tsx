import { useEffect, useMemo, useState } from "react";
import {
  listSalesProducts,
  listSalesTargets,
  saveSalesTarget,
  deleteSalesTarget,
  computeLadder,
  type SalesProduct,
  type SalesTarget,
} from "../lib/sales";

const DEFAULT: SalesTarget = {
  name: "",
  product_key: "sportsweb_one",
  period: "monthly",
  revenue_target: 14000,
  avg_deal_value: 3500,
  close_rate: 0.3,
  show_rate: 0.8,
  booking_rate: 0.25,
  contact_rate: 0.35,
  cta_conversion_rate: 0.05,
};

const fmt = (n: number) => n.toLocaleString("en-AU");

function RateField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="sw-sales-field sw-sales-rate">
      {label}
      <span className="sw-sales-rate-in">
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Math.max(0, Math.min(100, Number(e.target.value))) / 100)}
        />
        <span className="sw-sales-pct">%</span>
      </span>
    </label>
  );
}

function Rung({ label, value }: { label: string; value: number }) {
  return (
    <div className="sw-sales-rung">
      <div className="sw-sales-rung-n">{fmt(value)}</div>
      <div className="sw-sales-rung-l">{label}</div>
    </div>
  );
}

export function SalesFormula() {
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [t, setT] = useState<SalesTarget>(DEFAULT);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listSalesProducts().then(setProducts);
    listSalesTargets().then(setTargets);
  }, []);

  const product = products.find((p) => p.key === t.product_key);
  const ladder = useMemo(() => computeLadder(t), [t]);

  const set = (patch: Partial<SalesTarget>) => setT((cur) => ({ ...cur, ...patch }));

  const pickProduct = (key: string) => {
    const p = products.find((x) => x.key === key);
    set({ product_key: key, avg_deal_value: p ? p.avg_deal_value : t.avg_deal_value });
  };

  const save = async () => {
    if (!t.name.trim()) {
      setMsg("Give the target a name first.");
      return;
    }
    setBusy(true);
    setMsg("");
    const err = await saveSalesTarget({ ...t, name: t.name.trim() });
    if (err) setMsg(err);
    else {
      setMsg("Saved.");
      setTargets(await listSalesTargets());
    }
    setBusy(false);
  };

  const remove = async (id?: string) => {
    if (!id) return;
    await deleteSalesTarget(id);
    setTargets(await listSalesTargets());
  };

  return (
    <div className="sw-admin-page">
      <header className="sw-admin-head">
        <div>
          <h1>Sales formula</h1>
          <p>Enter a revenue target and reverse-engineer the activity it takes to hit it.</p>
        </div>
      </header>

      <div className="sw-sales-banner">
        <strong>In development</strong> — deal values and conversion rates are placeholders until you set real numbers. Anything tagged
        “placeholder” is a starting assumption, not live data.
      </div>

      <div className="sw-sales-grid">
        {/* Inputs */}
        <div className="sw-sales-card sw-sales-form">
          <label className="sw-sales-field">
            Target name
            <input value={t.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Q3 SportsWeb One" />
          </label>

          <div className="sw-sales-row sw-sales-row--3">
            <label className="sw-sales-field">
              Product
              <select value={t.product_key ?? ""} onChange={(e) => pickProduct(e.target.value)}>
                {products.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="sw-sales-field">
              Period
              <select value={t.period} onChange={(e) => set({ period: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </label>
          </div>

          <div className="sw-sales-row">
            <label className="sw-sales-field">
              Revenue target ($)
              <input type="number" min={0} value={t.revenue_target} onChange={(e) => set({ revenue_target: Number(e.target.value) })} />
            </label>
            <label className="sw-sales-field">
              <span>Avg deal value ($){product?.is_placeholder && <em className="sw-sales-ph"> · placeholder</em>}</span>
              <input type="number" min={0} value={t.avg_deal_value} onChange={(e) => set({ avg_deal_value: Number(e.target.value) })} />
            </label>
          </div>

          <div className="sw-sales-sub">Conversion assumptions</div>
          <div className="sw-sales-rates">
            <RateField label="Close rate" value={t.close_rate} onChange={(v) => set({ close_rate: v })} />
            <RateField label="Demo show rate" value={t.show_rate} onChange={(v) => set({ show_rate: v })} />
            <RateField label="Conversation → booking" value={t.booking_rate} onChange={(v) => set({ booking_rate: v })} />
            <RateField label="Contact rate" value={t.contact_rate} onChange={(v) => set({ contact_rate: v })} />
            <RateField label="CTA conversion" value={t.cta_conversion_rate} onChange={(v) => set({ cta_conversion_rate: v })} />
          </div>

          <div className="sw-sales-actions">
            <button onClick={save} disabled={busy} className="sw-btn">{t.id ? "Update target" : "Save target"}</button>
            {t.id && <button onClick={() => setT(DEFAULT)} className="sw-sales-link">New</button>}
            {msg && <span className={`sw-sales-msg${msg === "Saved." ? " is-ok" : " is-err"}`}>{msg}</span>}
          </div>
        </div>

        {/* Ladder */}
        <div className="sw-sales-col">
          <div className="sw-sales-lead">
            To win <strong>{fmt(ladder.wins)}</strong> {ladder.wins === 1 ? "deal" : "deals"} ({t.period}), the funnel needs:
          </div>
          <div className="sw-sales-rungs">
            <Rung label="Wins" value={ladder.wins} />
            <Rung label="Presentations" value={ladder.presentations} />
            <Rung label="Demos booked" value={ladder.demos} />
            <Rung label="Conversations" value={ladder.conversations} />
            <Rung label="Contact attempts" value={ladder.contacts} />
          </div>
          <div className="sw-sales-cta">
            <div className="sw-sales-cta-n">{fmt(ladder.ctaViews)}</div>
            <div className="sw-sales-rung-l">CTA views</div>
          </div>
          <div className="sw-sales-chain">
            <strong>{fmt(ladder.wins)} sales</strong> = {fmt(ladder.presentations)} presentations = {fmt(ladder.demos)} demos booked ={" "}
            {fmt(ladder.conversations)} conversations = {fmt(ladder.contacts)} targeted contacts = <strong>{fmt(ladder.ctaViews)} CTA views</strong>.
          </div>

          {targets.length > 0 && (
            <div className="sw-sales-card">
              <div className="sw-sales-sub">Saved targets</div>
              <div className="sw-sales-saved">
                {targets.map((s) => (
                  <div key={s.id} className="sw-sales-saved-row">
                    <button onClick={() => setT(s)} className="sw-sales-saved-name">{s.name}</button>
                    <span className="sw-sales-saved-meta">${fmt(s.revenue_target)} · {s.period}</span>
                    <button onClick={() => remove(s.id)} className="sw-sales-link is-danger">Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
