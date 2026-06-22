// mfa-admin-reset — let a club senior admin (or platform admin) clear another
// user's two-factor factors, e.g. when someone loses their phone. The user can
// then sign in with their password and set 2FA up again.
//
// DEPLOY (Supabase dashboard → Edge Functions) — see supabase/functions/README-mfa.md.
// Requires env: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") ?? "";

  // Caller-scoped client: confirms who is asking and what they're allowed to do.
  const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const { data: who } = await caller.auth.getUser();
  if (!who?.user) return json({ error: "Not signed in" }, 401);

  let targetUserId = "";
  let clubId: string | null = null;
  try {
    const body = await req.json();
    targetUserId = body.targetUserId ?? "";
    clubId = body.clubId ?? null;
  } catch {
    return json({ error: "Invalid body" }, 400);
  }
  if (!targetUserId) return json({ error: "targetUserId required" }, 400);

  // Authorise: platform admin, or a senior admin of the named club.
  const { data: isPlat } = await caller.rpc("is_platform_admin");
  let allowed = isPlat === true;
  if (!allowed && clubId) {
    const { data: role } = await caller.rpc("club_role", { p_club: clubId });
    allowed = role === "club_senior_admin";
  }
  if (!allowed) return json({ error: "Not authorised" }, 403);

  // Remove the target's MFA factors using the admin REST API.
  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  };
  const listRes = await fetch(`${url}/auth/v1/admin/users/${targetUserId}/factors`, { headers });
  if (!listRes.ok) return json({ error: "Could not list factors" }, 500);
  const listJson = await listRes.json();
  const factors = Array.isArray(listJson) ? listJson : listJson?.factors ?? [];

  let removed = 0;
  for (const f of factors) {
    const del = await fetch(`${url}/auth/v1/admin/users/${targetUserId}/factors/${f.id}`, {
      method: "DELETE",
      headers,
    });
    if (del.ok) removed += 1;
  }

  // Also clear their backup codes so a fresh set is issued on re-enrol.
  const admin = createClient(url, service);
  await admin.from("mfa_backup_codes").delete().eq("user_id", targetUserId);

  return json({ ok: true, removed });
});
