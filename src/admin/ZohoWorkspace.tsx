/**
 * Workspace screens — the club's operational tools, powered by Zoho. These are
 * built and ready; until a club is on a plan that includes them (and SportsWeb
 * connects them), each shows a friendly "contact SportsWeb" state. When
 * connected, the same screen opens straight into the club's tool.
 */

export type WorkspaceApp = { label: string; title: string; blurb: string; zoho: string };

export const WORKSPACE: Record<string, WorkspaceApp> = {
  email: {
    label: "Email",
    title: "Club Email",
    blurb:
      "Proper club email for your office-bearers — send and receive from your own club address, with shared role mailboxes like secretary@ and treasurer@ so handovers are painless.",
    zoho: "Zoho Mail",
  },
  workdrive: {
    label: "WorkDrive",
    title: "WorkDrive",
    blurb:
      "Your club's shared file store — policies, logos, meeting minutes, grant docs and registration exports, all in one secure place the whole committee can reach (instead of buried in someone's personal drive).",
    zoho: "Zoho WorkDrive",
  },
  intranet: {
    label: "Intranet",
    title: "Club Intranet",
    blurb:
      "A private space just for your club — post announcements, run committee and team groups, share a members' feed and keep everyone in the loop. Think of it as the club's own internal home page, separate from your public website.",
    zoho: "Zoho Connect",
  },
  office: {
    label: "Office",
    title: "Office (like Microsoft 365 & Google Workspace)",
    blurb:
      "A full office suite for the club — documents, spreadsheets and presentations, the same idea as Microsoft Office or Google Workspace. Open Writer, Sheets or Show from the menu.",
    zoho: "Zoho Office Suite",
  },
  writer: {
    label: "Writer",
    title: "Writer",
    blurb: "Word processor for letters, policies, reports and newsletters — like Microsoft Word or Google Docs.",
    zoho: "Zoho Writer",
  },
  sheets: {
    label: "Sheets",
    title: "Sheets",
    blurb: "Spreadsheets for budgets, rosters, ladders and lists — like Microsoft Excel or Google Sheets.",
    zoho: "Zoho Sheet",
  },
  show: {
    label: "Show",
    title: "Show",
    blurb: "Slides for presentations, AGM decks and sponsor pitches — like PowerPoint or Google Slides.",
    zoho: "Zoho Show",
  },
  meeting: {
    label: "Meeting",
    title: "Meeting",
    blurb:
      "Run committee meetings and AGMs by video, share your screen and record the session for anyone who couldn't make it.",
    zoho: "Zoho Meeting",
  },
  calendar: {
    label: "Calendar",
    title: "Club Calendar",
    blurb:
      "One shared club calendar — fixtures, training, events and committee meetings in a single view the whole committee can see and add to.",
    zoho: "Zoho Calendar",
  },
  vault: {
    label: "Vault",
    title: "Vault",
    blurb:
      "A secure, shared password vault for the club's logins — league portal, social accounts, banking — so access survives committee changeovers. President and Secretary only.",
    zoho: "Zoho Vault",
  },
  todo: {
    label: "To-Do",
    title: "To-Do",
    blurb:
      "Committee tasks and to-dos — assign actions, set due dates and see what's done across the whole committee, so nothing falls through the cracks.",
    zoho: "Zoho To-Do",
  },
  committee: {
    label: "Committee Room",
    title: "Committee Room",
    blurb:
      "A private chat just for your committee — quick questions, decisions and discussion in one place, without clogging up email. The club's back-room for getting things done.",
    zoho: "Zoho Cliq",
  },
};

export function ZohoWorkspace({ appKey }: { appKey: string }) {
  const a = WORKSPACE[appKey];
  if (!a) return null;
  return (
    <div className="sw-admin-panel sw-ws">
      <div className="sw-admin-formhead">
        <h2>{a.title}</h2>
      </div>
      <p className="sw-admin-note">{a.blurb}</p>

      <div className="sw-ws-connect">
        <span className="sw-ws-badge">Not connected yet</span>
        <p>
          Please contact SportsWeb to have your {a.label.toLowerCase()} connected. Once your club is on a plan that
          includes {a.zoho}, this screen opens straight into your club's {a.label.toLowerCase()}.
        </p>
        <a className="sw-btn" href={`mailto:support@sportsweb.com.au?subject=${encodeURIComponent("Connect " + a.label)}`}>
          Contact SportsWeb
        </a>
      </div>
    </div>
  );
}
