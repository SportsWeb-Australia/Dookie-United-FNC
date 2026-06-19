import { useEffect, useState } from "react";
import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";
import { getMatchData } from "../../lib/matchData";
import type { MatchCentreData } from "../../content/types";

type Tab = "fixtures" | "results" | "ladder";

interface Props {
  bare?: boolean;
}

export function MatchCentre({ bare }: Props) {
  const { club } = useClub();
  const [data, setData] = useState<MatchCentreData>(club.matchCentre);
  const [tab, setTab] = useState<Tab>("fixtures");

  useEffect(() => {
    let active = true;
    getMatchData(club.matchCentre).then((d) => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, [club.matchCentre]);

  const embedSrc = data.mode === "embed" ? data.embed?.[tab] : undefined;

  const panel = (
    <>
      {data.liveLinks && data.liveLinks.length > 0 && (
        <div className="sw-mc-live">
          <span className="sw-mc-live-label">Live source</span>
          {data.liveLinks.map((l) => (
            <SmartLink key={l.label} href={l.href} className="sw-mc-live-link">
              {l.label} ↗
            </SmartLink>
          ))}
        </div>
      )}

      <div className="sw-mc-tabs" role="tablist" aria-label="Match centre">
        {(["fixtures", "results", "ladder"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className="sw-mc-tab"
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="sw-mc-panel" role="tabpanel">
        {embedSrc ? (
          <div className="sw-mc-embed">
            <div className="sw-mc-embed-head">
              <span className="sw-mc-comp">Live from {data.provider ?? "the league"}</span>
              <a className="sw-link-arrow" href={embedSrc} target="_blank" rel="noopener noreferrer">
                Open ↗
              </a>
            </div>
            <iframe
              title={`${tab} — ${data.competitionLabel}`}
              src={embedSrc}
              loading="lazy"
              style={{ width: "100%", height: `${data.embed?.height ?? 820}px`, border: 0, background: "#fff" }}
            />
            <p className="sw-mc-embed-note">
              If the live table doesn&apos;t load, the provider may block embedding — use “Open ↗”.
            </p>
          </div>
        ) : (
          <>
            {tab === "fixtures" && (
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fixtures.map((f, i) => (
                    <tr key={i}>
                      <td>{f.round}</td>
                      <td>{f.date}</td>
                      <td>
                        <span className="sw-mc-team">
                          {f.opponentLogo && <img className="sw-mc-logo" src={f.opponentLogo} alt="" loading="lazy" />}
                          {f.opponent}
                        </span>
                      </td>
                      <td>
                        <span className="sw-venue">{f.venue}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "results" && (
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Round</th>
                    <th>Opponent</th>
                    <th>Score</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((r, i) => (
                    <tr key={i}>
                      <td>{r.round}</td>
                      <td>
                        <span className="sw-mc-team">
                          {r.opponentLogo && <img className="sw-mc-logo" src={r.opponentLogo} alt="" loading="lazy" />}
                          {r.opponent}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>
                        {r.scoreFor} – {r.scoreAgainst}
                      </td>
                      <td>
                        <span className={`sw-pill ${r.outcome.toLowerCase()}`}>{r.outcome}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "ladder" && (
              <table className="sw-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>P</th>
                    <th>W</th>
                    <th>L</th>
                    <th>%</th>
                    <th>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ladder.map((row, i) => (
                    <tr key={i} className={row.isClub ? "is-club" : undefined}>
                      <td>
                        <span className="sw-mc-team">
                          {row.logo && <img className="sw-mc-logo" src={row.logo} alt="" loading="lazy" />}
                          {row.team}
                        </span>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.lost}</td>
                      <td style={{ fontFamily: "var(--font-mono)" }}>{row.pct.toFixed(1)}</td>
                      <td>
                        <strong>{row.points}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        <div className="sw-mc-foot">
          <span className="sw-mc-comp">
            {data.competitionLabel}
            {data.mode === "manual" && data.placeholder && (
              <span className="sw-flag" style={{ marginLeft: 8 }}>
                Manual / sample data
              </span>
            )}
          </span>
          {data.fullFixturesHref && (
            <SmartLink href={data.fullFixturesHref} className="sw-link-arrow">
              Full fixtures →
            </SmartLink>
          )}
        </div>
      </div>
    </>
  );

  if (bare) return panel;

  return (
    <section className="sw-section sw-section--alt">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">Match centre</span>
            <h2>Fixtures &amp; results</h2>
          </div>
        </div>
        {panel}
      </div>
    </section>
  );
}
