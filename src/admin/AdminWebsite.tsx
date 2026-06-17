import { useClub } from "../components/ClubContext";
import type { DesignVariant } from "../content/types";

const STYLES: { id: DesignVariant; label: string; note: string }[] = [
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
  { id: "fieldcourt", label: "Fieldcourt (AFL/Netball)", note: "Dual-code club — football + netball split." },
  { id: "masters", label: "Masters (AFL Masters)", note: "Warm, social, events-first, photo-led." },
  { id: "pitch", label: "Pitch (Soccer)", note: "Sleek, dark, horizontal fixture rail." },
  { id: "scorecard", label: "Scorecard (Cricket)", note: "Scoreboard strip + fixtures | ladder split." },
  { id: "hardcourt", label: "Hardcourt (Basketball)", note: "Dark stat bento, broadcast energy." },
  { id: "fastbreak", label: "Fastbreak (Lacrosse)", note: "Energetic zig-zag feature rows." },
  { id: "leaguefooty", label: "Leaguefooty (AFL)", note: "Guernsey hero, grade strip, match + ladder." },
  { id: "courtside", label: "Courtside (Netball)", note: "Airy, bib-style grade chips incl. Mixed." },
  { id: "juniors", label: "Juniors (Junior Football)", note: "Friendly, family-focused, parent info panel." },
  { id: "rugbyunion", label: "Rugby Union", note: "Traditional, centred crest, honours ribbon." },
  { id: "rugbyleague", label: "Rugby League", note: "Dark clash banner, form guide, ladder." },
  { id: "oztag", label: "Oztag", note: "Social comp — register-a-team, divisions, nights." },
  { id: "touch", label: "Touch Footy", note: "Summery social — come-and-try steps + draw." },
];

export function AdminWebsite() {
  const { club, variant, setVariant } = useClub();

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Website style</h2>
      </div>
      <p className="sw-admin-note">
        Pick a look for the {club.identity.shortName} website. The preview applies live across the
        site — saving it as your permanent style is coming soon.
      </p>
      <div className="sw-admin-styles">
        {STYLES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="sw-admin-style"
            data-active={s.id === variant}
            onClick={() => setVariant(s.id)}
          >
            <strong>{s.label}</strong>
            <span>{s.note}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
