import { Link } from "react-router-dom";
import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";

export function Footer() {
  const { club } = useClub();
  const { identity, contact, nav, footer } = club;
  const year = new Date().getFullYear();

  return (
    <footer className="sw-footer">
      <div className="sw-container">
        <div className="sw-footer-top">
          <div>
            <div className="sw-footer-brand">
              <img src={identity.logo} alt={`${identity.name} logo`} />
              <div>
                <strong style={{ fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
                  {identity.shortName}
                </strong>
                <div className="sw-brand-sub">{identity.league}</div>
              </div>
            </div>
            <p style={{ marginTop: "1rem", color: "color-mix(in srgb, var(--text-invert) 70%, transparent)" }}>
              {identity.ground}
            </p>
          </div>

          <div className="sw-footer-col">
            <h4>Explore</h4>
            {nav.slice(0, 6).map((item) => (
              <Link key={item.label} to={item.href}>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="sw-footer-col">
            <h4>Get involved</h4>
            <Link to="/register">Register to play</Link>
            <Link to="/register">Volunteer</Link>
            <Link to="/sponsors">Become a sponsor</Link>
            <Link to="/contact">Contact us</Link>
          </div>

          <div className="sw-footer-col">
            <h4>Stay in touch</h4>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.phone && <a href={`tel:${contact.phone}`}>{contact.phone}</a>}
            <div className="sw-footer-socials" style={{ marginTop: "1rem" }}>
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  IG
                </a>
              )}
              {contact.facebook && (
                <a href={contact.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  FB
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="sw-ack">{footer.acknowledgement}</p>

        <div className="sw-footer-bottom">
          <span>
            © {year} {identity.name}. All rights reserved.
          </span>
          <div className="sw-footer-legal">
            {footer.legal.map((l) => (
              <SmartLink key={l.label} href={l.href}>
                {l.label}
              </SmartLink>
            ))}
          </div>
          <span className="sw-builtby">
            Built on{" "}
            <a href="https://sportsweb.com.au" target="_blank" rel="noopener noreferrer">
              SportsWeb One
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
