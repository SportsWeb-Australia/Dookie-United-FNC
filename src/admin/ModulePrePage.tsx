import type { ModuleDef } from "../lib/modules";

/**
 * Pre-page for a module: what it is, what you can do, a quick-start, and a
 * video slot (placeholder for now — clubs/Carson drop real walkthroughs in
 * later). Modules that aren't wired into this dashboard yet show "Coming soon".
 */
export function ModulePrePage({ mod, status }: { mod: ModulePre; status: "open" | "soon" }) {
  return (
    <div className="sw-admin-panel sw-mod">
      <div className="sw-mod-head">
        <span className="sw-mod-badge">{mod.badge}</span>
        <div>
          <h2>{mod.name}</h2>
          <p className="sw-mod-tagline">{mod.tagline}</p>
        </div>
        <span className={`sw-mod-status sw-mod-status--${status}`}>
          {status === "open" ? mod.plan : "Coming soon"}
        </span>
      </div>

      <p className="sw-mod-summary">{mod.summary}</p>

      <div className="sw-mod-video" aria-label="Video walkthrough placeholder">
        <span>▶ Video walkthrough</span>
        <small>Coming soon</small>
      </div>

      <div className="sw-mod-cols">
        <section>
          <h3>What you can do</h3>
          <ul className="sw-mod-list">
            {mod.overview.map((o, i) => (
              <li key={i}>{o}</li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Quick start guide</h3>
          <ol className="sw-mod-steps">
            {mod.quickstart.map((s, i) => (
              <li key={i}>
                <strong>{s.title}</strong>
                <span>{s.body}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="sw-mod-foot">
        {status === "open" && mod.appUrl ? (
          <a className="sw-btn" href={mod.appUrl} target="_blank" rel="noreferrer">
            Open {mod.name} →
          </a>
        ) : (
          <button className="sw-btn" disabled>
            Launching soon
          </button>
        )}
      </div>
    </div>
  );
}

export type ModulePre = Pick<
  ModuleDef,
  "key" | "name" | "badge" | "tagline" | "summary" | "overview" | "quickstart" | "plan" | "appUrl"
>;

/** Modules that have their own dashboard entry but aren't built into the club app yet. */
export const COMING_SOON_MODULES: ModulePre[] = [
  {
    key: "team_lineups",
    name: "Team Line-Ups",
    badge: "TL",
    tagline: "Pick your teams on a branded oval and share them everywhere.",
    summary:
      "Select each team on an oval-field graphic, add sponsors and headshots, then export a clean image for socials or embed it on your site.",
    overview: [
      "Drag players onto positions on a club-branded oval.",
      "Add sponsor banners, headshots and competition logos.",
      "Export to PNG / Instagram, or embed straight on your website.",
      "Save by round and clone last week's team to start fast.",
    ],
    quickstart: [
      { title: "Pick a team & round", body: "Choose the grade and round you're selecting for." },
      { title: "Place your players", body: "Drop players onto their positions and add any sponsors." },
      { title: "Share it", body: "Export the image or grab the embed link for your site." },
    ],
    plan: "SportsWeb module",
  },
  { key: "sponsor_deals", name: "Sponsor Deals", badge: "SD", tagline: "Sell sponsor deals and member offers in one place.", summary: "Package sponsor and member-only offers, publish them, and track redemptions.", overview: ["Create deals with expiry, limits and sponsor branding.", "Track views and redemptions per sponsor."], quickstart: [{ title: "Add a deal", body: "Create your first sponsor or member offer." }], plan: "Add module to plan" },
  { key: "pos", name: "POS", badge: "PS", tagline: "Point of sale for the canteen, bar and merch.", summary: "Take payments at the canteen, bar and merch table with a simple touch POS.", overview: ["Fast tap-to-pay across multiple registers.", "Daily takings roll straight into Club Finance."], quickstart: [{ title: "Set up a register", body: "Add your products and prices to get selling." }], plan: "Add module to plan" },
  { key: "commerce", name: "Superstore Commerce", badge: "SC", tagline: "A full online store with built-in inventory control.", summary: "Run a proper club online store with stock levels, variants and order management.", overview: ["Products, variants and live inventory control.", "Orders, shipping and pickup in one dashboard."], quickstart: [{ title: "Add a product", body: "List your first item and set stock on hand." }], plan: "Add module to plan" },
  { key: "social", name: "Club Social", badge: "CS", tagline: "Schedule and publish across all your socials.", summary: "Plan, schedule and publish posts across the club's social channels from one place.", overview: ["Schedule to Facebook, Instagram and more.", "A shared content calendar for the committee."], quickstart: [{ title: "Connect a channel", body: "Link your club's social accounts to begin." }], plan: "Add module to plan" },
  { key: "loyalty", name: "Club Loyalty Points", badge: "LP", tagline: "Reward members and volunteers with points and perks.", summary: "Run a loyalty program that rewards turning up, volunteering and spending.", overview: ["Earn and redeem points for perks and prizes.", "Recognise your most active members."], quickstart: [{ title: "Set up rewards", body: "Decide what earns points and what they unlock." }], plan: "Add module to plan" },
  { key: "surveys", name: "Club Surveys", badge: "SV", tagline: "Run polls and surveys and see the results.", summary: "Gather feedback from members, parents and volunteers with quick surveys.", overview: ["Build surveys and polls in minutes.", "See results and trends at a glance."], quickstart: [{ title: "Create a survey", body: "Add your questions and share the link." }], plan: "Add module to plan" },
  { key: "engagement", name: "Club Engagement", badge: "CE", tagline: "Track and lift member engagement across the club.", summary: "See who's engaged, who's drifting, and act before they leave.", overview: ["Engagement scoring across members and volunteers.", "Nudges and campaigns to re-engage."], quickstart: [{ title: "Connect your data", body: "Switch on the signals you want to track." }], plan: "Add module to plan" },
  { key: "profiles", name: "Player Profiles", badge: "PP", tagline: "Rich player profiles, stats and milestones.", summary: "A profile for every player with stats, history and milestones.", overview: ["Career stats, photos and milestones.", "Feeds line-ups, trading cards and match reports."], quickstart: [{ title: "Import players", body: "Pull players in from your registrations." }], plan: "Add module to plan" },
  { key: "trading_cards", name: "Trading Cards", badge: "TC", tagline: "Digital collectible cards minted from match data.", summary: "Turn players and milestones into collectible digital cards your members can swap.", overview: ["Cards auto-minted from match and milestone data.", "Album, packs and swaps for members."], quickstart: [{ title: "Pick a set", body: "Choose the team and season to generate cards." }], plan: "Add module to plan" },
  { key: "call_centre", name: "1300 Call Centre", badge: "CC", tagline: "A shared 1300 number and simple call handling.", summary: "Give the club a professional 1300 number with menus and call routing.", overview: ["One number that routes to the right person.", "Voicemail-to-email and call records."], quickstart: [{ title: "Claim a number", body: "We'll provision and set up your 1300 line." }], plan: "Add module to plan" },
  { key: "wifi", name: "WIFI Infrastructure & Hosting", badge: "WF", tagline: "Club Wi-Fi, networking and hosting, managed.", summary: "Managed Wi-Fi, networking and hosting for your clubrooms and site.", overview: ["Reliable guest and committee Wi-Fi.", "Hosting and networking handled for you."], quickstart: [{ title: "Book a site check", body: "We'll scope your clubrooms and connection." }], plan: "Add module to plan" },
  { key: "desk", name: "Club Desk", badge: "CD", tagline: "A help desk for member and parent queries.", summary: "Turn member and parent emails into tidy, trackable support tickets.", overview: ["Shared inbox with ticketing and assignment.", "Canned replies and a self-help knowledge base."], quickstart: [{ title: "Connect an inbox", body: "Point your club email at the help desk." }], plan: "Add module to plan" },
  { key: "club_iq", name: "Club IQ", badge: "IQ", tagline: "An AI chat bot that answers club questions 24/7.", summary: "A club-trained AI assistant that answers common questions on your site and socials.", overview: ["Answers fixtures, fees and how-to questions.", "Hands off to a human when it needs to."], quickstart: [{ title: "Train it", body: "Point it at your site and FAQs to learn." }], plan: "Add module to plan" },
  { key: "match_reports", name: "Match Reports", badge: "MR", tagline: "Write and publish match reports in minutes.", summary: "Capture results and write match reports that publish to your site and socials.", overview: ["Templates and stats to write reports fast.", "Publishes to your website and socials."], quickstart: [{ title: "Add a result", body: "Enter the score and let the draft begin." }], plan: "Add module to plan" },
  { key: "live_score", name: "Live Score", badge: "LS", tagline: "Live scores and updates fans can follow.", summary: "Post live scores and updates fans can follow from anywhere.", overview: ["Live score entry from the boundary.", "A public live page fans can follow."], quickstart: [{ title: "Start a match", body: "Open the game and start scoring live." }], plan: "Add module to plan" },
  { key: "governance", name: "Governance", badge: "GV", tagline: "WWCC, RSA, coach & first-aid expiries — tracked.", summary: "Keep every accreditation and check in one register, with reminders well before anything lapses.", overview: ["Track WWCC, RSA, coaching, first-aid and more, per person.", "Automatic reminders before each expiry — no nasty surprises.", "A clear compliance register for committee and audits."], quickstart: [{ title: "Add a check type", body: "Set up WWCC, RSA, first aid and any others you need." }], plan: "Add module to plan" },
  { key: "shifts", name: "People One", badge: "PO", tagline: "Roster paid staff and work shifts.", summary: "Powered by Zoho Shifts — build work-shift rosters for canteen, bar and game-day staff, with swaps and reminders handled.", overview: ["Publish work-shift rosters for paid staff.", "Shift swaps, availability and reminders built in.", "Hours flow through for payroll and Club Finance."], quickstart: [{ title: "Add your team", body: "Add staff and the roles they cover." }], plan: "Add module to plan" },
];
