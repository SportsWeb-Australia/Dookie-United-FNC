/**
 * PWA helpers: service-worker registration, install-prompt capture, and push
 * subscription. Push is provider-agnostic — supply a VAPID public key and a
 * subscribe endpoint (e.g. a Supabase Edge Function) via env to enable it.
 */

export function registerServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration failures shouldn't break the app */
    });
  });
}

/** Capture the install prompt so we can trigger it from our own UI. */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function watchInstallPrompt(onAvailable: () => void): void {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    onAvailable();
  });
}

export async function triggerInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return choice.outcome === "accepted";
}

export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/* ---------------- Push ---------------- */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SUBSCRIBE_URL = import.meta.env.VITE_PUSH_SUBSCRIBE_URL as string | undefined;

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

/**
 * Ask for permission and, if a VAPID key + endpoint are configured, subscribe and
 * register the subscription with the backend. Returns true if permission granted.
 */
export async function enablePush(clubSlug: string): Promise<boolean> {
  if (!pushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  // Permission alone is enough to "opt in". Full delivery needs a push backend.
  if (!VAPID_PUBLIC_KEY || !SUBSCRIBE_URL) return true;

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch(SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ club: clubSlug, subscription: sub }),
    });
    return true;
  } catch {
    // Permission was granted even if subscription/storage failed.
    return true;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
