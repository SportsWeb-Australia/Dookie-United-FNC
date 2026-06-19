import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SmartLink } from "../components/SmartLink";
import { MediaPlaceholder } from "../components/blocks/MediaPlaceholder";
import { TeamsBlock } from "../components/blocks/TeamsBlock";
import { JoinCTA } from "../components/blocks/JoinCTA";

export function Teams() {
  const { club } = useClub();
  return (
    <>
      <PageHero pageKey="teams"
        eyebrow="Football & Netball"
        title="Teams & Programs"
        intro="From Auskick and Net Set Go through to seniors — there's a place at the Dooks for every age and ability."
      />

      <section className="sw-section">
        <div className="sw-container">
          <MediaPlaceholder label="Club teams photo" className="sw-media-band" />
          <div className="sw-pathway-links" style={{ marginTop: "1.5rem" }}>
            {club.teams.map((g) => (
              <SmartLink key={g.sport} href={`/${g.sport.toLowerCase()}`} className="sw-btn sw-btn--ghost">
                {g.sport} overview →
              </SmartLink>
            ))}
          </div>
          <div className="sw-prose" style={{ margin: "2rem 0" }}>
            <p>
              {club.identity.shortName} fields {club.identity.sports.join(" and ").toLowerCase()} teams
              across the season. Whether you're returning for another year, brand new to the club, or
              just getting started in sport, our coaches and volunteers will help you find the right
              team and settle in.
            </p>
          </div>
          <TeamsBlock bare />
        </div>
      </section>

      <JoinCTA />
    </>
  );
}
