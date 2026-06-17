import { AccentBars } from "./Chevron";
import { useClub } from "../ClubContext";
import type { DesignVariant } from "../../content/types";

interface Props {
  eyebrow: string;
  title: string;
  intro?: string;
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
};

export function PageHero({ eyebrow, title, intro }: Props) {
  const { variant } = useClub();
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
        <span className="sw-breadcrumb">{eyebrow}</span>
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
    </section>
  );
}
