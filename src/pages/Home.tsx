import { useClub } from "../components/ClubContext";
import { Hero } from "../components/blocks/Hero";
import { QuickLinks } from "../components/blocks/QuickLinks";
import { FeaturedNews } from "../components/blocks/FeaturedNews";
import { MatchCentre } from "../components/blocks/MatchCentre";
import { SponsorStrip } from "../components/blocks/SponsorStrip";
import { JoinCTA } from "../components/blocks/JoinCTA";

/**
 * Rationalised home page — the essentials only, so the page stays focused.
 * Everything else lives on its own page: the President's welcome, history and
 * committee on About; events on Events; documents on Documents; teams on Teams.
 * Each block still honours its config toggle so a club can switch sections off.
 */
export function Home() {
  const { club } = useClub();
  const b = club.blocks;

  return (
    <>
      <Hero />
      {b.quickLinks && <QuickLinks />}
      {b.featuredNews && <FeaturedNews limit={3} />}
      {b.matchCentre && <MatchCentre />}
      {b.joinCta && <JoinCTA />}
      {b.sponsors && <SponsorStrip />}
    </>
  );
}
