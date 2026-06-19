import { useClub } from "../components/ClubContext";

/** How a club presents news vs social. Default is "news" (source of truth). */
export type NewsMode = "news" | "social" | "both";

export function getNewsMode(content?: Record<string, string>): NewsMode {
  const v = content?.["news.mode"];
  return v === "social" || v === "both" ? v : "news";
}

export function useNewsMode(): NewsMode {
  const { club } = useClub();
  return getNewsMode(club.content);
}

export const NEWS_MODE_OPTIONS: { id: NewsMode; label: string; note: string }[] = [
  { id: "news", label: "News (one-click to socials)", note: "Your website is the source of truth; share posts to socials in a click." },
  { id: "both", label: "News + social feed", note: "Show articles and your live social feed together." },
  { id: "social", label: "Social feed only", note: "Your Facebook/Instagram feed replaces on-site news." },
];
