// SportsWeb One — zoho-metrics Edge Function
// Returns a club's role-dashboard KPI bundle, read from Zoho (Creator / Books /
// Bookings) once the Zoho connection is set up. Until then it returns
// {connected:false} so dashboards show tidy "Connect Zoho" states.
//
// Deploy:   supabase functions deploy zoho-metrics
// Secrets (added in step B, the Zoho connector):
//   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_DC (e.g. com.au)
//
// Contract (keep in sync with src/lib/roleKpis.ts → ZohoMetrics):
//   { connected, members:{active,newThisMonth}, finance:{netYtd,budgetYtd,variancePct},
//     registrations:{pending,issues,unpaid}, events:{upcoming,ticketsSold},
//     volunteers:{active,openTasks}, compliance:{risks}, tasks:{open,overdue} }

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const haveZoho =
    Deno.env.get("ZOHO_CLIENT_ID") &&
    Deno.env.get("ZOHO_CLIENT_SECRET") &&
    Deno.env.get("ZOHO_REFRESH_TOKEN");

  if (!haveZoho) {
    // Not connected yet — dashboards render the placeholder cards.
    return json({ connected: false });
  }

  // TODO (step B): exchange refresh token, call Zoho Creator/Books for this club,
  // and map the responses into the contract below.
  // const clubId = (await req.json().catch(() => ({}))).clubId;
  return json({
    connected: true,
    members: { active: 0, newThisMonth: 0 },
    finance: { netYtd: 0, budgetYtd: 0, variancePct: 0 },
    registrations: { pending: 0, issues: 0, unpaid: 0 },
    events: { upcoming: 0, ticketsSold: 0 },
    volunteers: { active: 0, openTasks: 0 },
    compliance: { risks: 0 },
    tasks: { open: 0, overdue: 0 },
  });
});
