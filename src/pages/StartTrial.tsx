import { useState } from "react";
import { supabase } from "../lib/supabase";

/** Club types offered at signup -> the real sport_type enum + assigned template variant. */
const CLUB_TYPES: { label: string; sport: string; variant: string }[] = [
  { label: "AFL / Australian Football", sport: "afl", variant: "leaguefooty" },
  { label: "Football & Netball club", sport: "afl", variant: "fieldcourt" },
  { label: "Netball", sport: "netball", variant: "courtside" },
  { label: "Soccer", sport: "soccer", variant: "pitch" },
  { label: "Cricket", sport: "cricket", variant: "scorecard" },
  { label: "Basketball", sport: "basketball", variant: "hardcourt" },
  { label: "Rugby Union", sport: "rugby_union", variant: "rugbyunion" },
  { label: "Rugby League", sport: "rugby_league", variant: "rugbyleague" },
  { label: "Junior Football", sport: "afl", variant: "juniors" },
  { label: "Masters / Over-35s Football", sport: "afl", variant: "masters" },
  { label: "Oztag", sport: "other", variant: "oztag" },
  { label: "Touch Football", sport: "other", variant: "touch" },
  { label: "Lacrosse", sport: "other", variant: "fastbreak" },
];

type Result = { slug: string; variant: string };

export function StartTrial() {
  const [name, setName] = useState("");
  const [typeIdx, setTypeIdx] = useState(0);
  const [email, setEmail] = useState("");
  const [primary, setPrimary] = useState("#1F2A44");
  const [secondary, setSecondary] = useState("#C8102E");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  async function sendLogin(toEmail: string) {
    if (!supabase) return;
    setLinkBusy(true);
    setLinkMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: toEmail,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLinkMsg(error ? error.message : "Check your inbox for a login link to start editing.");
    } catch {
      setLinkMsg("Could not send the link just now. Please try again.");
    } finally {
      setLinkBusy(false);
    }
  }

  async function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter your club name.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError("Please enter a valid email so we can send your trial details.");
      return;
    }
    if (!supabase) {
      setError("Signup is temporarily unavailable. Please try again shortly.");
      return;
    }
    const t = CLUB_TYPES[typeIdx];
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("create_trial_club", {
        p_name: name.trim(),
        p_sport: t.sport,
        p_variant: t.variant,
        p_email: email.trim(),
        p_primary: primary,
        p_secondary: secondary,
      });
      if (error) throw error;
      const r = (data ?? {}) as { slug?: string; variant?: string };
      if (!r.slug) throw new Error("Could not create your trial. Please try again.");
      setResult({ slug: r.slug, variant: r.variant ?? t.variant });
      // Send the welcome email straight away; the scheduled job is the backstop.
      try {
        await supabase.functions.invoke("trial-nurture", { body: {} });
      } catch {
        /* best-effort; the cron will still send it */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sw-trial">
      <div className="sw-trial-card">
        <div className="sw-trial-brand">SportsWeb One</div>

        {!result ? (
          <>
            <h1 className="sw-trial-title">Start your free club website</h1>
            <p className="sw-trial-sub">
              A complete, ready-to-go site in under a minute. Free for 7 days, no card required.
              Add your own logo and photos any time.
            </p>
            <p className="sw-trial-urgency">EOFYS: free setup for clubs who start before 30 June.</p>

            <label className="sw-trial-label">
              Club name
              <input
                className="sw-trial-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Riverside Hawks"
                maxLength={80}
              />
            </label>

            <label className="sw-trial-label">
              What sort of club?
              <select
                className="sw-trial-input"
                value={typeIdx}
                onChange={(e) => setTypeIdx(Number(e.target.value))}
              >
                {CLUB_TYPES.map((t, i) => (
                  <option key={t.label} value={i}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="sw-trial-label">
              Your email
              <input
                className="sw-trial-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@club.org.au"
                required
              />
            </label>

            <div className="sw-trial-colours">
              <label className="sw-trial-label sw-trial-colour">
                Main colour
                <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} />
              </label>
              <label className="sw-trial-label sw-trial-colour">
                Second colour
                <input type="color" value={secondary} onChange={(e) => setSecondary(e.target.value)} />
              </label>
            </div>

            {error && <div className="sw-trial-error">{error}</div>}

            <button className="sw-trial-btn" onClick={submit} disabled={busy}>
              {busy ? "Building your site..." : "Create my free site"}
            </button>
            <p className="sw-trial-fine">
              We will set you up with starter content so your site looks alive straight away.
            </p>
          </>
        ) : (
          <>
            <h1 className="sw-trial-title">Your site is live.</h1>
            <p className="sw-trial-sub">
              We have set up your club with sample news, fixtures, teams and sponsors so you can see
              it in action. We have emailed {email} a quick-start guide too.
            </p>
            <div className="sw-trial-actions">
              <a className="sw-trial-btn" href={`/?club=${result.slug}`}>
                View my site
              </a>
              <button
                className="sw-trial-btn sw-trial-btn-ghost"
                onClick={() => sendLogin(email)}
                disabled={linkBusy}
              >
                {linkBusy ? "Sending login link..." : "Create my login to edit it"}
              </button>
              <a className="sw-trial-btn sw-trial-btn-ghost" href="/guide">
                Quick-start guide
              </a>
            </div>
            {linkMsg && <p className="sw-trial-fine">{linkMsg}</p>}
            <p className="sw-trial-fine">
              Your free trial runs for 7 days. Add your logo and photos any time, and we will be in
              touch to help you get the most out of it.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
