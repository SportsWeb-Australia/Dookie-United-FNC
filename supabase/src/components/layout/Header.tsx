import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useClub } from "../ClubContext";

export function Header() {
  const { club } = useClub();
  const { identity, contact, nav } = club;
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the drawer whenever navigation occurs.
  const close = () => setOpen(false);

  return (
    <>
      <div className="sw-topbar">
        <div className="sw-container">
          <span>{identity.location}</span>
          <div className="sw-topbar-meta">
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            {contact.instagram && (
              <a href={contact.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {contact.facebook && (
              <a href={contact.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
          </div>
        </div>
      </div>

      <header className="sw-header">
        <div className="sw-container">
          <Link to="/" className="sw-brand" onClick={close}>
            <img src={identity.logo} alt={`${identity.name} logo`} />
            <span className="sw-brand-text">
              <span className="sw-brand-name">{identity.shortName}</span>
              <br />
              <span className="sw-brand-sub">{identity.sports.join(" · ")}</span>
            </span>
          </Link>

          <nav className="sw-nav" aria-label="Primary">
            <ul>
              {nav.map((item) => (
                <li key={item.label} className="sw-nav-item">
                  <NavLink
                    to={item.href}
                    className="sw-nav-link"
                    end={item.href === "/"}
                  >
                    {item.label}
                    {item.children && <span aria-hidden="true">▾</span>}
                  </NavLink>
                  {item.children && (
                    <div className="sw-submenu">
                      {item.children.map((c) => (
                        <Link key={c.label} to={c.href.startsWith("/") ? c.href : "/"}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <Link to="/register" className="sw-btn sw-header-cta">
            Join the club
          </Link>

          <button
            className="sw-burger"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="sw-drawer" data-open={open} key={location.pathname}>
        {nav.map((item) =>
          item.children ? (
            <details key={item.label}>
              <summary>{item.label}</summary>
              {item.children.map((c) => (
                <Link
                  key={c.label}
                  to={c.href.startsWith("/") ? c.href : "/"}
                  onClick={close}
                >
                  {c.label}
                </Link>
              ))}
            </details>
          ) : (
            <Link key={item.label} to={item.href} onClick={close}>
              {item.label}
            </Link>
          )
        )}
        <Link to="/register" className="sw-btn" onClick={close}>
          Join the club
        </Link>
      </div>
    </>
  );
}
