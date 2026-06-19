import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";

export function QuickLinks() {
  const { club } = useClub();
  return (
    <nav className="sw-quicklinks" aria-label="Quick links">
      <div className="sw-container">
        {club.quickLinks.map((l) => (
          <SmartLink key={l.label} href={l.href} className="sw-quicklink">
            {l.label}
            <span aria-hidden="true">→</span>
          </SmartLink>
        ))}
      </div>
    </nav>
  );
}
