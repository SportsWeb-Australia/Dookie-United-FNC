import { useMemo, useState } from "react";
import { useClub } from "../components/ClubContext";
import { useActiveClub } from "./ActiveClub";
import { usePermissions } from "../lib/permissions";
import { supabase } from "../lib/supabase";
import { getNewsMode, NEWS_MODE_OPTIONS, type NewsMode } from "../lib/newsMode";
import type { DesignVariant } from "../content/types";

const STYLES: { id: DesignVariant; label: string; note: string; sports?: string[] }[] = [
  { id: "heritage", label: "Heritage", note: "Clean, light, classic club feel." },
  { id: "broadcast", label: "Broadcast", note: "Dark and bold, TV-style." },
  { id: "arena", label: "Arena", note: "Sharp, flat, high-impact." },
  { id: "classic", label: "Classic", note: "Elegant serif, centred." },
  { id: "stadium", label: "Stadium", note: "Full-bleed photo hero + scoreboard." },
  { id: "editorial", label: "Editorial", note: "Magazine-style overlap." },
  { id: "momentum", label: "Momentum", note: "Diagonal split, energetic." },
  { id: "coastal", label: "Coastal", note: "Airy, light, relaxed." },
  { id: "broadsheet", label: "Broadsheet", note: "News-led newspaper front page." },
  { id: "matchday", label: "Matchday", note: "Next match + scores up top." },
  { id: "appshell", label: "App shell", note: "Member-app card feed." },
  { id: "bento", label: "Bento", note: "Asymmetric magazine grid." },
  { id: "sponsorforward", label: "Sponsor-forward", note: "Partners front and centre." },
  { id: "portal", label: "Portal", note: "Sidebar nav + dashboard." },
  { id: "poster", label: "Poster", note: "Brutalist — huge type, colour blocks." },
  { id: "fieldcourt", label: "Fieldcourt (AFL/Netball)", note: "Dual-code club — football + netball split.", sports: ["afl", "netball"] },
  { id: "masters", label: "Masters (AFL Masters)", note: "Warm, social, events-first, photo-led.", sports: ["afl"] },
  { id: "pitch", label: "Pitch (Soccer)", note: "Sleek, dark, horizontal fixture rail.", sports: ["soccer"] },
  { id: "scorecard", label: "Scorecard (Cricket)", note: "Scoreboard strip + fixtures | ladder split.", sports: ["cricket"] },
  { id: "hardcourt", label: "Hardcourt (Basketball)", note: "Dark stat bento, broadcast energy.", sports: ["basketball"] },
  { id: "fastbreak", label: "Fastbreak (Lacrosse)", note: "Energetic zig-zag feature rows.", sports: ["lacrosse"] },
  { id: "leaguefooty", label: "Leaguefooty (AFL)", note: "Guernsey hero, grade strip, match + ladder.", sports: ["afl"] },
  { id: "courtside", label: "Courtside (Netball)", note: "Airy, bib-style grade chips incl. Mixed.", sports: ["netball"] },
  { id: "juniors", label: "Juniors (Junior Football)", note: "Friendly, family-focused, parent info panel.", sports: ["afl"] },
  { id: "rugbyunion", label: "Rugby Union", note: "Traditional, centred crest, honours ribbon.", sports: ["rugbyunion"] },
  { id: "rugbyleague", label: "Rugby League", note: "Dark clash banner, form guide, ladder.", sports: ["rugbyleague"] },
  { id: "oztag", label: "Oztag", note: "Social comp — register-a-team, divisions, nights.", sports: ["oztag"] },
  { id: "touch", label: "Touch Footy", note: "Summery social — come-and-try steps + draw.", sports: ["touch"] },
];

// Map a club's free-text sport (e.g. "Football", "AFL") to a canonical family.
// In this AFL/footy platform, "football"/"footy" means Australian Rules.
function sportFamily(s: string): string {
  const k = s.toLowerCase().trim();
  if (/(afl|aussie|australian rules|footy|^football$|aussie rules)/.test(k)) return "afl";
  if (k.includes("netball")) return "netball";
  if (k.includes("soccer")) return "soccer";
  if (k.includes("cricket")) return "cricket";
  if (k.includes("basket")) return "basketball";
  if (k.includes("lacrosse")) return "lacrosse";
  if (k.includes("union")) return "rugbyunion";
  if (k.includes("league")) return "rugbyleague";
  if (k.includes("oztag")) return "oztag";
  if (k.includes("touch")) return "touch";
  return k;
}

export function AdminWebsite() {
  const { club, variant, setVariant } = useClub();
  const { clubId } = useActiveClub();
  const { can } = usePermissions();
  const isPlatform = can("platform.clubs");
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<NewsMode>(getNewsMode(club.content));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [styleSaving, setStyleSaving] = useState(false);
  const [styleSaved, setStyleSaved] = useState(false);

  // Only offer styles relevant to this club's sport(s). Generic styles (no sport
  // tag) always show; the current style always shows so it never disappears.
  const clubFamilies = useMemo(
    () => new Set((club.identity.sports ?? []).map(sportFamily)),
    [club.identity.sports],
  );
  const visibleStyles = useMemo(() => {
    if (isPlatform && showAll) return STYLES;
    return STYLES.filter(
      (s) => !s.sports || s.id === variant || s.sports.some((sp) => clubFamilies.has(sp)),
    );
  }, [clubFamilies, variant, isPlatform, showAll]);

  const chooseMode = async (m: NewsMode) => {
    setMode(m);
    setSaved(false);
    if (!clubId || !supabase) return;
    setSaving(true);
    const { error } = await supabase
      .from("club_content")
      .upsert({ club_id: clubId, content_key: "news.mode", value: m }, { onConflict: "club_id,content_key" });
    setSaving(false);
    if (!error) setSaved(true);
  };

  const chooseStyle = async (v: DesignVariant) => {
    setVariant(v); // apply live immediately
    setStyleSaved(false);
    if (!clubId || !supabase) return;
    setStyleSaving(true);
    const { error } = await supabase
      .from("club_content")
      .upsert({ club_id: clubId, content_key: "site.variant", value: v }, { onConflict: "club_id,content_key" });
    setStyleSaving(false);
    if (!error) setStyleSaved(true);
  };

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Website style</h2>
      </div>
      <p className="sw-admin-note">
        Pick a look for the {club.identity.shortName} website. It applies live across the site and
        saves as your club&apos;s style straight away. Only styles suited to your
        club&apos;s sport{(club.identity.sports ?? []).length === 1 ? "" : "s"} are shown
        {(club.identity.sports ?? []).length > 0 ? ` (${club.identity.sports.join(" & ")})` : ""}.
      </p>
      {isPlatform && (
        <label className="sw-admin-showall">
          <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
          <span>Show all styles (platform admin)</span>
        </label>
      )}
      <div className="sw-admin-styles">
        {visibleStyles.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sw-admin-style"
            data-active={s.id === variant}
            onClick={() => chooseStyle(s.id)}
          >
            <strong>{s.label}</strong>
            <span>{s.note}</span>
          </button>
        ))}
      </div>
      {(styleSaving || styleSaved) && (
        <p className="sw-admin-note" style={{ marginTop: "0.6rem" }}>
          {styleSaving ? "Saving\u2026" : "Saved \u2014 this is now your club's style."}
        </p>
      )}

      <div className="sw-admin-formhead" style={{ marginTop: "2.5rem" }}>
        <h2>News &amp; social</h2>
      </div>
      <p className="sw-admin-note">
        Choose how {club.identity.shortName} handles news and social. This saves for your club.
      </p>
      <div className="sw-admin-newsmode">
        {NEWS_MODE_OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            className="sw-admin-style"
            data-active={o.id === mode}
            onClick={() => chooseMode(o.id)}
          >
            <strong>{o.label}</strong>
            <span>{o.note}</span>
          </button>
        ))}
      </div>
      <p className="sw-admin-note" aria-live="polite">
        {!clubId
          ? "Sign in as a club admin to change this."
          : saving
            ? "Saving…"
            : saved
              ? "Saved. Reload the site to see it."
              : ""}
      </p>
    </div>
  );
}
