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

The same content renders in four visual templates, chosen by `variant` in the config:

- **`heritage`** — light, clean, community/sponsor-friendly (default).
- **`broadcast`** — dark, bold, match-day broadcast energy.
- **`arena`** — sharp-edged, flat, high-contrast sporting look with a black hero.
- **`classic`** — silver-toned, rounded, soft premium-heritage feel.

All four share identical content and structure; only the design tokens (colours,
surfaces, corner radius, shadow) change. While `showVariantSwitcher: true`, a
floating **Design** toggle (bottom-right) lets a club preview all four live before
choosing. **Set `showVariantSwitcher: false` for production** once a design is locked.

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
