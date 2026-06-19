import type { MatchCentreData } from "../content/types";

/**
 * Match Centre adapter.
 *
 * - "manual": data comes straight from club.config.ts.
 * - "embed":  the component renders provider (GameDay) pages in an iframe;
 *             no fetch is needed, so the config is passed straight through.
 * - "api":    implement `fetchFromApi()` and set matchCentre.mode = "api".
 *
 * Components only ever call `getMatchData()` — they never know which source
 * the data came from. That is the seam that keeps the API optional.
 */

export async function getMatchData(
  config: MatchCentreData
): Promise<MatchCentreData> {
  if (config.mode === "api") {
    try {
      return await fetchFromApi(config);
    } catch {
      // Graceful fallback: if the feed is unavailable, show manual data.
      return { ...config, mode: "manual" };
    }
  }
  // "manual" and "embed" need no async work.
  return config;
}

/**
 * Placeholder for the future live feed.
 * Wire this to the real endpoint, map the response into MatchCentreData,
 * and the existing UI renders it unchanged.
 */
async function fetchFromApi(_config: MatchCentreData): Promise<MatchCentreData> {
  // Example shape once implemented:
  // const res = await fetch(`/api/match-centre?comp=${_config.competitionLabel}`);
  // const data = await res.json();
  // return mapApiResponse(data, config);
  throw new Error("API mode not yet implemented — using manual data.");
}
