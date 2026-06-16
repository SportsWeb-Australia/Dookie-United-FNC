import { useClub } from "../components/ClubContext";
import type { DesignVariant } from "../content/types";

const STYLES: { id: DesignVariant; label: string; note: string }[] = [
  { id: "heritage", label: "Heritage", note: "Clean, light, classic club feel." },
  { id: "broadcast", label: "Broadcast", note: "Dark and bold, TV-style." },
  { id: "arena", label: "Arena", note: "Sharp, flat, high-impact." },
  { id: "classic", label: "Classic", note: "Elegant serif, centred." },
  { id: "stadium", label: "Stadium", note: "Full-bleed photo hero + scoreboard." },
  { id: "editorial", label: "Editorial", note: "Magazine-style overlap." },
  { id: "momentum", label: "Momentum", note: "Diagonal split, energetic." },
  { id: "coastal", label: "Coastal", note: "Airy, light, relaxed." },
];

export function AdminWebsite() {
  const { club, variant, setVariant } = useClub();

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Website style</h2>
      </div>
      <p className="sw-admin-note">
        Pick a look for the {club.identity.shortName} website. The preview applies live across the
        site — saving it as your permanent style is coming soon.
      </p>
      <div className="sw-admin-styles">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sw-admin-style"
            data-active={s.id === variant}
            onClick={() => setVariant(s.id)}
          >
            <strong>{s.label}</strong>
            <span>{s.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
