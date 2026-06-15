import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { Documents as DocumentsBlock } from "../components/blocks/Documents";

export function Documents() {
  const { club } = useClub();
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Documents & Policies"
        intro="Club policies, welfare information and the forms you need, all in one place."
      />

      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-prose" style={{ marginBottom: "2rem" }}>
            <p>
              These documents cover how the club operates and how we keep everyone safe and supported.
              If you can't find what you're after, or need a document in another format,{" "}
              <a href={`mailto:${club.contact.email}`} style={{ color: "var(--accent-on-bg)" }}>
                get in touch
              </a>
              .
            </p>
          </div>
          <DocumentsBlock bare />
        </div>
      </section>
    </>
  );
}
