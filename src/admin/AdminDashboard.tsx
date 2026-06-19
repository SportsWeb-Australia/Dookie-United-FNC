import { useEffect, useState } from "react";
import { useClub } from "../components/ClubContext";
import { useAuth } from "../lib/auth";
import { usePermissions } from "../lib/permissions";
import { supabase } from "../lib/supabase";

/**
 * Admin landing dashboard. Shows a friendly snapshot of the club plus quick
 * shortcuts to the jobs people do most. `go` switches the admin view (same
 * setActive used by the sidebar), so a card behaves like a nav shortcut.
 */
export function AdminDashboard({ go }: { go: (key: string) => void }) {
  const { club } = useClub();
  const { membership } = useAuth();
  const { can } = usePermissions();
  const clubId = membership?.clubId ?? "";

  const [counts, setCounts] = useState<Record<string, number | null>>({
    news: null,
    events: null,
    teams: null,
    sponsors: null,
    ladder: null,
  });

  useEffect(() => {
    if (!clubId || !supabase) return;
    let alive = true;
    const tables: Record<string, string> = {
      news: "news",
      events: "events",
      teams: "teams",
      sponsors: "sponsors",
      ladder: "ladder",
    };
    (async () => {
      const entries = await Promise.all(
        Object.entries(tables).map(async ([key, table]) => {
          try {
            const { count } = await supabase!
              .from(table)
              .select("id", { count: "exact", head: true })
              .eq("club_id", clubId);
            return [key, count ?? 0] as const;
          } catch {
            return [key, null] as const;
          }
        })
      );
      if (alive) setCounts(Object.fromEntries(entries));
    })();
    return () => {
      alive = false;
    };
  }, [clubId]);

  const clubName = club.identity.shortName || "your club";

  const stats: { key: string; label: string }[] = [
    { key: "news", label: "News posts" },
    { key: "events", label: "Events" },
    { key: "teams", label: "Teams" },
    { key: "sponsors", label: "Sponsors" },
    { key: "ladder", label: "Ladder rows" },
  ];

  const quick: { title: string; sub: string; key: string; show: boolean }[] = [
    { title: "Write a news post", sub: "Share an update with your members", key: "news", show: can("club.content") },
    { title: "Add an event", sub: "Put a date on the calendar", key: "events", show: can("club.content") },
    { title: "Update the ladder", sub: "Add or edit a ladder row", key: "ladder", show: can("club.content") },
    { title: "Edit your website", sub: "Hero, logo, text, images and video", key: "__site", show: can("club.website") },
    { title: "Send a message", sub: "Email or SMS your members", key: "__comms", show: can("club.comms") },
  ];

  return (
    <div className="sw-admin-panel sw-dash">
      <div className="sw-dash-head">
        <h2>Welcome back</h2>
        <p className="sw-admin-note">Here's {clubName} at a glance. Jump straight into whatever you need.</p>
      </div>

      <div className="sw-dash-stats">
        {stats.map((s) => (
          <button key={s.key} className="sw-dash-stat" onClick={() => go(s.key)}>
            <span className="sw-dash-stat-num">{counts[s.key] === null ? "—" : counts[s.key]}</span>
            <span className="sw-dash-stat-label">{s.label}</span>
          </button>
        ))}
      </div>

      <h3 className="sw-dash-subhead">Quick actions</h3>
      <div className="sw-dash-grid">
        {quick.filter((q) => q.show).map((q) => (
          <button key={q.key} className="sw-dash-card" onClick={() => go(q.key)}>
            <span className="sw-dash-card-title">{q.title}</span>
            <span className="sw-dash-card-sub">{q.sub}</span>
            <span className="sw-dash-card-go" aria-hidden="true">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
