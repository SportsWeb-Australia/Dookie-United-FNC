import { PageHero } from "../components/layout/PageHero";
import { UpcomingEvents } from "../components/blocks/UpcomingEvents";

export function Events() {
  return (
    <>
      <PageHero
        eyebrow="What's On"
        title="Events Calendar"
        intro="Social nights, fundraisers and the dates that matter across the season."
      />

      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-prose" style={{ marginBottom: "2rem" }}>
            <p>
              Club events are a big part of life at the Dooks — they bring players, families and
              supporters together and help fund everything we do. Everyone's welcome, so come down and
              get involved.
            </p>
          </div>
          <UpcomingEvents bare />
        </div>
      </section>
    </>
  );
}
