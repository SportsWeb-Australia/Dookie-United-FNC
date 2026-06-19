import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars, Chevron } from "../layout/Chevron";

interface Props {
  bare?: boolean;
}

export function TeamsBlock({ bare }: Props) {
  const { club } = useClub();

  const groups = (
    <div className="sw-pathway">
      {club.teams.map((group) => (
        <div className="sw-pathway-group" key={group.sport}>
          <h3>
            <Chevron />
            {group.sport}
          </h3>
          <div className="sw-tiles">
            {group.teams.map((team) => (
              <SmartLink
                key={team.name}
                href={team.href ?? "/teams"}
                className="sw-tile"
              >
                {team.image && <img className="sw-tile-thumb" src={team.image} alt="" loading="lazy" />}
                {team.ages && <span className="sw-tile-ages">{team.ages}</span>}
                <h4>{team.name}</h4>
                <p>{team.blurb}</p>
              </SmartLink>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (bare) return groups;

  return (
    <section className="sw-section sw-section--alt">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">Pathways</span>
            <h2>Teams &amp; programs</h2>
          </div>
          <SmartLink href="/register" className="sw-link-arrow">
            New player enquiries →
          </SmartLink>
        </div>
        {groups}
      </div>
    </section>
  );
}
