import { useParams } from "react-router-dom";
import { useClub } from "../components/ClubContext";
import { PageHero } from "../components/layout/PageHero";
import { SmartLink } from "../components/SmartLink";
import { MediaEmbed } from "../components/blocks/MediaEmbed";
import { Countdown } from "../components/blocks/Countdown";
import { NotFound } from "./NotFound";
import { useSeo } from "../lib/seo";
import { slugify } from "../lib/slug";
import { formatDate } from "../lib/format";

export function EventDetail() {
  const { slug } = useParams();
  const { club } = useClub();

  const ev = club.events.find((e) => (e.slug ?? slugify(e.title)) === slug) ?? null;

  useSeo(
    ev ? { title: `${ev.title} | ${club.identity.name}`, description: ev.description ?? "" } : null
  );

  if (!ev) return <NotFound />;

  const when = [formatDate(ev.date), ev.time].filter(Boolean).join(" · ");
  const mapEmbed = ev.location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(ev.location)}&z=15&output=embed`
    : null;

  return (
    <>
      <PageHero eyebrow={ev.tag ? ev.tag : "Event"} title={ev.title} intro={when} />

      <section className="sw-section">
        <div className="sw-container sw-article">
          <div className="sw-article-main">
            {ev.image && <img className="sw-article-cover" src={ev.image} alt="" />}

            {ev.featured && <Countdown iso={ev.startsAt ?? ev.date} />}

            <ul className="sw-deflist">
              <li>
                <span>When</span>
                <span>{when}</span>
              </li>
              {ev.location && (
                <li>
                  <span>Where</span>
                  <span>{ev.location}</span>
                </li>
              )}
              {ev.tag && (
                <li>
                  <span>Type</span>
                  <span>{ev.tag}</span>
                </li>
              )}
            </ul>

            {ev.description && <p className="sw-lead">{ev.description}</p>}

            <div className="sw-event-actions">
              {ev.ticketHref && (
                <SmartLink href={ev.ticketHref} className="sw-btn">
                  Get tickets
                </SmartLink>
              )}
              {ev.mapUrl && (
                <SmartLink href={ev.mapUrl} className="sw-link-arrow">
                  Open in Maps ↗
                </SmartLink>
              )}
            </div>

            {ev.video && <MediaEmbed url={ev.video} title={ev.title} />}

            {mapEmbed && (
              <div className="sw-map">
                <iframe title={`Map — ${ev.location}`} src={mapEmbed} loading="lazy" />
              </div>
            )}

            <SmartLink href="/events" className="sw-link-arrow">
              ← Back to all events
            </SmartLink>
          </div>
        </div>
      </section>
    </>
  );
}
