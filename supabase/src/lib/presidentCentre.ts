import type { Metrics } from "./roleKpis";

/**
 * President Command Centre — derives a club health score, red-flag alerts and a
 * president to-do list from whatever data is connected, and clearly marks the
 * state of each signal so nothing is faked:
 *   live  → real data from SportsWeb / connected source
 *   mock  → sample value so the layout is useful before the source is connected
 *   setup → needs a module or Zoho connection before it can be scored
 *   manual→ entered by hand
 *
 * As modules and Zoho connect for a club, items flip from setup/mock to live
 * with no layout change.
 */

export type DataState = "live" | "mock" | "setup" | "manual";
export type Status = "green" | "amber" | "red" | "muted";

export type HealthArea = {
  key: string;
  label: string;
  status: Status;
  score: number | null;
  reason: string;
  owner: string;
  action?: string;
  go?: string;
  state: DataState;
};

export type RedFlag = {
  id: string;
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  owner: string;
  due?: string;
  action: string;
  go?: string;
  state: DataState;
};

export type Todo = {
  id: string;
  title: string;
  bucket: "urgent" | "week" | "month" | "season";
  owner: string;
  go?: string;
  state: DataState;
};

export type CentreLocal = { events: number; sponsors: number; teams: number; news: number };

/** Section 19 default targets — configurable per club later. */
export const TARGETS = {
  unpaidRegPct: 10,
  minVolunteers: 8,
  wwccCompliancePct: 100,
  newsMaxDays: 14,
  cashReserveMonths: 3,
};

function statusFromScore(s: number): Status {
  if (s >= 80) return "green";
  if (s >= 60) return "amber";
  return "red";
}

export function buildHealth(m: Metrics, local: CentreLocal): { overall: number | null; status: Status; areas: HealthArea[] } {
  const members = m.members?.active ?? 0;
  const newThis = m.members?.newThisMonth ?? 0;
  const unpaid = m.registrations?.unpaid ?? 0;
  const vols = m.volunteers?.active;
  const risks = m.compliance?.risks;
  const upcoming = m.events?.upcoming ?? 0;

  const areas: HealthArea[] = [];

  // 1. Financial — needs Club Finance / Zoho Books.
  if (m.finance) {
    const score = Math.max(0, Math.min(100, 80 + m.finance.variancePct));
    areas.push({
      key: "finance",
      label: "Financial health",
      status: statusFromScore(score),
      score,
      reason: `Net ${m.finance.variancePct >= 0 ? "ahead of" : "behind"} budget by ${Math.abs(m.finance.variancePct)}% YTD.`,
      owner: "Treasurer",
      action: m.finance.variancePct < 0 ? "Review cash flow and overdue invoices" : undefined,
      state: "live",
    });
  } else {
    areas.push({
      key: "finance",
      label: "Financial health",
      status: "muted",
      score: null,
      reason: "Connect Club Finance to track cash, budget and invoices.",
      owner: "Treasurer",
      action: "Connect Club Finance",
      go: "__modules",
      state: "setup",
    });
  }

  // 2. Membership & retention — live counts; retention trend lands later.
  {
    let score = members > 0 ? 85 : 40;
    if (unpaid > 0) score -= Math.min(25, unpaid * 3);
    areas.push({
      key: "membership",
      label: "Membership & retention",
      status: members > 0 ? statusFromScore(score) : "muted",
      score: members > 0 ? Math.max(0, score) : null,
      reason: members > 0 ? `${members} active members · ${newThis} new this month · ${unpaid} unpaid.` : "No members on file yet.",
      owner: "Registrar / Secretary",
      action: unpaid > 0 ? "Send registration payment reminders" : undefined,
      go: "members",
      state: members > 0 ? "live" : "setup",
    });
  }

  // 3. Volunteer coverage — live count; shift coverage lands later.
  if (vols != null) {
    const score = vols >= TARGETS.minVolunteers ? 90 : vols >= TARGETS.minVolunteers / 2 ? 70 : 45;
    areas.push({
      key: "volunteers",
      label: "Volunteer coverage",
      status: statusFromScore(score),
      score,
      reason: `${vols} active volunteers${vols < TARGETS.minVolunteers ? " — below a healthy base" : ""}.`,
      owner: "Volunteer Manager",
      action: vols < TARGETS.minVolunteers ? "Recruit helpers and spread the load" : undefined,
      go: "volunteers",
      state: "live",
    });
  } else {
    areas.push({ key: "volunteers", label: "Volunteer coverage", status: "muted", score: null, reason: "Volunteer module not set up.", owner: "Volunteer Manager", state: "setup" });
  }

  // 4. Compliance & risk — live (WWCC / accreditation expiries).
  if (risks != null) {
    const score = risks === 0 ? 100 : risks <= 2 ? 70 : 40;
    areas.push({
      key: "compliance",
      label: "Compliance & risk",
      status: statusFromScore(score),
      score,
      reason: risks === 0 ? "No checks expiring in the next 30 days." : `${risks} WWCC / accreditation check${risks === 1 ? "" : "s"} expiring or lapsed.`,
      owner: "Secretary",
      action: risks > 0 ? "Review and renew expiring checks" : undefined,
      go: "compliance",
      state: "live",
    });
  } else {
    areas.push({ key: "compliance", label: "Compliance & risk", status: "muted", score: null, reason: "Compliance records not set up.", owner: "Secretary", state: "setup" });
  }

  // 5. Sponsorship — count is live; exposure / $ needs setup.
  areas.push({
    key: "sponsorship",
    label: "Sponsorship",
    status: local.sponsors > 0 ? "amber" : "muted",
    score: local.sponsors > 0 ? 70 : null,
    reason: `${local.sponsors} active sponsor${local.sponsors === 1 ? "" : "s"} · revenue & exposure tracking not set up.`,
    owner: "Sponsorship Manager",
    action: "Set up sponsor benefits & exposure tracking",
    go: "sponsors",
    state: "mock",
  });

  // 6. Team health — setup.
  areas.push({ key: "teams", label: "Team health", status: "muted", score: null, reason: "Team numbers, availability and injuries not yet connected.", owner: "Football / Netball Director", state: "setup", go: "teams" });

  // 7. Events & fundraising — upcoming is live; ticketing/break-even setup.
  areas.push({
    key: "events",
    label: "Events & fundraising",
    status: upcoming > 0 ? "green" : "amber",
    score: upcoming > 0 ? 80 : 55,
    reason: `${upcoming} upcoming event${upcoming === 1 ? "" : "s"} · ticket sales & break-even not connected.`,
    owner: "Events Coordinator",
    action: upcoming === 0 ? "Schedule the next club event" : undefined,
    go: "events",
    state: upcoming > 0 ? "live" : "mock",
  });

  // 8. Engagement & communication — setup.
  areas.push({ key: "engagement", label: "Engagement & comms", status: "muted", score: null, reason: "Website, email and social analytics not connected.", owner: "Media Manager", state: "setup" });

  // 9. Governance & committee — setup.
  areas.push({ key: "governance", label: "Governance & committee", status: "muted", score: null, reason: "Committee tasks & decisions not yet tracked.", owner: "Secretary", state: "setup" });

  const scored = areas.filter((a) => a.score != null).map((a) => a.score as number);
  const overall = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null;
  return { overall, status: overall == null ? "muted" : statusFromScore(overall), areas };
}

export function buildRedFlags(m: Metrics, _local: CentreLocal): RedFlag[] {
  const flags: RedFlag[] = [];
  const risks = m.compliance?.risks ?? 0;
  const unpaid = m.registrations?.unpaid ?? 0;
  const pending = m.registrations?.pending ?? 0;

  if (risks > 0)
    flags.push({ id: "wwcc", title: `${risks} compliance check${risks === 1 ? "" : "s"} expiring or lapsed`, category: "Compliance", severity: "high", owner: "Secretary", action: "Review WWCC / accreditation", go: "compliance", state: "live" });
  if (unpaid > 0)
    flags.push({ id: "unpaid", title: `${unpaid} unpaid registration${unpaid === 1 ? "" : "s"}`, category: "Finance", severity: "medium", owner: "Treasurer", action: "Chase outstanding payments", go: "members", state: "live" });
  if (pending > 0)
    flags.push({ id: "pending", title: `${pending} registration${pending === 1 ? "" : "s"} awaiting approval`, category: "Membership", severity: "low", owner: "Registrar", action: "Approve or follow up", go: "members", state: "live" });

  // Samples so the section reads well before finance/sponsor data connects.
  flags.push({ id: "s1", title: "Sponsor invoice overdue 14+ days", category: "Sponsorship", severity: "high", owner: "Treasurer", action: "Contact sponsor", state: "mock" });
  flags.push({ id: "s2", title: "Insurance renewal due within 30 days", category: "Compliance", severity: "medium", owner: "Secretary", action: "Confirm renewal", state: "mock" });

  return flags;
}

export function buildTodos(m: Metrics, _local: CentreLocal): Todo[] {
  const todos: Todo[] = [];
  const risks = m.compliance?.risks ?? 0;
  const unpaid = m.registrations?.unpaid ?? 0;

  if (risks > 0) todos.push({ id: "t-wwcc", title: "Follow up expiring WWCC / accreditation", bucket: "urgent", owner: "Secretary", go: "compliance", state: "live" });
  if (unpaid > 0) todos.push({ id: "t-unpaid", title: "Chase unpaid registrations with treasurer", bucket: "week", owner: "Treasurer", go: "members", state: "live" });

  todos.push({ id: "t-update", title: "Approve this week's club update", bucket: "week", owner: "President", state: "mock" });
  todos.push({ id: "t-lowteams", title: "Review team numbers for low-registration age groups", bucket: "month", owner: "President", go: "teams", state: "mock" });
  todos.push({ id: "t-sponsor", title: "Start sponsor renewal conversations", bucket: "month", owner: "Sponsorship Manager", go: "sponsors", state: "mock" });
  todos.push({ id: "t-agenda", title: "Prepare next committee agenda", bucket: "season", owner: "President", state: "mock" });
  todos.push({ id: "t-grants", title: "Review grant opportunities", bucket: "season", owner: "President", state: "mock" });

  return todos;
}
