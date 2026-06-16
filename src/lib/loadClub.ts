import { supabase, CLUB_SLUG } from "./supabase";
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
    const { data: clubRow } = await supabase
      .from("clubs")
      .select("*")
      .eq("slug", CLUB_SLUG)
      .maybeSingle();

    if (!clubRow) return staticClub;
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

    // Identity + colours
    cfg.identity = {
      ...staticClub.identity,
      name: clubRow.name ?? staticClub.identity.name,
      slug: clubRow.slug ?? staticClub.identity.slug,
      logo: clubRow.logo_url ?? staticClub.identity.logo,
      colours: deriveColours(
        clubRow.primary_colour ?? null,
        clubRow.secondary_colour ?? null,
        staticClub.identity.colours
      ),
    };

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

    // Module entitlement — which add-ons this club has. Falls back to the
    // static config list if the club_modules table isn't present yet.
    const { data: moduleRows, error: moduleErr } = await supabase
      .from("club_modules")
      .select("module_key,status")
      .eq("club_id", clubId);
    if (!moduleErr && moduleRows) {
      cfg.enabledModules = moduleRows
        .filter((m) => m.status === "enabled" || m.status === "trial")
        .map((m) => m.module_key);
    }

    return cfg;
  } catch {
    // Any failure → safe, complete static config.
    return staticClub;
  }
}

function sentenceCase(s: string | null): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  fallback: BrandColours
): BrandColours {
  const parsed = [primary, secondary]
    .filter((c): c is string => !!c)
    .map((hex) => ({ hex, rgb: hexToRgb(hex) }))
    .filter((c): c is { hex: string; rgb: Rgb } => c.rgb !== null);

  if (!parsed.length) return fallback;

  const darkest = [...parsed].sort((a, b) => lum(a.rgb) - lum(b.rgb))[0];
  const ink = lum(darkest.rgb) < 0.25 ? darkest.hex : fallback.ink;

  const usable = parsed.filter((c) => lum(c.rgb) > 0.12 && lum(c.rgb) < 0.85);
  const accentPick = (usable.length ? usable : parsed).sort(
    (a, b) => sat(b.rgb) - sat(a.rgb)
  )[0];
  const accent = accentPick ? accentPick.hex : fallback.accent;

  return { ink, paper: fallback.paper, accent, silver: fallback.silver };
}
