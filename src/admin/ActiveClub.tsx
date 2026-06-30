import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import { getClubConfigById } from "../lib/loadClub";
import { ClubContext, useClub } from "../components/ClubContext";
import { emptyClub } from "../content/emptyClub";
import type { ClubConfig } from "../content/types";
import { useAuth } from "../lib/auth";

/** A club the signed-in user can switch the admin to. */
export interface SwitchableClub {
  id: string;
  name: string;
  role: string | null;
}

interface ActiveClubState {
  /** The club every admin screen should read/write ("" when none resolved). */
  clubId: string;
  /** The active club's display name. */
  clubName: string;
  /** The active club's URL slug ("" when none resolved). */
  clubSlug: string;
  /** The user's role in the active club (platform role still governs perms). */
  role: string | null;
  /** Clubs the user can switch between (their memberships). */
  clubs: SwitchableClub[];
  /** True once the initial club list has been built for this user. */
  ready: boolean;
  /** True while the active club's config (branding/modules) is loading. */
  loading: boolean;
  /** A platform admin is viewing a club that isn't their own membership. */
  isActingAs: boolean;
  /** Switch the admin to a club (any id — powers superadmin "open any club"). */
  setActiveClub: (id: string) => void;
  /** Return to the user's own club / the platform console. */
  exitActingAs: () => void;
}

const Ctx = createContext<ActiveClubState | null>(null);

export function useActiveClub(): ActiveClubState {
  const c = useContext(Ctx);
  if (!c) throw new Error("useActiveClub must be used within ActiveClubProvider");
  return c;
}

const SAVED_KEY = "sw_admin_active_club";

/** Every club this user belongs to (both the legacy and new RBAC tables). */
async function listMyClubs(userId: string): Promise<SwitchableClub[]> {
  if (!supabase || !userId) return [];
  const out = new Map<string, SwitchableClub>();
  const add = (rows: any[] | null) => {
    for (const r of rows ?? []) {
      const clubs = r.clubs as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(clubs) ? clubs[0]?.name : clubs?.name;
      if (r.club_id && !out.has(r.club_id)) {
        out.set(r.club_id, { id: r.club_id, name: name ?? "Club", role: r.role ?? null });
      }
    }
  };
  try {
    const { data } = await supabase.from("club_users").select("club_id, role, clubs(name)").eq("user_id", userId);
    add(data);
  } catch {
    /* table may not exist on this deployment */
  }
  try {
    const { data } = await supabase.from("user_club_roles").select("club_id, role, clubs(name)").eq("user_id", userId);
    add(data);
  } catch {
    /* table may not exist on this deployment */
  }
  return [...out.values()];
}

export function ActiveClubProvider({ children }: { children: ReactNode }) {
  const { userId, membership } = useAuth();
  // The outer (host) ClubContext from App. We keep its variant + setVariant so
  // the website-style live preview keeps working exactly as before; we only
  // swap which *club* the admin reads/writes.
  const outer = useClub();
  const homeId = membership?.clubId ?? "";

  const [clubs, setClubs] = useState<SwitchableClub[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [cfg, setCfg] = useState<ClubConfig>(emptyClub);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Build the switchable list once we know the user, then seed the active club.
  useEffect(() => {
    let alive = true;
    if (!userId) {
      setClubs([]);
      setActiveId("");
      setReady(true);
      return;
    }
    setReady(false);
    (async () => {
      const mine = await listMyClubs(userId);
      // Always include the auth-resolved membership (covers trial-claim users
      // whose row the queries above might miss until RLS catches up).
      const list = [...mine];
      if (homeId && !list.some((c) => c.id === homeId)) {
        list.unshift({ id: homeId, name: membership?.clubName ?? "Your club", role: membership?.role ?? null });
      }
      if (!alive) return;
      setClubs(list);
      // Prefer a saved choice (survives a refresh mid-review), else home, else first.
      let initial = homeId;
      try {
        const saved = sessionStorage.getItem(SAVED_KEY);
        if (saved && (saved === homeId || list.some((c) => c.id === saved))) initial = saved;
      } catch {
        /* ignore */
      }
      if (!initial && list.length) initial = list[0].id;
      setActiveId(initial);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [userId, homeId]);

  // Load the active club's full config (branding + modules) when it changes,
  // and sync the shared preview variant so the picker reflects this club.
  useEffect(() => {
    let alive = true;
    if (!activeId) {
      setCfg(emptyClub);
      return;
    }
    setLoading(true);
    getClubConfigById(activeId).then((c) => {
      if (!alive) return;
      setCfg(c);
      outer.setVariant(c.variant);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
    // outer.setVariant is a stable state setter; intentionally keyed on activeId.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const setActiveClub = useCallback((id: string) => {
    try {
      sessionStorage.setItem(SAVED_KEY, id);
    } catch {
      /* ignore */
    }
    setActiveId(id);
  }, []);

  const exitActingAs = useCallback(() => {
    try {
      sessionStorage.removeItem(SAVED_KEY);
    } catch {
      /* ignore */
    }
    setActiveId(homeId);
  }, [homeId]);

  const isActingAs = !!activeId && activeId !== homeId;
  const role =
    clubs.find((c) => c.id === activeId)?.role ?? (activeId === homeId ? membership?.role ?? null : null);
  const clubName = cfg.identity?.name ?? clubs.find((c) => c.id === activeId)?.name ?? "";
  const clubSlug = cfg.identity?.slug ?? "";

  const value = useMemo<ActiveClubState>(
    () => ({
      clubId: activeId,
      clubName,
      clubSlug,
      role,
      clubs,
      ready,
      loading,
      isActingAs,
      setActiveClub,
      exitActingAs,
    }),
    [activeId, clubName, clubSlug, role, clubs, ready, loading, isActingAs, setActiveClub, exitActingAs]
  );

  return (
    <Ctx.Provider value={value}>
      <ClubContext.Provider value={{ club: cfg, variant: outer.variant, setVariant: outer.setVariant }}>
        {children}
      </ClubContext.Provider>
    </Ctx.Provider>
  );
}
