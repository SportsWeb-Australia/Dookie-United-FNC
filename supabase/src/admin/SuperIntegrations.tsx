import { useEffect, useState } from "react";
import { checkProviders, type ProviderStatus } from "../lib/comms";

interface Provider {
  key: keyof ProviderStatus;
  name: string;
  blurb: string;
  secrets: { name: string; note: string }[];
}

const PROVIDERS: Provider[] = [
  {
    key: "email",
    name: "Email — Zoho ZeptoMail",
    blurb: "Transactional email for club announcements and notifications.",
    secrets: [
      { name: "ZEPTOMAIL_TOKEN", note: "Send Mail token from ZeptoMail (Mail Agents → SMTP/API)." },
      { name: "ZEPTOMAIL_FROM", note: "A verified sending address on your domain, e.g. club@yourdomain.com.au." },
      { name: "ZEPTOMAIL_FROM_NAME", note: "Display name shown to recipients, e.g. SportsWeb." },
    ],
  },
  {
    key: "sms",
    name: "SMS — Twilio",
    blurb: "Text messages to members. Billed per message by Twilio.",
    secrets: [
      { name: "TWILIO_ACCOUNT_SID", note: "From your Twilio console dashboard." },
      { name: "TWILIO_AUTH_TOKEN", note: "From your Twilio console dashboard." },
      { name: "TWILIO_FROM", note: "Your Twilio sender number in +61 format." },
    ],
  },
  {
    key: "push",
    name: "Push — WebPushr",
    blurb: "Browser/app push notifications to everyone who installed the club app.",
    secrets: [
      { name: "WEBPUSHR_KEY", note: "REST API key from WebPushr." },
      { name: "WEBPUSHR_TOKEN", note: "Auth token from WebPushr." },
    ],
  },
];

export function SuperIntegrations() {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [reachable, setReachable] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const s = await checkProviders();
    setReachable(s !== null);
    setStatus(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="sw-admin-page">
      <header className="sw-admin-head">
        <div>
          <h1>Integrations</h1>
          <p>Connect the messaging providers once, for the whole platform. Clubs just write and send.</p>
        </div>
        <button className="sw-btn sw-btn--ghost" onClick={refresh}>
          Re-check
        </button>
      </header>

      {!loading && !reachable && (
        <div className="sw-comms-result err">
          Couldn't reach the dispatch-message function. Deploy it first (see the steps below), then re-check.
        </div>
      )}

      <div className="sw-super-providers">
        {PROVIDERS.map((p) => {
          const connected = status?.[p.key] ?? false;
          return (
            <div key={p.key} className="sw-super-provider">
              <div className="sw-super-provider-head">
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.blurb}</p>
                </div>
                <span className={`sw-pill ${connected ? "ok" : "err"}`}>
                  {loading ? "Checking…" : connected ? "Connected" : "Not connected"}
                </span>
              </div>
              <table className="sw-admin-table sw-super-secrets">
                <tbody>
                  {p.secrets.map((s) => (
                    <tr key={s.name}>
                      <td>
                        <code>{s.name}</code>
                      </td>
                      <td>{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      <section className="sw-super-howto">
        <h3>How to connect (one-time, from your computer)</h3>
        <p>
          Provider secrets are never stored in the database. They live in Supabase as Edge Function secrets, which only
          you (the operator) can set. From the project folder:
        </p>
        <pre className="sw-code">
{`# 1. Deploy the dispatcher (once)
supabase functions deploy dispatch-message

# 2. Set the providers you want (examples)
supabase secrets set ZEPTOMAIL_TOKEN=... ZEPTOMAIL_FROM=club@yourdomain.com.au ZEPTOMAIL_FROM_NAME="SportsWeb"
supabase secrets set TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_FROM=+61...
supabase secrets set WEBPUSHR_KEY=... WEBPUSHR_TOKEN=...

# 3. Come back here and press "Re-check"`}
        </pre>
        <p className="sw-comms-note">
          A provider with no secrets set is simply skipped, so you can turn them on one at a time. Any channel that isn't
          connected is greyed out for clubs automatically.
        </p>
      </section>
    </div>
  );
}
