import { useEffect, useState } from "react";
import { useClub } from "../ClubContext";
import {
  watchInstallPrompt,
  triggerInstall,
  isStandalone,
  isIos,
  pushSupported,
  notificationPermission,
  enablePush,
} from "../../lib/pwa";

const DISMISS_KEY = "sw-pwa-dismissed";
const PUSH_KEY = "sw-push-dismissed";

function dismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function setDismissed(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }
}

export function AppPrompts() {
  const { club } = useClub();
  const slug = club.identity.slug ?? "club";

  const [installable, setInstallable] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const [hideInstall, setHideInstall] = useState(dismissed(DISMISS_KEY) || isStandalone());

  const [pushState, setPushState] = useState(notificationPermission());
  const [hidePush, setHidePush] = useState(dismissed(PUSH_KEY));

  useEffect(() => {
    if (isStandalone()) return;
    watchInstallPrompt(() => setInstallable(true));
    // iOS doesn't fire beforeinstallprompt — offer manual instructions instead.
    if (isIos() && !isStandalone()) setShowIosHint(true);
  }, []);

  const onInstall = async () => {
    const ok = await triggerInstall();
    if (ok) setHideInstall(true);
  };

  const onEnablePush = async () => {
    const ok = await enablePush(slug);
    setPushState(notificationPermission());
    if (ok) setHidePush(true);
  };

  const showInstall = !hideInstall && (installable || showIosHint);
  const showPush =
    !showInstall &&
    !hidePush &&
    pushSupported() &&
    pushState === "default";

  if (!showInstall && !showPush) return null;

  return (
    <div className="sw-pwa-banner" role="dialog" aria-label="App options">
      {showInstall ? (
        <>
          <div className="sw-pwa-text">
            <strong>Add {club.identity.shortName} to your phone</strong>
            <span>
              {showIosHint && !installable
                ? "Tap Share, then “Add to Home Screen”."
                : "Install the app for one-tap access to fixtures and news."}
            </span>
          </div>
          <div className="sw-pwa-actions">
            {installable && (
              <button className="sw-btn" onClick={onInstall}>
                Install
              </button>
            )}
            <button
              className="sw-pwa-dismiss"
              aria-label="Dismiss"
              onClick={() => {
                setDismissed(DISMISS_KEY);
                setHideInstall(true);
              }}
            >
              ✕
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="sw-pwa-text">
            <strong>Match-day alerts</strong>
            <span>Get notified about results, events and club news.</span>
          </div>
          <div className="sw-pwa-actions">
            <button className="sw-btn" onClick={onEnablePush}>
              Enable
            </button>
            <button
              className="sw-pwa-dismiss"
              aria-label="Dismiss"
              onClick={() => {
                setDismissed(PUSH_KEY);
                setHidePush(true);
              }}
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
