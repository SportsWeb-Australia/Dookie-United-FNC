import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";

interface Props {
  /** Show a shortened welcome (first two paragraphs) with a link to About. */
  condensed?: boolean;
}

export function PresidentWelcome({ condensed }: Props) {
  const { club } = useClub();
  const { president, identity } = club;
  const paras = condensed ? president.body.slice(0, 2) : president.body;

  return (
    <section className="sw-section sw-section--alt">
      <div className="sw-container">
        <AccentBars />
        <span className="sw-eyebrow">Welcome to {identity.shortName}</span>
        <div className="sw-welcome-grid" style={{ marginTop: "1.5rem" }}>
          <aside className="sw-welcome-aside">
            <div className="sw-welcome-portrait">
              {president.portrait ? (
                <img src={president.portrait} alt={president.name} />
              ) : (
                identity.initials
              )}
            </div>
            <div className="sw-welcome-name">{president.name}</div>
            <div className="sw-welcome-role">{president.role}</div>
          </aside>
          <div className="sw-welcome-body">
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {condensed ? (
              <SmartLink href="/about" className="sw-link-arrow">
                More about the club →
              </SmartLink>
            ) : (
              president.signoff && <p className="sw-signoff">{president.signoff}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
