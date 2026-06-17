/**
 * SportsWeb One — Club content schema.
 *
 * This file defines the shape of EVERY editable piece of a club site.
 * The future SportsWeb One admin dashboard maps its forms onto these types,
 * so a club edits content here (or via the dashboard) without touching layout.
 *
 * Rule of thumb:
 *   - Anything in ClubConfig = club-editable.
 *   - Layout, tokens logic, and component structure = locked/global (see styles + components).
 */

export type DesignVariant =
  | "heritage"
  | "broadcast"
  | "arena"
  | "classic"
  | "stadium"
  | "editorial"
  | "momentum"
  | "coastal"
  | "broadsheet"
  | "matchday"
  | "appshell"
  | "bento"
  | "sponsorforward"
  | "portal"
  | "poster"
  | "fieldcourt"
  | "masters"
  | "pitch"
  | "scorecard"
  | "hardcourt"
  | "fastbreak";

export interface BrandColours {
  /** Primary ink / dominant colour (Dookie: black). */
  ink: string;
  /** Paper / light surface (Dookie: white). */
  paper: string;
  /** Brand accent, pulled from the logo (Dookie teal: #1F8CA7). */
  accent: string;
  /** Secondary / metallic (Dookie silver). */
  silver: string;
}

export interface LinkRef {
  label: string;
  /** Absolute URL or internal route starting with "/". */
  href: string;
  /** Marks links that still need a real destination from the club. */
  placeholder?: boolean;
}

export interface NavItem {
  label: string;
  href: string;
  children?: LinkRef[];
}

export interface Sponsor {
  name: string;
  href?: string;
  /** Tier controls placement + size. Matches the DB sponsor_level enum. */
  tier: "platinum" | "gold" | "silver";
  /** Optional logo path under /public. Falls back to a styled name plate. */
  logo?: string;
  blurb?: string;
  /** When false, hidden from the home-page logo strip (still on /sponsors). */
  inCarousel?: boolean;
  placeholder?: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  slug?: string;
  date: string; // ISO yyyy-mm-dd
  category: string;
  excerpt: string;
  content?: string; // full HTML body
  href?: string;
  image?: string;
  video?: string;
  author?: string;
  placeholder?: boolean;
}

export interface ClubEvent {
  id: string;
  title: string;
  slug?: string;
  date: string; // ISO
  startsAt?: string; // full ISO for countdowns
  time?: string;
  location?: string;
  description?: string;
  ticketHref?: string;
  mapUrl?: string;
  image?: string;
  video?: string;
  featured?: boolean;
  tag?: string;
  placeholder?: boolean;
}

export interface TeamGroup {
  /** "Football" | "Netball" etc. */
  sport: string;
  teams: {
    name: string;
    blurb: string;
    href?: string;
    ages?: string;
    slug?: string;
    grades?: string[];
    image?: string;
    video?: string;
  }[];
}

export interface Person {
  name: string;
  role: string;
  email?: string;
  phone?: string;
  placeholder?: boolean;
}

export interface DocItem {
  label: string;
  href: string;
  kind: "policy" | "form" | "guide" | "welfare";
  placeholder?: boolean;
}

/** Match Centre data — manual mode now, API adapter later (see lib/matchData.ts). */
export interface Fixture {
  round: string;
  date: string;
  iso?: string;
  opponent: string;
  opponentLogo?: string;
  venue: "Home" | "Away";
  grade: string;
}
export interface Result {
  round: string;
  opponent: string;
  opponentLogo?: string;
  scoreFor: string;
  scoreAgainst: string;
  outcome: "W" | "L" | "D";
  grade: string;
}
export interface LadderRow {
  team: string;
  logo?: string;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  pct: number;
  points: number;
  isClub?: boolean;
}
/** Per-view embed URLs (e.g. GameDay fixture/results/ladder pages). */
export interface MatchEmbed {
  fixtures?: string;
  results?: string;
  ladder?: string;
  /** Iframe height in px (provider pages vary). Defaults to 820. */
  height?: number;
}

export interface MatchCentreData {
  /**
   * "manual" renders the data below.
   * "embed"  renders provider pages (GameDay) in an iframe per tab.
   * "api"    uses the adapter (future).
   */
  mode: "manual" | "embed" | "api";
  /** Provider name shown on the embed panel, e.g. "GameDay". */
  provider?: string;
  competitionLabel: string;
  fixtures: Fixture[];
  results: Result[];
  ladder: LadderRow[];
  /** URLs used when mode === "embed". */
  embed?: MatchEmbed;
  /** Always-visible deep links to the live source(s) (football + netball). */
  liveLinks?: LinkRef[];
  /** Where full fixtures live (league site / GameDay) until API is wired. */
  fullFixturesHref?: string;
  placeholder?: boolean;
}

export interface BlockToggles {
  announcementBar: boolean;
  quickLinks: boolean;
  presidentWelcome: boolean;
  featuredNews: boolean;
  matchCentre: boolean;
  upcomingEvents: boolean;
  teams: boolean;
  sponsors: boolean;
  clubInfo: boolean;
  committee: boolean;
  documents: boolean;
  socialFeed: boolean;
  joinCta: boolean;
}

export interface ClubConfig {
  /** Selected design template. Clubs choose this; layout stays identical. */
  variant: DesignVariant;
  /** Floating Heritage/Broadcast preview toggle. Turn off for production. */
  showVariantSwitcher: boolean;

  identity: {
    name: string;
    slug?: string;
    shortName: string;
    initials: string;
    nickname: string;
    sports: string[];
    location: string;
    ground: string;
    league: string;
    leagueHref?: string;
    foundedNote: string;
    logo: string;
    colours: BrandColours;
  };

  contact: {
    email: string;
    phone?: string;
    instagram?: string;
    facebook?: string;
    addressLine?: string;
  };

  announcement: {
    enabled: boolean;
    text: string;
    link?: LinkRef;
  };

  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCta: LinkRef;
    secondaryCta?: LinkRef;
    /** Optional background image under /public. Motif renders if absent. */
    backgroundImage?: string;
    /** Optional hero video (mp4/webm) for media-led designs; poster shown first. */
    video?: string;
    poster?: string;
  };

  quickLinks: LinkRef[];

  president: {
    name: string;
    role: string;
    portrait?: string;
    /** Paragraphs of the welcome message. */
    body: string[];
    signoff?: string;
  };

  nav: NavItem[];
  sponsors: Sponsor[];
  /**
   * How sponsors are presented:
   *  - "tiered"   grouped by tier (platinum / gold / silver)
   *  - "flat"     one equal logo wall, no tiers
   *  - "featured" top tier shown large, the rest in a wall
   */
  sponsorDisplay?: "tiered" | "flat" | "featured";
  news: NewsPost[];
  events: ClubEvent[];
  teams: TeamGroup[];
  committee: Person[];
  documents: DocItem[];
  matchCentre: MatchCentreData;

  about: {
    heading: string;
    body: string[];
    /** Club values shown as a small grid. */
    values?: { title: string; text: string }[];
    /** History timeline milestones. */
    history?: { year: string; text: string }[];
    /** Quick club facts (founded, ground, league, colours, etc.). */
    facts?: { label: string; value: string }[];
  };

  /** Extra content for the Register / get-involved page. */
  register?: {
    steps: string[];
    feesNote?: string;
    faqs?: { q: string; a: string }[];
  };

  join: {
    heading: string;
    blurb: string;
    options: LinkRef[];
  };

  social: {
    heading: string;
    note: string;
  };

  blocks: BlockToggles;

  /** Module keys this club has switched on (from lib/modules.ts catalog). */
  enabledModules?: string[];
  /** Inline page-content overrides (text + image URLs) keyed by content_key. */
  content?: Record<string, string>;
  /** Platform/sales settings used by the module upgrade pages. */
  platform?: {
    salesEmail?: string;
    trialDays?: number;
    /** Deployed Volunteer Manager app URL — opened/embedded from the admin. */
    volunteerAppUrl?: string;
  };

  footer: {
    acknowledgement: string;
    legal: LinkRef[];
  };
}
