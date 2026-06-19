import { useClub } from "../ClubContext";
import type { DesignVariant } from "../../content/types";

const OPTIONS: { id: DesignVariant; label: string }[] = [
  { id: "heritage", label: "Heritage" },
  { id: "broadcast", label: "Broadcast" },
  { id: "arena", label: "Arena" },
  { id: "classic", label: "Classic" },
  { id: "stadium", label: "Stadium" },
  { id: "editorial", label: "Editorial" },
  { id: "momentum", label: "Momentum" },
  { id: "coastal", label: "Coastal" },
];

/**
 * Lets the club preview both design templates live before choosing one.
 * Controlled by `showVariantSwitcher` in club.config.ts — set to false to hide
 * for production once a design is chosen.
 */
export function VariantSwitcher() {
  const { variant, setVariant } = useClub();
  return (
    <div className="sw-switcher" role="group" aria-label="Choose design template">
      <span className="sw-switcher-label">Design</span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          data-active={variant === o.id}
          aria-pressed={variant === o.id}
          onClick={() => setVariant(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
