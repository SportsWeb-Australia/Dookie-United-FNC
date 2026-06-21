import { useState } from "react";

interface HelpStep {
  title: string;
  body: string;
}
interface HelpContent {
  purpose: string;
  options: string[];
  steps: HelpStep[];
}

/**
 * Per-section help & quick-start. A collapsible panel that explains what a
 * section is for, the options available, and a step-by-step. Each carries a
 * video placeholder so walkthrough clips can be dropped in later.
 */
export const HELP_CONTENT: Record<string, HelpContent> = {
  news: {
    purpose:
      "News is where you post club updates — match reports, announcements, milestones — that show on your website's news page and homepage.",
    options: [
      "Write a post with a title, formatted text, a cover image and an optional video.",
      "Save it as a draft to finish later, or publish it straight away.",
      "Set the publish date so a post can be back-dated or scheduled to read in order.",
    ],
    steps: [
      { title: "Start a post", body: "Click ‘New News article’ in the top right." },
      { title: "Add the detail", body: "Give it a title, write the body with the formatting toolbar, and add a cover image." },
      { title: "Publish", body: "Set status to Published and save. Reload your site to see it live." },
    ],
  },
  events: {
    purpose:
      "Events lists what's coming up — game days, fundraisers, presentation nights — on your website's events page.",
    options: [
      "Add an event with a date, time, location, description and image.",
      "Add a ticket or registration link so people can sign up.",
      "Save as draft until details are locked in, then publish.",
    ],
    steps: [
      { title: "Add an event", body: "Click ‘New Event’ and enter the date, time and place." },
      { title: "Describe it", body: "Add a short description, an image, and any ticket link." },
      { title: "Publish", body: "Set status to Published and save." },
    ],
  },
  sponsors: {
    purpose:
      "Sponsors is your partner wall. Add each sponsor's logo and link so they appear on your site — grouped by tier.",
    options: [
      "Add a sponsor with a logo, website link and tier (e.g. Major, Gold, Community).",
      "Order sponsors so your biggest partners sit at the top.",
      "Hide a sponsor by setting it to draft without deleting it.",
    ],
    steps: [
      { title: "Add a sponsor", body: "Click ‘New Sponsor’ and upload their logo." },
      { title: "Set the tier", body: "Choose the sponsorship level and add their website link." },
      { title: "Save", body: "Publish and they appear on your sponsors strip." },
    ],
  },
  teams: {
    purpose:
      "Teams sets up each grade or side at your club — seniors, reserves, juniors, netball grades — each with its own page.",
    options: [
      "Add a team with a name, age group, grade and coach.",
      "Add a team photo and training details.",
      "Order teams so they list in a sensible pathway.",
    ],
    steps: [
      { title: "Add a team", body: "Click ‘New Team’ and name the grade or side." },
      { title: "Fill the detail", body: "Add the coach, training times and a team photo." },
      { title: "Save", body: "Publish and the team page goes live." },
    ],
  },
  matches: {
    purpose:
      "Fixtures & Results is your match centre — upcoming games and past scores, shown on your site by grade and round.",
    options: [
      "Add a fixture or result manually for any grade and round.",
      "Import a whole season at once by pasting a CSV.",
      "Record the opponent, venue, date and final score.",
    ],
    steps: [
      { title: "Add a match", body: "Click ‘New’ and pick the grade, round and date." },
      { title: "Enter the detail", body: "Add the opponent and venue; add the score once it's played." },
      { title: "Bulk option", body: "To load a full season, use Import CSV and paste your fixtures." },
    ],
  },
  ladder: {
    purpose:
      "Ladder shows where each team sits in their competition — played, won, lost, points and percentage.",
    options: [
      "Add ladder rows one at a time for each team in the grade.",
      "Import the full ladder in one go by pasting a CSV.",
      "Update the numbers each week as results come in.",
    ],
    steps: [
      { title: "Add a row", body: "Click ‘New Ladder row’ and enter a team's stats." },
      { title: "Or import", body: "Use Import CSV to paste a whole ladder at once." },
      { title: "Keep it current", body: "Edit the rows each round so the standings stay accurate." },
    ],
  },
  website: {
    purpose:
      "This is where you edit your public website — the homepage hero, your logo, the president's welcome, the join call-to-action, your About page and the footer.",
    options: [
      "Change any text and save it section by section.",
      "Swap images using the framing tool so they always sit nicely.",
      "Add a hero video link, or update your club logo.",
    ],
    steps: [
      { title: "Edit a section", body: "Type into any field — hero, welcome, join, about or footer." },
      { title: "Swap an image", body: "Click ‘Upload image’, frame it, and use it. It saves straight away." },
      { title: "Save & view", body: "Save each section, then reload your public site to see it live." },
    ],
  },
};

export function SectionHelp({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const content = HELP_CONTENT[section];
  if (!content) return null;

  return (
    <div className={`sw-help${open ? " sw-help--open" : ""}`}>
      <button className="sw-help-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>How this works · quick start guide</span>
        <span className="sw-help-chev" aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="sw-help-body">
          <p className="sw-help-purpose">{content.purpose}</p>

          <div className="sw-help-video" aria-label="Video walkthrough placeholder">
            <span>▶ Video walkthrough</span>
            <small>Coming soon</small>
          </div>

          <div className="sw-help-cols">
            <section>
              <h4>You can</h4>
              <ul className="sw-help-list">
                {content.options.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Step by step</h4>
              <ol className="sw-help-steps">
                {content.steps.map((s, i) => (
                  <li key={i}>
                    <strong>{s.title}</strong>
                    <span>{s.body}</span>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
