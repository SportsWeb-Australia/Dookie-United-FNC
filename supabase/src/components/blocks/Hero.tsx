import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";
import { EditableText } from "../edit/Editable";
import type { ClubConfig, DesignVariant } from "../../content/types";

const MEDIA_VARIANTS: DesignVariant[] = ["stadium", "editorial", "momentum", "coastal"];

const DEFAULT_HERO_IMG: Partial<Record<DesignVariant, string>> = {
  stadium: "/hero-dark.jpg",
  momentum: "/hero-dark.jpg",
  editorial: "/hero-light.jpg",
  coastal: "/hero-light.jpg",
};

export function Hero() {
  const { club, variant } = useClub();
  if (MEDIA_VARIANTS.includes(variant)) return <HeroMedia club={club} variant={variant} />;
  return <HeroStandard club={club} />;
}

/** Original motif-led hero (heritage / broadcast / arena / classic). */
function HeroStandard({ club }: { club: ClubConfig }) {
  const { hero } = club;
  return (
    <section className="sw-hero">
      {hero.backgroundImage && (
        <img className="sw-hero-bgimg" src={hero.backgroundImage} alt="" aria-hidden="true" />
      )}
      <div className="sw-hero-motif" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="sw-container">
        <div className="sw-hero-inner">
          <AccentBars />
          <HeroCopy hero={hero} />
          <HeroCtas club={club} />
        </div>
      </div>
    </section>
  );
}

/** Image/video-led hero (stadium / editorial / momentum / coastal). */
function HeroMedia({ club, variant }: { club: ClubConfig; variant: DesignVariant }) {
  const { hero, identity } = club;
  const img = hero.backgroundImage ?? DEFAULT_HERO_IMG[variant] ?? "/hero-dark.jpg";

  return (
    <section className="sw-hero sw-hero--media">
      <div className="sw-hero-media" aria-hidden="true">
        {hero.video ? (
          <video className="sw-hero-video" autoPlay muted loop playsInline poster={hero.poster ?? img}>
            <source src={hero.video} />
          </video>
        ) : (
          <img src={img} alt="" />
        )}
        <div className="sw-hero-scrim" />
      </div>

      <div className="sw-container">
        <div className="sw-hero-inner">
          <AccentBars />
          <HeroCopy hero={hero} />
          <HeroCtas club={club} />
        </div>
      </div>

      {variant === "stadium" && (
        <div className="sw-hero-stats">
          <div className="sw-container">
            <div>
              <span>Competition</span>
              <strong>{identity.league}</strong>
            </div>
            <div>
              <span>Home ground</span>
              <strong>{identity.ground}</strong>
            </div>
            <div>
              <span>Based in</span>
              <strong>{identity.location}</strong>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function HeroCopy({ hero }: { hero: ClubConfig["hero"] }) {
  return (
    <>
      <EditableText as="span" className="sw-eyebrow" k="hero.eyebrow" value={hero.eyebrow} />
      <EditableText as="h1" k="hero.title" value={hero.title} />
      <EditableText as="p" className="sw-hero-sub" k="hero.subtitle" value={hero.subtitle} />
    </>
  );
}

function HeroCtas({ club }: { club: ClubConfig }) {
  const { hero } = club;
  return (
    <div className="sw-hero-ctas">
      <SmartLink href={hero.primaryCta.href} className="sw-btn">
        {hero.primaryCta.label}
      </SmartLink>
      {hero.secondaryCta && (
        <SmartLink href={hero.secondaryCta.href} className="sw-btn sw-btn--ghost">
          {hero.secondaryCta.label}
        </SmartLink>
      )}
    </div>
  );
}
