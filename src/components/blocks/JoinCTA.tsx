import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { EditableText } from "../edit/Editable";

export function JoinCTA() {
  const { club } = useClub();
  const { join } = club;

  return (
    <section className="sw-section sw-join">
      <div className="sw-hero-motif" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="sw-container">
        <EditableText as="h2" k="join.heading" value={join.heading} />
        <EditableText as="p" k="join.blurb" value={join.blurb} />
        <div className="sw-join-options">
          {join.options.map((o) => (
            <SmartLink key={o.label} href={o.href} className="sw-btn">
              {o.label}
            </SmartLink>
          ))}
        </div>
      </div>
    </section>
  );
}
