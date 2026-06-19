import { supabase } from "./supabase";

export interface ClubPerson {
  userId: string;
  email: string;
  /** Access role: club_admin / club_senior_admin (read-only here). */
  role: string;
  displayName: string;
  committeeTitle: string;
}

/** People with admin access to a club (senior/platform only; defensive). */
export async function listClubPeople(clubId: string): Promise<ClubPerson[]> {
  if (!supabase || !clubId) return [];
  try {
    const { data, error } = await supabase.rpc("list_club_people", { p_club: clubId });
    if (error || !data) return [];
    return (data as Record<string, any>[]).map((r) => ({
      userId: r.user_id,
      email: r.email ?? "",
      role: r.role ?? "club_admin",
      displayName: r.display_name ?? "",
      committeeTitle: r.committee_title ?? "",
    }));
  } catch {
    return [];
  }
}

/** Assign a person's display name + committee title. Returns an error string or null. */
export async function setMemberCommittee(
  userId: string,
  clubId: string,
  displayName: string,
  title: string
): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("set_member_committee", {
      p_user: userId,
      p_club: clubId,
      p_display_name: displayName,
      p_title: title,
    });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save.";
  }
}
