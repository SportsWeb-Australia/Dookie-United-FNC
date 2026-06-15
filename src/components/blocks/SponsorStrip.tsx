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
}

export function SponsorStrip({ bare }: Props) {
  const { club } = useClub();

  const body = (
    <>
      {TIERS.map((tier) => {
        const list = club.sponsors.filter((s) => s.tier === tier.id);
        if (list.length === 0) return null;
        return (
          <div className="sw-sponsor-tier" key={tier.id}>
            <div className="sw-tier-label">{tier.label}</div>
            <div className={`sw-sponsor-row ${tier.id}`}>
              {list.map((s) => {
                const inner = s.logo ? (
                  <img src={s.logo} alt={s.name} />
                ) : (
                  <span>{s.name}</span>
                );
                return s.href ? (
                  <SmartLink
                    key={s.name}
                    href={s.href}
                    className={`sw-sponsor ${tier.id}`}
                    ariaLabel={s.name}
                  >
                    {inner}
                  </SmartLink>
                ) : (
                  <div key={s.name} className={`sw-sponsor ${tier.id}`}>
                    {inner}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );

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
