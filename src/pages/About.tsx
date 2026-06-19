import { useClub } from "../components/ClubContext";
import { useEdit } from "../lib/edit";
import { EditableText, EditableImage } from "../components/edit/Editable";
import { PageHero } from "../components/layout/PageHero";
import { AccentBars } from "../components/layout/Chevron";
import { MediaPlaceholder } from "../components/blocks/MediaPlaceholder";
import { PresidentWelcome } from "../components/blocks/PresidentWelcome";
import { Committee } from "../components/blocks/Committee";

export function About() {
  const { club } = useClub();
  const { canEdit, editing, value } = useEdit();
  const { about, identity } = club;
  const aboutPhoto = value("about.photo", "");

  return (
    <>
      <PageHero pageKey="about"
        eyebrow="The Club"
        title={about.heading}
        intro={`Football & netball in ${identity.location}, competing in the ${identity.league}.`}
      />

      <PresidentWelcome />

      <section className="sw-section">
        <div className="sw-container">
          {aboutPhoto || (canEdit && editing) ? (
            <EditableImage k="about.photo" value={aboutPhoto} alt="Club photo" className="sw-media-band" />
          ) : (
            <MediaPlaceholder label="Club / clubrooms photo" className="sw-media-band" />
          )}
        </div>
      </section>

      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-prose">
            {about.body.map((p, i) => (
              <EditableText key={i} as="p" k={`about.body.${i}`} value={p} />
            ))}
          </div>

          {about.facts && (
            <div className="sw-facts">
              {about.facts.map((f) => (
                <div className="sw-fact" key={f.label}>
                  <div className="sw-fact-label">{f.label}</div>
                  <div className="sw-fact-value">{f.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {about.values && (
        <section className="sw-section sw-section--alt">
          <div className="sw-container">
            <AccentBars />
            <span className="sw-eyebrow">What we stand for</span>
            <h2 style={{ fontSize: "var(--fs-h2)", margin: "0.6rem 0 2rem" }}>Our values</h2>
            <div className="sw-values">
              {about.values.map((v, i) => (
                <div className="sw-value" key={v.title}>
                  <EditableText as="h4" k={`about.values.${i}.title`} value={v.title} />
                  <EditableText as="p" k={`about.values.${i}.text`} value={v.text} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {about.history && (
        <section className="sw-section">
          <div className="sw-container">
            <AccentBars />
            <span className="sw-eyebrow">Our story</span>
            <h2 style={{ fontSize: "var(--fs-h2)", margin: "0.6rem 0 1rem" }}>Club history</h2>
            <div className="sw-timeline">
              {about.history.map((m, i) => (
                <div className="sw-tl-row" key={i}>
                  <EditableText as="span" className="sw-tl-year" k={`about.history.${i}.year`} value={String(m.year)} />
                  <EditableText as="p" k={`about.history.${i}.text`} value={m.text} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <Committee />
    </>
  );
}
