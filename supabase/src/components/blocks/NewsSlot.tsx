import type { ReactNode } from "react";
import { useNewsMode } from "../../lib/newsMode";
import { SocialFeed } from "./SocialFeed";

/**
 * Wraps a layout's native news section. Renders it as-is in "news" mode,
 * swaps in the social feed in "social" mode, or shows both in "both" mode.
 */
export function NewsSlot({ children }: { children: ReactNode }) {
  const mode = useNewsMode();
  if (mode === "social") return <SocialFeed />;
  return (
    <>
      {children}
      {mode === "both" ? <SocialFeed /> : null}
    </>
  );
}
