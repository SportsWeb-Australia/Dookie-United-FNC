import { useParams } from "react-router-dom";
import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SmartLink } from "../components/SmartLink";
import { MediaPlaceholder } from "../components/blocks/MediaPlaceholder";
import { JoinCTA } from "../components/blocks/JoinCTA";
import { NotFound } from "./NotFound";
import { useSeo } from "../lib/seo";

export function Program() {
  const { slug } = useParams();
  const { club } = useClub();

  let sport = "";
  const program = (() => {
    for (const g of club.teams) {
      const t = g.teams.find((x) => x.slug === slug);
      if (t) {
        sport = g.sport;
        return t;
      }
    }
    return null;
  })();

  useSeo(
    program
      ? {
          title: `${program.name} | ${club.identity.name}`,
          description: program.blurb,
        }
      : null
  );

  if (!program) return <NotFound />;

  const group = club.teams.find((g) => g.sport === sport);
  const siblings = group?.teams.filter((t) => t.slug !== slug) ?? [];
  const otherSports = club.teams.filter((g) => g.sport !== sport);

  return (
    <>
      <PageHero eyebrow={`${sport} · ${club.identity.shortName}`} title={program.name} intro={program.blurb} />

      <section className="sw-section">
        <div className="sw-container sw-program">
          <div className="sw-program-main">
            <MediaPlaceholder label={`${program.name} photo`} className="sw-media-band" />

            {program.grades && (
              <div className="sw-program-block">
                <h3>Grades &amp; teams</h3>
                <div className="sw-chips">
                  {program.grades.map((gr) => (
                    <span className="sw-chip" key={gr}>
                      {gr}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="sw-program-block">
              <h3>Details</h3>
              <ul className="sw-deflist">
                {program.ages && (
                  <li>
                    <span>Ages</span>
                    <span>{program.ages}</span>
                  </li>
                )}
                <li>
                  <span>Training</span>
                  <span className="sw-flag">Placeholder — add training days & times</span>
                </li>
                <li>
                  <span>Venue</span>
                  <span>{club.identity.ground}</span>
                </li>
              </ul>
            </div>

            <SmartLink href="/register" className="sw-btn">
              Register for {program.name}
            </SmartLink>
          </div>

          <aside className="sw-program-side">
            {siblings.length > 0 && (
              <div className="sw-side-card">
                <h4>More {sport.toLowerCase()} programs</h4>
                <ul>
                  {siblings.map((s) => (
                    <li key={s.name}>
                      <SmartLink href={s.href ?? "/teams"}>{s.name}</SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {otherSports.map((g) => (
              <div className="sw-side-card" key={g.sport}>
                <h4>{g.sport}</h4>
                <ul>
                  {g.teams.map((t) => (
                    <li key={t.name}>
                      <SmartLink href={t.href ?? "/teams"}>{t.name}</SmartLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <JoinCTA />
    </>
  );
}
