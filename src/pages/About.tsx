import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { AccentBars } from "../components/layout/Chevron";
import { PresidentWelcome } from "../components/blocks/PresidentWelcome";
import { Committee } from "../components/blocks/Committee";

export function About() {
  const { club } = useClub();
  const { about, identity } = club;

  return (
    <>
      <PageHero
        eyebrow="The Club"
        title={about.heading}
        intro={`Football & netball in ${identity.location}, competing in the ${identity.league}.`}
      />

      <PresidentWelcome />

      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-prose">
            {about.body.map((p, i) => (
              <p key={i}>{p}</p>
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
              {about.values.map((v) => (
                <div className="sw-value" key={v.title}>
                  <h4>{v.title}</h4>
                  <p>{v.text}</p>
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
                  <span className="sw-tl-year">{m.year}</span>
                  <p>{m.text}</p>
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
