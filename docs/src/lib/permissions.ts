import { useAuth } from "./auth";
import type { AnyRole } from "./roles";

// Capability keys. Platform.* are operator-level; club.* are within a club.
export type Permission =
  | "platform.clubs" //         see all clubs, toggle module entitlement
  | "platform.integrations" //  connect providers / secrets (owner only)
  | "platform.roles" //         assign platform roles (owner only)
  | "club.content" //           edit content, news, events, teams, people, sponsors
  | "club.comms" //             send messages
  | "club.modules" //           view/manage the club's module status
  | "club.settings" //          website style, branding, club settings
  | "club.website" //           edit website content (hero, text, images, video)
  | "club.billing" //           view billing / subscription
  | "club.users"; //            manage club users

const ALL: Permission[] = [
  "platform.clubs",
  "platform.integrations",
  "platform.roles",
  "club.content",
  "club.comms",
  "club.modules",
  "club.settings",
  "club.website",
  "club.billing",
  "club.users",
];

export const ROLE_PERMISSIONS: Record<AnyRole, Permission[]> = {
  // Owner — everything.
  superadmin: ALL,
  // SportsWeb staff — all clubs and support, but never code/secrets or platform roles.
  sportsweb_admin: ["platform.clubs", "club.content", "club.comms", "club.modules", "club.settings", "club.website", "club.billing", "club.users"],
  // Senior club role — full control of their own club.
  club_senior_admin: ["club.content", "club.comms", "club.modules", "club.settings", "club.website", "club.billing", "club.users"],
  // Operational club role — content, messaging and website editing.
  club_admin: ["club.content", "club.comms", "club.website"],
};

/** Map a stored role value (incl. the legacy club_users enum) to a model role. */
export function toModelRole(role: string | null | undefined): AnyRole | null {
  switch (role) {
    case "superadmin":
    case "sportsweb_admin":
    case "club_senior_admin":
    case "club_admin":
      return role;
    case "super_admin": // legacy club_users enum → senior club role
      return "club_senior_admin";
    default:
      return null;
  }
}

export interface PermissionApi {
  role: AnyRole | null;
  can: (permission: Permission) => boolean;
}

/** The signed-in user's effective role + a capability check. */
export function usePermissions(): PermissionApi {
  const { platformRole, membership } = useAuth();
  const role: AnyRole | null = platformRole ?? toModelRole(membership?.role);
  const granted = role ? ROLE_PERMISSIONS[role] : [];
  return { role, can: (p) => granted.includes(p) };
}
