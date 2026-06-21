import { useState } from "react";
import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";

export function AnnouncementBar() {
  const { club } = useClub();
  const { announcement } = club;
  const [dismissed, setDismissed] = useState(false);

  if (!announcement.enabled || dismissed) return null;

  return (
    <div className="sw-announce">
      <div className="sw-container">
        <p>{announcement.text}</p>
        {announcement.link && (
          <SmartLink href={announcement.link.href}>{announcement.link.label} →</SmartLink>
        )}
        <button
          aria-label="Dismiss announcement"
          onClick={() => setDismissed(true)}
          style={{ marginLeft: "auto", color: "#fff", fontFamily: "var(--font-mono)" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
