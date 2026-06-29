import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useClub } from "../components/ClubContext";
import { MODULE_CATALOG } from "../lib/modules";
import { COMING_SOON_MODULES } from "./ModulePrePage";
import type { DesignVariant } from "../content/types";

/**
 * NeedsWizard — captures a club's needs across six sections and a summary, then
 * writes one row per club to club_needs (status draft -> complete). Resumes an
 * existing draft on load. Autosaves as the user progresses; every save stamps
 * updated_at (the table has no triggers) and completion also stamps completed_at.
 *
 * Reachable from onboarding (club self-serve) and platform admin (running it for a
 * prospect). filled_by is decided by the caller: 'club' or 'admin'. Stops at the
 * summary for v1 - no Site Build handoff yet.
 *
 * RLS (already live) scopes club_needs to the club's members + platform admins, so
 * this calls Supabase directly with no service key.
 */

type Basics = { name: string; sports: string; location: string };
type Structure = { multiSport: boolean; sports: string; teams: string; season: string };
type Assets = { logo: "" | "yes" | "no"; colours: string; photos: "" | "yes" | "some" | "no"; existingSite: string };
type Answers = {
  basics?: Basics;
  purpose?: string[];
  structure?: Structure;
  design_note?: string;
  assets?: Assets;
};

const STEPS = [
  "Club basics",
  "What's your site for?",
  "What do you run?",
  "Look & feel",
  "What have you got?",
  "Modules of interest",
  "Summary",
];

const PURPOSES: { key: string; label: string }[] = [
  { key: "attract", label: "Attract new members" },
  { key: "fixtures", label: "Show fixtures & results" },
  { key: "sell", label: "Sell memberships & tickets" },
  { key: "news", label: "Publish news" },
  { key: "sponsors", label: "Showcase sponsors" },
  { key: "hub", label: "Club hub for existing members" },
];

const TEAM_COUNTS = ["1-3", "4-8", "9-15", "16+"];
const SEASONS: { key: string; label: string }[] = [
  { key: "winter", label: "Winter" },
  { key: "summer", label: "Summer" },
  { key: "yearround", label: "Year-round" },
  { key: "multi", label: "Multiple seasons" },
];

/** Plain-English design directions; each resolves to one existing template variant. */
const LOOK_DIRECTIONS: { id: string; label: string; note: string; variant: DesignVariant }[] = [
  { id: "classic_clean", label: "Clean & classic", note: "Light, simple, timeless.", variant: "heritage" },
  { id: "elegant", label: "Elegant & traditional", note: "Serif, centred, refined.", variant: "classic" },
  { id: "broadcast", label: "Bold & broadcast", note: "Dark, high-impact, TV-style.", variant: "broadcast" },
  { id: "photo", label: "Photo-led", note: "Big imagery, full-bleed hero.", variant: "stadium" },
  { id: "news", label: "News-led", note: "Front-page, story-first.", variant: "broadsheet" },
  { id: "modern", label: "Modern grid", note: "App-like, card layout.", variant: "bento" },
];

/** Sport family -> best-fit sport-specific variant for the "Best for your sport" option. */
const SPORT_VARIANT: Record<string, DesignVariant> = {
  afl: "leaguefooty",
  netball: "courtside",
  soccer: "pitch",
  cricket: "scorecard",
  basketball: "hardcourt",
  lacrosse: "fastbreak",
  rugbyunion: "rugbyunion",
  rugbyleague: "rugbyleague",
  oztag: "oztag",
  touch: "touch",
};

/** Friendly labels for the variants this wizard can recommend (summary copy). */
const VARIANT_LABELS: Partial<Record<DesignVariant, string>> = {
  heritage: "Clean & classic",
  classic: "Elegant & traditional",
  broadcast: "Bold & broadcast",
  stadium: "Photo-led",
  broadsheet: "News-led",
  bento: "Modern grid",
  fieldcourt: "AFL/Netball (Fieldcourt)",
  leaguefooty: "AFL (Leaguefooty)",
  courtside: "Netball (Courtside)",
  pitch: "Soccer (Pitch)",
  scorecard: "Cricket (Scorecard)",
  hardcourt: "Basketball (Hardcourt)",
  fastbreak: "Lacrosse (Fastbreak)",
  rugbyunion: "Rugby Union",
  rugbyleague: "Rugby League",
  oztag: "Oztag",
  touch: "Touch Footy",
};

// Map a club's free-text sport to a canonical family (mirrors AdminWebsite).
function sportFamily(s: string): string {
  const k = s.toLowerCase().trim();
  if (/(afl|aussie|australian rules|footy|^football$|aussie rules)/.test(k)) return "afl";
  if (k.includes("netball")) return "netball";
  if (k.includes("soccer")) return "soccer";
  if (k.includes("cricket")) return "cricket";
  if (k.includes("basket")) return "basketball";
  if (k.includes("lacrosse")) return "lacrosse";
  if (k.includes("union")) return "rugbyunion";
  if (k.includes("league")) return "rugbyleague";
  if (k.includes("oztag")) return "oztag";
  if (k.includes("touch")) return "touch";
  return k;
}

function variantLabel(v: DesignVariant | null): string {
  if (!v) return "a standard";
  return VARIANT_LABELS[v] ?? v;
}

function moduleName(key: string): string {
  return (
    MODULE_CATALOG.find((m) => m.key === key)?.name ??
    COMING_SOON_MODULES.find((m) => m.key === key)?.name ??
    key
  );
}

export function NeedsWizard({ clubId, filledBy }: { clubId: string; filledBy: "club" | "admin" }) {
  const { club } = useClub();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);
  const hydrated = useRef(false);
  const firstAfterHydrate = useRef(true);

  const [basics, setBasics] = useState<Basics>({ name: "", sports: "", location: "" });
  const [purpose, setPurpose] = useState<string[]>([]);
  const [structure, setStructure] = useState<Structure>({ multiSport: false, sports: "", teams: "", season: "" });
  const [designNote, setDesignNote] = useState("");
  const [recommendedVariant, setRecommendedVariant] = useState<DesignVariant | null>(null);
  const [assets, setAssets] = useState<Assets>({ logo: "", colours: "", photos: "", existingSite: "" });
  const [modulesInterest, setModulesInterest] = useState<string[]>([]);

  const families = useMemo(
    () => new Set((club.identity.sports ?? []).map(sportFamily)),
    [club.identity.sports],
  );
  const sportVariant: DesignVariant = useMemo(() => {
    if (families.has("afl") && families.has("netball")) return "fieldcourt";
    for (const f of families) if (SPORT_VARIANT[f]) return SPORT_VARIANT[f];
    return "heritage";
  }, [families]);

  // Pre-fill basics/structure from the club identity (sourced from the clubs row).
  const prefillBasics = useCallback(
    (): Basics => ({
      name: club.identity.name ?? "",
      sports: (club.identity.sports ?? []).join(", "),
      location: club.identity.location ?? "",
    }),
    [club.identity.name, club.identity.sports, club.identity.location],
  );

  // Load an existing row (resume a draft) or start fresh.
  useEffect(() => {
    let alive = true;
    if (!clubId) return;
    setLoading(true);
    hydrated.current = false;
    firstAfterHydrate.current = true;
    (async () => {
      const { data, error: e } = await supabase
        .from("club_needs")
        .select("*")
        .eq("club_id", clubId)
        .maybeSingle();
      if (!alive) return;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      const pre = prefillBasics();
      if (data) {
        const a = (data.answers ?? {}) as Answers;
        setBasics({ ...pre, ...(a.basics ?? {}) });
        setPurpose(a.purpose ?? []);
        setStructure({
          multiSport: (club.identity.sports ?? []).length > 1,
          sports: pre.sports,
          teams: "",
          season: "",
          ...(a.structure ?? {}),
        });
        setDesignNote(a.design_note ?? "");
        setAssets({ logo: "", colours: "", photos: "", existingSite: "", ...(a.assets ?? {}) });
        setRecommendedVariant((data.recommended_variant as DesignVariant) ?? null);
        setModulesInterest(data.modules_interest ?? []);
        if (data.status === "complete") setDone(true);
      } else {
        setBasics(pre);
        setStructure({ multiSport: (club.identity.sports ?? []).length > 1, sports: pre.sports, teams: "", season: "" });
      }
      setLoading(false);
      hydrated.current = true;
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  const buildAnswers = useCallback(
    (): Answers => ({ basics, purpose, structure, design_note: designNote, assets }),
    [basics, purpose, structure, designNote, assets],
  );

  const saveDraft = useCallback(async () => {
    if (!clubId) return;
    const { error: e } = await supabase.from("club_needs").upsert(
      {
        club_id: clubId,
        status: "draft",
        filled_by: filledBy,
        answers: buildAnswers(),
        modules_interest: modulesInterest,
        recommended_variant: recommendedVariant,
        updated_at: new Date().toISOString(),
        completed_at: null,
      },
      { onConflict: "club_id" },
    );
    if (e) setError(e.message);
    else {
      setError(null);
      setSaved(true);
    }
  }, [clubId, filledBy, buildAnswers, modulesInterest, recommendedVariant]);

  // Autosave (debounced) whenever an answer changes, once hydrated and not finished.
  useEffect(() => {
    if (!hydrated.current || done) return;
    // Skip the settle right after load so merely opening the wizard never writes a row.
    if (firstAfterHydrate.current) {
      firstAfterHydrate.current = false;
      return;
    }
    const t = setTimeout(() => {
      void saveDraft();
    }, 700);
    return () => clearTimeout(t);
  }, [saveDraft, done]);

  const goNext = async () => {
    await saveDraft();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!clubId) return;
    const now = new Date().toISOString();
    const { error: e } = await supabase.from("club_needs").upsert(
      {
        club_id: clubId,
        status: "complete",
        filled_by: filledBy,
        answers: buildAnswers(),
        modules_interest: modulesInterest,
        recommended_variant: recommendedVariant,
        updated_at: now,
        completed_at: now,
      },
      { onConflict: "club_id" },
    );
    if (e) {
      setError(e.message);
      return;
    }
    setDone(true);
  };

  const toggle = (list: string[], key: string) =>
    list.includes(key) ? list.filter((k) => k !== key) : [...list, key];

  const missingAssets = useMemo(() => {
    const m: string[] = [];
    if (assets.logo !== "yes") m.push("a club logo");
    if (assets.photos === "no" || assets.photos === "") m.push("club photos");
    if (!assets.colours.trim()) m.push("your club colours");
    return m;
  }, [assets]);

  if (loading) {
    return (
      <div className="sw-admin-panel">
        <div className="sw-admin-formhead">
          <h2>Needs analysis</h2>
        </div>
        <p className="sw-admin-note">Loading...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="sw-admin-panel sw-needs">
        <div className="sw-admin-formhead">
          <h2>Needs analysis</h2>
        </div>
        <div className="sw-needs-doneflag">All done - thanks.</div>
        <div className="sw-needs-summary">
          <p>
            Based on this, we'll build a <strong>{variantLabel(recommendedVariant)}</strong> site, focused on{" "}
            <strong>{purpose.length ? purpose.map((k) => PURPOSES.find((p) => p.key === k)?.label ?? k).join(", ") : "your priorities"}</strong>
            {modulesInterest.length > 0 && (
              <>
                , and you're interested in <strong>{modulesInterest.map(moduleName).join(", ")}</strong>
              </>
            )}
            {missingAssets.length > 0 && (
              <>
                ; you'll need to supply <strong>{missingAssets.join(", ")}</strong>
              </>
            )}
            .
          </p>
        </div>
        <div className="sw-needs-next">
          <h3>What happens next</h3>
          <p>
            SportsWeb has your club's needs on file. We'll use this to shape your site build and get the right
            template and layout ready - no further action needed from you right now. We'll be in touch with the next
            step, and you can come back and update these answers any time.
          </p>
        </div>
        <div className="sw-needs-nav">
          <button type="button" className="sw-btn sw-btn--ghost" onClick={() => { setDone(false); setStep(0); }}>
            Review answers
          </button>
        </div>
      </div>
    );
  }

  const isSummary = step === STEPS.length - 1;

  return (
    <div className="sw-admin-panel sw-needs">
      <div className="sw-admin-formhead">
        <h2>Needs analysis</h2>
      </div>
      <p className="sw-admin-note">
        A quick guided run-through so we build {club.identity.shortName || "your club"} the right site. Your answers
        autosave as you go{filledBy === "admin" ? " (you're filling this in as SportsWeb)" : ""}.
      </p>

      {/* Progress */}
      <div className="sw-needs-progress" aria-hidden="true">
        {STEPS.map((label, i) => (
          <span key={label} className="sw-needs-pill" data-active={i === step} data-done={i < step} title={label}>
            {i + 1}
          </span>
        ))}
      </div>
      <p className="sw-needs-steplabel">
        Step {step + 1} of {STEPS.length} - {STEPS[step]}
      </p>

      {error && <div className="sw-needs-error">{error}</div>}

      {/* Step 1 - Club basics */}
      {step === 0 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">Confirm the basics - we've pre-filled what we know.</p>
          <label className="sw-admin-field">
            <span>Club name</span>
            <input value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} />
          </label>
          <label className="sw-admin-field">
            <span>Sport(s)</span>
            <input value={basics.sports} onChange={(e) => setBasics({ ...basics, sports: e.target.value })} />
          </label>
          <label className="sw-admin-field">
            <span>Location</span>
            <input
              value={basics.location}
              placeholder="Town / suburb, state"
              onChange={(e) => setBasics({ ...basics, location: e.target.value })}
            />
          </label>
        </div>
      )}

      {/* Step 2 - Purpose */}
      {step === 1 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">What do you most want the site to do? Pick all that apply.</p>
          <div className="sw-admin-styles">
            {PURPOSES.map((p) => (
              <button
                key={p.key}
                type="button"
                className="sw-admin-style"
                data-active={purpose.includes(p.key)}
                onClick={() => setPurpose((l) => toggle(l, p.key))}
              >
                <strong>{p.label}</strong>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 - Structure */}
      {step === 2 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">A rough picture of what you run.</p>
          <label className="sw-admin-field">
            <span>Sport(s) you run</span>
            <input value={structure.sports} onChange={(e) => setStructure({ ...structure, sports: e.target.value })} />
          </label>
          <label className="sw-needs-check">
            <input
              type="checkbox"
              checked={structure.multiSport}
              onChange={(e) => setStructure({ ...structure, multiSport: e.target.checked })}
            />
            <span>We're a multi-sport club (e.g. football &amp; netball)</span>
          </label>
          <div className="sw-needs-field">
            <span className="sw-needs-fieldlabel">Roughly how many teams / grades?</span>
            <div className="sw-needs-chips">
              {TEAM_COUNTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="sw-needs-chip"
                  data-active={structure.teams === t}
                  onClick={() => setStructure({ ...structure, teams: t })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="sw-needs-field">
            <span className="sw-needs-fieldlabel">Season structure</span>
            <div className="sw-needs-chips">
              {SEASONS.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  className="sw-needs-chip"
                  data-active={structure.season === s.key}
                  onClick={() => setStructure({ ...structure, season: s.key })}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 - Look & feel */}
      {step === 3 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">Pick the direction that feels most like your club.</p>
          <div className="sw-admin-styles">
            <button
              type="button"
              className="sw-admin-style"
              data-active={recommendedVariant === sportVariant}
              onClick={() => setRecommendedVariant(sportVariant)}
            >
              <strong>&#9733; Best for your sport</strong>
              <span>Tailored to {club.identity.sports?.join(" & ") || "your sport"}.</span>
            </button>
            {LOOK_DIRECTIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                className="sw-admin-style"
                data-active={recommendedVariant === d.variant}
                onClick={() => setRecommendedVariant(d.variant)}
              >
                <strong>{d.label}</strong>
                <span>{d.note}</span>
              </button>
            ))}
          </div>
          <label className="sw-admin-field" style={{ marginTop: "1rem" }}>
            <span>Anything else about the look? (optional)</span>
            <textarea
              rows={3}
              value={designNote}
              onChange={(e) => setDesignNote(e.target.value)}
              placeholder="e.g. we love navy and gold, keep it clean and not too busy"
            />
          </label>
          <p className="sw-admin-note sw-needs-fineprint">
            This note helps us choose the right template and layout blocks - it doesn't authorise a custom/bespoke
            design.
          </p>
        </div>
      )}

      {/* Step 5 - Assets */}
      {step === 4 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">What have you already got? This tells us what you'll need to supply.</p>
          <div className="sw-needs-field">
            <span className="sw-needs-fieldlabel">Do you have a club logo?</span>
            <div className="sw-needs-chips">
              {(["yes", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="sw-needs-chip"
                  data-active={assets.logo === v}
                  onClick={() => setAssets({ ...assets, logo: v })}
                >
                  {v === "yes" ? "Yes" : "Not yet"}
                </button>
              ))}
            </div>
          </div>
          <label className="sw-admin-field">
            <span>Club colours</span>
            <input
              value={assets.colours}
              placeholder="e.g. Navy & gold"
              onChange={(e) => setAssets({ ...assets, colours: e.target.value })}
            />
          </label>
          <div className="sw-needs-field">
            <span className="sw-needs-fieldlabel">Photos of the club?</span>
            <div className="sw-needs-chips">
              {(["yes", "some", "no"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className="sw-needs-chip"
                  data-active={assets.photos === v}
                  onClick={() => setAssets({ ...assets, photos: v })}
                >
                  {v === "yes" ? "Plenty" : v === "some" ? "A few" : "None yet"}
                </button>
              ))}
            </div>
          </div>
          <label className="sw-admin-field">
            <span>Existing website to migrate? (optional)</span>
            <input
              value={assets.existingSite}
              placeholder="https://... or leave blank"
              onChange={(e) => setAssets({ ...assets, existingSite: e.target.value })}
            />
          </label>
        </div>
      )}

      {/* Step 6 - Modules of interest */}
      {step === 5 && (
        <div className="sw-needs-body">
          <p className="sw-admin-note">Which tools would you be interested in? Tap any that look useful.</p>
          <p className="sw-admin-note sw-needs-fineprint">
            Interest only - selecting a module here doesn't switch it on, grant access, or promise a release date.
            Entitlement is managed separately by SportsWeb.
          </p>
          <div className="sw-needs-chips sw-needs-chips--wrap">
            {MODULE_CATALOG.map((m) => (
              <button
                key={m.key}
                type="button"
                className="sw-needs-chip"
                data-active={modulesInterest.includes(m.key)}
                onClick={() => setModulesInterest((l) => toggle(l, m.key))}
                title={m.tagline}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="sw-needs-fieldlabel" style={{ marginTop: "1rem" }}>Coming soon</p>
          <div className="sw-needs-chips sw-needs-chips--wrap">
            {COMING_SOON_MODULES.map((m) => (
              <button
                key={m.key}
                type="button"
                className="sw-needs-chip sw-needs-chip--soon"
                data-active={modulesInterest.includes(m.key)}
                onClick={() => setModulesInterest((l) => toggle(l, m.key))}
                title={m.tagline}
              >
                {m.name}
                <span className="sw-needs-soontag">Coming soon</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 7 - Summary */}
      {isSummary && (
        <div className="sw-needs-body sw-needs-summary">
          <p>
            Based on this, we'll build a <strong>{variantLabel(recommendedVariant)}</strong> site, focused on{" "}
            <strong>
              {purpose.length
                ? purpose.map((k) => PURPOSES.find((p) => p.key === k)?.label ?? k).join(", ")
                : "your priorities"}
            </strong>
            {modulesInterest.length > 0 && (
              <>
                , and you're interested in <strong>{modulesInterest.map(moduleName).join(", ")}</strong>
              </>
            )}
            {missingAssets.length > 0 && (
              <>
                ; you'll need to supply <strong>{missingAssets.join(", ")}</strong>
              </>
            )}
            .
          </p>
          <p className="sw-admin-note">Happy with this? Confirm to finish, or step back to change anything.</p>
        </div>
      )}

      {/* Nav */}
      <div className="sw-needs-nav">
        <button type="button" className="sw-btn sw-btn--ghost" onClick={goBack} disabled={step === 0}>
          Back
        </button>
        <span className="sw-needs-save">{saved ? "Draft saved" : "Autosaves as you go"}</span>
        {isSummary ? (
          <button type="button" className="sw-btn" onClick={finish}>
            Confirm &amp; finish
          </button>
        ) : (
          <button type="button" className="sw-btn" onClick={goNext}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
