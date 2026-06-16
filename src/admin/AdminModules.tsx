import { useState } from "react";
import { useClub } from "../components/ClubContext";
import { MediaEmbed } from "../components/blocks/MediaEmbed";
import { MODULE_CATALOG, getModule } from "../lib/modules";

export function AdminModules() {
  const { club } = useClub();
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const enabled = new Set(club.enabledModules ?? []);
  const salesEmail = club.platform?.salesEmail ?? club.contact.email;
  const trialDays = club.platform?.trialDays ?? 14;

  const mailto = (subject: string, modName: string) =>
    `mailto:${salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Club: ${club.identity.name}\nModule: ${modName}\n\n`
    )}`;

  const mod = getModule(activeKey);

  if (mod) {
    const on = enabled.has(mod.key);
    const appUrl = mod.key === "volunteers" ? club.platform?.volunteerAppUrl || "" : mod.appUrl ?? "";
    const canEmbed = mod.key === "volunteers" && !!appUrl;
    return (
      <div className="sw-admin-panel">
        <div className="sw-admin-formhead">
          <h2>{mod.name}</h2>
          <button className="sw-btn sw-btn--ghost" onClick={() => setActiveKey(null)}>
            ← All modules
          </button>
        </div>

        {on ? (
          <div className="sw-module-banner on">
            <div>
              <strong>This module is active for {club.identity.shortName}.</strong>
              <p>Jump in below, or follow the quick start if you&apos;re new to it.</p>
            </div>
            {appUrl ? (
              <a className="sw-btn" href={appUrl} target="_blank" rel="noopener noreferrer">
                Open {mod.name} ↗
              </a>
            ) : mod.key === "volunteers" ? (
              <span className="sw-flag">Set volunteerAppUrl in config to open it</span>
            ) : (
              <span className="sw-flag">Launching soon</span>
            )}
          </div>
        ) : (
          <div className="sw-module-banner off">
            <div>
              <strong>{mod.name} isn&apos;t on your plan yet.</strong>
              <p>Try it free for {trialDays} days, or add it to your plan — we&apos;ll get you set up.</p>
            </div>
            <div className="sw-module-cta">
              <a className="sw-btn" href={mailto(`Free trial — ${mod.name}`, mod.name)}>
                Start {trialDays}-day free trial
              </a>
              <a className="sw-btn sw-btn--ghost" href={mailto(`Upgrade — ${mod.name}`, mod.name)}>
                Upgrade plan
              </a>
            </div>
          </div>
        )}

        {on && canEmbed && (
          <div className="sw-module-section">
            <h2>Live preview</h2>
            <p className="sw-admin-note">
              The Volunteer Manager running inside your admin. You may need to sign in to it the first time.
            </p>
            <div className="sw-module-embed">
              <iframe src={appUrl} title="Volunteer Manager" loading="lazy" />
            </div>
          </div>
        )}

        <p className="sw-lead" style={{ marginTop: "1.5rem" }}>{mod.summary}</p>

        <div className="sw-module-section">
          <h2>What you can do</h2>
          <ul className="sw-ticks">
            {mod.overview.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>

        <div className="sw-module-section">
          <h2>Quick start</h2>
          <ol className="sw-msteps">
            {mod.quickstart.map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <span>{s.body}</span>
              </li>
            ))}
          </ol>
        </div>

        {mod.videos && mod.videos.length > 0 && (
          <div className="sw-module-section">
            <h2>Walkthroughs</h2>
            {mod.videos.map((v) => (
              <div key={v.url}>
                <h3 style={{ marginBottom: "0.5rem" }}>{v.title}</h3>
                <MediaEmbed url={v.url} title={v.title} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Modules</h2>
      </div>
      <p className="sw-admin-note">
        Add-on tools for running the club. Open the ones you have, or take the others for a free trial.
      </p>
      <div className="sw-module-grid">
        {MODULE_CATALOG.map((m) => {
          const isOn = enabled.has(m.key);
          return (
            <button key={m.key} type="button" className="sw-module-card" onClick={() => setActiveKey(m.key)}>
              <div className="sw-module-top">
                <span className="sw-module-badge">{m.badge}</span>
                <span className={`sw-module-state ${isOn ? "on" : "off"}`}>{isOn ? "Active" : "Locked"}</span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.tagline}</p>
              <span className="sw-module-plan">{m.plan}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
