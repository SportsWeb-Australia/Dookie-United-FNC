// SportsWeb One - trial-nurture Edge Function
// Runs on a schedule (see supabase/trial-nurture.sql). For every trial club it
// works out which journey email is due, sends it via Zoho ZeptoMail, and logs
// it to trial_email_log so the same stage never sends twice. One email per club
// per run, so an older trial steps through the journey rather than getting a
// burst.
//
// Deploy:  supabase functions deploy trial-nurture --no-verify-jwt
// Secrets: reuses the dispatch-message ZeptoMail secrets, plus an optional
//          SportsWeb sender + site base URL:
//   supabase secrets set ZEPTOMAIL_TOKEN=...
//   supabase secrets set ZEPTOMAIL_TRIAL_FROM=hello@sportsweb.com.au ZEPTOMAIL_TRIAL_FROM_NAME="SportsWeb One"
//   supabase secrets set TRIAL_SITE_BASE=https://sportsweb-one.vercel.app
// (If ZEPTOMAIL_TRIAL_FROM is unset it falls back to ZEPTOMAIL_FROM.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ZTOKEN = Deno.env.get("ZEPTOMAIL_TOKEN");
const ZFROM = Deno.env.get("ZEPTOMAIL_TRIAL_FROM") ?? Deno.env.get("ZEPTOMAIL_FROM");
const ZNAME = Deno.env.get("ZEPTOMAIL_TRIAL_FROM_NAME") ?? "SportsWeb One";
const BASE = (Deno.env.get("TRIAL_SITE_BASE") ?? "https://sportsweb-one.vercel.app").replace(/\/+$/, "");

type Club = {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
};

const DAY = 86_400_000;
function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
}
function daysUntil(iso: string | null): number {
  if (!iso) return 99;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);
}

/** The journey. First stage in order whose `due` is true and not yet logged is sent. */
function buildStages(club: Club) {
  const age = daysSince(club.trial_started_at);
  const left = daysUntil(club.trial_ends_at);
  const view = `${BASE}/?club=${club.slug}`;
  const name = club.name;
  return [
    {
      key: "welcome",
      due: age >= 0,
      subject: `Your ${name} website is live`,
      body:
        `Hi there,\n\n` +
        `Great news - your new ${name} website is live and ready to explore:\n${view}\n\n` +
        `We have set it up with sample news, fixtures, teams and sponsors so it looks the part from day one.\n\n` +
        `Your 5-minute quick start (cheat sheet + video):\n${BASE}/guide\n\n` +
        `What you can try during your trial, and where:\n` +
        `- Make it yours: add your logo and club colours (Website)\n` +
        `- Post a news story with a photo (News)\n` +
        `- Add fixtures, results and the ladder (Match Centre)\n` +
        `- List your teams and sponsors (Teams, Sponsors)\n` +
        `- Push news to your socials (Website > News & social)\n\n` +
        `To start editing, use the login link from the signup screen, or reply here and we will set you up.\n\n` +
        `Your free trial runs for 7 days. Reply to this email any time and we will give you a hand.\n\n` +
        `- The SportsWeb One team`,
    },
    {
      key: "tips",
      due: age >= 2,
      subject: `3 quick wins for the ${name} site`,
      body:
        `Hi there,\n\n` +
        `A couple of days in - here are three things clubs love most:\n\n` +
        `1. Fixtures and ladder update in one place and show on every device\n` +
        `2. Sponsors get a proper home, which makes renewals easier\n` +
        `3. News and events can post straight to your socials\n\n` +
        `Take a look: ${view}\n\n` +
        `Want a hand setting any of it up? Just reply.\n\n` +
        `- The SportsWeb One team`,
    },
    {
      key: "ending_soon",
      due: left <= 2 && left >= 1,
      subject: `Your ${name} trial ends in ${Math.max(left, 1)} day${left === 1 ? "" : "s"}`,
      body:
        `Hi there,\n\n` +
        `Your free trial for ${name} wraps up soon. If you would like to keep the site live, just reply to this email and we will sort out the details.\n\n` +
        `Have a last look here: ${view}\n\n` +
        `- The SportsWeb One team`,
    },
    {
      key: "final",
      due: left <= 0 && age <= 9,
      subject: `Last day of your ${name} trial`,
      body:
        `Hi there,\n\n` +
        `Today is the final day of your ${name} free trial. We would love to keep your site online for the season - reply to this email and we will get you set up.\n\n` +
        `${view}\n\n` +
        `- The SportsWeb One team`,
    },
    {
      key: "post_trial",
      due: age >= 9,
      subject: `Keep the ${name} site live`,
      body:
        `Hi there,\n\n` +
        `Your free trial has ended, but your site and everything in it is safe. Reply any time to bring it back online - no need to start over.\n\n` +
        `- The SportsWeb One team`,
    },
  ];
}

async function sendEmail(to: string, name: string, subject: string, body: string) {
  if (!ZTOKEN || !ZFROM) return false;
  const html = `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6">${body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br>")}</div>`;
  try {
    const res = await fetch("https://api.zeptomail.com/v1.1/email", {
      method: "POST",
      headers: { Authorization: `Zoho-enczapikey ${ZTOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: { address: ZFROM, name: ZNAME },
        to: [{ email_address: { address: to, name } }],
        subject,
        htmlbody: html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  const supa = createClient(SUPA_URL, SERVICE);

  const { data: clubs, error } = await supa
    .from("clubs")
    .select("id,name,slug,contact_email,trial_started_at,trial_ends_at")
    .eq("is_trial", true)
    .not("contact_email", "is", null);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: logRows } = await supa.from("trial_email_log").select("club_id,stage");
  const sentSet = new Set((logRows ?? []).map((r) => `${r.club_id}:${r.stage}`));

  let sent = 0;
  const results: Record<string, string> = {};
  for (const club of (clubs ?? []) as Club[]) {
    if (!club.contact_email) continue;
    const stages = buildStages(club);
    const next = stages.find((s) => s.due && !sentSet.has(`${club.id}:${s.key}`));
    if (!next) continue;
    const ok = await sendEmail(club.contact_email, club.name, next.subject, next.body);
    if (ok) {
      await supa.from("trial_email_log").insert({ club_id: club.id, stage: next.key });
      sent++;
      results[club.slug] = next.key;
    } else {
      results[club.slug] = `failed:${next.key}`;
    }
  }

  return new Response(JSON.stringify({ ok: true, sent, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
