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

export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
