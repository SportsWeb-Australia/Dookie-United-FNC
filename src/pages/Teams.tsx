import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { TeamsBlock } from "../components/blocks/TeamsBlock";
import { JoinCTA } from "../components/blocks/JoinCTA";

export function Teams() {
  const { club } = useClub();
  return (
    <>
      <PageHero
        eyebrow="Football & Netball"
        title="Teams & Programs"
        intro="From Auskick and Net Set Go through to seniors — there's a place at the Dooks for every age and ability."
      />

      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-prose" style={{ marginBottom: "2rem" }}>
            <p>
              {club.identity.shortName} fields {club.identity.sports.join(" and ").toLowerCase()} teams
              across the season. Whether you're returning for another year, brand new to the club, or
              just getting started in sport, our coaches and volunteers will help you find the right
              team and settle in.
            </p>
            <p>
              Training happens at {club.identity.ground}. Days and times vary by team and change through
              the season — confirm current training times with the club or your coach.
              {" "}
              <span className="sw-flag">Placeholder: add training times</span>
            </p>
          </div>
          <TeamsBlock bare />
        </div>
      </section>

      <JoinCTA />
    </>
  );
}
