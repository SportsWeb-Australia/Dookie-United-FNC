import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { club as staticClub } from "./content/club.config";
import { getClubConfig } from "./lib/loadClub";
import { ClubContext } from "./components/ClubContext";
import { registerServiceWorker } from "./lib/pwa";
import type { ClubConfig, DesignVariant } from "./content/types";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { MobileTabBar } from "./components/layout/MobileTabBar";
import { AnnouncementBar } from "./components/blocks/AnnouncementBar";
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
import { AdminApp } from "./admin/AdminApp";
import { SeoManager } from "./lib/seo";

/** Scroll to top on every route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  // Static config renders instantly; live Supabase content swaps in when ready.
  const [club, setClub] = useState<ClubConfig>(staticClub);
  const [variant, setVariant] = useState<DesignVariant>(staticClub.variant);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    let active = true;
    getClubConfig().then((c) => {
      if (!active) return;
      setClub(c);
      setVariant(c.variant);
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
  }, [club]);

  useEffect(() => {
    document.documentElement.setAttribute("data-variant", variant);
  }, [variant]);

  // Admin runs as its own full-screen app, without the public site chrome.
  if (isAdmin) {
    return (
      <ClubContext.Provider value={{ club, variant, setVariant }}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </ClubContext.Provider>
    );
  }

  return (
    <ClubContext.Provider value={{ club, variant, setVariant }}>
      <a href="#main" className="sw-skip">
        Skip to content
      </a>
      <ScrollToTop />
      <SeoManager />
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
    </ClubContext.Provider>
  );
}
