import { useState, type ReactNode } from "react";
import { useClub } from "../components/ClubContext";
import { useActiveClub } from "./ActiveClub";
import { supabase, isPlatformHost } from "../lib/supabase";
import { ImageField } from "./ImageCropper";
import { SectionHelp } from "./SectionHelp";
import { HelpDot } from "./HelpDot";

/**
 * A titled, collapsible editor card. Title is prominent; an optional subtitle
 * explains what the section controls. Collapsed by default unless `defaultOpen`.
 */
function EdCard({
  title,
  subtitle,
  defaultOpen = false,
  children,
}: {
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={`sw-ed-card${open ? " sw-ed-card--open" : ""}`}>
      <button className="sw-ed-cardhead" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="sw-ed-cardtitles">
          <span className="sw-ed-cardtitle">{title}</span>
          {subtitle && <span className="sw-ed-cardsub">{subtitle}</span>}
        </span>
        <span className="sw-ed-cardchev" aria-hidden="true">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="sw-ed-cardbody">{children}</div>}
    </section>
  );
}

/**
 * Website editor — lives in the admin panel (Club Admin level and up).
 * Edits the same content keys the public site reads (club_content), plus the
 * club logo. Images upload to the club-media bucket via the crop tool. No
 * inline editing happens on the public site.
 */
export type SitePage =
  | "all"
  | "home"
  | "about"
  | "footer"
  | "contact"
  | "news"
  | "events"
  | "teams"
  | "fixtures"
  | "sponsors"
  | "documents"
  | "register";

const PAGE_LABELS: Record<string, string> = {
  home: "Home page",
  about: "About page",
  footer: "Footer & site-wide",
  contact: "Contact page",
  news: "News page",
  events: "Events page",
  teams: "Teams page",
  fixtures: "Fixtures page",
  sponsors: "Sponsors page",
  documents: "Documents page",
  register: "Register page",
};

// Pages that render a PageHero whose eyebrow/title/intro the club can override.
const HEADING_PAGES = ["about", "contact", "news", "events", "teams", "fixtures", "sponsors", "documents", "register"];

export function AdminSiteEditor({ page = "all" }: { page?: SitePage }) {
  const { club } = useClub();
  const { clubId } = useActiveClub();
  const show = (p: SitePage) => page === "all" || page === p;
  const pageTitle = PAGE_LABELS[page] ?? "Edit website";
  const headingKey = HEADING_PAGES.includes(page) ? page : "";
  const siteSlug = club.identity.slug ?? "";
  const previewHref = isPlatformHost() && siteSlug ? `/?club=${siteSlug}` : "/";

  const [hero, setHero] = useState({
    eyebrow: club.hero.eyebrow ?? "",
    title: club.hero.title ?? "",
    subtitle: club.hero.subtitle ?? "",
    video: club.hero.video ?? "",
  });
  const [pres, setPres] = useState({
    name: club.president?.name ?? "",
    role: club.president?.role ?? "",
    body: club.president?.body?.[0] ?? "",
    signoff: club.president?.signoff ?? "",
  });
  const [join, setJoin] = useState({
    heading: club.join?.heading ?? "",
    blurb: club.join?.blurb ?? "",
  });
  const [about, setAbout] = useState({
    body: club.about?.body?.[0] ?? "",
  });
  const [footer, setFooter] = useState({
    acknowledgement: club.footer?.acknowledgement ?? "",
  });

  const [img, setImg] = useState({
    heroImage: club.hero.backgroundImage ?? "",
    logo: club.identity.logo ?? "",
    portrait: club.president?.portrait ?? "",
    aboutPhoto: club.content?.["about.photo"] ?? "",
    footerLogo0: club.content?.["footer.logo.0"] ?? "",
    footerLogo1: club.content?.["footer.logo.1"] ?? "",
    footerLogo2: club.content?.["footer.logo.2"] ?? "",
  });

  const [status, setStatus] = useState<Record<string, string>>({});
  const content = club.content ?? {};
  const [heading, setHeading] = useState({
    eyebrow: (headingKey && content[`page.${headingKey}.eyebrow`]) || "",
    title: (headingKey && content[`page.${headingKey}.title`]) || "",
    intro: (headingKey && content[`page.${headingKey}.intro`]) || "",
  });
  const [contactInfo, setContactInfo] = useState({
    email: content["contact.email"] ?? club.contact.email ?? "",
    phone: content["contact.phone"] ?? club.contact.phone ?? "",
    instagram: content["contact.instagram"] ?? club.contact.instagram ?? "",
    facebook: content["contact.facebook"] ?? club.contact.facebook ?? "",
    address: content["contact.address"] ?? club.contact.addressLine ?? "",
  });
  const setSt = (card: string, msg: string) => setStatus((s) => ({ ...s, [card]: msg }));

  async function saveContent(card: string, entries: Record<string, string>) {
    if (!clubId || !supabase) return;
    setSt(card, "Saving…");
    const rows = Object.entries(entries).map(([content_key, value]) => ({ club_id: clubId, content_key, value }));
    const { error } = await supabase.from("club_content").upsert(rows, { onConflict: "club_id,content_key" });
    setSt(card, error ? `Could not save: ${error.message}` : "Saved. Reload your site to see it live.");
  }

  async function saveLogo(url: string) {
    if (!clubId || !supabase) return;
    setImg((s) => ({ ...s, logo: url }));
    setSt("brand", "Saving…");
    const { error } = await supabase
      .from("club_content")
      .upsert({ club_id: clubId, content_key: "branding.logo", value: url }, { onConflict: "club_id,content_key" });
    setSt("brand", error ? `Could not save: ${error.message}` : "Logo updated. Reload your site to see it live.");
  }

  if (!clubId) {
    return (
      <div className="sw-admin-panel">
        <p className="sw-admin-note">Sign in as a club admin to edit your website.</p>
      </div>
    );
  }

  return (
    <div className="sw-admin-panel sw-site-editor">
      <div className="sw-admin-formhead sw-site-edithead">
        <h2>{pageTitle}</h2>
        <a href={previewHref} target="_blank" rel="noreferrer" className="sw-btn sw-btn--ghost sw-preview-btn">
          Preview site →
        </a>
      </div>
      <p className="sw-admin-note">
        Edit your homepage and key pages here. Each section opens up so you can work through them one at a time.
        Images open a framing tool so they always sit nicely. Changes save to your site — reload the public site to see them live.
      </p>
      {show("home") && <SectionHelp section="website" />}

      {headingKey && (
        <EdCard title={`${PAGE_LABELS[page] ?? "Page"} heading`} subtitle="The banner at the top of this page. Leave a field blank to use the built-in default." defaultOpen>
          <label className="sw-ed-l">
            Eyebrow (small line above the title)
            <HelpDot example="“Est. 1952 · Melbourne's East”, or a netball club might use “Winter & summer comps”.">
              A short line that sits <em>above</em> your main heading — a label or tagline, just a few words. Clubs often use their founding year, location, or what they offer.
            </HelpDot>
          </label>
          <input className="sw-input" value={heading.eyebrow} onChange={(e) => setHeading({ ...heading, eyebrow: e.target.value })} />
          <label className="sw-ed-l">Title</label>
          <input className="sw-input" value={heading.title} onChange={(e) => setHeading({ ...heading, title: e.target.value })} />
          <label className="sw-ed-l">Intro <HelpDot example="On a Teams page: “Find your team, fixtures and results for the season.”">A sentence under the page's heading that sets the scene. Optional — leave blank to skip it.</HelpDot></label>
          <textarea className="sw-input" rows={3} value={heading.intro} onChange={(e) => setHeading({ ...heading, intro: e.target.value })} />
          <div className="sw-ed-foot">
            <button
              className="sw-btn"
              onClick={() =>
                saveContent("heading", {
                  [`page.${headingKey}.eyebrow`]: heading.eyebrow,
                  [`page.${headingKey}.title`]: heading.title,
                  [`page.${headingKey}.intro`]: heading.intro,
                })
              }
            >
              Save heading
            </button>
            <span className="sw-ed-status" aria-live="polite">{status.heading}</span>
          </div>
        </EdCard>
      )}

      {page === "contact" && (
        <EdCard title="Contact details" subtitle="Shown on your Contact page and used across the site." defaultOpen>
          <label className="sw-ed-l">Email</label>
          <input className="sw-input" value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
          <label className="sw-ed-l">Phone</label>
          <input className="sw-input" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} />
          <label className="sw-ed-l">Postal / ground address</label>
          <input className="sw-input" value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} />
          <label className="sw-ed-l">Instagram link</label>
          <input className="sw-input" placeholder="https://instagram.com/…" value={contactInfo.instagram} onChange={(e) => setContactInfo({ ...contactInfo, instagram: e.target.value })} />
          <label className="sw-ed-l">Facebook link</label>
          <input className="sw-input" placeholder="https://facebook.com/…" value={contactInfo.facebook} onChange={(e) => setContactInfo({ ...contactInfo, facebook: e.target.value })} />
          <div className="sw-ed-foot">
            <button
              className="sw-btn"
              onClick={() =>
                saveContent("contact", {
                  "contact.email": contactInfo.email,
                  "contact.phone": contactInfo.phone,
                  "contact.address": contactInfo.address,
                  "contact.instagram": contactInfo.instagram,
                  "contact.facebook": contactInfo.facebook,
                })
              }
            >
              Save contact details
            </button>
            <span className="sw-ed-status" aria-live="polite">{status.contact}</span>
          </div>
        </EdCard>
      )}

      {show("home") && (
        <EdCard title="Homepage hero" subtitle="The big banner at the very top of your homepage" defaultOpen>
        <label className="sw-ed-l">
          Eyebrow (small line above the title)
          <HelpDot example="“Est. 1952 · Melbourne's East”, or a netball club might use “Winter & summer comps”.">
            A short line that sits <em>above</em> your main heading — a label or tagline, just a few words. Clubs often use their founding year, location, or what they offer.
          </HelpDot>
        </label>
        <input className="sw-input" value={hero.eyebrow} onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })} />
        <label className="sw-ed-l">Title</label>
        <input className="sw-input" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        <label className="sw-ed-l">Subtitle <HelpDot example="“Junior &amp; senior lacrosse in Melbourne's east.”">The line under your big hero title — a short tagline or what your club is about.</HelpDot></label>
        <textarea className="sw-input" rows={2} maxLength={140} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
        <p className="sw-ed-hint" style={{ textAlign: "right", color: hero.subtitle.length > 130 ? "#b54708" : undefined }}>{hero.subtitle.length}/140 — a short tagline reads best</p>
        <ImageField
          label="Hero image"
          hint="Wide banner image. Recommended 1920 × 1080 (16:9). Landscape photos work best."
          aspect={16 / 9}
          targetW={1600}
          value={img.heroImage}
          folder="hero"
          clubId={clubId}
          onUploaded={async (url) => {
            setImg((s) => ({ ...s, heroImage: url }));
            await saveContent("hero", { "hero.image": url });
          }}
        />
        <label className="sw-ed-l">Hero video link (optional — YouTube, Vimeo or MP4 URL) <HelpDot>When set, a muted video loops behind your hero instead of the image. Leave blank to use the image.</HelpDot></label>
        <input
          className="sw-input"
          placeholder="https://…"
          value={hero.video}
          onChange={(e) => setHero({ ...hero, video: e.target.value })}
        />
        <p className="sw-ed-hint">A video only shows on the photo/video hero styles. Leave blank to use the image.</p>
        <div className="sw-ed-foot">
          <button className="sw-btn" onClick={() => saveContent("hero", { "hero.eyebrow": hero.eyebrow, "hero.title": hero.title, "hero.subtitle": hero.subtitle, "hero.video": hero.video })}>
            Save hero text
          </button>
          <span className="sw-ed-status" aria-live="polite">{status.hero}</span>
        </div>
      </EdCard>
      )}

      {show("home") && (
        <EdCard title="Club logo & branding" subtitle="Your club crest, shown in the header and around the site">
        <ImageField
          label="Logo"
          hint="Square works best. Recommended 512 × 512, transparent PNG."
          aspect={1}
          targetW={512}
          value={img.logo}
          folder="brand"
          clubId={clubId}
          transparent
          onUploaded={saveLogo}
        />
        <span className="sw-ed-status" aria-live="polite">{status.brand}</span>
      </EdCard>
      )}

      {show("home") && (
        <EdCard title="President's welcome" subtitle="The welcome message and portrait on your homepage">
        <div className="sw-ed-2col">
          <div>
            <label className="sw-ed-l">Name</label>
            <input className="sw-input" value={pres.name} onChange={(e) => setPres({ ...pres, name: e.target.value })} />
          </div>
          <div>
            <label className="sw-ed-l">Role <HelpDot example="“President”, or “Club President 2026”.">The person's title — not their name.</HelpDot></label>
            <input className="sw-input" value={pres.role} onChange={(e) => setPres({ ...pres, role: e.target.value })} />
          </div>
        </div>
        <label className="sw-ed-l">Welcome message <HelpDot example="“Welcome to our club. Whether you're new or returning, we're glad to have you with us this season…”">A short, warm hello from your president — two or three sentences is plenty.</HelpDot></label>
        <textarea className="sw-input" rows={4} value={pres.body} onChange={(e) => setPres({ ...pres, body: e.target.value })} />
        <label className="sw-ed-l">Sign-off (optional)</label>
        <input className="sw-input" value={pres.signoff} onChange={(e) => setPres({ ...pres, signoff: e.target.value })} />
        <ImageField
          label="Portrait"
          hint="Head-and-shoulders photo. Recommended 600 × 600 (square)."
          aspect={1}
          targetW={600}
          value={img.portrait}
          folder="people"
          clubId={clubId}
          onUploaded={async (url) => {
            setImg((s) => ({ ...s, portrait: url }));
            await saveContent("pres", { "president.portrait": url });
          }}
        />
        <div className="sw-ed-foot">
          <button className="sw-btn" onClick={() => saveContent("pres", { "president.name": pres.name, "president.role": pres.role, "president.body.0": pres.body, "president.signoff": pres.signoff })}>
            Save welcome
          </button>
          <span className="sw-ed-status" aria-live="polite">{status.pres}</span>
        </div>
      </EdCard>
      )}

      {show("home") && (
        <EdCard title="Join / membership call-to-action" subtitle="The prompt that invites people to join your club">
        <label className="sw-ed-l">Heading</label>
        <input className="sw-input" value={join.heading} onChange={(e) => setJoin({ ...join, heading: e.target.value })} />
        <label className="sw-ed-l">Blurb <HelpDot example="“New players welcome at every level — registrations are open now.”">One or two lines inviting people to get involved — players, volunteers or members.</HelpDot></label>
        <textarea className="sw-input" rows={2} value={join.blurb} onChange={(e) => setJoin({ ...join, blurb: e.target.value })} />
        <div className="sw-ed-foot">
          <button className="sw-btn" onClick={() => saveContent("join", { "join.heading": join.heading, "join.blurb": join.blurb })}>
            Save call-to-action
          </button>
          <span className="sw-ed-status" aria-live="polite">{status.join}</span>
        </div>
      </EdCard>
      )}

      {show("about") && (
        <EdCard title="About your club" subtitle="The opening of your About page">
        <label className="sw-ed-l">Opening paragraph</label>
        <textarea className="sw-input" rows={4} value={about.body} onChange={(e) => setAbout({ ...about, body: e.target.value })} />
        <ImageField
          label="About photo"
          hint="A club or team photo. Recommended 1200 × 900 (4:3)."
          aspect={4 / 3}
          targetW={1200}
          value={img.aboutPhoto}
          folder="about"
          clubId={clubId}
          onUploaded={async (url) => {
            setImg((s) => ({ ...s, aboutPhoto: url }));
            await saveContent("about", { "about.photo": url });
          }}
        />
        <div className="sw-ed-foot">
          <button className="sw-btn" onClick={() => saveContent("about", { "about.body.0": about.body })}>
            Save about
          </button>
          <span className="sw-ed-status" aria-live="polite">{status.about}</span>
        </div>
      </EdCard>
      )}

      {show("footer") && (
        <EdCard title="Footer" subtitle="Acknowledgement of Country and footer logos or flags">
        <label className="sw-ed-l">Acknowledgement of Country <HelpDot example="“We acknowledge the Traditional Custodians of the land on which we play, and pay our respects to Elders past and present.”">A short statement recognising the Traditional Owners of the land your club is on. Many clubs use their league's or council's wording.</HelpDot></label>
        <textarea className="sw-input" rows={3} value={footer.acknowledgement} onChange={(e) => setFooter({ acknowledgement: e.target.value })} />
        <div className="sw-ed-foot">
          <button className="sw-btn" onClick={() => saveContent("footer", { "footer.acknowledgement": footer.acknowledgement })}>
            Save acknowledgement
          </button>
          <span className="sw-ed-status" aria-live="polite">{status.footer}</span>
        </div>

        <hr className="sw-ed-rule" />
        <label className="sw-ed-l">Footer logos &amp; flags</label>
        <p className="sw-ed-hint">
          Add up to three images for the footer — your league or council logo, a major partner, or the
          Aboriginal and Torres Strait Islander flags for your Acknowledgement of Country. Transparent PNGs look best.
        </p>
        <div className="sw-ed-logos">
          <ImageField
            label="Logo or flag 1"
            hint="Transparent PNG recommended."
            aspect={1}
            targetW={400}
            value={img.footerLogo0}
            folder="footer"
            clubId={clubId}
            transparent
            onUploaded={async (url) => {
              setImg((s) => ({ ...s, footerLogo0: url }));
              await saveContent("footerlogos", { "footer.logo.0": url });
            }}
          />
          <ImageField
            label="Logo or flag 2"
            hint="Transparent PNG recommended."
            aspect={1}
            targetW={400}
            value={img.footerLogo1}
            folder="footer"
            clubId={clubId}
            transparent
            onUploaded={async (url) => {
              setImg((s) => ({ ...s, footerLogo1: url }));
              await saveContent("footerlogos", { "footer.logo.1": url });
            }}
          />
          <ImageField
            label="Logo or flag 3"
            hint="Transparent PNG recommended."
            aspect={1}
            targetW={400}
            value={img.footerLogo2}
            folder="footer"
            clubId={clubId}
            transparent
            onUploaded={async (url) => {
              setImg((s) => ({ ...s, footerLogo2: url }));
              await saveContent("footerlogos", { "footer.logo.2": url });
            }}
          />
        </div>
        <span className="sw-ed-status" aria-live="polite">{status.footerlogos}</span>
      </EdCard>
      )}
    </div>
  );
}
