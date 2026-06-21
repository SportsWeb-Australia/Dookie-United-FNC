# SportsWeb One — Club Website Template

A reusable football/netball club website, built as **template #1** of the SportsWeb
One system. **Client zero: Dookie United Football & Netball Club (DUFNC).**

Everything a club shows is driven by a single typed content file
(`src/content/club.config.ts`). Layout and components stay fixed; clubs change
content and pick a design — that's the whole template idea.

---

## Stack

- **Vite + React + TypeScript**
- **react-router-dom** for routing
- Plain CSS with design tokens (no UI framework — keeps the build light and portable)
- Google Fonts: Big Shoulders Display / Outfit / Geist Mono (the SportsWeb brand type system)
- Deploys on **Vercel** (SPA rewrite in `vercel.json`)

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to /dist
npm run preview  # preview the production build
```

## Design variants

The same content renders in eight visual templates, chosen by `variant` in the config.

**Text/motif-led** (the club's diagonal-stripe signature; no photography needed):

- **`heritage`** — light, clean, community/sponsor-friendly (default).
- **`broadcast`** — dark, bold, match-day broadcast energy.
- **`arena`** — sharp-edged, flat, high-contrast sporting look with a black hero.
- **`classic`** — silver-toned, rounded, soft premium-heritage feel.

**Media-led** (image or video hero, distinct layouts — see `hero.backgroundImage`,
`hero.video`, `hero.poster`):

- **`stadium`** — full-bleed photo/video hero, dark gradient, text bottom-left, a
  scoreboard-style stats strip; light content pages (Oswald).
- **`editorial`** — magazine layout: image to one side with the headline in an
  overlapping card, serif headlines (Playfair Display).
- **`momentum`** — diagonal split hero (solid block + clipped image), energetic
  condensed type (Saira Condensed), sharp edges.
- **`coastal`** — airy and minimal, a calm light-washed image band, centred type
  with lots of whitespace (Space Grotesk).

The media heroes use the bundled placeholder images (`/public/hero-dark.jpg`,
`/hero-light.jpg`) by default — set `hero.backgroundImage` (or `hero.video` +
`hero.poster`) to use a real photo/clip. Video autoplays muted/looping with the
poster as fallback.

While `showVariantSwitcher: true`, a floating **Design** toggle (bottom-right) lets a
club preview all eight live. **Set `showVariantSwitcher: false` for production** once a
design is locked. For production, also trim `index.html` to just the chosen design's
fonts.

## Make a new club from this template

1. Copy the project.
2. Edit `src/content/club.config.ts` — identity, colours, sponsors, teams, news, etc.
3. Drop the club logo into `public/` and point `identity.logo` at it.
4. Set `identity.colours` — those four values are the only colours that change; the
   whole theme (both variants) re-derives from them at runtime.
5. Pick a `variant`.

No component or CSS edits needed for a standard reskin.

## Content model

`src/content/types.ts` is the schema the future SportsWeb One admin dashboard maps
onto. `blocks` toggles turn whole homepage sections on/off per club.

## Connect to SportsWeb One (Supabase)

The site reads live content from the SportsWeb One Supabase project and falls back
to the bundled `club.config.ts` for anything the DB doesn't hold — so the site is
always complete, and works even before any env vars are set.

- `src/lib/supabase.ts` — the client (env-driven, with a fallback to the SportsWeb
  One project so it works out of the box).
- `src/lib/loadClub.ts` — fetches the club + its news / events / sponsors / teams /
  committee by `clubs.slug`, maps them to `ClubConfig`, and merges over the static
  defaults. Any failure → bundled config.

### Setup

Set these in Vercel (Project → Settings → Environment Variables) and locally in `.env`:

```
VITE_SUPABASE_URL=https://uzibfawcwoapfbigpzum.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-anon-key
VITE_CLUB_SLUG=dookie-united   # which club this deployment renders
```

The anon key is the publishable key (safe in the browser, RLS-protected). The
service-role key must never go in front-end code.

### Table → template mapping

| Supabase | ClubConfig |
| --- | --- |
| `clubs` | identity (name, slug, logo_url, colours from primary/secondary), contact |
| `clubs.selected_template_id` → `templates.template_key` | design `variant` |
| `news` (published) | news (title, summary→excerpt, published_at→date) |
| `events` (published, upcoming) | events |
| `sponsors` (published) | sponsors (sponsor_level→tier) |
| `teams` (published) | teams (grouped by sport) |
| `people` (committee-type roles) | committee |

`template_key` → variant is set in `loadClub.ts` (`default`→heritage,
`afl-classic`→arena, `club-modern`→broadcast). Add a row whose key maps to
`classic` to expose the fourth design.

### Known gaps (need a schema/admin decision)

1. **Colours** — `clubs` stores two (primary/secondary); this template themes on
   four (ink/paper/accent/silver). It derives ink + accent heuristically; for
   precise control, add explicit `accent_colour` / `ink_colour` columns.
2. **Multi-sport clubs** — `clubs.sport_type` is single and `teams` has no sport
   column, so football + netball can't be grouped separately. Add `teams.sport_type`
   (or `sport`) for clubs like Dookie that run both.
3. **News** — no `category` or `image_url` columns (defaults to "News", no image).
4. **Club documents/policies** — no club-level documents table (volunteer_documents
   is volunteer-only). Add one (label, kind, file_url, status, display_order).
5. **Freeform copy** — hero text, President's welcome, About, nav and footer come
   from the bundled config. Wire these to the `pages` table once its columns are
   confirmed.
6. **Committee** — `people.roles` is used with a keyword filter; a `display_on_website`
   flag (and order) would be cleaner.
7. **Match centre** — stays on the GameDay/PlayHQ embed; no fixtures tables needed.

Editing still happens in the SportsWeb One admin (which writes to these tables);
this site reflects those edits live.

## Club admin (self-serve editing)

A built-in admin lets club staff edit their own content. Visit **`/admin`**.

- Sign in with Supabase Auth (email + password).
- The signed-in user is matched to a club via `club_users(user_id, club_id, role)`.
- CRUD for **news, events, sponsors and teams**, scoped to that club.
- Security is enforced by **row-level security**, not the UI. Run
  `supabase/admin-policies.sql` (adjust table names if needed) so members can only
  read/write their own club's rows, and the public can read published rows.

Setup per club: create the user in Supabase Auth, add a `club_users` row linking
them to their `club_id`. The admin shares the site's env vars; no extra config.

This admin lives in the template for now. Longer term it can move into the central
SportsWeb One app so auth/roles live in one place and club sites stay read-only —
the table contract is identical either way.

## PWA (installable + push)

- `public/manifest.webmanifest` + icons + `public/sw.js` make the site installable
  and offline-capable (content stays network-first so it's never stale).
- An **install prompt** appears on supported devices (with iOS "Add to Home Screen"
  instructions); a **push opt-in** prompt requests notification permission.
- Push delivery is provider-agnostic. Set `VITE_VAPID_PUBLIC_KEY` and
  `VITE_PUSH_SUBSCRIBE_URL` (e.g. a Supabase Edge Function) to store subscriptions;
  the SW's `push` handler shows the notification. Without those, the prompt still
  captures permission. (If SportsWeb One sends via WebPushr, point the subscribe
  step there instead.)
- Manifest name/colours are Dookie's; generate per club for production.

## Sponsor layouts

Not every club ranks sponsors. `sponsorDisplay` controls presentation:
`"tiered"` (platinum/gold/silver, default), `"flat"` (one equal logo wall), or
`"featured"` (top tier large, the rest in a wall). Map it from an optional
`clubs.sponsor_display` column.

## Mobile

An app-style bottom tab bar (Home / Fixtures / News / Join / Club) appears on
phones; the desktop header hides on mobile. Everything is responsive across phone,
tablet and desktop.

## Teams: sport & program pages

Teams are structured so each program has its own page:

- `/football`, `/netball` — per-sport landing pages listing only that sport's programs.
- `/program/:slug` — a single program (e.g. Seniors & Reserves) with its grades and
  details, plus links to sibling programs and the other sport.
- `/teams` — a combined overview linking into both.

Programs live in `club.config.ts` under `teams[]` (each with a `slug`, `grades`,
and `href`). The nav dropdowns point at these routes.

## SEO

- Per-page `<title>` + meta description + canonical + Open Graph are set by
  `SeoManager` (static routes) and `useSeo` (sport/program pages) in `src/lib/seo.ts`.
- `index.html` carries default meta + `SportsOrganization` JSON-LD.
- `public/robots.txt`, `public/sitemap.xml` (update the domain on go-live), and icons.
- Note: this is a client-rendered SPA, so JS-aware crawlers (Google) see per-page tags,
  but some social scrapers only read `index.html`'s defaults. For per-page social cards,
  add a prerender/SSG step — happy to wire that when the domain is set.

## Redirects (go-live)

`vercel.json` has the SPA rewrite (so deep links like `/football` work on refresh) and
a `redirects` array for 301s. On go-live, add the canonical host redirect (apex↔www)
and any old→new URL maps there, e.g.:

```json
{ "source": "/old-news/:slug", "destination": "/news", "permanent": true }
```

## Match Centre

Three modes, set by `matchCentre.mode` in the config:

- **`manual`** (current) — fixtures/results/ladder come straight from the config.
- **`embed`** — renders the provider's live pages (GameDay for football) in an
  iframe, one per tab. Auto-updates when the league uploads results; no API key.
- **`api`** — implement `fetchFromApi()` in `src/lib/matchData.ts`.

A **Live source** bar (Football → GameDay, Netball → PlayHQ, League site) shows in
every mode, so the live data is always one tap away.

### Turning on the GameDay embed

1. Open the GameDay competitions hub:
   `websites.mygameday.app/assoc_page.cgi?c=0-6191-0-645511-0&a=COMPS`
2. Click **2026 Seniors → Fixture**. Copy that page URL.
3. Do the same for **Results** and **Ladder** (and optionally filter to Dookie United).
4. Paste the three URLs into `matchCentre.embed` (`fixtures` / `results` / `ladder`)
   in `src/content/club.config.ts`.
5. Set `matchCentre.mode: "embed"`.

Note: some provider pages send `X-Frame-Options`, which can block iframing. If a tab
shows blank, the embed panel's **Open ↗** link still works, or stay on `manual`. The
GameDay account admin can confirm/allow framing or supply an official widget.

Netball lives on PlayHQ; the Live source bar links there until a netball feed/embed is added.

## Data source reference

- Football (Seniors, Reserves, U14, U17): **GameDay** — `websites.mygameday.app`,
  PDFNL association id `0-6191-0-645511-0`.
- Netball + registration: **PlayHQ** — org `picola-and-district-football-netball-league/ffc532a8`.
- League site: `pdfnl.com`.

## What still needs real content (placeholders)

Items marked `placeholder: true` in the config render a small **Placeholder** flag in
the UI so they're easy to spot. Before launch, confirm/supply:

- **News** — currently three sample posts.
- **Events** — currently three sample events.
- **Committee** — only the President is real; the rest are role placeholders.
- **Documents** — labels are in; real files/links needed.
- **Match data** — sample fixtures/results/ladder, or wire the API.
- **Hero photo** — `hero.backgroundImage` is empty (the diagonal motif shows instead).
- **Registration / store URLs** — confirm live PlayHQ + Hip Pocket store links.
- **Sponsor tiers** — current Major/Gold/Community split is a starting placement.
- **President portrait** — initials show until a photo is added.

## Note on the build

This source was authored without a local `npm install`/build step available in the
authoring environment, so the production build is verified by Vercel on push rather
than locally. The code uses only standard, current dependencies and a conventional
Vite + React + TS structure. A filesystem import/export check was run over all
modules before delivery.
