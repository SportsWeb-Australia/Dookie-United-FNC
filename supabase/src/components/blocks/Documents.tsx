import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars } from "../layout/Chevron";

interface Props {
  bare?: boolean;
}

export function Documents({ bare }: Props) {
  const { club } = useClub();

  const list = (
    <div className="sw-docs">
      {club.documents.map((doc, i) => (
        <SmartLink key={i} href={doc.href} className="sw-doc">
          <span className="sw-doc-kind">{doc.kind}</span>
          <span className="sw-doc-label">
            {doc.label}
            {doc.placeholder && <span className="sw-flag" style={{ marginLeft: 8 }}>Placeholder</span>}
          </span>
          <span className="arrow" aria-hidden="true">
            ↓
          </span>
        </SmartLink>
      ))}
    </div>
  );

  if (bare) return list;

  return (
    <section className="sw-section sw-section--alt">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">Resources</span>
            <h2>Documents &amp; policies</h2>
          </div>
        </div>
        {list}
      </div>
    </section>
  );
}
