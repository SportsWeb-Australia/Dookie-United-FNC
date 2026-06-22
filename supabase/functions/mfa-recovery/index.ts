// mfa-recovery — let a locked-out user clear their own 2FA using a backup code,
// so they can sign in with their password and set 2FA up again. The code is
// verified server-side (hashed) and consumed (single use).
//
// DEPLOY (Supabase dashboard → Edge Functions) — see supabase/functions/README-mfa.md.
// Requires env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  let email = "";
  let code = "";
  try {
    const body = await req.json();
    email = (body.email ?? "").trim();
    code = (body.code ?? "").trim().toUpperCase();
  } catch {
    return json({ error: "Invalid body" }, 400);
  }
  if (!email || !code) return json({ error: "Email and code required" }, 400);

  const admin = createClient(url, service);
  const hash = await sha256Hex(code);

  // Consume the code (marks it used) and get the owning user id, all server-side.
  const { data: userId, error } = await admin.rpc("mfa_recovery_consume", {
    p_email: email,
    p_code_hash: hash,
  });
  // Deliberately vague error to avoid leaking which part was wrong.
  if (error || !userId) return json({ error: "That email and code didn't match." }, 400);

  const headers = {
    apikey: service,
    Authorization: `Bearer ${service}`,
    "Content-Type": "application/json",
  };
  const listRes = await fetch(`${url}/auth/v1/admin/users/${userId}/factors`, { headers });
  const listJson = listRes.ok ? await listRes.json() : [];
  const factors = Array.isArray(listJson) ? listJson : listJson?.factors ?? [];
  for (const f of factors) {
    await fetch(`${url}/auth/v1/admin/users/${userId}/factors/${f.id}`, { method: "DELETE", headers });
  }

  return json({ ok: true });
});
