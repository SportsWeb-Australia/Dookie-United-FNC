import type { ReactNode } from "react";
import { useClub } from "../ClubContext";
import { SmartLink } from "../SmartLink";
import { formatDate } from "../../lib/format";
import { slugify } from "../../lib/slug";
import { Countdown } from "../blocks/Countdown";
import { Hero } from "../blocks/Hero";
import { MatchCentre } from "../blocks/MatchCentre";
import { SponsorStrip } from "../blocks/SponsorStrip";
import { FeaturedNews } from "../blocks/FeaturedNews";
import { QuickLinks } from "../blocks/QuickLinks";
import { JoinCTA } from "../blocks/JoinCTA";
import type { ClubConfig, DesignVariant, NewsPost } from "../../content/types";

function newsHref(p: NewsPost) {
  return p.href ?? `/news/${p.slug ?? slugify(p.title)}`;
}
function useData() {
  const { club } = useClub();
  const mc = club.matchCentre;
  return {
    club,
    id: club.identity,
    news: club.news ?? [],
    events: club.events ?? [],
    sponsors: club.sponsors ?? [],
    fixtures: mc?.fixtures ?? [],
    results: mc?.results ?? [],
    ladder: mc?.ladder ?? [],
  };
}

/* ----------------------------------------------------------------- Broadsheet */
function Broadsheet() {
  const { id, news, fixtures, ladder } = useData();
  const lead = news[0];
  const rest = news.slice(1, 6);
  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <header className="sw-bs-masthead">
        <div className="sw-container">
          <p className="sw-bs-kicker">{id.league ?? "Club news"}</p>
          <h1>{id.name}</h1>
          <p className="sw-bs-date">{today}</p>
        </div>
      </header>
      <section className="sw-section">
        <div className="sw-container sw-bs-grid">
          <div className="sw-bs-main">
            {lead && (
              <article className="sw-bs-lead">
                {lead.image && <img src={lead.image} alt="" />}
                <div>
                  <span className="sw-bs-tag">{lead.category}</span>
                  <h2>
                    <SmartLink href={newsHref(lead)}>{lead.title}</SmartLink>
                  </h2>
                  <p className="sw-bs-byline">{[lead.author, formatDate(lead.date)].filter(Boolean).join(" · ")}</p>
                  <p>{lead.excerpt}</p>
                </div>
              </article>
            )}
            <div className="sw-bs-stories">
              {rest.map((p) => (
                <article key={p.id}>
                  <h3>
                    <SmartLink href={newsHref(p)}>{p.title}</SmartLink>
                  </h3>
                  <p>{p.excerpt}</p>
                </article>
              ))}
            </div>
          </div>
          <aside className="sw-bs-rail">
            <RailFixtures fixtures={fixtures} />
            <RailLadder ladder={ladder} />
            <div className="sw-bs-railcard">
              <h4>Get involved</h4>
              <ul>
                <li><SmartLink href="/register">Register to play</SmartLink></li>
                <li><SmartLink href="/sponsors">Become a sponsor</SmartLink></li>
                <li><SmartLink href="/contact">Contact the club</SmartLink></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ------------------------------------------------------------------- Matchday */
function Matchday() {
  const { id, fixtures, results } = useData();
  const next = fixtures[0];
  const last = results[0];
  return (
    <>
      <section className="sw-md-hero">
        <div className="sw-container">
          <p className="sw-md-eyebrow">Next match</p>
          {next ? (
            <>
              <h1>
                {id.shortName} <span>vs</span> {next.opponent}
              </h1>
              <p className="sw-md-meta">
                {next.round && `${next.round} · `}
                {next.date} · {next.venue}
              </p>
              {next.iso && <Countdown iso={next.iso} />}
            </>
          ) : (
            <h1>{id.name}</h1>
          )}
          <div className="sw-md-actions">
            <SmartLink href="/fixtures" className="sw-btn">Full fixtures</SmartLink>
            {last && (
              <span className="sw-md-last">
                Last up: {last.outcome === "W" ? "Won" : last.outcome === "L" ? "Lost" : "Drew"} v {last.opponent} {last.scoreFor}–{last.scoreAgainst}
              </span>
            )}
          </div>
        </div>
      </section>
      <MatchCentre />
      <FeaturedNews limit={3} />
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ------------------------------------------------------------------ App shell */
function AppShell() {
  const { id, news, events, fixtures } = useData();
  const next = fixtures[0];
  const ev = events[0];
  const actions = [
    { label: "Register", href: "/register" },
    { label: "Fixtures", href: "/fixtures" },
    { label: "Teams", href: "/teams" },
    { label: "Contact", href: "/contact" },
  ];
  return (
    <>
      <section className="sw-as-top">
        <div className="sw-container">
          <p className="sw-as-hi">G&apos;day, {id.shortName} fans</p>
          <div className="sw-as-actions">
            {actions.map((a) => (
              <SmartLink key={a.href} href={a.href} className="sw-as-action">
                {a.label}
              </SmartLink>
            ))}
          </div>
        </div>
      </section>
      <section className="sw-section sw-as-feed">
        <div className="sw-container">
          {next && (
            <article className="sw-as-card sw-as-match">
              <span className="sw-as-cardtag">Next match</span>
              <h3>{id.shortName} v {next.opponent}</h3>
              <p>{next.date} · {next.venue}</p>
              <SmartLink href="/fixtures" className="sw-link-arrow">Match centre →</SmartLink>
            </article>
          )}
          {news.slice(0, 4).map((p) => (
            <SmartLink key={p.id} href={newsHref(p)} className="sw-as-card sw-as-news">
              {p.image && <img src={p.image} alt="" />}
              <div>
                <span className="sw-as-cardtag">{p.category}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
              </div>
            </SmartLink>
          ))}
          {ev && (
            <SmartLink href={`/events/${ev.slug ?? slugify(ev.title)}`} className="sw-as-card sw-as-event">
              <span className="sw-as-cardtag">Upcoming</span>
              <h3>{ev.title}</h3>
              <p>{formatDate(ev.date)}{ev.location ? ` · ${ev.location}` : ""}</p>
            </SmartLink>
          )}
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ---------------------------------------------------------------------- Bento */
function Bento() {
  const { id, news, events, fixtures, ladder, sponsors } = useData();
  const lead = news[0];
  const next = fixtures[0];
  const ev = events[0];
  const topLadder = ladder.slice(0, 5);
  const sponsor = sponsors[0];
  return (
    <>
      <section className="sw-section">
        <div className="sw-container sw-bento">
          {lead && (
            <SmartLink href={newsHref(lead)} className="sw-bento-cell sw-bento-lead">
              {lead.image && <img src={lead.image} alt="" />}
              <div className="sw-bento-leadbody">
                <span className="sw-bento-tag">{lead.category}</span>
                <h2>{lead.title}</h2>
              </div>
            </SmartLink>
          )}
          {next && (
            <div className="sw-bento-cell sw-bento-match">
              <span className="sw-bento-tag">Next match</span>
              <h3>{id.shortName} v {next.opponent}</h3>
              <p>{next.date}</p>
              <SmartLink href="/fixtures" className="sw-link-arrow">Match centre →</SmartLink>
            </div>
          )}
          {ev && (
            <SmartLink href={`/events/${ev.slug ?? slugify(ev.title)}`} className="sw-bento-cell sw-bento-event">
              <span className="sw-bento-tag">Event</span>
              <h3>{ev.title}</h3>
              <p>{formatDate(ev.date)}</p>
            </SmartLink>
          )}
          {topLadder.length > 0 && (
            <div className="sw-bento-cell sw-bento-ladder">
              <span className="sw-bento-tag">Ladder</span>
              <ol>
                {topLadder.map((r, i) => (
                  <li key={i} className={r.isClub ? "is-club" : undefined}>
                    <span>{r.team}</span>
                    <span>{r.points}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {news[1] && (
            <SmartLink href={newsHref(news[1])} className="sw-bento-cell sw-bento-news">
              <span className="sw-bento-tag">News</span>
              <h3>{news[1].title}</h3>
            </SmartLink>
          )}
          <div className="sw-bento-cell sw-bento-cta">
            <h3>Join {id.shortName}</h3>
            <SmartLink href="/register" className="sw-btn">Register</SmartLink>
            {sponsor?.logo && <img className="sw-bento-sponsor" src={sponsor.logo} alt={sponsor.name} />}
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* -------------------------------------------------------------- Sponsor-forward */
function SponsorForward() {
  const { sponsors } = useData();
  const featured = sponsors.filter((s) => s.tier === "platinum" || s.tier === "gold").slice(0, 6);
  return (
    <>
      <Hero />
      <section className="sw-section sw-sf-showcase">
        <div className="sw-container">
          <div className="sw-sf-head">
            <h2>Our partners</h2>
            <p>The businesses that make our club possible.</p>
          </div>
          <div className="sw-sf-grid">
            {featured.map((s) => (
              <div key={s.name} className="sw-sf-card">
                {s.logo ? <img src={s.logo} alt={s.name} /> : <span className="sw-sf-name">{s.name}</span>}
                {s.blurb && <p>{s.blurb}</p>}
              </div>
            ))}
          </div>
          <div className="sw-sf-cta">
            <h3>Want your business here?</h3>
            <SmartLink href="/sponsors" className="sw-btn">Become a partner</SmartLink>
          </div>
        </div>
      </section>
      <FeaturedNews limit={3} />
      <MatchCentre />
      <SponsorStrip />
    </>
  );
}

/* --------------------------------------------------------------------- Portal */
function Portal() {
  const { id, news, events, fixtures } = useData();
  const links = [
    { label: "News", href: "/news" },
    { label: "Fixtures & results", href: "/fixtures" },
    { label: "Teams", href: "/teams" },
    { label: "Events", href: "/events" },
    { label: "Sponsors", href: "/sponsors" },
    { label: "Register", href: "/register" },
    { label: "Contact", href: "/contact" },
  ];
  const next = fixtures[0];
  return (
    <section className="sw-section">
      <div className="sw-container sw-portal">
        <aside className="sw-portal-rail">
          <div className="sw-portal-brand">{id.shortName}</div>
          <nav>
            {links.map((l) => (
              <SmartLink key={l.href} href={l.href}>{l.label}</SmartLink>
            ))}
          </nav>
        </aside>
        <div className="sw-portal-main">
          {next && (
            <div className="sw-portal-card sw-portal-match">
              <span className="sw-portal-tag">Next match</span>
              <h3>{id.shortName} v {next.opponent}</h3>
              <p>{next.date} · {next.venue}</p>
              <SmartLink href="/fixtures" className="sw-link-arrow">Match centre →</SmartLink>
            </div>
          )}
          <div className="sw-portal-card">
            <h3>Latest news</h3>
            <ul className="sw-portal-list">
              {news.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <SmartLink href={newsHref(p)}>{p.title}</SmartLink>
                  <span>{formatDate(p.date)}</span>
                </li>
              ))}
            </ul>
          </div>
          {events.length > 0 && (
            <div className="sw-portal-card">
              <h3>What&apos;s on</h3>
              <ul className="sw-portal-list">
                {events.slice(0, 4).map((ev) => (
                  <li key={ev.id}>
                    <SmartLink href={`/events/${ev.slug ?? slugify(ev.title)}`}>{ev.title}</SmartLink>
                    <span>{formatDate(ev.date)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------- small shared pieces */
function RailFixtures({ fixtures }: { fixtures: ReturnType<typeof useData>["fixtures"] }) {
  if (!fixtures.length) return null;
  return (
    <div className="sw-bs-railcard">
      <h4>Next fixtures</h4>
      <ul className="sw-bs-fixtures">
        {fixtures.slice(0, 4).map((f, i) => (
          <li key={i}>
            <span>{f.opponent}</span>
            <span>{f.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function RailLadder({ ladder }: { ladder: ReturnType<typeof useData>["ladder"] }) {
  if (!ladder.length) return null;
  return (
    <div className="sw-bs-railcard">
      <h4>Ladder</h4>
      <ol className="sw-bs-ladder">
        {ladder.slice(0, 5).map((r, i) => (
          <li key={i} className={r.isClub ? "is-club" : undefined}>
            <span>{r.team}</span>
            <span>{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Default home layout (the original block stack) for the existing variants. */
function Classic({ club }: { club: ClubConfig }) {
  const b = club.blocks;
  return (
    <>
      <Hero />
      {b.quickLinks && <QuickLinks />}
      {b.featuredNews && <FeaturedNews limit={3} />}
      {b.matchCentre && <MatchCentre />}
      {b.joinCta && <JoinCTA />}
      {b.sponsors && <SponsorStrip onlyCarousel />}
    </>
  );
}

const LAYOUTS: Partial<Record<DesignVariant, () => ReactNode>> = {
  broadsheet: Broadsheet,
  matchday: Matchday,
  appshell: AppShell,
  bento: Bento,
  sponsorforward: SponsorForward,
  portal: Portal,
};

export function HomeLayout() {
  const { club, variant } = useClub();
  const Layout = LAYOUTS[variant];
  if (Layout) return <Layout />;
  return <Classic club={club} />;
}
