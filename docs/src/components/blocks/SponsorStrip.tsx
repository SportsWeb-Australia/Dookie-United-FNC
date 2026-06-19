import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";
import type { Sponsor } from "../../content/types";

const TIERS: { id: Sponsor["tier"]; label: string }[] = [
  { id: "platinum", label: "Platinum partners" },
  { id: "gold", label: "Gold sponsors" },
  { id: "silver", label: "Silver supporters" },
];

interface Props {
  bare?: boolean;
  /** Home page: only show sponsors flagged for the logo carousel. */
  onlyCarousel?: boolean;
}

function SponsorPlate({ s, size, withBlurb }: { s: Sponsor; size: string; withBlurb?: boolean }) {
  const inner = s.logo ? <img src={s.logo} alt={s.name} /> : <span>{s.name}</span>;
  const plate = s.href ? (
    <SmartLink href={s.href} className={`sw-sponsor ${size}`} ariaLabel={s.name}>
      {inner}
    </SmartLink>
  ) : (
    <div className={`sw-sponsor ${size}`}>{inner}</div>
  );
  if (withBlurb && s.blurb) {
    return (
      <div className="sw-sponsor-card">
        {plate}
        <p className="sw-sponsor-blurb">{s.blurb}</p>
      </div>
    );
  }
  return plate;
}

export function SponsorStrip({ bare, onlyCarousel }: Props) {
  const { club } = useClub();
  const mode = club.sponsorDisplay ?? "tiered";
  const sponsors = onlyCarousel ? club.sponsors.filter((s) => s.inCarousel !== false) : club.sponsors;
  const withBlurb = !onlyCarousel;

  let body: JSX.Element;

  if (mode === "flat") {
    // One equal logo wall — for clubs that don't rank sponsors.
    body = (
      <div className="sw-sponsor-wall">
        {sponsors.map((s) => (
          <SponsorPlate key={s.name} s={s} size="silver" withBlurb={withBlurb} />
        ))}
      </div>
    );
  } else if (mode === "featured") {
    // Top tier large, everyone else in an equal wall.
    const featured = sponsors.filter((s) => s.tier === "platinum");
    const rest = sponsors.filter((s) => s.tier !== "platinum");
    body = (
      <>
        {featured.length > 0 && (
          <div className="sw-sponsor-row platinum" style={{ marginBottom: rest.length ? "1.5rem" : 0 }}>
            {featured.map((s) => (
              <SponsorPlate key={s.name} s={s} size="platinum" withBlurb={withBlurb} />
            ))}
          </div>
        )}
        {rest.length > 0 && (
          <div className="sw-sponsor-wall">
            {rest.map((s) => (
              <SponsorPlate key={s.name} s={s} size="silver" withBlurb={withBlurb} />
            ))}
          </div>
        )}
      </>
    );
  } else {
    // Tiered (default).
    body = (
      <>
        {TIERS.map((tier) => {
          const list = sponsors.filter((s) => s.tier === tier.id);
          if (list.length === 0) return null;
          return (
            <div className="sw-sponsor-tier" key={tier.id}>
              <div className="sw-tier-label">{tier.label}</div>
              <div className={`sw-sponsor-row ${tier.id}`}>
                {list.map((s) => (
                  <SponsorPlate key={s.name} s={s} size={tier.id} withBlurb={withBlurb} />
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  }

  if (bare) return body;

  return (
    <section className="sw-section">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">Proudly supported by</span>
            <h2>Our sponsors</h2>
          </div>
          <SmartLink href="/sponsors" className="sw-link-arrow">
            Become a sponsor →
          </SmartLink>
        </div>
        {body}
      </div>
    </section>
  );
}
