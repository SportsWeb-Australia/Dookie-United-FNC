import { useState } from "react";
import { readSidebarLook, writeSidebarLook, SIDEBAR_LOOKS, type SidebarLook } from "./sidebarLook";

/**
 * Three-option picker for the admin sidebar appearance. Self-contained: reads/writes
 * localStorage and broadcasts a window event that AdminApp listens for, so the look
 * updates live without prop-drilling through the admin shell.
 */
export function SidebarAppearance() {
  const [look, setLook] = useState<SidebarLook>(readSidebarLook);

  const choose = (value: SidebarLook) => {
    setLook(value);
    writeSidebarLook(value);
  };

  return (
    <div className="sw-look">
      <span className="sw-look-label">Sidebar appearance</span>
      <div className="sw-look-row" role="radiogroup" aria-label="Sidebar appearance">
        {SIDEBAR_LOOKS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={look === o.value}
            className="sw-look-opt"
            data-active={look === o.value}
            onClick={() => choose(o.value)}
          >
            <span className="sw-look-name">{o.label}</span>
            <span className="sw-look-hint">{o.hint}</span>
          </button>
        ))}
      </div>
      <p className="sw-acc-foot">Changes only how the admin menu looks, saved on this device.</p>
    </div>
  );
}
