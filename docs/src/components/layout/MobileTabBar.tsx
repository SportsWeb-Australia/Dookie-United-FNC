import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
}

const I = {
  home: (
    <path d="M3 11.5 12 4l9 7.5M5 10v10h5v-6h4v6h5V10" />
  ),
  fixtures: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  news: (
    <>
      <path d="M4 4h13v16H6a2 2 0 0 1-2-2z" />
      <path d="M17 8h3v10a2 2 0 0 1-2 2M7 8h7M7 12h7M7 16h5" />
    </>
  ),
  join: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.2 2.6-5.5 5.5-5.5s5.5 2.3 5.5 5.5M18 8v6M15 11h6" />
    </>
  ),
  club: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />
    </>
  ),
};

const TABS: Tab[] = [
  { to: "/", label: "Home", icon: I.home },
  { to: "/fixtures", label: "Fixtures", icon: I.fixtures },
  { to: "/news", label: "News", icon: I.news },
  { to: "/register", label: "Join", icon: I.join },
  { to: "/about", label: "Club", icon: I.club },
];

export function MobileTabBar() {
  return (
    <nav className="sw-tabbar" aria-label="Quick navigation">
      {TABS.map((t) => (
        <NavLink key={t.to} to={t.to} className="sw-tab" end={t.to === "/"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
