import { supabase } from "./supabase";

/** Common club committee positions, offered when a user sets their role. */
export const COMMITTEE_TITLES = [
  "President",
  "Vice President",
  "Secretary",
  "Treasurer",
  "Registrar",
  "Sponsorship Manager",
  "Volunteer Coordinator",
  "Coach Coordinator",
  "Football Manager",
  "Netball Manager",
  "Communications Officer",
  "General Committee",
];

export interface CommitteeProfile {
  displayName: string;
  committeeTitle: string;
}

const EMPTY: CommitteeProfile = { displayName: "", committeeTitle: "" };

/**
 * Load the signed-in user's name + committee title for a club. Fully
 * defensive: if the committee columns/migration aren't in place yet, this
 * resolves to empty rather than throwing, so the dashboard never breaks.
 */
export async function loadCommitteeProfile(clubId: string, userId: string): Promise<CommitteeProfile> {
  if (!supabase || !clubId || !userId) return EMPTY;
  const pick = (row: { display_name?: string | null; committee_title?: string | null } | null): CommitteeProfile | null =>
    row ? { displayName: row.display_name ?? "", committeeTitle: row.committee_title ?? "" } : null;

  for (const table of ["user_club_roles", "club_users"]) {
    try {
      const { data } = await supabase
        .from(table)
        .select("display_name, committee_title")
        .eq("user_id", userId)
        .eq("club_id", clubId)
        .maybeSingle();
      const p = pick(data as any);
      if (p && (p.displayName || p.committeeTitle)) return p;
    } catch {
      /* columns may not exist until the committee-roles migration is run */
    }
  }
  return EMPTY;
}

/** Save the caller's own name + committee title via the safe RPC. */
export async function saveCommitteeProfile(
  clubId: string,
  displayName: string,
  title: string
): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("set_my_committee_profile", {
      p_club: clubId,
      p_display_name: displayName,
      p_title: title,
    });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save.";
  }
}

/** A friendly first name from a saved display name, falling back to the email. */
export function firstNameFrom(displayName: string, email: string | null): string {
  const dn = displayName.trim();
  if (dn) return dn.split(/\s+/)[0];
  const local = (email ?? "").split("@")[0] ?? "";
  const tok = local.split(/[._-]+/)[0] ?? "";
  return tok ? tok.charAt(0).toUpperCase() + tok.slice(1) : "there";
}
