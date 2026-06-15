import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { FeaturedNews } from "../components/blocks/FeaturedNews";
import { SmartLink } from "../components/SmartLink";

export function News() {
  const { club } = useClub();
  const { contact } = club;
  return (
    <>
      <PageHero
        eyebrow="Latest"
        title="Club News"
        intro="Match reports, announcements and what's happening around the club."
      />

      <section className="sw-section">
        <div className="sw-container">
          <FeaturedNews bare />

          <div
            style={{
              marginTop: "3rem",
              padding: "2rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "var(--fs-h3)" }}>Never miss an update</h3>
            <p className="sw-lead" style={{ margin: "0.5rem auto 1.25rem", maxWidth: "48ch" }}>
              The fastest way to keep up with match-day, results and club news is on our socials.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              {contact.instagram && (
                <SmartLink href={contact.instagram} className="sw-btn">
                  Follow on Instagram
                </SmartLink>
              )}
              {contact.facebook && (
                <SmartLink href={contact.facebook} className="sw-btn sw-btn--ghost">
                  Like us on Facebook
                </SmartLink>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
