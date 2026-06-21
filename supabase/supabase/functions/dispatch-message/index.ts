// SportsWeb One — dispatch-message Edge Function
// Sends a club message across Email (Zoho ZeptoMail), SMS (Twilio) and Push (WebPushr).
//
// Deploy:   supabase functions deploy dispatch-message --no-verify-jwt
// Secrets:  supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+61...
//           supabase secrets set ZEPTOMAIL_TOKEN=... ZEPTOMAIL_FROM=club@yourdomain.com ZEPTOMAIL_FROM_NAME="Dookie United"
//           supabase secrets set WEBPUSHR_KEY=... WEBPUSHR_TOKEN=...
//
// A channel with no secrets configured is skipped (counted as 0), so you can
// turn providers on one at a time.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Recipient = { name?: string; email?: string | null; mobile?: string | null };

/** Best-effort AU mobile → E.164. */
function toE164(raw: string): string {
  const s = raw.replace(/[^\d+]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("0")) return "+61" + s.slice(1);
  if (s.startsWith("61")) return "+" + s;
  return s;
}

async function sendEmail(to: Recipient[], subject: string, body: string) {
  const token = Deno.env.get("ZEPTOMAIL_TOKEN");
  const from = Deno.env.get("ZEPTOMAIL_FROM");
  const fromName = Deno.env.get("ZEPTOMAIL_FROM_NAME") ?? "Club";
  let sent = 0,
    failed = 0;
  if (!token || !from) return { sent, failed: to.filter((r) => r.email).length };
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6">${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br>")}</div>`;
  for (const r of to) {
    if (!r.email) continue;
    try {
      const res = await fetch("https://api.zeptomail.com/v1.1/email", {
        method: "POST",
        headers: { Authorization: `Zoho-enczapikey ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: { address: from, name: fromName },
          to: [{ email_address: { address: r.email, name: r.name ?? "" } }],
          subject,
          htmlbody: html,
        }),
      });
      res.ok ? sent++ : failed++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

async function sendSms(to: Recipient[], body: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const auth = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM");
  let sent = 0,
    failed = 0;
  if (!sid || !auth || !from) return { sent, failed: to.filter((r) => r.mobile).length };
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const basic = btoa(`${sid}:${auth}`);
  for (const r of to) {
    if (!r.mobile) continue;
    try {
      const form = new URLSearchParams({ From: from, To: toE164(r.mobile), Body: body });
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      });
      res.ok ? sent++ : failed++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}

async function sendPush(title: string, body: string) {
  const key = Deno.env.get("WEBPUSHR_KEY");
  const token = Deno.env.get("WEBPUSHR_TOKEN");
  if (!key || !token) return { sent: 0, failed: 0 };
  try {
    const res = await fetch("https://api.webpushr.com/v1/notification/send/all", {
      method: "POST",
      headers: { "Content-Type": "application/json", "webpushr-key": key, "webpushr-auth-token": token },
      body: JSON.stringify({ title, message: body, target_url: "/" }),
    });
    return res.ok ? { sent: 1, failed: 0 } : { sent: 0, failed: 1 };
  } catch {
    return { sent: 0, failed: 1 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const payload = await req.json();

    // Connection status — booleans only, never the secret values themselves.
    if (payload?.action === "status") {
      const status = {
        email: !!(Deno.env.get("ZEPTOMAIL_TOKEN") && Deno.env.get("ZEPTOMAIL_FROM")),
        sms: !!(Deno.env.get("TWILIO_ACCOUNT_SID") && Deno.env.get("TWILIO_AUTH_TOKEN") && Deno.env.get("TWILIO_FROM")),
        push: !!(Deno.env.get("WEBPUSHR_KEY") && Deno.env.get("WEBPUSHR_TOKEN")),
      };
      return new Response(JSON.stringify({ ok: true, status }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { channels = [], subject = "", body = "", recipients = [] } = payload;
    const sent = { email: 0, sms: 0, push: 0 };
    const failed = { email: 0, sms: 0, push: 0 };

    if (channels.includes("email")) {
      const r = await sendEmail(recipients as Recipient[], subject || "Message from your club", body);
      sent.email = r.sent;
      failed.email = r.failed;
    }
    if (channels.includes("sms")) {
      const r = await sendSms(recipients as Recipient[], body);
      sent.sms = r.sent;
      failed.sms = r.failed;
    }
    if (channels.includes("push")) {
      const r = await sendPush(subject || "Club update", body);
      sent.push = r.sent;
      failed.push = r.failed;
    }

    const ok = failed.email + failed.sms + failed.push === 0;
    return new Response(JSON.stringify({ ok, sent, failed }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
