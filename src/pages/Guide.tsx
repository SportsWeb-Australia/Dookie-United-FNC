/**
 * Quick-start guide shown at /guide. Standalone (no club chrome) so it can be
 * linked straight from the welcome email. A cheat sheet of what a club can do
 * during the trial and how, plus a video slot.
 *
 * To add the walkthrough video: set VIDEO_EMBED to a YouTube/Loom embed URL.
 */
const VIDEO_EMBED = ""; // e.g. "https://www.youtube.com/embed/XXXXXXXX"

const STEPS: { title: string; how: string }[] = [
  {
    title: "Make it yours",
    how: "In your admin, open Website and add your club logo, then set your two club colours. The whole site re-themes instantly.",
  },
  {
    title: "Post your first news story",
    how: "Admin > News > New. Give it a headline, a short summary and a photo. It appears on your home page and news page straight away.",
  },
  {
    title: "Add fixtures, results and the ladder",
    how: "Admin > Match Centre. Enter upcoming games, add scores as results come in, and your ladder keeps itself tidy.",
  },
  {
    title: "List your teams",
    how: "Admin > Teams. Add each side with its grade and age group so members can find where they fit.",
  },
  {
    title: "Showcase your sponsors",
    how: "Admin > Sponsors. Add logos and a short line for each. Sponsors love seeing themselves on a real site - it makes renewals easier.",
  },
  {
    title: "Push news to your socials",
    how: "Admin > Website > News & social. Choose how your news and your Facebook feed work together, so one update can do double duty.",
  },
  {
    title: "Try the add-on modules",
    how: "Admin > Modules. Switch on Volunteer Manager and others to see what is included as you grow.",
  },
];

export function Guide() {
  return (
    <div className="sw-guide">
      <div className="sw-guide-inner">
        <div className="sw-guide-brand">SportsWeb One</div>
        <h1 className="sw-guide-title">Your 5-minute quick start</h1>
        <p className="sw-guide-sub">
          Your trial site is already full of sample content, so nothing is blank. Here is how to
          make it yours and try the features that matter most.
        </p>

        <div className="sw-guide-video">
          {VIDEO_EMBED ? (
            <iframe
              src={VIDEO_EMBED}
              title="SportsWeb One walkthrough"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="sw-guide-video-ph">Video walkthrough coming soon</div>
          )}
        </div>

        <ol className="sw-guide-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="sw-guide-step">
              <span className="sw-guide-num">{i + 1}</span>
              <div>
                <h3 className="sw-guide-step-title">{s.title}</h3>
                <p className="sw-guide-step-how">{s.how}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="sw-guide-cta">
          <a className="sw-trial-btn" href="/admin">
            Log in to edit my site
          </a>
          <p className="sw-guide-fine">
            Use the login link we emailed you. Stuck on anything? Just reply to that email and we
            will help you get going.
          </p>
        </div>
      </div>
    </div>
  );
}
