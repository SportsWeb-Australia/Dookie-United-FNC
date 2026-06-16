import type { ClubConfig } from "./types";

/**
 * CLIENT ZERO: Dookie United Football & Netball Club.
 *
 * Real, migrated content is unmarked. Anything with `placeholder: true`
 * (or a // TODO comment) needs the club to confirm/supply before launch.
 *
 * To spin up a new club from this template: copy this file, swap the values.
 * Layout and components do not change.
 */
export const club: ClubConfig = {
  variant: "heritage",
  showVariantSwitcher: true,

  identity: {
    name: "Dookie United Football & Netball Club",
    slug: "dookie-united",
    shortName: "Dookie United",
    initials: "DUFNC",
    nickname: "the Dooks",
    sports: ["Football", "Netball"],
    location: "Dookie, Victoria",
    ground: "Dookie Recreation Reserve",
    league: "Picola & District Football Netball League",
    leagueHref: "https://www.pdfnl.com/",
    foundedNote:
      "Football in Dookie dates to 1887; Dookie United was formed in 1977.", // TODO: confirm history wording with club
    logo: "/dookie-logo.png",
    colours: {
      ink: "#000000",
      paper: "#FFFFFF",
      accent: "#1F8CA7", // teal, sampled from the club logo
      silver: "#9B9B9B",
    },
  },

  contact: {
    email: "dufncpresident@gmail.com",
    phone: undefined, // TODO: add a club contact number if desired
    instagram: "https://www.instagram.com/dookieunited/",
    facebook: "https://www.facebook.com/profile.php?id=100063789829861",
    addressLine: "Dookie Recreation Reserve, Dookie VIC 3646",
  },

  announcement: {
    enabled: true,
    text: "2026 season is underway — get the full fixtures and come down to the Rec Reserve.",
    link: { label: "View fixtures", href: "/fixtures" },
  },

  hero: {
    eyebrow: "Picola & District FNL · Dookie, Victoria",
    title: "Dookie United Football & Netball Club",
    subtitle:
      "Country football and netball built on connection, commitment and a genuine love of the game. Go Dookie!",
    primaryCta: { label: "Join the club", href: "/register" },
    secondaryCta: { label: "Fixtures & results", href: "/fixtures" },
    backgroundImage: undefined, // TODO: supply a hero/ground/action photo for best effect
  },

  quickLinks: [
    { label: "Fixtures", href: "/fixtures" },
    { label: "Register", href: "/register" },
    { label: "Merch store", href: "https://shepparton.hippocketworkwear.com.au/shop-by-customer/dookie-united-fnc/" },
    { label: "Volunteer", href: "/register" },
  ],

  president: {
    name: "Danny McNamara",
    role: "President",
    portrait: undefined, // TODO: add a portrait of the President
    body: [
      "Welcome to the Dookie United Football Netball Club. On behalf of our committee, players, coaches, volunteers and supporters, I’m proud to welcome you to our club and community. Dookie United is built on strong country values — connection, commitment, and a genuine passion for football and netball.",
      "Our club proudly fields Senior and Reserves football teams, along with a thriving junior program from Auskick through to Under 17, and a complete netball pathway from Net Set Go through to our senior teams. This structure ensures we are not only competitive, but also focused on developing our people and keeping our community connected across all age groups.",
      "At Dookie United, we are more than just a sporting club. We are a place where friendships are formed, families come together, and lifelong memories are created. Whether you’re a player, parent, volunteer, sponsor or supporter, you are an important part of what makes our club special.",
      "We are committed to providing a positive, inclusive and welcoming environment where everyone has the opportunity to contribute, grow and enjoy being involved. Our volunteers are the backbone of our club, and we are incredibly grateful for the time and energy they give.",
      "I encourage you to get involved, support our teams, and be part of the Dookie United journey. We look forward to seeing you around the club.",
    ],
    signoff: "Go Dookie!",
  },

  nav: [
    { label: "Home", href: "/" },
    {
      label: "Football",
      href: "/football",
      children: [
        { label: "Football overview", href: "/football" },
        { label: "Seniors & Reserves", href: "/program/seniors-reserves" },
        { label: "Junior Football", href: "/program/junior-football" },
        { label: "Auskick", href: "/program/auskick" },
        { label: "New player enquiries", href: "/register" },
      ],
    },
    {
      label: "Netball",
      href: "/netball",
      children: [
        { label: "Netball overview", href: "/netball" },
        { label: "Senior Netball", href: "/program/senior-netball" },
        { label: "Junior Netball", href: "/program/junior-netball" },
        { label: "Net Set Go", href: "/program/net-set-go" },
        { label: "New player enquiries", href: "/register" },
      ],
    },
    { label: "Fixtures", href: "/fixtures" },
    { label: "News", href: "/news" },
    { label: "Events", href: "/events" },
    {
      label: "Club",
      href: "/about",
      children: [
        { label: "About the club", href: "/about" },
        { label: "Committee & coaches", href: "/about" },
        { label: "Documents & policies", href: "/documents" },
        { label: "Contact", href: "/contact" },
      ],
    },
    { label: "Sponsors", href: "/sponsors" },
  ],

  // Tiers below are a starting placement — confirm real packages with the club.
  sponsors: [
    { name: "GrainCorp", href: "https://www.graincorp.com.au/", tier: "platinum" },
    { name: "Nutrien Ag Solutions", href: "https://www.nutrienagsolutions.com.au/branch/shepparton", tier: "platinum" },
    { name: "GV Hotel", href: "https://gvhotel.com/", tier: "gold" },
    { name: "Choices Flooring", href: "https://www.choicesflooring.com.au/", tier: "gold" },
    { name: "Shepparton Real Estate", href: "https://www.sheppartonrealestate.com.au/", tier: "gold" },
    { name: "Animal Mineral Solutions", href: "https://www.animalmineralsolutions.com.au/", tier: "silver" },
    { name: "Rankin Plumbing", href: "https://www.rankinplumbing.com.au/", tier: "silver" },
    { name: "MSK Engineering", href: "https://mskengineeringvic.com.au/", tier: "silver" },
    { name: "JVella Builders", href: "https://www.jvellabuilders.com.au/", tier: "silver" },
  ],

  // TODO: replace with real club news. Marked placeholder so it's obvious in the UI.
  news: [
    {
      id: "n1",
      title: "Round 1 wrap: Dooks open the season at home",
      date: "2026-04-12",
      category: "Match report",
      excerpt:
        "A strong four-quarter effort in front of the home crowd at the Rec Reserve. Full report and best players inside.",
      placeholder: true,
    },
    {
      id: "n2",
      title: "Netball squads named for 2026",
      date: "2026-04-05",
      category: "Netball",
      excerpt:
        "Our Net Set Go through to senior netball squads are locked in. Welcome to all our new and returning players.",
      placeholder: true,
    },
    {
      id: "n3",
      title: "Auskick registrations now open",
      date: "2026-03-28",
      category: "Juniors",
      excerpt:
        "The next generation of Dooks starts here. Auskick is a fun, safe introduction to footy for our youngest players.",
      placeholder: true,
    },
  ],

  // TODO: replace with the real 2026 event calendar.
  events: [
    {
      id: "e1",
      title: "Season Launch & Social Night",
      date: "2026-04-04",
      time: "6:30pm",
      location: "Dookie Recreation Reserve",
      description: "Kick off the season with the whole club — players, families and supporters welcome.",
      placeholder: true,
    },
    {
      id: "e2",
      title: "Ladies’ Day",
      date: "2026-05-23",
      time: "12:00pm",
      location: "Dookie Recreation Reserve",
      description: "A club favourite. Lunch, raffles and a great day at the footy.",
      placeholder: true,
    },
    {
      id: "e3",
      title: "Past Players & Officials Reunion",
      date: "2026-07-18",
      location: "Dookie Recreation Reserve",
      description: "Reconnect with the Dookie United family across the generations.",
      placeholder: true,
    },
  ],

  teams: [
    {
      sport: "Football",
      teams: [
        { name: "Seniors & Reserves", slug: "seniors-reserves", blurb: "Our senior men's program — Seniors and Reserves competing in the Picola & District FNL.", ages: "Open", grades: ["Seniors", "Reserves"], href: "/program/seniors-reserves" },
        { name: "Junior Football", slug: "junior-football", blurb: "Development through the junior grades, building skills and a love of the game.", ages: "U10–U17", grades: ["Under 17", "Under 14", "Under 12", "Under 10"], href: "/program/junior-football" },
        { name: "Auskick", slug: "auskick", blurb: "A fun, safe first taste of footy for our youngest players.", ages: "5–10", grades: ["NAB AFL Auskick"], href: "/program/auskick" },
      ],
    },
    {
      sport: "Netball",
      teams: [
        { name: "Senior Netball", slug: "senior-netball", blurb: "Senior netball across multiple grades each season, from A Grade down.", ages: "Open", grades: ["A Grade", "B Grade", "C Grade"], href: "/program/senior-netball" },
        { name: "Junior Netball", slug: "junior-netball", blurb: "Building skills and confidence through the junior netball pathway.", ages: "Juniors", grades: ["17 & Under", "15 & Under", "13 & Under"], href: "/program/junior-netball" },
        { name: "Net Set Go", slug: "net-set-go", blurb: "Netball Australia's introductory program for our newest players.", ages: "5–10", grades: ["Net", "Set", "Go"], href: "/program/net-set-go" },
      ],
    },
  ],

  // TODO: confirm full committee roster — only the President is public today.
  committee: [
    { name: "Danny McNamara", role: "President", email: "dufncpresident@gmail.com" },
    { name: "Committee position", role: "Vice President", placeholder: true },
    { name: "Committee position", role: "Secretary", placeholder: true },
    { name: "Committee position", role: "Treasurer", placeholder: true },
  ],

  documents: [
    { label: "Club Policies", href: "/documents", kind: "policy", placeholder: true },
    { label: "Club Welfare & Wellbeing", href: "/documents", kind: "welfare", placeholder: true },
    { label: "Incident Report Form", href: "/documents", kind: "form", placeholder: true },
    { label: "Concussion Management", href: "/documents", kind: "guide", placeholder: true },
    { label: "Codes of Conduct", href: "/documents", kind: "policy", placeholder: true },
  ],

  matchCentre: {
    // Set to "manual" for a clean review. Flip to "embed" once the exact
    // 2026 Seniors GameDay URLs are pasted into `embed` below (see README).
    mode: "manual",
    provider: "GameDay",
    competitionLabel: "Picola & District FNL · Seniors",
    fullFixturesHref:
      "https://websites.mygameday.app/assoc_page.cgi?c=0-6191-0-645511-0&a=COMPS",
    // Always-visible deep links to the live source. Football → GameDay,
    // Netball → PlayHQ. These open the live pages in a new tab.
    liveLinks: [
      {
        label: "Football — GameDay",
        href: "https://websites.mygameday.app/assoc_page.cgi?c=0-6191-0-645511-0&a=COMPS",
      },
      {
        label: "Netball — PlayHQ",
        href: "https://www.playhq.com/afl/org/picola-and-district-football-netball-league/ffc532a8",
      },
      { label: "League site", href: "https://www.pdfnl.com/" },
    ],
    // TODO: paste the exact 2026 Seniors Fixture / Results / Ladder URLs from
    // GameDay here, then set mode: "embed" to activate the live iframes.
    embed: {
      fixtures: "",
      results: "",
      ladder: "",
      height: 820,
    },
    placeholder: true, // sample data below until embed URLs are confirmed
    fixtures: [
      { round: "R14", date: "Sat 21 Jun", opponent: "Katandra", venue: "Home", grade: "Seniors" },
      { round: "R15", date: "Sat 28 Jun", opponent: "Tungamah", venue: "Away", grade: "Seniors" },
      { round: "R16", date: "Sat 5 Jul", opponent: "Shepparton East", venue: "Home", grade: "Seniors" },
    ],
    results: [
      { round: "R13", opponent: "Rennie", scoreFor: "11.9 (75)", scoreAgainst: "8.7 (55)", outcome: "W", grade: "Seniors" },
      { round: "R12", opponent: "Berrigan", scoreFor: "9.6 (60)", scoreAgainst: "13.10 (88)", outcome: "L", grade: "Seniors" },
    ],
    ladder: [
      { team: "Katandra", played: 13, won: 12, lost: 1, drawn: 0, pct: 168.4, points: 48 },
      { team: "Tungamah", played: 13, won: 10, lost: 3, drawn: 0, pct: 142.1, points: 40 },
      { team: "Dookie United", played: 13, won: 8, lost: 5, drawn: 0, pct: 121.7, points: 32, isClub: true },
      { team: "Shepparton East", played: 13, won: 6, lost: 7, drawn: 0, pct: 96.3, points: 24 },
      { team: "Rennie", played: 13, won: 3, lost: 10, drawn: 0, pct: 71.2, points: 12 },
    ],
  },

  about: {
    heading: "About the Dooks",
    body: [
      "The Dookie United Football & Netball Club has a proud history built on a strong local community of friendly country people, together with the students and staff of Dookie College.",
      "Football in the town traces back to 1887. In 1977, the Dookie Agricultural College merged with the Dookie Football Club to become Dookie United. Since then the club has worked together as a community to welcome new people into the Dookie family.",
      "Today the club fields senior and reserves football, a full junior pathway from Auskick to Under 17, and netball from Net Set Go through to seniors — all competing in the Picola & District Football Netball League.",
    ],
    values: [
      { title: "Community first", text: "A place where families come together and lifelong friendships are formed." },
      { title: "Every age, every ability", text: "Genuine pathways from Auskick and Net Set Go through to seniors." },
      { title: "Run by volunteers", text: "The backbone of the club — and always room for more hands." },
      { title: "Inclusive & welcoming", text: "A positive environment where everyone can contribute and belong." },
    ],
    history: [
      { year: "1887", text: "Football first played in Dookie." },
      { year: "1977", text: "Dookie College and Dookie FC merge to form Dookie United." },
      { year: "2006", text: "Dookie United joins the Picola & District league." }, // TODO: confirm exact year/details with club
      { year: "Today", text: "Football and netball across all grades at the Rec Reserve." },
    ],
    facts: [
      { label: "Nickname", value: "The Dooks" },
      { label: "Home ground", value: "Dookie Recreation Reserve" },
      { label: "League", value: "Picola & District FNL" },
      { label: "Colours", value: "Black, White, Teal & Silver" },
    ],
  },

  register: {
    steps: [
      "Choose football or netball and the right age group.",
      "Complete the online registration via the club's sign-up link.",
      "Pay your fees online to finalise your spot for the season.",
      "Come down to training at the Rec Reserve and meet the team.",
    ],
    feesNote:
      "Season fees vary by age group and grade. Confirm current fees with the club — financial assistance options like the Get Active Kids Voucher may be available.", // TODO: add real 2026 fee amounts
    faqs: [
      {
        q: "When does the season start?",
        a: "The home-and-away season runs across winter. Pre-season training starts earlier in the year — check the events page and our socials for dates.",
      },
      {
        q: "I'm new to the area — can I just come down?",
        a: "Absolutely. New players and families are always welcome. Get in touch or come to training and we'll make sure you're looked after.",
      },
      {
        q: "How can I volunteer?",
        a: "From game-day roles to committee positions, there's a spot for everyone. Email the club and we'll find the right fit.",
      },
    ],
  },

  join: {
    heading: "Get involved",
    blurb: "Players, volunteers and supporters all make the Dooks who we are. Here’s how to be part of it.",
    options: [
      { label: "Football registration", href: "/register" },
      { label: "Netball registration", href: "/register" },
      { label: "Become a volunteer", href: "/register" },
    ],
  },

  social: {
    heading: "Follow the Dooks",
    note: "The fastest way to keep up with match-day, results and club news is on our socials.",
  },

  blocks: {
    announcementBar: true,
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

  // Demo: "learn" is switched on so the enabled state is visible; the rest show
  // the upgrade / free-trial state. Per-club entitlement will come from the DB.
  enabledModules: ["learn"],
  platform: {
    salesEmail: "carson@clicksportsmedia.com",
    trialDays: 14,
    // Set this to your deployed Volunteer Manager URL to open/embed it here.
    volunteerAppUrl: "https://volunteer-manager-e8ti.vercel.app/",
  },

  footer: {
    acknowledgement:
      "Dookie United Football & Netball Club acknowledges the Traditional Owners of Country throughout Australia and recognises the continuing connection to lands, waters and communities. We pay our respect to Aboriginal and Torres Strait Islander cultures and to Elders past and present.",
    legal: [
      { label: "Privacy Policy", href: "/documents" },
      { label: "Terms & Conditions", href: "/documents" },
      { label: "Contact", href: "/contact" },
    ],
  },
};
