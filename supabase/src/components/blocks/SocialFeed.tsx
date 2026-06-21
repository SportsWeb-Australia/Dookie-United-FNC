import { useClub } from "../ClubContext";
import { AccentBars } from "../layout/Chevron";

export function SocialFeed() {
  const { club } = useClub();
  const { social, contact, identity } = club;
  const fb = contact.facebook;
  const fbEmbed = fb
    ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(
        fb,
      )}&tabs=timeline&width=500&height=640&small_header=true&adapt_container_width=true&hide_cover=false&show_facebook=true`
    : null;

  return (
    <section className="sw-section">
      <div className="sw-container">
        <AccentBars />
        <span className="sw-eyebrow">{social.heading}</span>
        <div className="sw-social-grid" style={{ marginTop: "1.5rem" }}>
          <div>
            <h2 style={{ fontSize: "var(--fs-h2)" }}>Match-day, results &amp; club life</h2>
            <p className="sw-lead" style={{ marginTop: "0.75rem" }}>
              {social.note}
            </p>
            {!fbEmbed && (
              <p className="sw-social-embed-note">
                Add the {identity.shortName} Facebook page link in Settings to show the live feed here.
              </p>
            )}
            <div className="sw-social-cards" style={{ marginTop: "1.25rem" }}>
              {contact.instagram && (
                <a className="sw-social-card" href={contact.instagram} target="_blank" rel="noopener noreferrer">
                  <span className="sw-social-plat">Instagram</span>
                  <span className="sw-social-handle">Follow {identity.shortName}</span>
                  <span className="sw-link-arrow">Open →</span>
                </a>
              )}
              {contact.facebook && (
                <a className="sw-social-card" href={contact.facebook} target="_blank" rel="noopener noreferrer">
                  <span className="sw-social-plat">Facebook</span>
                  <span className="sw-social-handle">Like {identity.shortName}</span>
                  <span className="sw-link-arrow">Open →</span>
                </a>
              )}
            </div>
          </div>
          <div className="sw-social-embed">
            {fbEmbed ? (
              <iframe
                title={`${identity.shortName} Facebook feed`}
                src={fbEmbed}
                className="sw-fb-embed"
                loading="lazy"
                scrolling="no"
                allow="encrypted-media; clipboard-write"
              />
            ) : (
              <div className="sw-social-embed-empty">The live social feed appears here once connected.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
