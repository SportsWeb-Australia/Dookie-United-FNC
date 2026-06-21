import type { ModuleDef } from "../lib/modules";

/**
 * Pre-page for a module: what it is, what you can do, a quick-start, and a
 * video slot (placeholder for now — clubs/Carson drop real walkthroughs in
 * later). Modules that aren't wired into this dashboard yet show "Coming soon".
 */
export function ModulePrePage({ mod, status }: { mod: ModulePre; status: "open" | "soon" }) {
  return (
    <div className="sw-admin-panel sw-mod">
      <div className="sw-mod-head">
        <span className="sw-mod-badge">{mod.badge}</span>
        <div>
          <h2>{mod.name}</h2>
          <p className="sw-mod-tagline">{mod.tagline}</p>
        </div>
        <span className={`sw-mod-status sw-mod-status--${status}`}>
          {status === "open" ? mod.plan : "Coming soon"}
        </span>
      </div>

      <p className="sw-mod-summary">{mod.summary}</p>

      <div className="sw-mod-video" aria-label="Video walkthrough placeholder">
        <span>▶ Video walkthrough</span>
        <small>Coming soon</small>
      </div>

      <div className="sw-mod-cols">
        <section>
          <h3>What you can do</h3>
          <ul className="sw-mod-list">
            {mod.overview.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Quick start guide</h3>
          <ol className="sw-mod-steps">
            {mod.quickstart.map((s, i) => (
              <li key={i}>
                <strong>{s.title}</strong>
                <span>{s.body}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="sw-mod-foot">
        {status === "open" && mod.appUrl ? (
          <a className="sw-btn" href={mod.appUrl} target="_blank" rel="noreferrer">
            Open {mod.name} →
          </a>
        ) : (
          <button className="sw-btn" disabled>
            Launching soon
          </button>
        )}
      </div>
    </div>
  );
}

export type ModulePre = Pick<
  ModuleDef,
  "key" | "name" | "badge" | "tagline" | "summary" | "overview" | "quickstart" | "plan" | "appUrl"
>;

/** Modules that have their own dashboard entry but aren't built into the club app yet. */
export const COMING_SOON_MODULES: ModulePre[] = [
  {
    key: "team_lineups",
    name: "Team Line-Ups",
    badge: "TL",
    tagline: "Pick your teams on a branded oval and share them everywhere.",
    summary:
      "Select each team on an oval-field graphic, add sponsors and headshots, then export a clean image for socials or embed it on your site.",
    overview: [
      "Drag players onto positions on a club-branded oval.",
      "Add sponsor banners, headshots and competition logos.",
      "Export to PNG / Instagram, or embed straight on your website.",
      "Save by round and clone last week's team to start fast.",
    ],
    quickstart: [
      { title: "Pick a team & round", body: "Choose the grade and round you're selecting for." },
      { title: "Place your players", body: "Drop players onto their positions and add any sponsors." },
      { title: "Share it", body: "Export the image or grab the embed link for your site." },
    ],
    plan: "SportsWeb module",
  },
];
