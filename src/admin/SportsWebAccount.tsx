import { useEffect, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { useClub } from "../components/ClubContext";
import { MODULE_CATALOG } from "../lib/modules";
import { getSportswebMetrics, type Metrics } from "../lib/roleKpis";
import { MfaSettings } from "./MfaSettings";

/** Illustrative standalone pricing ($/month) for the jobs SportsWeb One covers. */
const SAVINGS = [
  { tool: "Website & hosting", standalone: 75 },
  { tool: "Club email (office-bearers)", standalone: 30 },
  { tool: "Online registrations & payments", standalone: 60 },
  { tool: "Event ticketing", standalone: 49 },
  { tool: "Volunteer management", standalone: 40 },
  { tool: "File storage & documents", standalone: 25 },
  { tool: "Team line-ups & comms", standalone: 20 },
];
const SPORTSWEB_MONTHLY = 99; // illustrative club plan

export function SportsWebAccount() {
  const { clubId, clubName } = useActiveClub();
  const { club } = useClub();
  const [m, setM] = useState<Partial<Metrics>>({});

  useEffect(() => {
    let alive = true;
    if (clubId) getSportswebMetrics(clubId).then((r) => alive && setM(r));
    return () => {
      alive = false;
    };
  }, [clubId]);

  const enabled = new Set(club.enabledModules ?? []);
  const activeModules = MODULE_CATALOG.filter((x) => enabled.has(x.key));
  const records =
    (m.members?.active ?? 0) +
    (m.events?.upcoming ?? 0) +
    (m.volunteers?.active ?? 0) +
    (m.registrations?.pending ?? 0);

  const standaloneMonthly = SAVINGS.reduce((s, x) => s + x.standalone, 0);
  const savedYearly = (standaloneMonthly - SPORTSWEB_MONTHLY) * 12;

  return (
    <div className="sw-admin-panel sw-acc">
      <div className="sw-admin-formhead">
        <h2>SportsWeb One account</h2>
      </div>
      <p className="sw-admin-note">
        Everything about {clubName || "your club"}'s SportsWeb One account in one place — what's active, what it's
        saving you, and how to get help.
      </p>

      <div className="sw-acc-grid">
        {/* Account overview */}
        <section className="sw-acc-card">
          <span className="sw-acc-cap">Account</span>
          <div className="sw-acc-rows">
            <div className="sw-acc-row">
              <span>Status</span>
              <strong className="sw-acc-status">Active</strong>
            </div>
            <div className="sw-acc-row">
              <span>Plan</span>
              <strong>SportsWeb One · Club</strong>
            </div>
            <div className="sw-acc-row">
              <span>Club</span>
              <strong>{clubName || "—"}</strong>
            </div>
            <div className="sw-acc-row">
              <span>Renewal date</span>
              <strong className="sw-acc-soft">Syncs with billing</strong>
            </div>
            <div className="sw-acc-row">
              <span>Records managed</span>
              <strong>{records}</strong>
            </div>
          </div>
          <p className="sw-acc-foot">Plan, status and renewal fill in automatically once Zoho billing is connected.</p>
        </section>

        {/* Savings */}
        <section className="sw-acc-card sw-acc-card--save">
          <span className="sw-acc-cap">
            What you're saving <span className="sw-acc-est">Estimate</span>
          </span>
          <div className="sw-acc-savehead">
            <span className="sw-acc-savebig">${savedYearly.toLocaleString()}</span>
            <span className="sw-acc-savesub">a year vs running these separately</span>
          </div>
          <ul className="sw-acc-savelist">
            {SAVINGS.map((s) => (
              <li key={s.tool}>
                <span>{s.tool}</span>
                <span className="sw-acc-soft">${s.standalone}/mo</span>
              </li>
            ))}
            <li className="sw-acc-savetot">
              <span>Separately</span>
              <span>${standaloneMonthly}/mo</span>
            </li>
            <li className="sw-acc-savetot sw-acc-savetot--us">
              <span>SportsWeb One</span>
              <span>${SPORTSWEB_MONTHLY}/mo</span>
            </li>
          </ul>
          <p className="sw-acc-foot">Based on typical standalone pricing for each tool — a guide, not a quote.</p>
        </section>

        {/* Active modules */}
        <section className="sw-acc-card">
          <span className="sw-acc-cap">Active modules ({activeModules.length})</span>
          <div className="sw-acc-mods">
            {activeModules.length ? (
              activeModules.map((x) => (
                <span key={x.key} className="sw-swf-chip">
                  {x.name}
                </span>
              ))
            ) : (
              <span className="sw-acc-soft">No modules active yet.</span>
            )}
          </div>
        </section>

        {/* Security */}
        <section className="sw-acc-card">
          <span className="sw-acc-cap">Security</span>
          <MfaSettings />
        </section>

        {/* Support team */}
        <section className="sw-acc-card">
          <span className="sw-acc-cap">Your support team</span>
          <div className="sw-acc-mgr">
            <span className="sw-acc-avatar" aria-hidden="true">
              CB
            </span>
            <div>
              <strong>Carson Brooks</strong>
              <span className="sw-acc-soft">Account manager</span>
              <span className="sw-acc-soft">carson@sportsweb.com.au</span>
            </div>
          </div>
          <div className="sw-acc-actions">
            <button className="sw-btn" type="button">
              Live chat
            </button>
            <a className="sw-btn sw-btn--ghost" href="https://sportsweb.com.au/help" target="_blank" rel="noreferrer">
              Knowledge base
            </a>
            <a className="sw-btn sw-btn--ghost" href="https://sportsweb.com.au/faqs" target="_blank" rel="noreferrer">
              FAQs
            </a>
          </div>
          <p className="sw-acc-foot">Prefer chat? Once Committee Room is connected you can reach us there too.</p>
        </section>
      </div>
    </div>
  );
}
