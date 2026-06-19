import { useClub } from "../ClubContext";
import { AccentBars } from "../layout/Chevron";

interface Props {
  bare?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Committee({ bare }: Props) {
  const { club } = useClub();

  const grid = (
    <div className="sw-people">
      {club.committee.map((p, i) => (
        <div className="sw-person" key={i}>
          <div className="sw-person-avatar">{initials(p.name)}</div>
          <div className="sw-person-role">{p.role}</div>
          <div className="sw-person-name">{p.name}</div>
          {p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}
          {p.placeholder && <div className="sw-flag" style={{ marginTop: 6 }}>Placeholder</div>}
        </div>
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <section className="sw-section">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">Who runs the club</span>
            <h2>Committee &amp; coaches</h2>
          </div>
        </div>
        {grid}
      </div>
    </section>
  );
}
