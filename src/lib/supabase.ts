import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for reading published club content.
 *
 * Values come from Vite env vars in production (set these in Vercel):
 *   VITE_SUPABASE_URL       e.g. https://uzibfawcwoapfbigpzum.supabase.co
 *   VITE_SUPABASE_ANON_KEY  the publishable anon key (safe in the browser; RLS-protected)
 *
 * If env vars aren't set, we fall back to the SportsWeb One project so the site
 * works out of the box. The anon key is public by design — never put the
 * service-role key in front-end code.
 */
const FALLBACK_URL = "https://uzibfawcwoapfbigpzum.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6aWJmYXdjd29hcGZiaWdwenVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTg2NzcsImV4cCI6MjA5NjMzNDY3N30.-BYc-g-swQjjPXosNvPlrVTj_86i39TXXAklAW_N-ek";

const url = import.meta.env.VITE_SUPABASE_URL ?? FALLBACK_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? FALLBACK_ANON_KEY;

/** Which club this site is for. Set VITE_CLUB_SLUG per deployment. */
export const CLUB_SLUG = import.meta.env.VITE_CLUB_SLUG ?? "dookie-united";

export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
