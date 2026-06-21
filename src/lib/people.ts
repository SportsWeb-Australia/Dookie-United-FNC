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

export interface ClubInvite {
  id: string;
  email: string;
  role: string;
  displayName: string;
  committeeTitle: string;
}

/** Invite (or directly grant, if they already have an account) a committee member. */
export async function inviteClubMember(
  clubId: string,
  email: string,
  name: string,
  role: string,
  title: string
): Promise<{ status?: "granted" | "invited"; error?: string }> {
  if (!supabase) return { error: "Not connected." };
  try {
    const { data, error } = await supabase.rpc("invite_club_member", {
      p_club: clubId,
      p_email: email,
      p_name: name,
      p_role: role,
      p_title: title,
    });
    if (error) return { error: error.message };
    return { status: (data as "granted" | "invited") ?? "invited" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not invite." };
  }
}

/** Pending (unclaimed) invites for a club. */
export async function listClubInvites(clubId: string): Promise<ClubInvite[]> {
  if (!supabase || !clubId) return [];
  try {
    const { data, error } = await supabase.rpc("list_club_invites", { p_club: clubId });
    if (error || !data) return [];
    return (data as Record<string, any>[]).map((r) => ({
      id: r.id,
      email: r.email ?? "",
      role: r.role ?? "club_admin",
      displayName: r.display_name ?? "",
      committeeTitle: r.committee_title ?? "",
    }));
  } catch {
    return [];
  }
}

/** Cancel a pending invite. */
export async function cancelClubInvite(id: string): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("cancel_club_invite", { p_id: id });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not cancel.";
  }
}

export interface ClubMember {
  personId: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  mobile: string | null;
  status: string | null;
  dateOfBirth: string | null;
  isMinor: boolean;
  roles: string[];
  teams: string[];
  paymentStatus: string | null;
  createdAt: string | null;
}

export async function listClubMembers(clubId: string): Promise<ClubMember[]> {
  if (!supabase || !clubId) return [];
  try {
    const { data, error } = await supabase.rpc("list_club_members", { p_club: clubId });
    if (error || !data) return [];
    return (data as Record<string, any>[]).map((r) => ({
      personId: r.person_id,
      fullName: r.full_name ?? "",
      firstName: r.first_name ?? null,
      lastName: r.last_name ?? null,
      email: r.email ?? null,
      mobile: r.mobile ?? null,
      status: r.status ?? null,
      dateOfBirth: r.date_of_birth ?? null,
      isMinor: Boolean(r.is_minor),
      roles: Array.isArray(r.roles) ? r.roles : [],
      teams: Array.isArray(r.teams) ? r.teams : [],
      paymentStatus: r.current_payment_status ?? null,
      createdAt: r.created_at ?? null,
    }));
  } catch {
    return [];
  }
}
