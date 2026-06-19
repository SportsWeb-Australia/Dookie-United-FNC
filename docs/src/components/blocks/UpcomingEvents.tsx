import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { AccentBars, Chevron } from "../layout/Chevron";
import { formatDate } from "../../lib/format";
import { slugify } from "../../lib/slug";
import { Countdown } from "./Countdown";

interface Props {
  limit?: number;
  bare?: boolean;
}

export function UpcomingEvents({ limit, bare }: Props) {
  const { club } = useClub();
  const events = limit ? club.events.slice(0, limit) : club.events;

  const grid = (
    <div className="sw-grid">
      {events.map((ev) => (
        <article className={`sw-card${ev.featured ? " is-featured" : ""}`} key={ev.id}>
          <div className="sw-card-media">
            {ev.image ? <img src={ev.image} alt="" /> : <Chevron />}
            {ev.featured && <span className="sw-card-ribbon">Featured</span>}
            <span className="sw-card-tag">{formatDate(ev.date)}</span>
          </div>
          <div className="sw-card-body">
            <span className="sw-card-date">
              {ev.time ? `${ev.time} · ` : ""}
              {ev.location}
              {ev.placeholder && <span className="sw-flag" style={{ marginLeft: 8 }}>Placeholder</span>}
            </span>
            <h3>{ev.title}</h3>
            {ev.tag && <span className="sw-event-tag">{ev.tag}</span>}
            {ev.featured && <Countdown iso={ev.startsAt ?? ev.date} />}
            {ev.description && <p>{ev.description}</p>}
            <div className="sw-event-actions">
              <SmartLink href={`/events/${ev.slug ?? slugify(ev.title)}`} className="sw-link-arrow">
                Full details →
              </SmartLink>
              {ev.ticketHref && (
                <SmartLink href={ev.ticketHref} className="sw-link-arrow">
                  Get tickets →
                </SmartLink>
              )}
              {ev.mapUrl && (
                <SmartLink href={ev.mapUrl} className="sw-link-arrow">
                  View map ↗
                </SmartLink>
              )}
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  if (bare) return grid;

  return (
    <section className="sw-section">
      <div className="sw-container">
        <div className="sw-section-head">
          <div>
            <AccentBars />
            <span className="sw-eyebrow">What&apos;s on</span>
            <h2>Upcoming events</h2>
          </div>
          <SmartLink href="/events" className="sw-link-arrow">
            Full calendar →
          </SmartLink>
        </div>
        {grid}
      </div>
    </section>
  );
}
