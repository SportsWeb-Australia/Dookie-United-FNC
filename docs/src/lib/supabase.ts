import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for reading published club content.
 *
 * Values come from Vite env vars in production (set these in Vercel):
 *   VITE_SUPABASE_URL       e.g. https://uzibfawcwoapfbigpzum.supabase.co
 *   VITE_SUPABASE_ANON_KEY  the publishable key, sb_publishable_… (safe in the
 *                           browser; RLS-protected). Accepts a legacy anon key too.
 *
 * If env vars aren't set, we fall back to the SportsWeb One project so the site
 * works out of the box. The publishable key is public by design — never put the
 * service-role / secret key in front-end code.
 */
const FALLBACK_URL = "https://uzibfawcwoapfbigpzum.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_bxaxVOhm9-9wyRrsvJG7Sw_MxAZ-egN";

const url = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? FALLBACK_PUBLISHABLE_KEY;

/** Default club for local dev, preview builds, and as a final fallback. */
export const DEFAULT_CLUB_SLUG = import.meta.env.VITE_CLUB_SLUG ?? "dookie-united";
/** Back-compat alias. */
export const CLUB_SLUG = DEFAULT_CLUB_SLUG;

/**
 * Work out which club this request is for, from the web address:
 *   1. VITE_CLUB_SLUG  — explicit per-deployment override (forces one club)
 *   2. club_domains    — explicit host → slug mapping (custom domains, short subdomains)
 *   3. {slug}.sportsweb.com.au — the subdomain label is the slug
 *   4. DEFAULT_CLUB_SLUG — local dev, *.vercel.app, apex, or anything unmatched
 * Always resolves to *something*, so the site is never blank.
 */
export async function resolveClubSlug(): Promise<string> {
  // Preview override: ?club=<slug> lets the operator view any club on any URL
  // (e.g. for demo sites + screenshots). Persists for the tab; ?club=reset clears.
  if (typeof window !== "undefined") {
    try {
      const q = new URLSearchParams(window.location.search).get("club");
      if (q === "reset") {
        sessionStorage.removeItem("sw_preview_club");
      } else if (q) {
        sessionStorage.setItem("sw_preview_club", q);
        return q;
      } else {
        const saved = sessionStorage.getItem("sw_preview_club");
        if (saved) return saved;
      }
    } catch {
      /* ignore */
    }
  }
  if (import.meta.env.VITE_CLUB_SLUG) return import.meta.env.VITE_CLUB_SLUG;
  if (typeof window === "undefined") return DEFAULT_CLUB_SLUG;

  const host = window.location.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".vercel.app")) {
    return DEFAULT_CLUB_SLUG;
  }

  // Explicit host → slug mapping (safe if the table doesn't exist yet).
  if (supabase) {
    try {
      const { data } = await supabase.from("club_domains").select("slug").eq("host", host).maybeSingle();
      if (data?.slug) return data.slug as string;
    } catch {
      /* table not present yet — fall through */
    }
  }

  // {slug}.sportsweb.com.au
  if (host.endsWith(".sportsweb.com.au")) {
    const label = host.split(".")[0];
    if (label && label !== "www" && label !== "app") return label;
  }

  return DEFAULT_CLUB_SLUG;
}

/**
 * Hosts that are SportsWeb One *platform* hosts (not a club's own site).
 * Add new platform aliases here.
 */
const PLATFORM_HOSTS = new Set([
  "sportsweb.com.au",
  "www.sportsweb.com.au",
  "app.sportsweb.com.au",
]);

/**
 * Is this request hitting a SportsWeb One platform host rather than a club site?
 *   true  → sportsweb-one-v1.vercel.app, *.vercel.app, app/www/apex sportsweb.com.au, localhost
 *   false → a club's custom domain (dookieunited.com.au) or {slug}.sportsweb.com.au
 * Drives host-aware root routing: platform host root = the SportsWeb One entry
 * page; club-domain root = that club's public homepage.
 */
export function isPlatformHost(host?: string): boolean {
  const h = (host ?? (typeof window !== "undefined" ? window.location.hostname : "")).toLowerCase();
  if (!h) return false;
  if (h === "localhost" || h === "127.0.0.1") return true;
  if (h.endsWith(".vercel.app")) return true;
  if (PLATFORM_HOSTS.has(h)) return true;
  return false;
}

/**
 * Is a club preview override active for this tab (?club=<slug>, or one saved
 * earlier this session)? When true, even a platform host shows that club's
 * public site — so the operator can demo any club from the platform URL.
 */
export function hasPreviewClub(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("club");
    if (q === "reset") return false;
    if (q) return true;
    return !!sessionStorage.getItem("sw_preview_club");
  } catch {
    return false;
  }
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, storageKey: "sw_admin_session" },
      })
    : null;
