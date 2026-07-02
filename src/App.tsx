import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { emptyClub } from "./content/emptyClub";
import { getClubConfig } from "./lib/loadClub";
import { isPlatformHost, hasPreviewClub } from "./lib/supabase";
import { ClubContext } from "./components/ClubContext";
import { AuthProvider, useAuth } from "./lib/auth";
import { EditProvider } from "./lib/edit";
import { registerServiceWorker } from "./lib/pwa";
import type { ClubConfig, DesignVariant } from "./content/types";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { AnnouncementBar } from "./components/blocks/AnnouncementBar";
import { TrialBanner } from "./components/blocks/TrialBanner";
import { AppPrompts } from "./components/pwa/AppPrompts";

import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Teams } from "./pages/Teams";
import { Sport } from "./pages/Sport";
import { Program } from "./pages/Program";
import { Fixtures } from "./pages/Fixtures";
import { News } from "./pages/News";
import { NewsArticle } from "./pages/NewsArticle";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Sponsors } from "./pages/Sponsors";
import { Documents } from "./pages/Documents";
import { Contact } from "./pages/Contact";
import { Register } from "./pages/Register";
import { NotFound } from "./pages/NotFound";
import { StartTrial } from "./pages/StartTrial";
import { Guide } from "./pages/Guide";
import { AdminApp } from "./admin/AdminApp";
import { PlatformLanding } from "./pages/PlatformLanding";
import { SeoManager } from "./lib/seo";

/** Scroll to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/**
 * Root of a SportsWeb One platform host. Logged out → the SportsWeb One entry
 * page (log in / sign up / learn more). Logged in → straight into the admin,
 * where the user's own club (or the platform console) resolves. Club custom
 * domains never reach here — their root renders the club's public homepage.
 */
function PlatformFront() {
  const { ready, email } = useAuth();
  if (!ready) return <div className="sw-admin-loading">Loading…</div>;
  if (email) return <Navigate to="/admin" replace />;
  return <PlatformLanding />;
}

export default function App() {
  // Static config renders instantly; live Supabase content swaps in when ready.
  // Seed with the neutral base, not the demo club, so a non-demo club never paints
  // Dookie's name/content for a frame before getClubConfig() resolves.
  const [club, setClub] = useState<ClubConfig>(emptyClub);
  const [variant, setVariant] = useState<DesignVariant>(emptyClub.variant);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const isTrial = location.pathname.startsWith("/start");
  const isGuide = location.pathname.startsWith("/guide");
  // Host-aware front door: on a SportsWeb One platform host, the root path shows
  // the SportsWeb One entry page — unless a club preview override is active, in
  // which case we render that club's public site for demos/screenshots.
  const [platformHost] = useState(() => isPlatformHost());
  const isPlatformFront =
    location.pathname === "/" && platformHost && !hasPreviewClub();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  // The admin is its own SportsWeb One-branded installable app: when inside
  // /admin we swap the manifest, theme colour and app icon to SportsWeb One,
  // and restore the club's branding for the public site.
  useEffect(() => {
    const head = document.head;
    const setMeta = (name: string, content: string) => {
      let m = head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute("name", name);
        head.appendChild(m);
      }
      m.setAttribute("content", content);
    };
    const setLink = (rel: string, href: string) => {
      let l = head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!l) {
        l = document.createElement("link");
        l.setAttribute("rel", rel);
        head.appendChild(l);
      }
      l.setAttribute("href", href);
    };
    if (isAdmin) {
      setLink("manifest", "/admin.webmanifest");
      setLink("apple-touch-icon", "/sw1-apple-touch.png");
      setMeta("theme-color", "#2563eb");
      setMeta("apple-mobile-web-app-title", "SportsWeb One");
    } else {
      setLink("manifest", "/manifest.webmanifest");
      setLink("apple-touch-icon", "/icon-192.png");
      setMeta("theme-color", "#000000");
      setMeta("apple-mobile-web-app-title", club.identity?.shortName ?? "SportsWeb");
    }
  }, [isAdmin, club]);

  useEffect(() => {
    let active = true;
    getClubConfig().then((c) => {
      if (!active) return;
      setClub(c);
      // Preview override: ?variant=<key> forces a template for screenshots/demos.
      let v = c.variant;
      try {
        const q = new URLSearchParams(window.location.search).get("variant");
        if (q) v = q as DesignVariant;
      } catch {
        /* ignore */
      }
      setVariant(v);
    });
    return () => {
      active = false;
    };
  }, []);

  // Inject brand colours (the only runtime-themed tokens) from the live config.
  useEffect(() => {
    const root = document.documentElement;
    const c = club.identity.colours;
    root.style.setProperty("--club-ink", c.ink);
    root.style.setProperty("--club-paper", c.paper);
    root.style.setProperty("--club-accent", c.accent);
    root.style.setProperty("--club-silver", c.silver);
    // Colour-forward fill + its readable on-colour (computed in deriveColours).
    // Falls back to accent/paper for the static Dookie config, which has neither.
    root.style.setProperty("--brand-fill", c.primary ?? c.accent);
    root.style.setProperty("--brand-fill-on", c.primaryOn ?? c.paper);
  }, [club]);

  useEffect(() => {
    document.documentElement.setAttribute("data-variant", variant);
  }, [variant]);

  // Public self-serve trial signup runs as its own clean page (no club chrome).
  if (isTrial) {
    return <StartTrial />;
  }

  // Standalone quick-start guide (linked from the welcome email).
  if (isGuide) {
    return <Guide />;
  }

  // SportsWeb One front door: platform host root, no club chrome.
  if (isPlatformFront) {
    return (
      <AuthProvider>
        <PlatformFront />
      </AuthProvider>
    );
  }

  // Admin runs as its own full-screen app, without the public site chrome.
  if (isAdmin) {
    return (
      <AuthProvider>
        <ClubContext.Provider value={{ club, variant, setVariant }}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
          </Routes>
        </ClubContext.Provider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <ClubContext.Provider value={{ club, variant, setVariant }}>
        <EditProvider>
          <a href="#main" className="sw-skip">
            Skip to content
          </a>
          <ScrollToTop />
          <SeoManager />
          <TrialBanner />
          <AnnouncementBar />
          <Header />
          <main id="main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/football" element={<Sport sport="Football" />} />
              <Route path="/netball" element={<Sport sport="Netball" />} />
              <Route path="/program/:slug" element={<Program />} />
              <Route path="/fixtures" element={<Fixtures />} />
              <Route path="/news" element={<News />} />
              <Route path="/news/:slug" element={<NewsArticle />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/sponsors" element={<Sponsors />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
          <MobileTabBar />
          <AppPrompts />
        </EditProvider>
      </ClubContext.Provider>
    </AuthProvider>
  );
}
