import { supabase, resolveClubSlug } from "./supabase";
import { slugify } from "./slug";
import { club as staticClub } from "../content/club.config";
import type { ClubConfig, DesignVariant, Sponsor, NewsPost, ClubEvent, TeamGroup, Person, BrandColours, Fixture, Result, LadderRow } from "../content/types";

/** SportsWeb One template_key -> this template's design variant. */
const TEMPLATE_VARIANT: Record<string, DesignVariant> = {
  default: "heritage",
  "afl-classic": "arena",
  "club-modern": "broadcast",
  "club-classic-serif": "classic",
  stadium: "stadium",
  editorial: "editorial",
  momentum: "momentum",
  coastal: "coastal",
  // Sport templates (EOFYS batch) — template_key matches the variant key.
  fieldcourt: "fieldcourt",
  masters: "masters",
  pitch: "pitch",
  scorecard: "scorecard",
  hardcourt: "hardcourt",
  fastbreak: "fastbreak",
  leaguefooty: "leaguefooty",
  courtside: "courtside",
  juniors: "juniors",
  rugbyunion: "rugbyunion",
  rugbyleague: "rugbyleague",
  oztag: "oztag",
  touch: "touch",
};

function toISODate(value: string | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}
function toTime(value: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}
/** "Sat 4 Apr, 2:00 PM" for the fixtures table. */
function formatMatchDate(value: string | null): string {
  if (!value) return "TBC";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "TBC";
  const day = d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  return hasTime ? `${day}, ${d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}` : day;
}

/**
 * Returns the club config for this site.
 * Supabase-first; anything not stored in the DB (hero copy, president welcome,
 * match centre, documents, nav) falls back to club.config.ts so the site is
 * always complete. If Supabase isn't reachable or the club isn't found, the
 * full static config is used.
 */
export async function getClubConfig(): Promise<ClubConfig> {
  if (!supabase) return staticClub;
  try {
    const slug = await resolveClubSlug();
    let clubRow: Record<string, any> | null = null;
    const direct = await supabase.from("clubs").select("*").eq("slug", slug).maybeSingle();
    clubRow = direct.data ?? null;

    // RLS fallback. The clubs SELECT policy only exposes status = 'published'
    // rows, so a platform admin previewing an unpublished club by slug reads no
    // row and would fall back to staticClub (Dookie). admin_get_club_by_slug is
    // a platform-admin-gated SECURITY DEFINER RPC that returns the full row. If
    // it isn't deployed yet, this is a safe no-op (errors swallowed).
    if (!clubRow) {
      const { data: rpcRow } = await supabase.rpc("admin_get_club_by_slug", { p_slug: slug });
      clubRow = Array.isArray(rpcRow) ? (rpcRow[0] ?? null) : (rpcRow ?? null);
    }

    if (!clubRow) return staticClub;
    return await buildClubConfig(clubRow);
  } catch {
    return staticClub;
  }
}

/**
 * Load a club's full config by its id. Powers the admin club switcher and the
 * superadmin "open any club in the same layout" act-as flow, where the club is
 * chosen by the operator rather than resolved from the host.
 */
export async function getClubConfigById(clubId: string): Promise<ClubConfig> {
  if (!supabase || !clubId) return staticClub;
  try {
    let clubRow: Record<string, any> | null = null;
    const direct = await supabase.from("clubs").select("*").eq("id", clubId).maybeSingle();
    clubRow = direct.data ?? null;

    // RLS fallback. A platform admin who "opens" a club they don't belong to may
    // not be able to read that club's row directly (the clubs SELECT policy is
    // membership-scoped). Without this, the read returns no row and we'd fall
    // back to staticClub — which is Dookie — so EVERY foreign club would open as
    // Dookie. admin_get_club is a platform-admin-gated SECURITY DEFINER RPC that
    // returns the full row. If the RPC isn't deployed yet, this is a safe no-op
    // (errors are swallowed) and behaviour is unchanged.
    if (!clubRow) {
      const { data: rpcRow } = await supabase.rpc("admin_get_club", { p_club: clubId });
      clubRow = Array.isArray(rpcRow) ? (rpcRow[0] ?? null) : (rpcRow ?? null);
    }

    if (!clubRow) return staticClub;
    return await buildClubConfig(clubRow);
  } catch {
    return staticClub;
  }
}

/** Build a complete ClubConfig from a clubs row (shared by both loaders). */
async function buildClubConfig(clubRow: Record<string, any>): Promise<ClubConfig> {
  if (!supabase) return staticClub;
  const clubId = clubRow.id;

    const [newsRes, eventsRes, sponsorsRes, teamsRes, peopleRes, matchesRes, ladderRes, templateRes] = await Promise.all([
      supabase.from("news").select("*").eq("club_id", clubId).eq("status", "published").order("published_at", { ascending: false }).limit(12),
      supabase.from("events").select("*").eq("club_id", clubId).eq("status", "published").gte("event_date", new Date().toISOString()).order("event_date", { ascending: true }).limit(12),
      supabase.from("sponsors").select("*").eq("club_id", clubId).eq("status", "published").order("display_order", { ascending: true }),
      supabase.from("teams").select("*").eq("club_id", clubId).eq("status", "published").order("display_order", { ascending: true }),
      supabase.from("people").select("*").eq("club_id", clubId).eq("status", "published"),
      supabase.from("matches").select("*").eq("club_id", clubId).order("match_date", { ascending: true }),
      supabase.from("ladder").select("*").eq("club_id", clubId).order("position", { ascending: true }),
      clubRow.selected_template_id
        ? supabase.from("templates").select("template_key").eq("id", clubRow.selected_template_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const cfg: ClubConfig = { ...staticClub };

    // Is this the built-in demo/template club (Dookie)? Only the demo keeps the
    // rich sample identity + content. EVERY other club is a clean slate that
    // shows only its own data — never Dookie's logo, sports, hero copy, etc.
    const isDemoClub = (clubRow.slug ?? "") === staticClub.identity.slug;

    // Identity + colours
    const colours = deriveColours(
      clubRow.primary_colour ?? null,
      clubRow.secondary_colour ?? null,
      clubRow.tertiary_colour ?? null,
      staticClub.identity.colours
    );
    const clubName: string = clubRow.name ?? staticClub.identity.name;
    cfg.identity = {
      ...staticClub.identity,
      name: clubName,
      slug: clubRow.slug ?? staticClub.identity.slug,
      colours,
      logo:
        clubRow.logo_url ??
        (isDemoClub
          ? staticClub.identity.logo
          : placeholderLogo(initialsFrom(clubName), colours.accent, colours.paper)),
      ...(isDemoClub
        ? {}
        : {
            shortName: clubName,
            initials: initialsFrom(clubName),
            nickname: "",
            sports: sportsFromType(clubRow.sport_type),
            location: "",
            ground: "",
            league: "",
            leagueHref: undefined,
            foundedNote: "",
          }),
    };

    // A non-demo club starts empty: strip Dookie's sample identity-led content
    // so nothing of Dookie's leaks in. The club's own DB data fills these below.
    if (!isDemoClub) {
      cfg.hero = { ...staticClub.hero, eyebrow: "", title: clubName, subtitle: "", backgroundImage: undefined };
      cfg.announcement = { ...staticClub.announcement, enabled: false };
      cfg.president = { ...staticClub.president, name: "", body: [], portrait: undefined, signoff: undefined };
      cfg.about = { ...staticClub.about, heading: `About ${clubName}`, body: [], values: [], history: [], facts: [] };
      cfg.join = { ...staticClub.join, blurb: "" };
      cfg.quickLinks = [
        { label: "Fixtures", href: "/fixtures" },
        { label: "Register", href: "/register" },
        { label: "Volunteer", href: "/register" },
      ];
      cfg.news = [];
      cfg.events = [];
      cfg.sponsors = [];
      cfg.teams = [];
      cfg.committee = [];
      cfg.documents = [];
      cfg.matchCentre = { ...staticClub.matchCentre, fixtures: [], results: [], ladder: [] };
    }

    // Contact
    cfg.contact = {
      ...staticClub.contact,
      email: clubRow.contact_email ?? staticClub.contact.email,
      phone: clubRow.phone ?? staticClub.contact.phone,
      instagram: clubRow.instagram_url ?? staticClub.contact.instagram,
      facebook: clubRow.facebook_url ?? staticClub.contact.facebook,
      addressLine: clubRow.address ?? staticClub.contact.addressLine,
    };

    // Design variant from selected template
    const key = (templateRes.data as { template_key?: string } | null)?.template_key;
    if (key && TEMPLATE_VARIANT[key]) cfg.variant = TEMPLATE_VARIANT[key];

    // Trial status (drives the countdown banner). is_trial / trial_ends_at are
    // added by supabase/trial-club.sql; read defensively in case they're absent.
    if (clubRow.is_trial === true) {
      cfg.trial = { active: true, endsAt: clubRow.trial_ends_at ?? null };
    }

    // News
    const news = (newsRes.data ?? []).map((r): NewsPost => {
      const slug = r.slug || slugify(r.title ?? "");
      return {
        id: r.id,
        title: r.title,
        slug,
        date: toISODate(r.published_at),
        category: "News",
        excerpt: r.summary ?? "",
        content: r.content ?? undefined,
        href: `/news/${slug}`,
        author: r.author ?? undefined,
        image: r.image_url ?? undefined,
        video: r.video_url ?? undefined,
      };
    });
    if (news.length) cfg.news = news;

    // Events
    const events = (eventsRes.data ?? []).map(
      (r): ClubEvent => ({
        id: r.id,
        title: r.title,
        slug: r.slug || slugify(r.title ?? ""),
        date: toISODate(r.event_date),
        startsAt: r.event_date ?? undefined,
        time: toTime(r.event_date),
        location: r.location ?? undefined,
        description: r.description ?? undefined,
        featured: r.featured === true,
        tag: r.tag ?? undefined,
        ticketHref: r.tickets_url ?? undefined,
        mapUrl: r.map_url ?? undefined,
        image: r.image_url ?? undefined,
        video: r.video_url ?? undefined,
      })
    );
    if (events.length) cfg.events = events;

    // Sponsors
    const sponsors = (sponsorsRes.data ?? []).map(
      (r): Sponsor => ({
        name: r.name,
        href: r.website_url ?? undefined,
        tier: (r.sponsor_level as Sponsor["tier"]) ?? "silver",
        logo: r.logo_url ?? undefined,
        blurb: r.blurb ?? undefined,
        inCarousel: r.in_carousel !== false,
      })
    );
    if (sponsors.length) cfg.sponsors = sponsors;

    // Optional per-club sponsor layout (add clubs.sponsor_display to use this).
    const display = clubRow.sponsor_display as string | undefined;
    if (display === "tiered" || display === "flat" || display === "featured") {
      cfg.sponsorDisplay = display;
    }

    // Teams — grouped by sport when present, else one group from the club sport.
    const teamRows = teamsRes.data ?? [];
    if (teamRows.length) {
      const groups = new Map<string, TeamGroup>();
      for (const r of teamRows) {
        const sport = (r.sport as string) ?? sentenceCase(clubRow.sport_type) ?? "Teams";
        if (!groups.has(sport)) groups.set(sport, { sport, teams: [] });
        groups.get(sport)!.teams.push({
          name: r.name,
          blurb: r.description ?? [r.grade, r.coach_name && `Coach: ${r.coach_name}`].filter(Boolean).join(" · "),
          ages: r.age_group ?? undefined,
          href: "/teams",
          image: r.image_url ?? undefined,
          video: r.video_url ?? undefined,
        });
      }
      cfg.teams = [...groups.values()];
    }

    // Committee from people whose roles look like committee/official positions
    // (so the page doesn't fill with every volunteer or player).
    const committee = (peopleRes.data ?? [])
      .filter(
        (p) =>
          Array.isArray(p.roles) &&
          p.roles.some((r: string) =>
            COMMITTEE_ROLES.some((k) => (r ?? "").toLowerCase().includes(k))
          )
      )
      .map(
        (p): Person => ({
          name: p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" "),
          role: p.roles[0],
          email: p.email ?? undefined,
        })
      );
    if (committee.length) cfg.committee = committee;

    // Match centre — admin-managed fixtures, results, ladder.
    // When the club has entered any matches or ladder rows, switch the Match
    // Centre to live (manual) data; otherwise the static sample stays.
    const matchRows = matchesRes.data ?? [];
    const ladderRows = ladderRes.data ?? [];
    if (matchRows.length || ladderRows.length) {
      const fixtures = matchRows
        .filter((r) => r.status !== "completed")
        .map(
          (r): Fixture => ({
            round: r.round ?? "",
            date: formatMatchDate(r.match_date),
            iso: r.match_date ?? undefined,
            opponent: r.opponent ?? "",
            opponentLogo: r.opponent_logo ?? undefined,
            venue: r.home_away === "Away" ? "Away" : "Home",
            grade: r.grade ?? "",
          })
        );
      const results = matchRows
        .filter((r) => r.status === "completed")
        .sort((a, b) => new Date(b.match_date ?? 0).getTime() - new Date(a.match_date ?? 0).getTime())
        .map((r): Result => {
          const sf = r.our_score;
          const sa = r.opponent_score;
          const outcome: Result["outcome"] =
            sf == null || sa == null ? "D" : sf > sa ? "W" : sf < sa ? "L" : "D";
          return {
            round: r.round ?? "",
            opponent: r.opponent ?? "",
            opponentLogo: r.opponent_logo ?? undefined,
            scoreFor: sf != null ? String(sf) : "",
            scoreAgainst: sa != null ? String(sa) : "",
            outcome,
            grade: r.grade ?? "",
          };
        });
      const ladder = ladderRows.map(
        (r): LadderRow => ({
          team: r.team ?? "",
          logo: r.logo ?? undefined,
          played: Number(r.played ?? 0),
          won: Number(r.won ?? 0),
          lost: Number(r.lost ?? 0),
          drawn: Number(r.drawn ?? 0),
          pct: Number(r.percentage ?? 0),
          points: Number(r.points ?? 0),
          isClub: r.is_own === true,
        })
      );
      cfg.matchCentre = {
        ...staticClub.matchCentre,
        mode: "manual",
        placeholder: false,
        fixtures,
        results,
        ladder,
      };
    }

    // Module entitlement. Two sources, merged:
    //  - club_modules: the generic per-club add-on table (Learn/Books/etc.)
    //  - modules:      the core table that governs Volunteer Manager and other
    //                  first-party modules (module_name + enabled).
    // Both are read defensively so a missing table never breaks the load.
    const enabledKeys = new Set<string>(cfg.enabledModules ?? []);
    // First-party modules table (Volunteer Manager and other core modules).
    const { data: modRows, error: modErr } = await supabase
      .from("modules")
      .select("module_name,enabled")
      .eq("club_id", clubId);
    if (!modErr && modRows) {
      for (const m of modRows) if (m.enabled) enabledKeys.add(m.module_name as string);
    }
    // Per-club add-on table is authoritative: enabled/trial add a module, locked
    // removes it even if config lists it by default. A missing row = keep default.
    const { data: cmRows, error: cmErr } = await supabase
      .from("club_modules")
      .select("module_key,status")
      .eq("club_id", clubId);
    if (!cmErr && cmRows) {
      for (const m of cmRows) {
        if (m.status === "enabled" || m.status === "trial") enabledKeys.add(m.module_key);
        else if (m.status === "locked") enabledKeys.delete(m.module_key);
      }
    }
    cfg.enabledModules = [...enabledKeys];

    // Inline content overrides (hero copy, images, etc.) edited on the live site.
    const { data: contentRows, error: contentErr } = await supabase
      .from("club_content")
      .select("content_key,value")
      .eq("club_id", clubId);
    if (!contentErr && contentRows && contentRows.length) {
      const map: Record<string, string> = {};
      for (const r of contentRows) if (r.value != null) map[r.content_key] = r.value;
      cfg.content = map;
      // Trial/assigned template: an explicit variant in club_content wins over
      // the one derived from selected_template_id (lets us assign a template
      // without needing a matching row in the templates table).
      if (map["site.variant"]) cfg.variant = map["site.variant"] as DesignVariant;
      // Hero media is rendered from cfg.hero (not via the content reader), so
      // map the saved overrides onto it here.
      if (map["hero.image"]) cfg.hero = { ...cfg.hero, backgroundImage: map["hero.image"] };
      if (map["hero.video"]) cfg.hero = { ...cfg.hero, video: map["hero.video"] };
      if (map["branding.logo"]) cfg.identity = { ...cfg.identity, logo: map["branding.logo"] };
      // Contact-page overrides (edited under Edit website → Contact).
      if (map["contact.email"]) cfg.contact = { ...cfg.contact, email: map["contact.email"] };
      if (map["contact.phone"]) cfg.contact = { ...cfg.contact, phone: map["contact.phone"] };
      if (map["contact.instagram"]) cfg.contact = { ...cfg.contact, instagram: map["contact.instagram"] };
      if (map["contact.facebook"]) cfg.contact = { ...cfg.contact, facebook: map["contact.facebook"] };
      if (map["contact.address"]) cfg.contact = { ...cfg.contact, addressLine: map["contact.address"] };
      // Saved homepage hero copy (text) — neutralised above for new clubs, so
      // re-apply whatever the club has edited. Without this, saved text vanishes
      // on the next load.
      if (map["hero.title"]) cfg.hero = { ...cfg.hero, title: map["hero.title"] };
      if (map["hero.eyebrow"] != null) cfg.hero = { ...cfg.hero, eyebrow: map["hero.eyebrow"] };
      if (map["hero.subtitle"] != null) cfg.hero = { ...cfg.hero, subtitle: map["hero.subtitle"] };
      // President welcome.
      if (map["president.name"] != null) cfg.president = { ...cfg.president, name: map["president.name"] };
      if (map["president.role"] != null) cfg.president = { ...cfg.president, role: map["president.role"] };
      if (map["president.body.0"] != null)
        cfg.president = { ...cfg.president, body: map["president.body.0"] ? [map["president.body.0"]] : [] };
      if (map["president.signoff"] != null) cfg.president = { ...cfg.president, signoff: map["president.signoff"] };
      if (map["president.portrait"]) cfg.president = { ...cfg.president, portrait: map["president.portrait"] };
      // Join section.
      if (map["join.heading"] != null) cfg.join = { ...cfg.join, heading: map["join.heading"] };
      if (map["join.blurb"] != null) cfg.join = { ...cfg.join, blurb: map["join.blurb"] };
      // About body.
      if (map["about.body.0"] != null)
        cfg.about = { ...cfg.about, body: map["about.body.0"] ? [map["about.body.0"]] : [] };
      // Footer acknowledgement.
      if (map["footer.acknowledgement"] != null)
        cfg.footer = { ...cfg.footer, acknowledgement: map["footer.acknowledgement"] };
    }

    return cfg;
}

function sentenceCase(s: string | null): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Up to 4 initials from a club name (e.g. "Chadstone Lacrosse" -> "CL"). */
function initialsFrom(name: string): string {
  const letters = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
  return letters || "CLUB";
}

/** Map the clubs.sport_type enum to display sport labels for the website skin
 *  filter. 'other' (and anything unknown) returns [] so only generic styles
 *  show — never Dookie's Football/Netball. True multi-sport lives in a future
 *  sports array; this is the single-enum best effort. */
function sportsFromType(t: string | null | undefined): string[] {
  switch ((t ?? "").toLowerCase()) {
    case "afl": return ["AFL"];
    case "afl_netball": return ["AFL", "Netball"];
    case "netball": return ["Netball"];
    case "soccer": return ["Soccer"];
    case "cricket": return ["Cricket"];
    case "basketball": return ["Basketball"];
    case "rugby_union": return ["Rugby Union"];
    case "rugby_league": return ["Rugby League"];
    default: return [];
  }
}

/** Neutral placeholder crest for a club with no logo yet: an initials badge in
 *  the club's own colours, as an inline SVG data URI (so it needs no upload and
 *  never shows another club's logo). */
function placeholderLogo(initials: string, bg: string, fg: string): string {
  const text = (initials || "CLUB").slice(0, 4);
  const size = text.length > 2 ? 30 : 42;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>` +
    `<rect width='100' height='100' rx='16' fill='${bg}'/>` +
    `<text x='50' y='54' font-family='Arial,Helvetica,sans-serif' font-size='${size}' ` +
    `font-weight='700' fill='${fg}' text-anchor='middle' dominant-baseline='middle'>${text}</text>` +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

/** Roles (case-insensitive substring) treated as public committee/officials. */
const COMMITTEE_ROLES = [
  "president",
  "vice",
  "secretary",
  "treasurer",
  "committee",
  "board",
  "chair",
  "official",
  "registrar",
  "coordinator",
  "coach",
  "manager",
];

type Rgb = { r: number; g: number; b: number };
function hexToRgb(hex: string): Rgb | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function lum({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function sat({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/**
 * The DB stores two club colours (primary/secondary); this template themes on
 * four tokens (ink/paper/accent/silver). Pick the darkest stored colour as ink
 * (for text + inverted surfaces) and the most saturated mid-tone as the accent.
 * Paper and silver come from sensible defaults. Falls back per-channel if a
 * club's colours can't fill a role (e.g. secondary is white).
 */
function deriveColours(
  primary: string | null,
  secondary: string | null,
  tertiary: string | null,
  fallback: BrandColours
): BrandColours {
  const parsed = [primary, secondary]
    .filter((c): c is string => !!c)
    .map((hex) => ({ hex, rgb: hexToRgb(hex) }))
    .filter((c): c is { hex: string; rgb: Rgb } => c.rgb !== null);

  const tertiaryHex = tertiary && hexToRgb(tertiary) ? tertiary : undefined;

  if (!parsed.length) return { ...fallback, tertiary: tertiaryHex ?? fallback.tertiary };

  const darkest = [...parsed].sort((a, b) => lum(a.rgb) - lum(b.rgb))[0];
  const ink = lum(darkest.rgb) < 0.25 ? darkest.hex : fallback.ink;

  const usable = parsed.filter((c) => lum(c.rgb) > 0.12 && lum(c.rgb) < 0.85);
  const accentPick = (usable.length ? usable : parsed).sort(
    (a, b) => sat(b.rgb) - sat(a.rgb)
  )[0];
  const accent = accentPick ? accentPick.hex : fallback.accent;

  return { ink, paper: fallback.paper, accent, silver: fallback.silver, tertiary: tertiaryHex };
}
