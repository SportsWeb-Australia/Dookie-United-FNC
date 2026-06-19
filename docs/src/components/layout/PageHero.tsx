import { AccentBars } from "./Chevron";
import { useClub } from "../ClubContext";
import type { DesignVariant } from "../../content/types";

interface Props {
  eyebrow: string;
  title: string;
  intro?: string;
  /** When set, the club can override this page's eyebrow/title/intro from the admin. */
  pageKey?: string;
}

/** Each variant family gets an interior page-header treatment that matches its
 *  homepage personality, so inside pages feel on-brand across every variant. */
const HERO_FAMILY: Record<DesignVariant, string> = {
  heritage: "",
  broadcast: "dark",
  arena: "bold",
  classic: "serif",
  stadium: "bold",
  editorial: "serif",
  momentum: "bold",
  coastal: "soft",
  broadsheet: "serif",
  matchday: "dark",
  appshell: "soft",
  bento: "soft",
  sponsorforward: "bold",
  portal: "rule",
  poster: "dark",
  fieldcourt: "dark",
  masters: "serif",
  pitch: "dark",
  scorecard: "serif",
  hardcourt: "dark",
  fastbreak: "bold",
  leaguefooty: "dark",
  courtside: "soft",
  juniors: "soft",
  rugbyunion: "serif",
  rugbyleague: "dark",
  oztag: "bold",
  touch: "soft",
};

export function PageHero({ eyebrow, title, intro, pageKey }: Props) {
  const { club, variant } = useClub();
  const c = club.content ?? {};
  const ev = (pageKey && c[`page.${pageKey}.eyebrow`]) || eyebrow;
  const tv = (pageKey && c[`page.${pageKey}.title`]) || title;
  const iv = (pageKey && c[`page.${pageKey}.intro`]) || intro;
  const family = HERO_FAMILY[variant] ?? "";
  return (
    <section className={`sw-pagehero${family ? ` sw-pagehero--${family}` : ""}`}>
      <div className="sw-hero-motif" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="sw-container">
        <AccentBars />
        <span className="sw-breadcrumb">{ev}</span>
        <h1>{tv}</h1>
        {iv && <p>{iv}</p>}
      </div>
    </section>
  );
}
