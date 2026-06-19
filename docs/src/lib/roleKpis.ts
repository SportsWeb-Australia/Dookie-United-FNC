import { supabase } from "./supabase";

/**
 * Role dashboards read "critical indicators" from whichever system OWNS each
 * metric — a hybrid model:
 *
 *   SportsWeb One Supabase DB  →  members (people), registrations, upcoming
 *                                 events; (next: volunteers, tickets sold,
 *                                 compliance once those tables are confirmed)
 *   Zoho                       →  finance / P&L vs budget (Books)
 *   Either (TBD)               →  committee tasks / bookings
 *
 * Both sources feed one merged Metrics object. A card whose data isn't wired
 * yet renders a placeholder — "Connect Zoho" only for Zoho-owned metrics;
 * SportsWeb-owned metrics show a quiet "—" until their table is confirmed.
 */

export type Metrics = {
  zohoConnected: boolean;
  members?: { active: number; newThisMonth: number }; // sportsweb (people)
  volunteers?: { active: number; openTasks: number }; // sportsweb (next)
  events?: { upcoming: number; ticketsSold: number }; // sportsweb (events / Ticket One)
  compliance?: { risks: number }; // sportsweb (next)
  registrations?: { pending: number; issues: number; unpaid: number }; // sportsweb (registrations)
  finance?: { netYtd: number; budgetYtd: number; variancePct: number }; // zoho
  tasks?: { open: number; overdue: number }; // either
};

export type MetricSource = "sportsweb" | "zoho" | "either";

async function countOf(build: () => any): Promise<number | null> {
  try {
    const { count, error } = await build();
    return !error && typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

/** SportsWeb-owned figures, read straight from this Supabase project. */
export async function getSportswebMetrics(clubId: string | null): Promise<Partial<Metrics>> {
  if (!clubId || !supabase) return {};
  const sb = supabase;
  const out: Partial<Metrics> = {};
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const nowIso = now.toISOString();

  // Members — active people + how many active joined this month.
  const total = await countOf(() =>
    sb.from("people").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "active")
  );
  const newThis = await countOf(() =>
    sb
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("status", "active")
      .gte("created_at", monthStart)
  );
  if (total != null) out.members = { active: total, newThisMonth: newThis ?? 0 };

  // Registrations — pending approval + not fully paid.
  const pending = await countOf(() =>
    sb.from("registrations").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "pending")
  );
  const unpaid = await countOf(() =>
    sb.from("registrations").select("id", { count: "exact", head: true }).eq("club_id", clubId).neq("payment_status", "paid")
  );
  if (pending != null || unpaid != null) out.registrations = { pending: pending ?? 0, issues: 0, unpaid: unpaid ?? 0 };

  // Upcoming events — dated today or later.
  const upcoming = await countOf(() =>
    sb.from("events").select("id", { count: "exact", head: true }).eq("club_id", clubId).gte("event_date", nowIso)
  );
  if (upcoming != null) out.events = { upcoming, ticketsSold: 0 };

  // Volunteers — active on the books.
  const vols = await countOf(() =>
    sb.from("volunteers").select("id", { count: "exact", head: true }).eq("club_id", clubId).eq("status", "active")
  );
  if (vols != null) out.volunteers = { active: vols, openTasks: 0 };

  // Compliance — checks expiring within 30 days (or already lapsed).
  const soon = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const risks = await countOf(() =>
    sb
      .from("volunteer_compliance_records")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .not("expires_on", "is", null)
      .lte("expires_on", soon)
  );
  if (risks != null) out.compliance = { risks };

  return out;
}

/** Zoho-owned figures (finance) via the zoho-metrics function. */
export async function getZohoMetrics(clubId: string | null): Promise<Partial<Metrics> & { zohoConnected: boolean }> {
  if (!clubId || !supabase) return { zohoConnected: false };
  try {
    const { data, error } = await supabase.functions.invoke("zoho-metrics", { body: { clubId } });
    if (error || !data || !data.connected) return { zohoConnected: false };
    return { zohoConnected: true, finance: data.finance, tasks: data.tasks };
  } catch {
    return { zohoConnected: false };
  }
}

/** Merge both sources into one bundle for the dashboard. */
export async function getDashboardMetrics(clubId: string | null): Promise<Metrics> {
  const [sw, z] = await Promise.all([getSportswebMetrics(clubId), getZohoMetrics(clubId)]);
  return { zohoConnected: z.zohoConnected, ...sw, ...z };
}

export type Tone = "good" | "warn" | "bad" | "info" | "plain";

export type Kpi = {
  label: string;
  value: number | string | null;
  hint?: string;
  tone?: Tone;
  source: MetricSource;
  go?: string;
};

export type Persona = "president" | "treasurer" | "secretary" | "coach" | "volunteer" | "general";

export function personaFromTitle(title: string): Persona {
  const t = (title || "").toLowerCase();
  if (t.includes("president")) return "president";
  if (t.includes("treasurer")) return "treasurer";
  if (t.includes("secretary")) return "secretary";
  if (t.includes("coach")) return "coach";
  if (t.includes("volunteer")) return "volunteer";
  return "general";
}

export type LocalCounts = { events: number; sponsors: number; teams: number; news: number };

function money(n?: number): string | null {
  if (n == null) return null;
  return "$" + Math.round(n).toLocaleString("en-AU");
}

/** Build the indicator set for a persona from local site counts + merged Metrics. */
export function buildKpis(persona: Persona, local: LocalCounts, m: Metrics): { heading: string; cards: Kpi[] } {
  const reg = m.registrations;
  const fin = m.finance;
  const variance = (): Kpi => ({
    label: "Net vs budget (YTD)",
    value: fin ? `${fin.variancePct >= 0 ? "+" : ""}${fin.variancePct}%` : null,
    source: "zoho",
    tone: fin ? (fin.variancePct >= 0 ? "good" : "bad") : "info",
    hint: fin ? `${money(fin.netYtd)} vs ${money(fin.budgetYtd)}` : "Profit & loss against budget (Zoho Books)",
  });
  const upcomingEvents = (): Kpi => ({
    label: "Upcoming events",
    value: m.events?.upcoming ?? null,
    source: "sportsweb",
    tone: "info",
    go: "events",
  });

  if (persona === "president") {
    return {
      heading: "President — key indicators",
      cards: [
        { label: "Members", value: m.members?.active ?? null, source: "sportsweb", tone: "info", hint: "People on file" },
        { label: "New this month", value: m.members?.newThisMonth ?? null, source: "sportsweb", tone: "good" },
        variance(),
        { label: "Pending registrations", value: reg?.pending ?? null, source: "sportsweb", tone: reg && reg.pending > 0 ? "warn" : "good" },
        { label: "Active volunteers", value: m.volunteers?.active ?? null, source: "sportsweb", tone: "info" },
        { label: "Compliance risks", value: m.compliance?.risks ?? null, source: "sportsweb", tone: m.compliance && m.compliance.risks > 0 ? "bad" : "good", hint: "Expiring WWCC / accreditation" },
        { label: "Open committee tasks", value: m.tasks?.open ?? null, source: "either", tone: m.tasks && m.tasks.open > 0 ? "warn" : "good" },
        upcomingEvents(),
        { label: "Active sponsors", value: local.sponsors, source: "sportsweb", tone: "plain", go: "sponsors" },
      ],
    };
  }

  if (persona === "treasurer") {
    return {
      heading: "Treasurer — key indicators",
      cards: [
        variance(),
        { label: "Net position (YTD)", value: money(fin?.netYtd), source: "zoho", tone: "info" },
        { label: "Unpaid registrations", value: reg?.unpaid ?? null, source: "sportsweb", tone: reg && reg.unpaid > 0 ? "warn" : "good" },
        { label: "Pending registrations", value: reg?.pending ?? null, source: "sportsweb", tone: reg && reg.pending > 0 ? "warn" : "good" },
        { label: "Active sponsors", value: local.sponsors, source: "sportsweb", tone: "plain", go: "sponsors" },
      ],
    };
  }

  if (persona === "secretary") {
    return {
      heading: "Secretary — key indicators",
      cards: [
        { label: "Pending registrations", value: reg?.pending ?? null, source: "sportsweb", tone: reg && reg.pending > 0 ? "warn" : "good" },
        { label: "Open governance tasks", value: m.tasks?.open ?? null, source: "either", tone: m.tasks && m.tasks.open > 0 ? "warn" : "good" },
        { label: "Compliance risks", value: m.compliance?.risks ?? null, source: "sportsweb", tone: m.compliance && m.compliance.risks > 0 ? "bad" : "good" },
        upcomingEvents(),
      ],
    };
  }

  // general / coach / volunteer (full sets land next)
  return {
    heading: "Club — key indicators",
    cards: [
      { label: "Members", value: m.members?.active ?? null, source: "sportsweb", tone: "info" },
      { label: "Active volunteers", value: m.volunteers?.active ?? null, source: "sportsweb", tone: "info" },
      upcomingEvents(),
      { label: "Teams", value: local.teams, source: "sportsweb", tone: "plain", go: "teams" },
      { label: "Active sponsors", value: local.sponsors, source: "sportsweb", tone: "plain", go: "sponsors" },
    ],
  };
}
