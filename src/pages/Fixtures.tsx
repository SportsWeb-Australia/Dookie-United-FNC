import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { MatchCentre } from "../components/blocks/MatchCentre";

export function Fixtures() {
  const { club } = useClub();
  return (
    <>
      <PageHero
        eyebrow="Match Centre"
        title="Fixtures & Results"
        intro="Upcoming games, recent results and where the Dooks sit on the ladder."
      />

      <section className="sw-section">
        <div className="sw-container">
          <MatchCentre bare />

          <div
            style={{
              marginTop: "2.5rem",
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "1fr",
            }}
          >
            <div className="sw-prose" style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
              <p style={{ fontSize: "var(--fs-h3)", fontFamily: "var(--font-display)", textTransform: "uppercase" }}>
                Following the Dooks
              </p>
              <p>
                Home games are played at {club.identity.ground}. Football fixtures, results and ladders
                are published on GameDay; netball runs through PlayHQ. Use the live source links above
                for the latest, and follow our socials for match-day updates and final scores.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
