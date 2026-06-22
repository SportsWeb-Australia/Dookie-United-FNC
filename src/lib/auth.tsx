import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";
import type { PlatformRole } from "./roles";

export interface ClubMembership {
  clubId: string;
  role: string | null;
  clubName?: string;
}

interface AuthState {
  ready: boolean;
  resolving: boolean;
  email: string | null;
  userId: string | null;
  membership: ClubMembership | null;
  platformRole: PlatformRole | null;
  isPlatformAdmin: boolean;
  isSuperadmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

async function resolveMembership(userId: string): Promise<ClubMembership | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("club_users")
    .select("club_id, role, clubs(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (data) {
    const clubs = data.clubs as { name?: string } | { name?: string }[] | null;
    const clubName = Array.isArray(clubs) ? clubs[0]?.name : clubs?.name;
    return { clubId: data.club_id, role: data.role ?? null, clubName };
  }
  // New RBAC model (self-signup trial owners land here, not in club_users).
  const { data: ucr } = await supabase
    .from("user_club_roles")
    .select("club_id, role, clubs(name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!ucr) return null;
  const clubs = ucr.clubs as { name?: string } | { name?: string }[] | null;
  const clubName = Array.isArray(clubs) ? clubs[0]?.name : clubs?.name;
  return { clubId: ucr.club_id, role: ucr.role ?? null, clubName };
}

/**
 * Resolve membership, and if a logged-in user has none yet, try to claim a
 * trial club created with their email (self-signup), then resolve again.
 */
async function resolveMembershipWithClaim(userId: string): Promise<ClubMembership | null> {
  if (supabase) {
    // Claim any committee invites addressed to this user's email (best-effort).
    try {
      await supabase.rpc("claim_member_invites");
    } catch {
      /* best-effort */
    }
  }
  let m = await resolveMembership(userId);
  if (!m && supabase) {
    try {
      const { data } = await supabase.rpc("claim_trial_clubs");
      if (data && (data as { linked?: number }).linked) m = await resolveMembership(userId);
    } catch {
      /* claim is best-effort */
    }
  }
  return m;
}

async function resolvePlatformRole(): Promise<PlatformRole | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("my_platform_role");
  if (error || !data) return null;
  return data === "superadmin" || data === "sportsweb_manager" || data === "sportsweb_admin" ? (data as PlatformRole) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [membership, setMembership] = useState<ClubMembership | null>(null);
  const [platformRole, setPlatformRole] = useState<PlatformRole | null>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      setEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      if (user) {
        setResolving(true);
        const [m, pr] = await Promise.all([resolveMembershipWithClaim(user.id), resolvePlatformRole()]);
        setMembership(m);
        setPlatformRole(pr);
        setResolving(false);
      }
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      setEmail(user?.email ?? null);
      setUserId(user?.id ?? null);
      if (user) {
        setResolving(true);
        const [m, pr] = await Promise.all([resolveMembershipWithClaim(user.id), resolvePlatformRole()]);
        setMembership(m);
        setPlatformRole(pr);
        setResolving(false);
      } else {
        setMembership(null);
        setPlatformRole(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (em: string, pw: string): Promise<string | null> => {
    if (!supabase) return "Supabase isn't configured.";
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    return error ? error.message : null;
  };

  const signOut = async (): Promise<void> => {
    await supabase?.auth.signOut();
  };

  const isSuperadmin = platformRole === "superadmin";
  // Platform admin = Super Admin or SportsWeb Manager. The SportsWeb Admin (builder)
  // is a platform role but NOT a platform admin: it only reaches assigned clubs.
  const isPlatformAdmin = platformRole === "superadmin" || platformRole === "sportsweb_manager";

  return (
    <Ctx.Provider
      value={{ ready, resolving, email, userId, membership, platformRole, isPlatformAdmin, isSuperadmin, signIn, signOut }}
    >
      {children}
    </Ctx.Provider>
  );
}
