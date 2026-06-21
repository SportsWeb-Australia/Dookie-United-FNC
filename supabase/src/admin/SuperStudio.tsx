// Placeholder for the future Template Studio. Visual + brief so we can pick it
// up later. Not wired to anything yet — deliberately inert.

const TILES = [
  { name: "Broadcast", accent: "#C21F22", layout: "split" },
  { name: "Heritage", accent: "#1F8CA7", layout: "stack" },
  { name: "Stadium", accent: "#0E1320", layout: "wide" },
  { name: "Editorial", accent: "#7A5C2E", layout: "grid" },
];

export function SuperStudio() {
  return (
    <div className="sw-admin-page">
      <header className="sw-admin-head">
        <div>
          <h1>
            Template Studio <span className="sw-dev-pill">In development</span>
          </h1>
          <p>Generate new club designs, tweak them, and grow the SportsWeb portfolio.</p>
        </div>
        <button className="sw-btn" disabled title="Coming soon">
          ✦ Generate design
        </button>
      </header>

      <div className="sw-studio-grid">
        {TILES.map((t) => (
          <div className="sw-studio-tile" key={t.name} style={{ ["--tile" as string]: t.accent }}>
            <div className={`sw-studio-wire sw-studio-wire--${t.layout}`}>
              <span className="sw-studio-bar" />
              <span className="sw-studio-block" />
              <span className="sw-studio-block" />
              <span className="sw-studio-block" />
            </div>
            <div className="sw-studio-tilefoot">
              <strong>{t.name}</strong>
              <span>preview</span>
            </div>
          </div>
        ))}
      </div>

      <section className="sw-studio-note">
        <h3>What this will do (build brief)</h3>
        <p>
          Press <em>Generate</em> to produce a fresh, harmonious design — palette, font pairing and a base layout — then
          tweak and name it. A SportsWeb Admin submits it for approval; a Superadmin approves or rejects; only approved
          designs appear in the portfolio clubs choose from.
        </p>
        <ul>
          <li>Templates become data (stored in the database) so a new one appears without a code deploy.</li>
          <li>Two phases: (1) Studio + approval queue, (2) wire approved designs into each club's Website-style picker.</li>
          <li>New structural layouts (elements in genuinely different places) are still a code build — the generator
            combines those layouts with new colours and fonts.</li>
          <li>Approval is enforced at the database, the same way as the rest of the role model.</li>
        </ul>
        <p className="sw-comms-note">Parked for now — come back to this when the portfolio push begins.</p>
      </section>
    </div>
  );
}
