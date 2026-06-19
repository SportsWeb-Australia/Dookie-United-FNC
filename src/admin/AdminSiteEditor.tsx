import { useState, type ReactNode } from "react";
import { useClub } from "../components/ClubContext";
import { useActiveClub } from "./ActiveClub";
import { supabase, isPlatformHost } from "../lib/supabase";
import { ImageField } from "./ImageCropper";
import { SectionHelp } from "./SectionHelp";

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
export type SitePage = "all" | "home" | "about" | "footer";

export function AdminSiteEditor({ page = "all" }: { page?: SitePage }) {
  const { club } = useClub();
  const { clubId } = useActiveClub();
  const show = (p: SitePage) => page === "all" || page === p;
  const pageTitle =
    page === "home"
      ? "Home page"
      : page === "about"
        ? "About page"
        : page === "footer"
          ? "Footer & site-wide"
          : "Edit website";
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

      {show("home") && (
        <EdCard title="Homepage hero" subtitle="The big banner at the very top of your homepage" defaultOpen>
        <label className="sw-ed-l">Eyebrow (small line above the title)</label>
        <input className="sw-input" value={hero.eyebrow} onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })} />
        <label className="sw-ed-l">Title</label>
        <input className="sw-input" value={hero.title} onChange={(e) => setHero({ ...hero, title: e.target.value })} />
        <label className="sw-ed-l">Subtitle</label>
        <textarea className="sw-input" rows={2} value={hero.subtitle} onChange={(e) => setHero({ ...hero, subtitle: e.target.value })} />
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
        <label className="sw-ed-l">Hero video link (optional — YouTube, Vimeo or MP4 URL)</label>
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
            <label className="sw-ed-l">Role</label>
            <input className="sw-input" value={pres.role} onChange={(e) => setPres({ ...pres, role: e.target.value })} />
          </div>
        </div>
        <label className="sw-ed-l">Welcome message</label>
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
        <label className="sw-ed-l">Blurb</label>
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
        <label className="sw-ed-l">Acknowledgement of Country</label>
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
