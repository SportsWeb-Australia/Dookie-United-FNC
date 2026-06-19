import { supabase } from "./supabase";

/**
 * Role dashboards read "critical indicators" from whichever system OWNS each
 * metric — a hybrid model:
 *
 *   SportsWeb One Supabase DB  →  members/people, volunteers (Volunteer One),
 *                                 ticketed events + tickets sold (Ticket One),
 *                                 compliance (WWCC / accreditation expiry)
 *   Zoho                       →  finance / P&L vs budget (Books),
 *                                 registrations (Creator)
 *   Either (TBD)               →  committee tasks / bookings
 *
 * Both sources feed one merged Metrics object. A card whose data isn't wired
 * yet renders a placeholder — "Connect Zoho" only for Zoho-owned metrics;
 * SportsWeb-owned metrics just show a quiet "—" until their query is live.
 */

export type Metrics = {
  zohoConnected: boolean;
  members?: { active: number; newThisMonth: number }; // sportsweb
  volunteers?: { active: number; openTasks: number }; // sportsweb
  events?: { upcoming: number; ticketsSold: number }; // sportsweb (Ticket One)
  compliance?: { risks: number }; // sportsweb
  finance?: { netYtd: number; budgetYtd: number; variancePct: number }; // zoho
  registrations?: { pending: number; issues: number; unpaid: number }; // zoho
  tasks?: { open: number; overdue: number }; // either
};

export type MetricSource = "sportsweb" | "zoho" | "either";

/** SportsWeb-owned figures, read straight from this Supabase project. */
export async function getSportswebMetrics(clubId: string | null): Promise<Partial<Metrics>> {
  if (!clubId || !supabase) return {};
  const out: Partial<Metrics> = {};
  // Members — best-effort count from the people foundation table.
  try {
    const { count, error } = await supabase
      .from("people")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId);
    if (!error && typeof count === "number") out.members = { active: count, newThisMonth: 0 };
  } catch {
    /* table not present yet — leave undefined */
  }
  // TODO (next pass): volunteers (volunteer_* tables), events/ticketsSold (Ticket One),
  // compliance (people accreditation expiry). Confirm table/column names, then add here.
  return out;
}

/** Zoho-owned figures (finance, registrations) via the zoho-metrics function. */
export async function getZohoMetrics(clubId: string | null): Promise<Partial<Metrics> & { zohoConnected: boolean }> {
  if (!clubId || !supabase) return { zohoConnected: false };
  try {
    const { data, error } = await supabase.functions.invoke("zoho-metrics", { body: { clubId } });
    if (error || !data || !data.connected) return { zohoConnected: false };
    return { zohoConnected: true, finance: data.finance, registrations: data.registrations, tasks: data.tasks };
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
  value: number | string | null; // null → placeholder (see source for copy)
  hint?: string;
  tone?: Tone;
  source: MetricSource;
  go?: string; // optional nav key for a "view" affordance
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

  if (persona === "president") {
    return {
      heading: "President — key indicators",
      cards: [
        { label: "Active members", value: m.members?.active ?? null, source: "sportsweb", tone: "info", hint: "Financial members" },
        { label: "New this month", value: m.members?.newThisMonth ?? null, source: "sportsweb", tone: "good" },
        variance(),
        { label: "Pending registrations", value: reg?.pending ?? null, source: "zoho", tone: reg && reg.pending > 0 ? "warn" : "good" },
        { label: "Active volunteers", value: m.volunteers?.active ?? null, source: "sportsweb", tone: "info" },
        { label: "Compliance risks", value: m.compliance?.risks ?? null, source: "sportsweb", tone: m.compliance && m.compliance.risks > 0 ? "bad" : "good", hint: "Expiring WWCC / accreditation" },
        { label: "Open committee tasks", value: m.tasks?.open ?? null, source: "either", tone: m.tasks && m.tasks.open > 0 ? "warn" : "good" },
        { label: "Events listed", value: local.events, source: "sportsweb", tone: "plain", go: "events" },
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
        { label: "Unpaid registrations", value: reg?.unpaid ?? null, source: "zoho", tone: reg && reg.unpaid > 0 ? "warn" : "good" },
        { label: "Registration issues", value: reg?.issues ?? null, source: "zoho", tone: reg && reg.issues > 0 ? "bad" : "good" },
        { label: "Active sponsors", value: local.sponsors, source: "sportsweb", tone: "plain", go: "sponsors" },
      ],
    };
  }

  if (persona === "secretary") {
    return {
      heading: "Secretary — key indicators",
      cards: [
        { label: "Pending registrations", value: reg?.pending ?? null, source: "zoho", tone: reg && reg.pending > 0 ? "warn" : "good" },
        { label: "Open governance tasks", value: m.tasks?.open ?? null, source: "either", tone: m.tasks && m.tasks.open > 0 ? "warn" : "good" },
        { label: "Compliance risks", value: m.compliance?.risks ?? null, source: "sportsweb", tone: m.compliance && m.compliance.risks > 0 ? "bad" : "good" },
        { label: "Events listed", value: local.events, source: "sportsweb", tone: "plain", go: "events" },
      ],
    };
  }

  // general / coach / volunteer (full sets land next)
  return {
    heading: "Club — key indicators",
    cards: [
      { label: "Active members", value: m.members?.active ?? null, source: "sportsweb", tone: "info" },
      { label: "Active volunteers", value: m.volunteers?.active ?? null, source: "sportsweb", tone: "info" },
      { label: "Events listed", value: local.events, source: "sportsweb", tone: "plain", go: "events" },
      { label: "Teams", value: local.teams, source: "sportsweb", tone: "plain", go: "teams" },
      { label: "Active sponsors", value: local.sponsors, source: "sportsweb", tone: "plain", go: "sponsors" },
    ],
  };
}
