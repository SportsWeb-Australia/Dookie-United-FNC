import { useEffect, useState } from "react";
import { clubRetention, type ClubRetention } from "../lib/retention";

function Mini({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: tone ?? "#11161f" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#667085" }}>{label}</div>
    </div>
  );
}

export function RetentionCard({ clubId }: { clubId: string }) {
  const [r, setR] = useState<ClubRetention | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let live = true;
    clubRetention(clubId).then((res) => {
      if (live) {
        setR(res);
        setLoaded(true);
      }
    });
    return () => {
      live = false;
    };
  }, [clubId]);

  if (!loaded || !r) return null;

  const rateTone = r.retention_rate >= 75 ? "#1f9d57" : r.retention_rate >= 50 ? "#b45309" : "#d64545";

  return (
    <section className="sw-dash-panel" style={{ marginTop: "1.25rem" }}>
      <header className="sw-dash-panelhead">
        <h3>Player retention</h3>
      </header>
      {!r.have_two_seasons ? (
        <p className="sw-muted" style={{ margin: 0 }}>
          Retention compares one season to the next. Once you've run two seasons with players assigned to them, your
          year-on-year retention shows here — your earliest signal of whether last year's players are coming back.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 26, flexWrap: "wrap", alignItems: "baseline" }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.1, color: rateTone }}>{r.retention_rate}%</div>
              <div style={{ fontSize: 12.5, color: "#667085" }}>
                returned · {r.previous_season} → {r.current_season}
              </div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <Mini label="Retained" value={r.retained} tone="#1f9d57" />
              <Mini label="New" value={r.new} tone="#2563eb" />
              <Mini label="Not back" value={r.churned} tone="#d64545" />
            </div>
          </div>
          <p className="sw-comms-note" style={{ marginTop: 12 }}>
            {r.retained} of last season's {r.members_prev} players came back; {r.churned} haven't yet ({r.churn_rate}% churn).
          </p>
        </>
      )}
    </section>
  );
}
