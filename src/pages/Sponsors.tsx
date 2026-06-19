import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SponsorStrip } from "../components/blocks/SponsorStrip";

export function Sponsors() {
  const { club } = useClub();
  return (
    <>
      <PageHero pageKey="sponsors"
        eyebrow="Partners"
        title="Our Sponsors"
        intro="Local business backing local sport. Our partners make everything at the club possible."
      />
      <section className="sw-section">
        <div className="sw-container">
          <SponsorStrip bare />
          <div
            style={{
              marginTop: "3rem",
              padding: "2rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              background: "var(--surface)",
            }}
          >
            <h3 style={{ fontSize: "var(--fs-h3)" }}>Become a sponsor</h3>
            <p className="sw-lead" style={{ marginTop: "0.5rem" }}>
              Partner with {club.identity.shortName} and reach a passionate local community across
              the season. Get in touch to discuss a package that suits your business.
            </p>
            <a href={`mailto:${club.contact.email}`} className="sw-btn" style={{ marginTop: "1.25rem" }}>
              Enquire about sponsorship
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
