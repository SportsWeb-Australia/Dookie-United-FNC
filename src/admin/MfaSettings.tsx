import { useEffect, useState } from "react";
import {
  getMfaStatus,
  enrollTotp,
  verifyCode,
  removeMfa,
  generateBackupCodes,
  backupCodesRemaining,
  type MfaStatus,
  type EnrollResult,
} from "../lib/mfa";

type Phase = "idle" | "enrolling" | "codes";

/** Group the setup key into 4-char blocks so it's easy to type by hand. */
const formatSecret = (s: string) => s.replace(/(.{4})/g, "$1 ").trim();

function QrView({ qr }: { qr: string }) {
  if (!qr) return null;
  if (qr.trim().startsWith("<svg")) {
    return <div className="sw-mfa-qr" dangerouslySetInnerHTML={{ __html: qr }} />;
  }
  return <img className="sw-mfa-qr" src={qr} alt="Two-factor QR code" />;
}

function CodesView({ codes }: { codes: string[] }) {
  const text = codes.join("\n");
  const copy = () => navigator.clipboard?.writeText(text).catch(() => undefined);
  const download = () => {
    const blob = new Blob([`SportsWeb One backup codes\n\n${text}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sportsweb-one-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="sw-mfa-codes">
      <ul>
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="sw-mfa-codeactions">
        <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={copy}>Copy</button>
        <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={download}>Download</button>
      </div>
    </div>
  );
}

export function MfaSettings({ enforced = false }: { enforced?: boolean }) {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [enroll, setEnroll] = useState<EnrollResult | null>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyKey = () => {
    if (!enroll) return;
    navigator.clipboard
      ?.writeText(enroll.secret)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  async function refresh() {
    const s = await getMfaStatus();
    setStatus(s);
    if (s.enrolled) setRemaining(await backupCodesRemaining());
  }
  useEffect(() => {
    refresh();
  }, []);

  async function startSetup() {
    setBusy(true);
    setErr(null);
    const res = await enrollTotp();
    setBusy(false);
    if (res.error || !res.data) {
      setErr(res.error ?? "Could not start setup.");
      return;
    }
    setEnroll(res.data);
    setCode("");
    setPhase("enrolling");
  }

  async function confirmSetup() {
    if (!enroll) return;
    setBusy(true);
    setErr(null);
    const msg = await verifyCode(enroll.factorId, code);
    if (msg) {
      setBusy(false);
      setErr(msg);
      return;
    }
    // Verified — generate a first set of backup codes.
    const gen = await generateBackupCodes();
    setBusy(false);
    if (gen.error) {
      // 2FA is on even if codes failed; surface but continue.
      setErr(`Two-factor is on, but backup codes couldn't be saved: ${gen.error}`);
      setPhase("idle");
      await refresh();
      return;
    }
    setCodes(gen.codes);
    setPhase("codes");
    await refresh();
  }

  async function regenerate() {
    setBusy(true);
    setErr(null);
    const gen = await generateBackupCodes();
    setBusy(false);
    if (gen.error) {
      setErr(gen.error);
      return;
    }
    setCodes(gen.codes);
    setPhase("codes");
    await refresh();
  }

  async function turnOff() {
    if (!status?.factorId) return;
    if (!window.confirm("Turn off two-factor authentication for your account?")) return;
    setBusy(true);
    setErr(null);
    const msg = await removeMfa(status.factorId);
    setBusy(false);
    if (msg) {
      setErr(msg);
      return;
    }
    setPhase("idle");
    setEnroll(null);
    await refresh();
  }

  if (!status) {
    return (
      <div className="sw-mfa">
        <h3 className="sw-mfa-h">Two-factor authentication (2FA)</h3>
        <p className="sw-mem-muted">Checking…</p>
      </div>
    );
  }

  if (!status.available) {
    return (
      <div className="sw-mfa">
        <h3 className="sw-mfa-h">Two-factor authentication (2FA)</h3>
        <p className="sw-admin-note">Two-factor isn't available on this connection.</p>
      </div>
    );
  }

  return (
    <div className="sw-mfa">
      <h3 className="sw-mfa-h">Two-factor authentication (2FA)</h3>
      <p className="sw-admin-note">
        Add a second step to your login using an authenticator app (Google Authenticator, Authy, 1Password
        and similar). Recommended for all admin and committee accounts.
      </p>

      {err && <p className="sw-admin-note sw-md-msg">{err}</p>}

      {/* Showing freshly generated backup codes */}
      {phase === "codes" && (
        <div className="sw-mfa-panel">
          <strong>Save your backup codes</strong>
          <p className="sw-mem-muted">
            Each code works once if you ever lose your phone. Store them somewhere safe — they won&apos;t be
            shown again.
          </p>
          <CodesView codes={codes} />
          <button className="sw-btn" onClick={() => setPhase("idle")}>Done</button>
        </div>
      )}

      {/* Enrolment in progress */}
      {phase === "enrolling" && enroll && (
        <div className="sw-mfa-panel">
          <div className="sw-mfa-step">
            <span className="sw-mfa-stepnum">1</span>
            <div>
              <strong>Open an authenticator app on your phone</strong>
              <p className="sw-mem-muted">
                Use Google Authenticator, Microsoft Authenticator, Authy or 1Password. Your phone
                camera or a chat app <em>won&apos;t</em> work for this — it has to be an authenticator app.
              </p>
            </div>
          </div>

          <div className="sw-mfa-step">
            <span className="sw-mfa-stepnum">2</span>
            <div className="sw-mfa-add">
              <strong>Add SportsWeb One to it</strong>

              {/* Easiest on a phone: one tap opens the authenticator pre-filled */}
              <a className="sw-btn sw-mfa-open" href={enroll.uri}>
                Open in my authenticator app
              </a>
              <p className="sw-mem-muted sw-mfa-or">
                Nothing opened? Add it by hand — in your authenticator app choose
                <strong> Add account → Enter a setup key</strong>, then paste this key:
              </p>

              <div className="sw-mfa-key">
                <code>{formatSecret(enroll.secret)}</code>
                <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={copyKey}>
                  {copied ? "Copied ✓" : "Copy key"}
                </button>
              </div>

              {/* QR is only useful from a *second* device, so it's tucked away */}
              <details className="sw-mfa-qrwrap">
                <summary>On a computer instead? Scan this QR with your phone</summary>
                <QrView qr={enroll.qrCode} />
              </details>
            </div>
          </div>

          <div className="sw-mfa-step">
            <span className="sw-mfa-stepnum">3</span>
            <div className="sw-mfa-add">
              <strong>Type the 6-digit code your app now shows</strong>
              <div className="sw-mfa-verify">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <button className="sw-btn" disabled={busy || code.length < 6} onClick={confirmSetup}>
                  {busy ? "Verifying…" : "Verify & turn on"}
                </button>
              </div>
            </div>
          </div>

          <button className="sw-btn sw-btn--ghost sw-btn--sm" onClick={() => { setPhase("idle"); setEnroll(null); }}>
            Cancel
          </button>
        </div>
      )}

      {/* Steady state */}
      {phase === "idle" && (
        status.enrolled ? (
          <div className="sw-mfa-on">
            <p className="sw-mfa-status sw-mfa-status--on">✓ Two-factor is on</p>
            <p className="sw-mem-muted">Backup codes remaining: <strong>{remaining}</strong></p>
            <div className="sw-mfa-actions">
              <button className="sw-btn sw-btn--ghost" disabled={busy} onClick={regenerate}>
                Regenerate backup codes
              </button>
              {!enforced && (
                <button className="sw-btn sw-btn--ghost sw-ts-del" disabled={busy} onClick={turnOff}>
                  Turn off 2FA
                </button>
              )}
            </div>
            {enforced && (
              <p className="sw-mem-muted">
                Two-factor is required on admin accounts by your platform's security policy, so it
                can't be switched off here.
              </p>
            )}
          </div>
        ) : (
          <div className="sw-mfa-off">
            <p className="sw-mfa-status sw-mfa-status--off">Two-factor is off</p>
            <button className="sw-btn" disabled={busy} onClick={startSetup}>
              {busy ? "Starting…" : "Set up two-factor"}
            </button>
          </div>
        )
      )}
    </div>
  );
}
