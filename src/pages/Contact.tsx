import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";

export function Contact() {
  const { club } = useClub();
  const { contact, identity, committee } = club;
  const publicContacts = committee.filter((p) => p.email && !p.placeholder);

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact the Club"
        intro="Questions about playing, volunteering, sponsorship or anything else — we'd love to hear from you."
      />
      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-welcome-grid">
            <aside className="sw-welcome-aside">
              <div className="sw-welcome-role">Club details</div>
              <p style={{ marginTop: "0.75rem" }}>
                <strong>{identity.name}</strong>
              </p>
              {contact.addressLine && <p style={{ color: "var(--text-soft)" }}>{contact.addressLine}</p>}
              <p style={{ marginTop: "1rem" }}>
                <a href={`mailto:${contact.email}`} className="sw-link-arrow">
                  {contact.email} &rarr;
                </a>
              </p>
              {contact.phone && (
                <p>
                  <a href={`tel:${contact.phone}`} className="sw-link-arrow">
                    {contact.phone} &rarr;
                  </a>
                </p>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                {contact.instagram && (
                  <a href={contact.instagram} target="_blank" rel="noopener noreferrer" className="sw-link-arrow">
                    Instagram
                  </a>
                )}
                {contact.facebook && (
                  <a href={contact.facebook} target="_blank" rel="noopener noreferrer" className="sw-link-arrow">
                    Facebook
                  </a>
                )}
              </div>
            </aside>
            <div className="sw-prose">
              <p>
                The quickest way to reach us is by email — drop us a line and the right person at the
                club will get back to you.
              </p>
              <p>
                Looking to <strong>play</strong>? Head to the{" "}
                <a href="/register" style={{ color: "var(--accent-on-bg)" }}>
                  registration page
                </a>{" "}
                for football and netball sign-up links. Keen to <strong>volunteer</strong> or{" "}
                <strong>sponsor</strong> the club? Email us and we'll find a way to get you involved.
              </p>

              {publicContacts.length > 0 && (
                <div style={{ marginTop: "1.5rem" }}>
                  <p style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: "1.2rem" }}>
                    Key contacts
                  </p>
                  {publicContacts.map((p) => (
                    <p key={p.name} style={{ marginBottom: "0.25rem" }}>
                      <strong>{p.role}:</strong> {p.name} —{" "}
                      <a href={`mailto:${p.email}`} style={{ color: "var(--accent-on-bg)" }}>
                        {p.email}
                      </a>
                    </p>
                  ))}
                </div>
              )}

              <p className="sw-social-embed-note">
                Contact form slot: a SportsWeb One enquiry form can be embedded here so messages land
                straight in the club inbox. For now, the email link above is live.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
