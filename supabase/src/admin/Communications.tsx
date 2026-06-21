import { useEffect, useMemo, useState } from "react";
import { useActiveClub } from "./ActiveClub";
import {
  loadPeople,
  rolesOf,
  sendMessage,
  logMessage,
  loadHistory,
  checkProviders,
  type Channel,
  type Recipient,
  type MessageRow,
  type ProviderStatus,
} from "../lib/comms";

const CHANNELS: { key: Channel; label: string; needs: "email" | "mobile" | null; hint: string }[] = [
  { key: "email", label: "Email", needs: "email", hint: "Sent via ClickSend" },
  { key: "sms", label: "SMS", needs: "mobile", hint: "Sent via ClickSend" },
  { key: "push", label: "Push", needs: null, hint: "All app subscribers" },
];

const SMS_LIMIT = 160;

export function Communications() {
  const { clubId } = useActiveClub();

  const [people, setPeople] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<MessageRow[]>([]);
  const [providers, setProviders] = useState<ProviderStatus | null>(null);

  const [channels, setChannels] = useState<Channel[]>(["email"]);
  const [audience, setAudience] = useState<string>("everyone");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!clubId) return;
    setLoading(true);
    Promise.all([loadPeople(clubId), loadHistory(clubId)]).then(([p, h]) => {
      setPeople(p);
      setHistory(h);
      setLoading(false);
    });
    checkProviders().then(setProviders);
  }, [clubId]);

  // Drop any selected channel that turns out not to be connected.
  useEffect(() => {
    if (!providers) return;
    setChannels((cs) => cs.filter((c) => providers[c]));
  }, [providers]);

  const roles = useMemo(() => rolesOf(people), [people]);

  const recipients = useMemo(() => {
    if (audience === "everyone") return people;
    if (audience.startsWith("role:")) {
      const role = audience.slice(5);
      return people.filter((p) => p.roles.includes(role));
    }
    return people;
  }, [people, audience]);

  const withEmail = recipients.filter((r) => r.email).length;
  const withMobile = recipients.filter((r) => r.mobile).length;

  const toggleChannel = (c: Channel) =>
    setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));

  const wantsEmail = channels.includes("email");
  const wantsSms = channels.includes("sms");
  const wantsPush = channels.includes("push");

  // Reachable count for the chosen channels (push is a broadcast, counted separately).
  const reachable = useMemo(() => {
    const ids = new Set<string>();
    for (const r of recipients) {
      if (wantsEmail && r.email) ids.add(r.id);
      if (wantsSms && r.mobile) ids.add(r.id);
    }
    return ids.size;
  }, [recipients, wantsEmail, wantsSms]);

  const audienceLabel = audience === "everyone" ? "Everyone" : `Role: ${audience.slice(5)}`;

  const canSend =
    !!clubId &&
    channels.length > 0 &&
    body.trim().length > 0 &&
    (wantsPush || reachable > 0) &&
    (!wantsEmail || subject.trim().length > 0);

  const doSend = async () => {
    if (!clubId) return;
    setConfirming(false);
    setSending(true);
    setResult(null);
    const payload = {
      clubId,
      channels,
      subject: wantsEmail ? subject.trim() : undefined,
      body: body.trim(),
      recipients: recipients.map((r) => ({ name: r.name, email: r.email, mobile: r.mobile })),
    };
    const res = await sendMessage(payload);
    const parts: string[] = [];
    if (wantsEmail) parts.push(`${res.sent.email} email`);
    if (wantsSms) parts.push(`${res.sent.sms} SMS`);
    if (wantsPush) parts.push(`${res.sent.push} push`);
    const status = res.ok ? "sent" : "failed";
    await logMessage({
      clubId,
      channels,
      subject: wantsEmail ? subject.trim() : undefined,
      body: body.trim(),
      audience: audienceLabel,
      recipientCount: reachable,
      status,
    });
    setHistory(await loadHistory(clubId));
    setSending(false);
    if (res.ok) {
      setResult(`Sent: ${parts.join(" · ") || "nothing"}.`);
      setBody("");
      setSubject("");
    } else {
      setResult(`Couldn't send: ${res.error ?? "the dispatch service returned an error."}`);
    }
  };

  if (!clubId) return <div className="sw-admin-loading">No club.</div>;

  return (
    <div className="sw-admin-page">
      <header className="sw-admin-head">
        <div>
          <h1>Communications</h1>
          <p>Send a message to your members by email, SMS or app push.</p>
        </div>
      </header>

      <div className="sw-comms-grid">
        <div className="sw-comms-compose">
          <div className="sw-admin-field">
            <span>Channels</span>
            <div className="sw-comms-channels">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.key);
                const connected = providers ? providers[c.key] : true;
                return (
                  <button
                    key={c.key}
                    type="button"
                    className={`sw-comms-chan${on ? " on" : ""}`}
                    disabled={!connected}
                    title={connected ? "" : "Not set up yet — ask SportsWeb to connect it"}
                    onClick={() => toggleChannel(c.key)}
                  >
                    <strong>{c.label}</strong>
                    <small>{connected ? c.hint : "Not set up"}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="sw-admin-field">
            <span>Audience</span>
            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="everyone">Everyone ({people.length})</option>
              {roles.map((r) => (
                <option key={r} value={`role:${r}`}>
                  {r} ({people.filter((p) => p.roles.includes(r)).length})
                </option>
              ))}
            </select>
          </label>

          {wantsEmail && (
            <label className="sw-admin-field">
              <span>Subject (email)</span>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Round 12 — bus details" />
            </label>
          )}

          <label className="sw-admin-field">
            <span>Message</span>
            <textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
            {wantsSms && (
              <small className={body.length > SMS_LIMIT ? "sw-warn" : ""}>
                {body.length} characters · {Math.max(1, Math.ceil(body.length / SMS_LIMIT))} SMS segment(s)
              </small>
            )}
          </label>

          {result && <div className={`sw-comms-result${result.startsWith("Sent") ? " ok" : " err"}`}>{result}</div>}

          <div className="sw-comms-actions">
            <button className="sw-btn" disabled={!canSend || sending} onClick={() => setConfirming(true)}>
              {sending ? "Sending…" : "Send message"}
            </button>
          </div>
        </div>

        <aside className="sw-comms-aside">
          <h3>This send</h3>
          {loading ? (
            <p>Loading contacts…</p>
          ) : (
            <ul className="sw-comms-summary">
              <li>
                <span>Audience</span>
                <strong>{audienceLabel}</strong>
              </li>
              <li>
                <span>People</span>
                <strong>{recipients.length}</strong>
              </li>
              {wantsEmail && (
                <li>
                  <span>With email</span>
                  <strong>{withEmail}</strong>
                </li>
              )}
              {wantsSms && (
                <li>
                  <span>With mobile</span>
                  <strong>{withMobile}</strong>
                </li>
              )}
              {wantsPush && (
                <li>
                  <span>Push</span>
                  <strong>all subscribers</strong>
                </li>
              )}
            </ul>
          )}
          <p className="sw-comms-note">
            Email and SMS go to people with that detail on file. Push notifications go to everyone who installed the
            club app and allowed notifications.
          </p>
        </aside>
      </div>

      <section className="sw-comms-history">
        <h3>Recent sends</h3>
        {history.length === 0 ? (
          <p className="sw-muted">Nothing sent yet.</p>
        ) : (
          <table className="sw-admin-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Channels</th>
                <th>Audience</th>
                <th>To</th>
                <th>Message</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.created_at).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td>{(m.channels ?? []).join(", ")}</td>
                  <td>{m.audience ?? "—"}</td>
                  <td>{m.recipient_count}</td>
                  <td className="sw-comms-msgcell">{m.subject ? `${m.subject} — ` : ""}{m.body}</td>
                  <td>
                    <span className={`sw-pill ${m.status === "sent" ? "ok" : "err"}`}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {confirming && (
        <div className="sw-modal-backdrop" onClick={() => setConfirming(false)}>
          <div className="sw-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send this message?</h3>
            <p>
              {channels.join(", ").toUpperCase()} · {audienceLabel} ·{" "}
              {wantsPush ? "all push subscribers" : `${reachable} people`}.
            </p>
            <p className="sw-comms-note">This sends immediately and can't be recalled.</p>
            <div className="sw-comms-actions">
              <button className="sw-btn sw-btn--ghost" onClick={() => setConfirming(false)}>
                Cancel
              </button>
              <button className="sw-btn" onClick={doSend}>
                Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
