import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";
import { useEdit } from "../../lib/edit";
import { EditableText, EditableImage } from "../edit/Editable";

interface Props {
  /** Show a shortened welcome (first two paragraphs) with a link to About. */
  condensed?: boolean;
}

export function PresidentWelcome({ condensed }: Props) {
  const { club } = useClub();
  const { canEdit, editing } = useEdit();
  const { president, identity } = club;
  const paras = condensed ? president.body.slice(0, 2) : president.body;

  return (
    <section className="sw-section sw-section--alt">
      <div className="sw-container">
        <AccentBars />
        <span className="sw-eyebrow">Welcome to {identity.shortName}</span>
        <div className="sw-welcome-grid" style={{ marginTop: "1.5rem" }}>
          <aside className="sw-welcome-aside">
            <div className="sw-welcome-portrait">
              {president.portrait || (canEdit && editing) ? (
                <EditableImage k="president.portrait" value={president.portrait ?? ""} alt={president.name} />
              ) : (
                identity.initials
              )}
            </div>
            <EditableText as="div" className="sw-welcome-name" k="president.name" value={president.name} />
            <EditableText as="div" className="sw-welcome-role" k="president.role" value={president.role} />
          </aside>
          <div className="sw-welcome-body">
            {paras.map((p, i) => (
              <EditableText key={i} as="p" k={`president.body.${i}`} value={p} />
            ))}
            {condensed ? (
              <SmartLink href="/about" className="sw-link-arrow">
                More about the club →
              </SmartLink>
            ) : (
              president.signoff && <EditableText as="p" className="sw-signoff" k="president.signoff" value={president.signoff} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
