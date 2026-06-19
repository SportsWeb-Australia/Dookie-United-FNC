# News & Social — per-club "News mode" (captured decision)

Applies to ALL clubs / all templates. Each club chooses how news and social work.
This is a per-club setting (proposed key: `news.mode`, stored in `club_content`,
default `news`). The home page and the News page read it and render accordingly.

## The three modes

1. **social** — Facebook/Instagram embed IS their news.
   - No separate articles. The home "news" slot and the News page show the club's
     live social feed embed instead.
   - For clubs that already run everything through Facebook and don't want a CMS.

2. **both** — news articles AND a social feed.
   - Club posts proper articles; a social feed/embed also appears (home strip and/or
     a panel on the News page). Best of both.

3. **news** (DEFAULT) — news is the single source of truth, shared to socials in 1 click.
   - Club writes the article here; a "Share" action pushes it out to their connected
     socials (Facebook page post, optionally Instagram/X) without leaving the admin.
   - Positions the website as the canonical record (fits the "AI prepares, humans
     approve, the system records everything" product line).

## What already exists to build on
- `components/blocks/SocialFeed.tsx` — social block with an embed slot + follow links.
- `components/blocks/MediaEmbed.tsx` — generic embed.
- `blocks.socialFeed` toggle + `social: { heading, note }` config in `content/types.ts`.
- Contact handles: `contact.facebook`, `contact.instagram`.

## Proposed build (its own focused pass)
- **Phase A — display modes (no external APIs):** add `news.mode` setting + a setup
  control; introduce a `<NewsOrSocial>` wrapper that renders FeaturedNews / SocialFeed /
  both based on mode; swap it into the home layouts + News page. Wire a real Facebook
  Page embed (and Instagram via their official embed) into SocialFeed.
- **Phase B — 1-click share (integration, needs approvals):**
  - Facebook Page post: Meta Graph API with a Page access token (requires a Meta app +
    `pages_manage_posts` review). Realistic.
  - Instagram: Graph API content publishing (business/creator account, stricter review).
  - X/Twitter: paid API tier.
  - Pragmatic shortcut: relay via Buffer / Zapier / Make webhook so we don't own each
    platform's review process — article publish → webhook → relay posts to socials.

## Note
Instagram/Facebook embeds and posting both require the club to connect their accounts
and (for posting) app review. Phase A delivers visible value with zero approvals;
Phase B is the integration project.
