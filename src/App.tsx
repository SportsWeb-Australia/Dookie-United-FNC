import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { club as staticClub } from "./content/club.config";
import { getClubConfig } from "./lib/loadClub";
import { ClubContext } from "./components/ClubContext";
import type { ClubConfig, DesignVariant } from "./content/types";

import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { VariantSwitcher } from "./components/layout/VariantSwitcher";
import { AnnouncementBar } from "./components/blocks/AnnouncementBar";

import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Teams } from "./pages/Teams";
import { Fixtures } from "./pages/Fixtures";
import { News } from "./pages/News";
import { Events } from "./pages/Events";
import { Sponsors } from "./pages/Sponsors";
import { Documents } from "./pages/Documents";
import { Contact } from "./pages/Contact";
import { Register } from "./pages/Register";
import { NotFound } from "./pages/NotFound";

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

  return (
    <ClubContext.Provider value={{ club, variant, setVariant }}>
      <a href="#main" className="sw-skip">
        Skip to content
      </a>
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/fixtures" element={<Fixtures />} />
          <Route path="/news" element={<News />} />
          <Route path="/events" element={<Events />} />
          <Route path="/sponsors" element={<Sponsors />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      {club.showVariantSwitcher && <VariantSwitcher />}
    </ClubContext.Provider>
  );
}
