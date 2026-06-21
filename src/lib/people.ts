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
  sports: string[];
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
      sports: Array.isArray(r.sports) ? r.sports : [],
      paymentStatus: r.current_payment_status ?? null,
      createdAt: r.created_at ?? null,
    }));
  } catch {
    return [];
  }
}

export interface MemberRole {
  id: string; role: string; sport: string | null; committee_title: string | null;
  status: string; start_date: string | null; end_date: string | null;
  team_name: string | null; season_name: string | null;
}
export interface MemberRelationship {
  id: string; relationship: string; related_id: string; related_name: string; related_is_minor: boolean;
}
export interface MemberCompliance {
  id: string; check_type: string; reference_no: string | null;
  issued_on: string | null; expires_on: string | null; status: string;
}
export interface MemberRegistration {
  id: string; membership_label: string | null; status: string | null; payment_status: string | null;
  amount_cents: number | null; amount_paid_cents: number | null; registered_at: string | null; season_name: string | null;
}
export interface MemberProfile {
  id: string; full_name: string; first_name: string | null; last_name: string | null;
  email: string | null; mobile: string | null; date_of_birth: string | null; status: string | null;
  avatar_url: string | null; address: string | null; suburb: string | null; state: string | null;
  postcode: string | null; member_since: string | null; emergency_name: string | null;
  emergency_phone: string | null; notes: string | null; created_at: string | null; is_minor: boolean;
}
export interface MemberDetail {
  profile: MemberProfile | null;
  roles: MemberRole[];
  relationships: MemberRelationship[];
  compliance: MemberCompliance[] | null;
  registrations: MemberRegistration[] | null;
  can_edit: boolean;
  can_view_sensitive: boolean;
}

export async function getMemberDetail(clubId: string, personId: string): Promise<MemberDetail | null> {
  if (!supabase || !clubId || !personId) return null;
  try {
    const { data, error } = await supabase.rpc("get_member_detail", { p_club: clubId, p_person: personId });
    if (error || !data) return null;
    return data as MemberDetail;
  } catch {
    return null;
  }
}

export async function updateMemberProfile(
  clubId: string,
  personId: string,
  patch: Record<string, any>,
): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("update_member_profile", {
      p_club: clubId,
      p_person: personId,
      p_patch: patch,
    });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not save.";
  }
}

export async function uploadMemberAvatar(
  clubId: string,
  personId: string,
  file: File,
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: "Not connected." };
  try {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${clubId}/members/${personId}.${ext}`;
    const { error } = await supabase.storage.from("club-media").upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (error) return { error: error.message };
    const { data } = supabase.storage.from("club-media").getPublicUrl(path);
    return { url: `${data.publicUrl}?v=${Date.now()}` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

export interface ClubTeam { id: string; name: string; sport: string | null; ageGroup: string | null; gender: string | null; }
export interface ClubSeason { id: string; name: string; sport: string | null; isCurrent: boolean; }

export async function addClubMember(
  clubId: string,
  profile: Record<string, any>,
): Promise<{ id?: string; error?: string }> {
  if (!supabase) return { error: "Not connected." };
  try {
    const { data, error } = await supabase.rpc("add_club_member", { p_club: clubId, p_profile: profile });
    if (error) return { error: error.message };
    return { id: data as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not add member." };
  }
}

export async function addPersonRole(
  clubId: string,
  personId: string,
  r: { role: string; sport?: string | null; teamId?: string | null; seasonId?: string | null; committeeTitle?: string | null; startDate?: string | null },
): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("add_person_role", {
      p_club: clubId,
      p_person: personId,
      p_role: r.role,
      p_sport: r.sport ?? null,
      p_team_id: r.teamId ?? null,
      p_season_id: r.seasonId ?? null,
      p_committee_title: r.committeeTitle ?? null,
      p_start_date: r.startDate ?? null,
    });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not add role.";
  }
}

export async function endPersonRole(roleId: string, endDate?: string | null): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("end_person_role", { p_role_id: roleId, p_end_date: endDate ?? null });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not update role.";
  }
}

export async function deletePersonRole(roleId: string): Promise<string | null> {
  if (!supabase) return "Not connected.";
  try {
    const { error } = await supabase.rpc("delete_person_role", { p_role_id: roleId });
    return error ? error.message : null;
  } catch (e) {
    return e instanceof Error ? e.message : "Could not remove role.";
  }
}

export async function listClubTeams(clubId: string): Promise<ClubTeam[]> {
  if (!supabase || !clubId) return [];
  try {
    const { data, error } = await supabase.rpc("list_club_teams", { p_club: clubId });
    if (error || !data) return [];
    return (data as Record<string, any>[]).map((t) => ({
      id: t.id, name: t.name, sport: t.sport ?? null, ageGroup: t.age_group ?? null, gender: t.gender ?? null,
    }));
  } catch {
    return [];
  }
}

export async function listClubSeasons(clubId: string): Promise<ClubSeason[]> {
  if (!supabase || !clubId) return [];
  try {
    const { data, error } = await supabase.rpc("list_club_seasons", { p_club: clubId });
    if (error || !data) return [];
    return (data as Record<string, any>[]).map((s) => ({
      id: s.id, name: s.name, sport: s.sport ?? null, isCurrent: Boolean(s.is_current),
    }));
  } catch {
    return [];
  }
}
