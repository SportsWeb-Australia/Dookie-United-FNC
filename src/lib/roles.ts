// Canonical role model for SportsWeb One.
// Two scopes: platform roles (global) and club roles (per club).

export type PlatformRole = "superadmin" | "sportsweb_admin";
export type ClubRole = "club_senior_admin" | "club_admin";
export type AnyRole = PlatformRole | ClubRole;

export const PLATFORM_ROLES: PlatformRole[] = ["superadmin", "sportsweb_admin"];
export const CLUB_ROLES: ClubRole[] = ["club_senior_admin", "club_admin"];

export const ROLE_LABELS: Record<AnyRole, string> = {
  superadmin: "Superadmin",
  sportsweb_admin: "SportsWeb Admin",
  club_senior_admin: "Club Senior Admin",
  club_admin: "Club Admin",
};

// Higher rank = more authority. Used for "can manage users below them" logic.
export const ROLE_RANK: Record<AnyRole, number> = {
  superadmin: 100,
  sportsweb_admin: 80,
  club_senior_admin: 50,
  club_admin: 20,
};

export function isPlatformRole(role: string | null | undefined): role is PlatformRole {
  return role === "superadmin" || role === "sportsweb_admin";
}

export function roleLabel(role: string | null | undefined): string {
  return role && role in ROLE_LABELS ? ROLE_LABELS[role as AnyRole] : "—";
}

/** Can `actor` manage someone holding `target` role? (strictly more senior) */
export function canManageRole(actor: AnyRole | null, target: AnyRole): boolean {
  if (!actor) return false;
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
