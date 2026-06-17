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

/* --------------------------------------------------------------------- Poster */
function Poster() {
  const { id, news, fixtures } = useData();
  const next = fixtures[0];
  const lead = news[0];
  return (
    <>
      <section className="sw-po-hero">
        <div className="sw-container">
          <p className="sw-po-kicker">{id.league ?? id.shortName}</p>
          <h1>{id.name}</h1>
          <SmartLink href="/register" className="sw-po-btn">Register now →</SmartLink>
        </div>
      </section>
      <section className="sw-po-block sw-po-block--ink">
        <div className="sw-container">
          <span className="sw-po-label">Next match</span>
          {next ? (
            <h2>{id.shortName} v {next.opponent}</h2>
          ) : (
            <h2>Fixtures coming soon</h2>
          )}
          {next && <p className="sw-po-meta">{next.date} · {next.venue}</p>}
          <SmartLink href="/fixtures" className="sw-po-link">Match centre →</SmartLink>
        </div>
      </section>
      {lead && (
        <section className="sw-po-block sw-po-block--accent">
          <div className="sw-container">
            <span className="sw-po-label">Latest</span>
            <h2>
              <SmartLink href={newsHref(lead)}>{lead.title}</SmartLink>
            </h2>
            <p className="sw-po-meta">{lead.excerpt}</p>
            <SmartLink href="/news" className="sw-po-link">All news →</SmartLink>
          </div>
        </section>
      )}
      <section className="sw-po-block sw-po-block--paper">
        <div className="sw-container">
          <span className="sw-po-label">Join the club</span>
          <h2>Play. Volunteer. Sponsor.</h2>
          <div className="sw-po-ctas">
            <SmartLink href="/register" className="sw-po-link">Register →</SmartLink>
            <SmartLink href="/teams" className="sw-po-link">Our teams →</SmartLink>
            <SmartLink href="/sponsors" className="sw-po-link">Partner with us →</SmartLink>
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ----------------------------------------------------------------- Fieldcourt */
/* AFL + Netball dual club: navy hero, then a two-code split, then news. */
function FieldCourt() {
  const { id, news, fixtures } = useData();
  const next = fixtures[0];
  const lead = news[0];
  const rest = news.slice(1, 4);
  return (
    <>
      <section className="sw-fc-hero">
        <div className="sw-container">
          <p className="sw-fc-eyebrow">{id.league ?? "Football · Netball"}</p>
          <h1>{id.name}</h1>
          <p className="sw-fc-sub">One club, two codes — {id.shortName} fields football and netball sides across every grade.</p>
          <div className="sw-fc-herocta">
            <SmartLink href="/register" className="sw-btn">Register to play</SmartLink>
            <SmartLink href="/fixtures" className="sw-btn sw-btn-ghost">Fixtures</SmartLink>
          </div>
        </div>
      </section>
      <section className="sw-section">
        <div className="sw-container sw-fc-split">
          <article className="sw-fc-code sw-fc-code--footy">
            <span className="sw-fc-codetag">Football</span>
            <h2>Seniors &amp; Reserves</h2>
            <p>Saturday afternoons across the grades. New players welcome at every level.</p>
            {next && (
              <div className="sw-fc-nextline">
                <span>Next</span>
                <strong>{id.shortName} v {next.opponent}</strong>
                <span>{next.date} · {next.venue}</span>
              </div>
            )}
            <SmartLink href="/teams" className="sw-link-arrow">Football teams →</SmartLink>
          </article>
          <article className="sw-fc-code sw-fc-code--netball">
            <span className="sw-fc-codetag">Netball</span>
            <h2>A-grade to juniors</h2>
            <p>Court action every round, with pathways from NetSetGo through to A-grade.</p>
            <div className="sw-fc-nextline">
              <span>Season</span>
              <strong>Pre-season training on now</strong>
              <span>Wednesday nights · Club courts</span>
            </div>
            <SmartLink href="/teams" className="sw-link-arrow">Netball teams →</SmartLink>
          </article>
        </div>
      </section>
      <section className="sw-section sw-fc-newswrap">
        <div className="sw-container">
          <div className="sw-fc-newshead">
            <h2>Club news</h2>
            <SmartLink href="/news" className="sw-link-arrow">All news →</SmartLink>
          </div>
          <div className="sw-fc-newsgrid">
            {lead && (
              <SmartLink href={newsHref(lead)} className="sw-fc-lead">
                {lead.image && <img src={lead.image} alt="" />}
                <div>
                  <span className="sw-fc-cat">{lead.category}</span>
                  <h3>{lead.title}</h3>
                  <p>{lead.excerpt}</p>
                </div>
              </SmartLink>
            )}
            <div className="sw-fc-newsside">
              {rest.map((p) => (
                <SmartLink key={p.id} href={newsHref(p)} className="sw-fc-mini">
                  <span className="sw-fc-cat">{p.category}</span>
                  <h4>{p.title}</h4>
                  <span className="sw-fc-date">{formatDate(p.date)}</span>
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* -------------------------------------------------------------------- Masters */
/* AFL Masters: warm, social, events-first, photo-led, serif headings. */
function Masters() {
  const { id, news, events, fixtures } = useData();
  const next = fixtures[0];
  const lead = news[0];
  const rest = news.slice(1, 3);
  const evs = events.slice(0, 3);
  return (
    <>
      <section className="sw-ma-hero">
        <div className="sw-container">
          <p className="sw-ma-eyebrow">{id.league ?? "Masters football"}</p>
          <h1>{id.name}</h1>
          <p className="sw-ma-sub">Footy for the love of it — over-35s having a run, and a club that&apos;s as much about the rooms after the game as the game itself.</p>
          <div className="sw-ma-herocta">
            <SmartLink href="/register" className="sw-btn">Come for a run</SmartLink>
            <SmartLink href="/contact" className="sw-btn sw-btn-ghost">Get in touch</SmartLink>
          </div>
        </div>
      </section>
      <section className="sw-section sw-ma-socialwrap">
        <div className="sw-container">
          <div className="sw-ma-head">
            <h2>What&apos;s on at the club</h2>
            <p>The social calendar — the real reason we keep turning up.</p>
          </div>
          <div className="sw-ma-events">
            {evs.length ? evs.map((e) => (
              <SmartLink key={e.id} href="/events" className="sw-ma-event">
                <span className="sw-ma-evdate">{formatDate(e.date)}</span>
                <h3>{e.title}</h3>
                {e.location && <p>{e.location}</p>}
              </SmartLink>
            )) : (
              <p className="sw-ma-empty">Season launch and social calendar coming soon.</p>
            )}
          </div>
        </div>
      </section>
      <section className="sw-section sw-ma-roomswrap">
        <div className="sw-container sw-ma-rooms">
          <div className="sw-ma-roomslead">
            <span className="sw-ma-kicker">From the rooms</span>
            {lead ? (
              <SmartLink href={newsHref(lead)} className="sw-ma-leadlink">
                {lead.image && <img src={lead.image} alt="" />}
                <h3>{lead.title}</h3>
                <p>{lead.excerpt}</p>
              </SmartLink>
            ) : <p>Match reports and yarns from around the club.</p>}
          </div>
          <aside className="sw-ma-roomsside">
            {next && (
              <div className="sw-ma-nextcard">
                <span>Next game</span>
                <strong>{id.shortName} v {next.opponent}</strong>
                <p>{next.date} · {next.venue}</p>
              </div>
            )}
            {rest.map((p) => (
              <SmartLink key={p.id} href={newsHref(p)} className="sw-ma-sidelink">
                <h4>{p.title}</h4>
                <span>{formatDate(p.date)}</span>
              </SmartLink>
            ))}
          </aside>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ---------------------------------------------------------------------- Pitch */
/* Soccer: sleek, with a horizontal fixture rail as the signature element. */
function Pitch() {
  const { id, news, fixtures } = useData();
  const rail = fixtures.slice(0, 6);
  const grid = news.slice(0, 6);
  return (
    <>
      <section className="sw-pi-hero">
        <div className="sw-container">
          <p className="sw-pi-eyebrow">{id.league ?? "Football club"}</p>
          <h1>{id.name}</h1>
          <p className="sw-pi-sub">The beautiful game, played our way — senior men&apos;s, women&apos;s and junior sides.</p>
          <div className="sw-pi-herocta">
            <SmartLink href="/register" className="sw-btn">Join the club</SmartLink>
            <SmartLink href="/fixtures" className="sw-btn sw-btn-ghost">Fixtures &amp; table</SmartLink>
          </div>
        </div>
      </section>
      <section className="sw-pi-railwrap">
        <div className="sw-container">
          <div className="sw-pi-railhead">
            <h2>Upcoming fixtures</h2>
            <SmartLink href="/fixtures" className="sw-link-arrow">Full list →</SmartLink>
          </div>
        </div>
        <div className="sw-pi-rail">
          {rail.length ? rail.map((f, i) => (
            <div key={i} className="sw-pi-fix">
              <span className="sw-pi-round">{f.round || "Fixture"}</span>
              <div className="sw-pi-teams">
                <strong>{id.shortName}</strong>
                <span className="sw-pi-v">v</span>
                <strong>{f.opponent}</strong>
              </div>
              <span className="sw-pi-when">{f.date}</span>
              <span className="sw-pi-where">{f.venue}</span>
            </div>
          )) : <div className="sw-pi-fix sw-pi-empty">Fixtures coming soon</div>}
        </div>
      </section>
      <section className="sw-section">
        <div className="sw-container">
          <div className="sw-pi-newshead">
            <h2>Latest</h2>
            <SmartLink href="/news" className="sw-link-arrow">All news →</SmartLink>
          </div>
          <div className="sw-pi-grid">
            {grid.map((p) => (
              <SmartLink key={p.id} href={newsHref(p)} className="sw-pi-card">
                {p.image && <img src={p.image} alt="" />}
                <div className="sw-pi-cardbody">
                  <span className="sw-pi-cat">{p.category}</span>
                  <h3>{p.title}</h3>
                  <p>{p.excerpt}</p>
                </div>
              </SmartLink>
            ))}
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ------------------------------------------------------------------ Scorecard */
/* Cricket: a scoreboard strip up top, then split fixtures | ladder columns. */
function Scorecard() {
  const { id, news, fixtures, results, ladder } = useData();
  const next = fixtures[0];
  const last = results[0];
  const cols = news.slice(0, 4);
  return (
    <>
      <section className="sw-sc-board">
        <div className="sw-container">
          <div className="sw-sc-boardgrid">
            <div className="sw-sc-bteam">
              <span className="sw-sc-blabel">Club</span>
              <strong>{id.shortName}</strong>
            </div>
            <div className="sw-sc-bmid">
              {last ? (
                <>
                  <span className="sw-sc-bstate">{last.outcome === "W" ? "Won" : last.outcome === "L" ? "Lost" : "Drew"}</span>
                  <span className="sw-sc-bscore">{last.scoreFor}{last.scoreAgainst ? ` – ${last.scoreAgainst}` : ""}</span>
                  <span className="sw-sc-bvs">v {last.opponent}</span>
                </>
              ) : (
                <span className="sw-sc-bstate">Season ahead</span>
              )}
            </div>
            <div className="sw-sc-bteam sw-sc-bteam--next">
              <span className="sw-sc-blabel">Next up</span>
              <strong>{next ? next.opponent : "TBC"}</strong>
              {next && <span className="sw-sc-bwhen">{next.date}</span>}
            </div>
          </div>
        </div>
      </section>
      <section className="sw-sc-hero">
        <div className="sw-container">
          <p className="sw-sc-eyebrow">{id.league ?? "Cricket club"}</p>
          <h1>{id.name}</h1>
          <p className="sw-sc-sub">Summer cricket across all grades — from juniors through to the first XI.</p>
        </div>
      </section>
      <section className="sw-section">
        <div className="sw-container sw-sc-split">
          <div className="sw-sc-panel">
            <h2>Fixtures</h2>
            <ul className="sw-sc-fixtures">
              {fixtures.length ? fixtures.slice(0, 5).map((f, i) => (
                <li key={i}>
                  <span className="sw-sc-fround">{f.round}</span>
                  <span className="sw-sc-fopp">v {f.opponent}</span>
                  <span className="sw-sc-fwhen">{f.date}</span>
                  <span className="sw-sc-fven">{f.venue}</span>
                </li>
              )) : <li className="sw-sc-empty">Fixtures coming soon</li>}
            </ul>
            <SmartLink href="/fixtures" className="sw-link-arrow">Full fixtures →</SmartLink>
          </div>
          <div className="sw-sc-panel">
            <h2>Ladder</h2>
            <ol className="sw-sc-ladder">
              {ladder.length ? ladder.slice(0, 6).map((r, i) => (
                <li key={i} className={r.isClub ? "is-club" : undefined}>
                  <span className="sw-sc-lpos">{i + 1}</span>
                  <span className="sw-sc-lteam">{r.team}</span>
                  <span className="sw-sc-lpts">{r.points}</span>
                </li>
              )) : <li className="sw-sc-empty">Ladder updates in-season</li>}
            </ol>
          </div>
        </div>
      </section>
      <section className="sw-section sw-sc-newswrap">
        <div className="sw-container">
          <div className="sw-sc-newshead">
            <h2>Club news</h2>
            <SmartLink href="/news" className="sw-link-arrow">All news →</SmartLink>
          </div>
          <div className="sw-sc-cols">
            {cols.map((p) => (
              <SmartLink key={p.id} href={newsHref(p)} className="sw-sc-col">
                <span className="sw-sc-cat">{p.category}</span>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <span className="sw-sc-date">{formatDate(p.date)}</span>
              </SmartLink>
            ))}
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ------------------------------------------------------------------ Hardcourt */
/* Basketball: dark asymmetric stat bento — hero tile + next/last/ladder tiles. */
function Hardcourt() {
  const { id, news, fixtures, results, ladder } = useData();
  const next = fixtures[0];
  const last = results[0];
  const clubRow = ladder.find((r) => r.isClub);
  const clubPos = clubRow ? ladder.indexOf(clubRow) + 1 : null;
  const lead = news[0];
  const row = news.slice(1, 4);
  return (
    <>
      <section className="sw-hc-bento">
        <div className="sw-container sw-hc-grid">
          <div className="sw-hc-tile sw-hc-main">
            <p className="sw-hc-eyebrow">{id.league ?? "Basketball"}</p>
            <h1>{id.name}</h1>
            <p className="sw-hc-sub">Run the floor with us — domestic and rep teams across every age group.</p>
            <div className="sw-hc-cta">
              <SmartLink href="/register" className="sw-btn">Get on a team</SmartLink>
              <SmartLink href="/fixtures" className="sw-btn sw-btn-ghost">Schedule</SmartLink>
            </div>
          </div>
          <div className="sw-hc-tile sw-hc-stat sw-hc-next">
            <span className="sw-hc-statlabel">Next game</span>
            {next ? (
              <>
                <strong className="sw-hc-statbig">{next.opponent}</strong>
                <span className="sw-hc-statsub">{next.date} · {next.venue}</span>
              </>
            ) : <strong className="sw-hc-statbig">TBC</strong>}
          </div>
          <div className="sw-hc-tile sw-hc-stat sw-hc-last">
            <span className="sw-hc-statlabel">Last result</span>
            {last ? (
              <>
                <strong className="sw-hc-statbig">{last.scoreFor}{last.scoreAgainst ? `–${last.scoreAgainst}` : ""}</strong>
                <span className="sw-hc-statsub">{last.outcome === "W" ? "Win" : last.outcome === "L" ? "Loss" : "Draw"} v {last.opponent}</span>
              </>
            ) : <strong className="sw-hc-statbig">—</strong>}
          </div>
          <div className="sw-hc-tile sw-hc-stat sw-hc-pos">
            <span className="sw-hc-statlabel">Ladder</span>
            <strong className="sw-hc-statbig">{clubPos ? `#${clubPos}` : "—"}</strong>
            <span className="sw-hc-statsub">{clubRow ? `${clubRow.points} pts` : "In-season"}</span>
          </div>
        </div>
      </section>
      <section className="sw-section sw-hc-newswrap">
        <div className="sw-container">
          <div className="sw-hc-newshead">
            <h2>Courtside</h2>
            <SmartLink href="/news" className="sw-link-arrow">All news →</SmartLink>
          </div>
          <div className="sw-hc-news">
            {lead && (
              <SmartLink href={newsHref(lead)} className="sw-hc-lead">
                {lead.image && <img src={lead.image} alt="" />}
                <div>
                  <span className="sw-hc-cat">{lead.category}</span>
                  <h3>{lead.title}</h3>
                  <p>{lead.excerpt}</p>
                </div>
              </SmartLink>
            )}
            <div className="sw-hc-newsrow">
              {row.map((p) => (
                <SmartLink key={p.id} href={newsHref(p)} className="sw-hc-mini">
                  <span className="sw-hc-cat">{p.category}</span>
                  <h4>{p.title}</h4>
                </SmartLink>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
  );
}

/* ------------------------------------------------------------------ Fastbreak */
/* Lacrosse: energetic, alternating zig-zag feature rows + a fixtures grid. */
function Fastbreak() {
  const { id, news, fixtures } = useData();
  const next = fixtures[0];
  const lead = news[0];
  const second = news[1];
  const grid = fixtures.slice(0, 4);
  return (
    <>
      <section className="sw-fb-hero">
        <div className="sw-container">
          <p className="sw-fb-eyebrow">{id.league ?? "Lacrosse"}</p>
          <h1>{id.name}</h1>
          <p className="sw-fb-sub">Fast, physical, end-to-end — the fastest game on two feet. Come and try it.</p>
          <SmartLink href="/register" className="sw-btn">Start playing</SmartLink>
        </div>
      </section>
      <section className="sw-section sw-fb-rows">
        <div className="sw-container">
          {next && (
            <div className="sw-fb-row">
              <div className="sw-fb-rowmedia sw-fb-rowmedia--accent">
                <span className="sw-fb-big">VS</span>
              </div>
              <div className="sw-fb-rowbody">
                <span className="sw-fb-tag">Next match</span>
                <h2>{id.shortName} v {next.opponent}</h2>
                <p>{next.round && `${next.round} · `}{next.date} · {next.venue}</p>
                <SmartLink href="/fixtures" className="sw-link-arrow">Match centre →</SmartLink>
              </div>
            </div>
          )}
          {lead && (
            <div className="sw-fb-row sw-fb-row--flip">
              <div className="sw-fb-rowmedia">
                {lead.image ? <img src={lead.image} alt="" /> : <span className="sw-fb-big">NEWS</span>}
              </div>
              <div className="sw-fb-rowbody">
                <span className="sw-fb-tag">Latest</span>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <SmartLink href={newsHref(lead)} className="sw-link-arrow">Read more →</SmartLink>
              </div>
            </div>
          )}
          {second && (
            <div className="sw-fb-row">
              <div className="sw-fb-rowmedia sw-fb-rowmedia--violet">
                {second.image ? <img src={second.image} alt="" /> : <span className="sw-fb-big">CLUB</span>}
              </div>
              <div className="sw-fb-rowbody">
                <span className="sw-fb-tag">Around the club</span>
                <h2>{second.title}</h2>
                <p>{second.excerpt}</p>
                <SmartLink href={newsHref(second)} className="sw-link-arrow">Read more →</SmartLink>
              </div>
            </div>
          )}
        </div>
      </section>
      <section className="sw-section sw-fb-fixwrap">
        <div className="sw-container">
          <div className="sw-fb-fixhead">
            <h2>Fixtures</h2>
            <SmartLink href="/fixtures" className="sw-link-arrow">Full list →</SmartLink>
          </div>
          <div className="sw-fb-fixgrid">
            {grid.length ? grid.map((f, i) => (
              <div key={i} className="sw-fb-fix">
                <span className="sw-fb-fround">{f.round || "Fixture"}</span>
                <strong>{f.opponent}</strong>
                <span className="sw-fb-fwhen">{f.date}</span>
                <span className="sw-fb-fwhere">{f.venue}</span>
              </div>
            )) : <div className="sw-fb-fix sw-fb-empty">Fixtures coming soon</div>}
          </div>
        </div>
      </section>
      <SponsorStrip onlyCarousel />
    </>
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
  poster: Poster,
  fieldcourt: FieldCourt,
  masters: Masters,
  pitch: Pitch,
  scorecard: Scorecard,
  hardcourt: Hardcourt,
  fastbreak: Fastbreak,
};

export function HomeLayout() {
  const { club, variant } = useClub();
  const Layout = LAYOUTS[variant];
  if (Layout) return <Layout />;
  return <Classic club={club} />;
}
