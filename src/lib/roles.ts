// Canonical role model for SportsWeb One.
// Two scopes: platform roles (global) and club roles (per club).

export type PlatformRole = "superadmin" | "sportsweb_manager" | "sportsweb_admin";
export type ClubRole = "club_senior_admin" | "club_admin";
export type AnyRole = PlatformRole | ClubRole;

export const PLATFORM_ROLES: PlatformRole[] = ["superadmin", "sportsweb_manager", "sportsweb_admin"];
export const CLUB_ROLES: ClubRole[] = ["club_senior_admin", "club_admin"];

export const ROLE_LABELS: Record<AnyRole, string> = {
  superadmin: "Super Admin",
  sportsweb_manager: "SportsWeb Manager",
  sportsweb_admin: "SportsWeb Admin",
  club_senior_admin: "Exec Admin",
  club_admin: "Club Admin",
};

// Higher rank = more authority. Used for "can manage users below them" logic.
export const ROLE_RANK: Record<AnyRole, number> = {
  superadmin: 100,
  sportsweb_manager: 80,
  sportsweb_admin: 70,
  club_senior_admin: 50,
  club_admin: 20,
};

// Platform-scoped roles live in platform_user_roles. IMPORTANT: being a platform
// role is NOT the same as being a platform admin. The SportsWeb Admin (builder) is
// platform-scoped for identity and rank, but only reaches the clubs handed to it.
// The "is this a platform admin" decision lives in auth (Super Admin + Manager only).
export function isPlatformRole(role: string | null | undefined): role is PlatformRole {
  return role === "superadmin" || role === "sportsweb_manager" || role === "sportsweb_admin";
}

export function roleLabel(role: string | null | undefined): string {
  return role && role in ROLE_LABELS ? ROLE_LABELS[role as AnyRole] : "\u2014";
}

/** Can `actor` manage someone holding `target` role? (strictly more senior) */
export function canManageRole(actor: AnyRole | null, target: AnyRole): boolean {
  if (!actor) return false;
  return ROLE_RANK[actor] > ROLE_RANK[target];
}
