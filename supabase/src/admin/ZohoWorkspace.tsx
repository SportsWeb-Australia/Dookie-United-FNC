import type { ReactNode } from "react";

/**
 * Workspace screens — the club's operational tools, powered by Zoho. Built and
 * ready; until a club is on a plan that includes them (and SportsWeb connects
 * them), each shows a friendly "contact SportsWeb" state. When connected, the
 * same screen opens straight into the club's tool.
 */

const ic = (inner: ReactNode): ReactNode => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {inner}
  </svg>
);

export const WS_ICON: Record<string, ReactNode> = {
  email: ic(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  workdrive: ic(<><path d="M6 19a4 4 0 0 1-.9-7.9 5 5 0 0 1 9.7-1.6A4.5 4.5 0 0 1 18 19z" /></>),
  intranet: ic(<><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>),
  office: ic(<><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>),
  writer: ic(<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>),
  sheets: ic(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M4 15h16M10 4v16" /></>),
  show: ic(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M12 16v4M8 20h8" /></>),
  meeting: ic(<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>),
  calendar: ic(<><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M4 9h16M9 3v4M15 3v4" /></>),
  vault: ic(<><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 15v2" /></>),
  todo: ic(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m8 12 3 3 5-5" /></>),
  committee: ic(<><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" /></>),
};

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
    label: "Club Office",
    title: "Club Office",
    blurb:
      "A full office suite for the club — documents, spreadsheets and presentations. It works just like Microsoft Office and Google Workspace, and it's actually compatible with them too: open, edit and save .docx, .xlsx and .pptx files without converting anything. Open Writer, Sheets or Show from the menu.",
    zoho: "Zoho Office Suite",
  },
  writer: {
    label: "Writer",
    title: "Writer",
    blurb:
      "Word processor for letters, policies, reports and newsletters. Works like — and is compatible with — Microsoft Word and Google Docs (.docx in and out).",
    zoho: "Zoho Writer",
  },
  sheets: {
    label: "Sheets",
    title: "Sheets",
    blurb:
      "Spreadsheets for budgets, rosters, ladders and lists. Works like — and is compatible with — Microsoft Excel and Google Sheets (.xlsx in and out).",
    zoho: "Zoho Sheet",
  },
  show: {
    label: "Show",
    title: "Show",
    blurb:
      "Slides for presentations, AGM decks and sponsor pitches. Works like — and is compatible with — PowerPoint and Google Slides (.pptx in and out).",
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
      <div className="sw-ws-hero">
        <span className="sw-ws-hero-ic">{WS_ICON[appKey]}</span>
        <div className="sw-ws-hero-copy">
          <h2>{a.title}</h2>
          <p>{a.blurb}</p>
        </div>
      </div>

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
