import { useEffect, useState } from "react";

/** Ticks every minute; renders days/hours/minutes until `iso`. Hides once past. */
export function Countdown({ iso }: { iso?: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return null;

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000) % 24;
  const m = Math.floor(diff / 60_000) % 60;

  return (
    <div className="sw-countdown" aria-label="Time until event">
      {d > 0 && (
        <span className="sw-countdown-unit">
          <strong>{d}</strong>d
        </span>
      )}
      <span className="sw-countdown-unit">
        <strong>{h}</strong>h
      </span>
      <span className="sw-countdown-unit">
        <strong>{m}</strong>m
      </span>
      <span className="sw-countdown-label">to go</span>
    </div>
  );
}
