import { useClub } from "../ClubContext";

/** Whole days from now until the given ISO date (can be negative once passed). */
function daysLeft(endsAt?: string | null): number | null {
  if (!endsAt) return null;
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) return null;
  const ms = end - Date.now();
  return Math.ceil(ms / 86_400_000);
}

/**
 * Slim banner shown only on trial clubs. Counts down the free trial and links
 * to upgrade. Sits above the site so it is visible on every page. Hidden
 * entirely for non-trial clubs.
 */
export function TrialBanner() {
  const { club } = useClub();
  const trial = club.trial;
  if (!trial?.active) return null;

  const left = daysLeft(trial.endsAt);
  const salesEmail = club.platform?.salesEmail || "hello@sportsweb.com.au";
  const upgradeHref = `mailto:${salesEmail}?subject=${encodeURIComponent(
    `Upgrade ${club.identity.name}`
  )}`;

  let message: string;
  let urgent = false;
  if (left === null) {
    message = "You are on a free SportsWeb One trial.";
  } else if (left > 1) {
    message = `${left} days left on your free trial.`;
  } else if (left === 1) {
    message = "Last day of your free trial.";
    urgent = true;
  } else if (left === 0) {
    message = "Your free trial ends today.";
    urgent = true;
  } else {
    message = "Your free trial has ended.";
    urgent = true;
  }

  return (
    <div className={`sw-trialbar${urgent ? " sw-trialbar-urgent" : ""}`} role="status">
      <span className="sw-trialbar-msg">{message}</span>
      <a className="sw-trialbar-cta" href={upgradeHref}>
        Keep this site &rarr;
      </a>
    </div>
  );
}
