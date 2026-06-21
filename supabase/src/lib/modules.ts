/**
 * SportsWeb One module catalogue. The same catalogue ships with every club;
 * which modules are live is per-club (ClubConfig.enabledModules). Each module
 * has a "pre-page": an overview + quick-start the club sees before opening the
 * tool — or, when it isn't on their plan, an upgrade / free-trial prompt.
 */
export interface ModuleQuickStep {
  title: string;
  body: string;
}
export interface ModuleVideo {
  title: string;
  url: string;
}
export interface ModuleDef {
  key: string;
  name: string;
  /** Short letters for the tile badge (we avoid external icon deps). */
  badge: string;
  tagline: string;
  summary: string;
  overview: string[];
  quickstart: ModuleQuickStep[];
  videos?: ModuleVideo[];
  /** Where "Open" goes when the module is enabled. */
  appUrl?: string;
  /** Plan label shown on the tile + pre-page. */
  plan: string;
}

export const MODULE_CATALOG: ModuleDef[] = [
  {
    key: "volunteers",
    name: "Volunteer One",
    badge: "VM",
    tagline: "Rosters, reminders and thank-yous — sorted.",
    summary:
      "Build fair game-day rosters, fill gaps fast, and message your volunteers across SMS, email and push from one place.",
    overview: [
      "AI-assisted roster builder proposes a fair draft you approve — it never sends anything on its own.",
      "Track availability, roles and hours per person across the season.",
      "One-tap dispatch to volunteers via SMS, email or app push.",
      "See who's confirmed, who's pending, and who still needs a nudge.",
    ],
    quickstart: [
      { title: "Add your people", body: "Import or add volunteers with their roles and contact details." },
      { title: "Build a roster", body: "Pick a date and let the roster builder propose a fair draft, then adjust." },
      { title: "Send it out", body: "Dispatch the roster and reminders, and watch confirmations come back in." },
    ],
    plan: "SportsWeb add-on",
  },
  {
    key: "learn",
    name: "Club Learn",
    badge: "LN",
    tagline: "Onboarding and accreditation, all in one library.",
    summary:
      "Powered by Zoho Learn — give coaches, officials and committee members a single place for courses, policies and inductions.",
    overview: [
      "Host coach and volunteer inductions as short, trackable courses.",
      "Keep child-safety, first-aid and policy docs in one searchable library.",
      "See who has completed what, and send reminders for what's outstanding.",
    ],
    quickstart: [
      { title: "Create a course", body: "Group your induction videos and documents into a simple course." },
      { title: "Invite members", body: "Add coaches and volunteers and assign the courses they need." },
      { title: "Track completion", body: "Use the dashboard to see progress and follow up on gaps." },
    ],
    appUrl: "https://learn.zoho.com.au",
    plan: "Zoho-powered add-on",
  },
  {
    key: "books",
    name: "Club Finance",
    badge: "BK",
    tagline: "Invoices, payments and a clean set of books.",
    summary:
      "Powered by Zoho Books — raise sponsor invoices, track payments and hand your treasurer a tidy end-of-season report.",
    overview: [
      "Send branded sponsor and membership invoices and track what's paid.",
      "Reconcile club bank transactions without spreadsheets.",
      "Produce treasurer and committee reports in a couple of clicks.",
    ],
    quickstart: [
      { title: "Set up the club", body: "Add your club details, bank account and a logo for invoices." },
      { title: "Raise an invoice", body: "Invoice a sponsor or member and send it straight from the app." },
      { title: "Reconcile", body: "Match payments to invoices so your books always balance." },
    ],
    appUrl: "https://books.zoho.com.au",
    plan: "Zoho-powered add-on",
  },
  {
    key: "bookings",
    name: "Club Bookings",
    badge: "BO",
    tagline: "Ground, rooms and events — bookable online.",
    summary:
      "Powered by Zoho Bookings — let members and the community book your facilities, with confirmations and reminders handled for you.",
    overview: [
      "Take online bookings for the clubrooms, ground or function space.",
      "Automatic confirmations and reminders cut down no-shows.",
      "Set availability, buffers and who gets notified for each space.",
    ],
    quickstart: [
      { title: "Add a space", body: "Create a bookable resource — clubrooms, ground or a coach." },
      { title: "Set availability", body: "Choose the hours and rules for when it can be booked." },
      { title: "Share the link", body: "Drop the booking link on your site and socials." },
    ],
    appUrl: "https://bookings.zoho.com.au",
    plan: "Zoho-powered add-on",
  },
  {
    key: "forms",
    name: "Club Forms",
    badge: "FM",
    tagline: "Registrations and sign-ups without the paper.",
    summary:
      "Powered by Zoho Forms — collect registrations, expressions of interest and consent forms with everything flowing into one place.",
    overview: [
      "Build registration and EOI forms that match your club branding.",
      "Collect payments and consents alongside the details you need.",
      "Export responses or pipe them into your other club tools.",
    ],
    quickstart: [
      { title: "Pick a template", body: "Start from a registration or EOI template and tweak the fields." },
      { title: "Add it to your site", body: "Embed the form or share its link." },
      { title: "Manage responses", body: "Review submissions and export them whenever you need." },
    ],
    appUrl: "https://forms.zoho.com.au",
    plan: "Zoho-powered add-on",
  },
];

export function getModule(key: string | undefined): ModuleDef | null {
  if (!key) return null;
  return MODULE_CATALOG.find((m) => m.key === key) ?? null;
}
