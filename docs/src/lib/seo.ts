import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useClub } from "../components/ClubContext";

export interface SeoInput {
  title: string;
  description?: string;
  image?: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function useSeo(seo: SeoInput | null) {
  useEffect(() => {
    if (!seo) return;
    document.title = seo.title;
    upsertMeta("property", "og:title", seo.title);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", window.location.href);
    if (seo.description) {
      upsertMeta("name", "description", seo.description);
      upsertMeta("property", "og:description", seo.description);
    }
    if (seo.image) {
      upsertMeta("property", "og:image", seo.image);
      upsertMeta("name", "twitter:card", "summary_large_image");
    }
    upsertCanonical(window.location.origin + window.location.pathname);
  }, [seo]);
}

/**
 * Central titles/descriptions for the static routes. Dynamic pages
 * (sport/program) set their own SEO and are intentionally absent here.
 */
export function SeoManager() {
  const { club } = useClub();
  const { pathname } = useLocation();
  const name = club.identity.name;
  const place = club.identity.location;

  const MAP: Record<string, SeoInput> = {
    "/": {
      title: `${name} | ${club.identity.league}`,
      description: club.hero.subtitle,
    },
    "/about": {
      title: `About | ${name}`,
      description: `The story, people and values of ${name} — football & netball in ${place}.`,
    },
    "/teams": {
      title: `Teams & Programs | ${name}`,
      description: `Football and netball teams and programs at ${name}, from juniors to seniors.`,
    },
    "/fixtures": {
      title: `Fixtures & Results | ${name}`,
      description: `Match fixtures, results and ladders for ${name}.`,
    },
    "/news": {
      title: `News | ${name}`,
      description: `The latest news and match wraps from ${name}.`,
    },
    "/events": {
      title: `Events | ${name}`,
      description: `Upcoming events, functions and key dates at ${name}.`,
    },
    "/sponsors": {
      title: `Sponsors & Partners | ${name}`,
      description: `Meet the sponsors who back ${name}, and find out how to get involved.`,
    },
    "/documents": {
      title: `Documents & Policies | ${name}`,
      description: `Club documents, forms and policies for ${name}.`,
    },
    "/contact": {
      title: `Contact | ${name}`,
      description: `Get in touch with ${name} in ${place}.`,
    },
    "/register": {
      title: `Join the Club | ${name}`,
      description: `Register to play football or netball with ${name} this season.`,
    },
  };

  useSeo(MAP[pathname] ?? null);
  return null;
}
