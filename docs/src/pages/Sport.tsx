import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SmartLink } from "../components/SmartLink";
import { MediaPlaceholder } from "../components/blocks/MediaPlaceholder";
import { JoinCTA } from "../components/blocks/JoinCTA";
import { useSeo } from "../lib/seo";

export function Sport({ sport }: { sport: string }) {
  const { club } = useClub();
  const group = club.teams.find((g) => g.sport.toLowerCase() === sport.toLowerCase());
  const others = club.teams.filter((g) => g.sport.toLowerCase() !== sport.toLowerCase());

  useSeo({
    title: `${sport} | ${club.identity.name}`,
    description: `${sport} programs at ${club.identity.name} — ${group?.teams.map((t) => t.name).join(", ")}.`,
  });

  return (
    <>
      <PageHero
        eyebrow={club.identity.league}
        title={sport}
        intro={`Everything ${sport.toLowerCase()} at ${club.identity.shortName} — find the right program and get involved.`}
      />

      <section className="sw-section">
        <div className="sw-container">
          <MediaPlaceholder label={`${sport} action photo`} className="sw-media-band" />

          <div className="sw-tiles" style={{ marginTop: "2rem" }}>
            {group?.teams.map((team) => (
              <SmartLink key={team.name} href={team.href ?? "/teams"} className="sw-tile">
                {team.ages && <span className="sw-tile-ages">{team.ages}</span>}
                <h4>{team.name}</h4>
                <p>{team.blurb}</p>
                {team.grades && <span className="sw-tile-meta">{team.grades.join(" · ")}</span>}
              </SmartLink>
            ))}
          </div>

          {others.length > 0 && (
            <p className="sw-prose" style={{ marginTop: "2.5rem" }}>
              Looking for something else?{" "}
              {others.map((g, i) => (
                <span key={g.sport}>
                  <SmartLink href={`/${g.sport.toLowerCase()}`} className="sw-inline-link">
                    {g.sport}
                  </SmartLink>
                  {i < others.length - 1 ? ", " : "."}
                </span>
              ))}
            </p>
          )}
        </div>
      </section>

      <JoinCTA />
    </>
  );
}
