/**
 * Per-user/per-device admin sidebar appearance preference.
 *
 * Three looks share the same structure/font/icons and differ only in the
 * active-item treatment and row density (see [data-sidebar-look] blocks in
 * blocks.css). "calm" is the default baseline and needs no attribute overrides.
 * Stored in localStorage only - no Supabase, no schema.
 */
export type SidebarLook = "calm" | "workspace" | "refined";

const KEY = "sw1.admin.sidebar.look";
const LOOKS: SidebarLook[] = ["calm", "workspace", "refined"];

/** Fired on the window after a write so the live admin shell can re-read and re-apply. */
export const SIDEBAR_LOOK_EVENT = "sw1:sidebar-look";

/** Read the saved look; unset or invalid values fall back to "calm". */
export function readSidebarLook(): SidebarLook {
  try {
    const v = localStorage.getItem(KEY);
    return v && (LOOKS as string[]).includes(v) ? (v as SidebarLook) : "calm";
  } catch {
    return "calm";
  }
}

/** Persist the look and notify the live shell; never throws on storage errors. */
export function writeSidebarLook(look: SidebarLook): void {
  try {
    localStorage.setItem(KEY, look);
    window.dispatchEvent(new Event(SIDEBAR_LOOK_EVENT));
  } catch {
    /* ignore quota/availability errors */
  }
}

/** Options for the Settings picker, in display order. */
export const SIDEBAR_LOOKS: { value: SidebarLook; label: string; hint: string }[] = [
  { value: "calm", label: "Calm", hint: "Quiet active state, thin accent bar" },
  { value: "workspace", label: "Workspace", hint: "Roomier rows, soft blue active" },
  { value: "refined", label: "Refined", hint: "Solid blue active pill with glow" },
];
