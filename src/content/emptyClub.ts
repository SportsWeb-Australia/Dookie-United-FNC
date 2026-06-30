import type { ClubConfig } from "./types";

/**
 * Neutral, content-free club config -- "a club with nothing filled in yet".
 *
 * Every NON-demo club is built from this base in loadClub.ts, so none of the demo
 * club's (Dookie's) content can leak in. Only genuinely structural / non-club-specific
 * defaults are present: generic nav + quick links (pointing at the real routes),
 * generic hero/CTA labels, section toggles, and an empty placeholder match centre.
 * Every club-identifying field (name, contact, hero copy, president, about,
 * acknowledgement, sponsors/news/events/teams, logo, colours) is blank/empty and is
 * filled from the club's own clubs row + club_content. The demo club keeps using
 * club.config.ts (staticClub).
 *
 * Authored as an explicit literal (no staticClub spread) on purpose: if ClubConfig
 * gains a field, the build fails here loudly instead of silently inheriting Dookie's.
 */
export const emptyClub: ClubConfig = {
  variant: "heritage",
  showVariantSwitcher: false,

  identity: {
    name: "",
    slug: undefined,
    shortName: "",
    initials: "",
    nickname: "",
    sports: [],
    location: "",
    ground: "",
    league: "",
    leagueHref: undefined,
    foundedNote: "",
    logo: "", // replaced with a generated placeholder crest in loadClub.
    colours: { ink: "#1a1a2e", paper: "#ffffff", accent: "#1a1a2e", silver: "#9aa3b2", tertiary: undefined },
  },

  contact: { email: "", phone: "", instagram: "", facebook: "", addressLine: "" },

  announcement: { enabled: false, text: "" },

  hero: {
    eyebrow: "",
    title: "",
    subtitle: "",
    primaryCta: { label: "Join the club", href: "/register" },
    secondaryCta: { label: "Fixtures & results", href: "/fixtures" },
    backgroundImage: undefined,
    video: undefined,
    poster: undefined,
  },

  quickLinks: [
    { label: "Fixtures", href: "/fixtures" },
    { label: "Register", href: "/register" },
    { label: "Volunteer", href: "/register" },
  ],

  president: { name: "", role: "", portrait: undefined, body: [], signoff: undefined },

  nav: [
    { label: "Home", href: "/" },
    { label: "Teams", href: "/teams" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "News", href: "/news" },
    { label: "Events", href: "/events" },
    { label: "Sponsors", href: "/sponsors" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],

  sponsors: [],
  news: [],
  events: [],
  teams: [],
  committee: [],
  documents: [],

  matchCentre: {
    mode: "manual",
    competitionLabel: "",
    fixtures: [],
    results: [],
    ladder: [],
    placeholder: true,
  },

  about: { heading: "", body: [], values: [], history: [], facts: [] },

  register: {
    steps: ["Pick your team or program", "Complete the online registration form", "Pay securely to finish"],
    feesNote: "",
  },

  join: { heading: "Get involved", blurb: "", options: [] },

  social: { heading: "Follow us", note: "" },

  blocks: {
    announcementBar: false,
    quickLinks: true,
    presidentWelcome: true,
    featuredNews: true,
    matchCentre: true,
    upcomingEvents: true,
    teams: true,
    sponsors: true,
    clubInfo: true,
    committee: true,
    documents: true,
    socialFeed: true,
    joinCta: true,
  },

  enabledModules: [],
  platform: { trialDays: 14 },

  footer: { acknowledgement: "", legal: [] },
};
