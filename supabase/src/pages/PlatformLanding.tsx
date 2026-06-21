import { useState } from "react";
import { Login } from "../admin/Login";

const MARKETING_URL = "https://sportsweb.com.au";
const SIGNUP_URL = "https://sportsweb.com.au/#pricing";

const FEATURES: { badge: string; title: string; body: string }[] = [
  { badge: "WB", title: "Club website", body: "A fast, branded website your committee edits itself — no developer required." },
  { badge: "VM", title: "Volunteer One", body: "Fair game-day rosters, reminders and thank-yous across SMS, email and push." },
  { badge: "T1", title: "Ticket One", body: "Sell event tickets, scan at the gate, and get paid straight to the club." },
  { badge: "MOD", title: "Modules", body: "Books, bookings, forms and learning — switch on what your club needs." },
];

/**
 * SportsWeb One front door. A SportsWeb-branded landing page; the log-in form
 * opens on demand rather than greeting every visitor. Sign up and Learn more
 * head to the marketing site to choose a plan.
 */
export function PlatformLanding() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="sw-land sw-brandwrap">
      <header className="sw-land-nav">
        <div className="sw-login-brand" style={{ margin: 0 }}>
          <span className="sw-login-mark">S1</span>
          <span className="sw-login-word">
            SportsWeb <span className="sw-login-one">One</span>
          </span>
        </div>
        <nav className="sw-land-navactions">
          <a className="sw-land-navlink" href={MARKETING_URL}>
            Learn more
          </a>
          <button className="sw-btn sw-btn--ghost sw-land-loginbtn" onClick={() => setShowLogin(true)}>
            Log in
          </button>
          <a className="sw-btn sw-land-getstarted" href={SIGNUP_URL}>
            Get started
          </a>
        </nav>
      </header>

      <section className="sw-land-hero">
        <p className="sw-land-eyebrow">The operating system for community sport</p>
        <h1 className="sw-land-title">
          Run your club from <span className="sw-login-one">one</span> place.
        </h1>
        <p className="sw-land-sub">
          Websites, volunteers, ticketing and more — one platform built for Australian football, netball
          and cricket clubs. AI prepares, humans approve, the system records everything.
        </p>
        <div className="sw-land-cta">
          <a className="sw-btn sw-land-cta-primary" href={SIGNUP_URL}>
            Get started — choose a plan
          </a>
          <button className="sw-btn sw-btn--ghost sw-land-cta-ghost" onClick={() => setShowLogin(true)}>
            Log in to your club →
          </button>
        </div>
      </section>

      <section className="sw-land-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="sw-land-feature">
            <span className="sw-land-fbadge">{f.badge}</span>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="sw-land-foot">SportsWeb One · the operating system for community sport</footer>

      {showLogin && (
        <div className="sw-land-modal" role="dialog" aria-modal="true" onClick={() => setShowLogin(false)}>
          <div className="sw-land-modal-inner" onClick={(e) => e.stopPropagation()}>
            <button className="sw-land-modal-close" aria-label="Close" onClick={() => setShowLogin(false)}>
              ×
            </button>
            <Login />
          </div>
        </div>
      )}
    </div>
  );
}
