import { useEffect, useMemo, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import { loadHistory, type MessageRow } from "../lib/comms";
import { listClubMembers, type ClubMember } from "../lib/people";

function pretty(a: string | null): string {
  if (!a) return "—";
  const s = a.replace(/_/g, " ").trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="sw-mem-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function CommsReport({ clubId }: { clubId: string | null }) {
  const [history, setHistory] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    loadHistory(clubId).then((h) => {
      setHistory(h);
      setLoading(false);
    });
  }, [clubId]);

  const stats = useMemo(() => {
    const sent = history.filter((m) => m.status === "sent");
    const failed = history.filter((m) => m.status === "failed");
    const reached = sent.reduce((n, m) => n + (m.recipient_count ?? 0), 0);
    const chan = (c: string) => history.filter((m) => (m.channels ?? []).includes(c)).length;
    return {
      total: history.length,
      sent: sent.length,
      failed: failed.length,
      reached,
      email: chan("email"),
      sms: chan("sms"),
      push: chan("push"),
    };
  }, [history]);

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Communication reports</h2>
      </div>
      <p className="sw-admin-note">
        A summary of every message sent from your club — what went out, to how many people, and how it landed.
      </p>

      {loading ? (
        <p className="sw-mem-muted">Loading…</p>
      ) : history.length === 0 ? (
        <p className="sw-sends-empty">Nothing sent yet. Once you send messages, your reporting appears here.</p>
      ) : (
        <>
          <div className="sw-mem-stats">
            <Tile value={stats.total} label="Messages sent" />
            <Tile value={stats.reached} label="Recipients reached" />
            <Tile value={stats.sent} label="Delivered" />
            <Tile value={stats.failed} label="Failed" />
          </div>

          <div className="sw-rep-block">
            <h3 className="sw-rep-h">By channel</h3>
            <div className="sw-rep-bars">
              <ReportBar label="Email" n={stats.email} total={stats.total} />
              <ReportBar label="SMS" n={stats.sms} total={stats.total} />
              <ReportBar label="Push" n={stats.push} total={stats.total} />
            </div>
          </div>

          <div className="sw-sends" style={{ marginTop: "1.5rem" }}>
            <div className="sw-sends-head">
              <h3>Send history</h3>
              <span className="sw-sends-count">{history.length} message{history.length === 1 ? "" : "s"}</span>
            </div>
            <div className="sw-sends-card">
              <div className="sw-sends-scroll">
                <table className="sw-sends-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Channels</th>
                      <th>Audience</th>
                      <th className="sw-sends-num">To</th>
                      <th>Message</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((m) => (
                      <tr key={m.id}>
                        <td className="sw-sends-when">
                          {new Date(m.created_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                        </td>
                        <td>
                          <span className="sw-sends-chips">
                            {(m.channels ?? []).map((c) => (
                              <span key={c} className="sw-sends-chip">{c}</span>
                            ))}
                          </span>
                        </td>
                        <td>{pretty(m.audience)}</td>
                        <td className="sw-sends-num">{m.recipient_count}</td>
                        <td className="sw-sends-msg">
                          {m.subject ? <strong>{m.subject}</strong> : null}
                          {m.subject ? " — " : ""}
                          {m.body}
                        </td>
                        <td>
                          <span
                            className={`sw-sends-status sw-sends-status--${
                              m.status === "sent" ? "ok" : m.status === "failed" ? "err" : "muted"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ReportBar({ label, n, total }: { label: string; n: number; total: number }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <div className="sw-rep-bar">
      <div className="sw-rep-bar-top">
        <span>{label}</span>
        <strong>{n}</strong>
      </div>
      <div className="sw-rep-bar-track">
        <div className="sw-rep-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const ROLE_SEGMENTS = ["player", "guardian", "coach", "volunteer", "committee"];

function MembersReport({ clubId }: { clubId: string | null }) {
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    listClubMembers(clubId).then((rows) => {
      setMembers(rows);
      setLoading(false);
    });
  }, [clubId]);

  const stats = useMemo(() => {
    const roleCount = (r: string) => members.filter((m) => m.roles.includes(r)).length;
    const byTeam: Record<string, number> = {};
    members.forEach((m) => m.teams.forEach((t) => (byTeam[t] = (byTeam[t] ?? 0) + 1)));
    const pay = (s: string) => members.filter((m) => (m.paymentStatus ?? "").toLowerCase() === s).length;
    return {
      total: members.length,
      minors: members.filter((m) => m.isMinor).length,
      active: members.filter((m) => (m.status ?? "active").toLowerCase() === "active").length,
      inactive: members.filter((m) => (m.status ?? "").toLowerCase() === "inactive").length,
      roles: ROLE_SEGMENTS.map((r) => ({ r, n: roleCount(r) })),
      byTeam: Object.entries(byTeam).sort((a, b) => b[1] - a[1]),
      paid: pay("paid"),
      unpaid: pay("unpaid") + pay("overdue"),
    };
  }, [members]);

  return (
    <div className="sw-admin-panel">
      <div className="sw-admin-formhead">
        <h2>Member reports</h2>
      </div>
      <p className="sw-admin-note">
        A snapshot of your membership — totals, the roles people hold, team numbers and membership payment status.
      </p>

      {loading ? (
        <p className="sw-mem-muted">Loading…</p>
      ) : members.length === 0 ? (
        <p className="sw-sends-empty">No members yet. Add members to see reporting here.</p>
      ) : (
        <>
          <div className="sw-mem-stats">
            <Tile value={stats.total} label="Total members" />
            <Tile value={stats.active} label="Active" />
            <Tile value={stats.minors} label="Under 18" />
            <Tile value={stats.inactive} label="Inactive" />
          </div>

          <div className="sw-rep-block">
            <h3 className="sw-rep-h">By role</h3>
            <div className="sw-rep-bars">
              {stats.roles.map(({ r, n }) => (
                <ReportBar key={r} label={pretty(r)} n={n} total={stats.total} />
              ))}
            </div>
          </div>

          {stats.byTeam.length > 0 && (
            <div className="sw-rep-block">
              <h3 className="sw-rep-h">By team</h3>
              <div className="sw-rep-bars">
                {stats.byTeam.map(([name, n]) => (
                  <ReportBar key={name} label={name} n={n} total={stats.total} />
                ))}
              </div>
            </div>
          )}

          <div className="sw-rep-block">
            <h3 className="sw-rep-h">Membership payments</h3>
            <div className="sw-mem-stats">
              <Tile value={stats.paid} label="Paid" />
              <Tile value={stats.unpaid} label="Unpaid / overdue" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function Reports({ section }: { section: "communications" | "members" }) {
  const { clubId } = useActiveClub();
  if (section === "communications") return <CommsReport clubId={clubId} />;
  return <MembersReport clubId={clubId} />;
}
