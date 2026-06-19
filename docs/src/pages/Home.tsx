import { HomeLayout } from "../components/home/HomeLayouts";

/**
 * The home page composition depends on the active design variant. The original
 * eight variants share the classic block stack; the six structural variants
 * (broadsheet, matchday, appshell, bento, sponsorforward, portal) each have
 * their own layout. See components/home/HomeLayouts.tsx.
 */
export function Home() {
  return <HomeLayout />;
}
