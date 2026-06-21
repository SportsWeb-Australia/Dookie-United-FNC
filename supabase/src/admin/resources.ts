export type FieldType = "text" | "textarea" | "date" | "datetime" | "select" | "url" | "number" | "boolean" | "image" | "video" | "richtext";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
}

export interface ResourceDef {
  key: string;
  label: string;
  singular: string;
  table: string;
  order: { col: string; asc: boolean };
  listColumns: { name: string; label: string }[];
  fields: Field[];
  /** Field whose value seeds an auto-slug when slug is left blank. */
  slugFrom?: string;
  /** Show the paste-CSV bulk importer for this resource. */
  bulkImport?: boolean;
  defaults: Record<string, unknown>;
}

const STATUS: Field = {
  name: "status",
  label: "Status",
  type: "select",
  options: ["published", "draft"],
  required: true,
};

export const RESOURCES: ResourceDef[] = [
  {
    key: "news",
    label: "News",
    singular: "News article",
    table: "news",
    order: { col: "published_at", asc: false },
    slugFrom: "title",
    listColumns: [
      { name: "title", label: "Title" },
      { name: "status", label: "Status" },
      { name: "published_at", label: "Published" },
    ],
    defaults: { status: "published" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate." },
      { name: "author", label: "Author", type: "text", help: "Shown as the byline." },
      { name: "summary", label: "Summary", type: "textarea", help: "Shown on cards." },
      { name: "content", label: "Content", type: "richtext", help: "The full article. Use the toolbar to format." },
      { name: "image_url", label: "Cover image", type: "image" },
      { name: "video_url", label: "Video", type: "video", help: "Optional highlight or interview clip." },
      { name: "published_at", label: "Publish date", type: "datetime" },
      STATUS,
    ],
  },
  {
    key: "events",
    label: "Events",
    singular: "Event",
    table: "events",
    order: { col: "event_date", asc: true },
    slugFrom: "title",
    listColumns: [
      { name: "title", label: "Title" },
      { name: "event_date", label: "Date" },
      { name: "status", label: "Status" },
    ],
    defaults: { status: "published", featured: "false" },
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate." },
      { name: "event_date", label: "Date & time", type: "datetime", required: true },
      { name: "location", label: "Location", type: "text" },
      { name: "map_url", label: "Map link", type: "url", help: "Google Maps link to the venue." },
      { name: "description", label: "Description", type: "textarea" },
      { name: "featured", label: "Featured event", type: "boolean", help: "Highlights the card and shows a countdown." },
      {
        name: "tag",
        label: "Tag",
        type: "select",
        options: ["", "Featured", "Over 18s", "Family friendly", "Fundraiser", "Social", "Junior", "Presentation night"],
        help: "Optional label shown on the event card.",
      },
      { name: "tickets_url", label: "Tickets link", type: "url", help: "Adds a Get tickets button." },
      { name: "image_url", label: "Image", type: "image" },
      { name: "video_url", label: "Video", type: "video" },
      STATUS,
    ],
  },
  {
    key: "sponsors",
    label: "Sponsors",
    singular: "Sponsor",
    table: "sponsors",
    order: { col: "display_order", asc: true },
    listColumns: [
      { name: "name", label: "Name" },
      { name: "sponsor_level", label: "Level" },
      { name: "status", label: "Status" },
    ],
    defaults: { status: "published", sponsor_level: "gold", display_order: 0, in_carousel: "true" },
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "website_url", label: "Website", type: "url" },
      { name: "logo_url", label: "Logo", type: "image", help: "Hi-res logo. Transparent PNG works best." },
      { name: "blurb", label: "Blurb", type: "textarea", help: "Short description shown on the Sponsors page." },
      {
        name: "sponsor_level",
        label: "Level",
        type: "select",
        options: ["platinum", "gold", "silver"],
        required: true,
      },
      { name: "display_order", label: "Priority order", type: "number", help: "Lower shows first." },
      { name: "in_carousel", label: "Show in logo carousel", type: "boolean", help: "Appears in the rotating strip on the home page." },
      STATUS,
    ],
  },
  {
    key: "teams",
    label: "Teams",
    singular: "Team",
    table: "teams",
    order: { col: "display_order", asc: true },
    slugFrom: "name",
    listColumns: [
      { name: "name", label: "Team" },
      { name: "grade", label: "Grade" },
      { name: "status", label: "Status" },
    ],
    defaults: { status: "published", display_order: 0 },
    fields: [
      { name: "name", label: "Team name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", help: "Leave blank to auto-generate." },
      { name: "age_group", label: "Age group", type: "text" },
      {
        name: "gender",
        label: "Gender",
        type: "select",
        options: ["Men", "Women", "Mixed"],
      },
      { name: "grade", label: "Grade / division", type: "text" },
      { name: "coach_name", label: "Coach", type: "text" },
      { name: "training_details", label: "Training", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image_url", label: "Team photo", type: "image" },
      { name: "video_url", label: "Video", type: "video" },
      { name: "display_order", label: "Order", type: "number" },
      STATUS,
    ],
  },
  {
    key: "matches",
    label: "Fixtures & Results",
    singular: "Match",
    table: "matches",
    order: { col: "match_date", asc: true },
    bulkImport: true,
    listColumns: [
      { name: "round", label: "Round" },
      { name: "opponent", label: "Opponent" },
      { name: "match_date", label: "Date" },
      { name: "status", label: "Status" },
    ],
    defaults: { status: "scheduled", home_away: "Home", grade: "Seniors" },
    fields: [
      { name: "grade", label: "Grade / team", type: "text", required: true, help: 'e.g. "Seniors", "Reserves", "A Grade".' },
      { name: "round", label: "Round", type: "text", help: 'e.g. "Round 5" or "Semi Final".' },
      { name: "match_date", label: "Date & time", type: "datetime" },
      { name: "opponent", label: "Opponent", type: "text", required: true },
      { name: "opponent_logo", label: "Opponent logo URL", type: "url", help: "Paste a logo image link. Shows next to the opponent." },
      { name: "home_away", label: "Home / Away", type: "select", options: ["Home", "Away"] },
      { name: "our_score", label: "Our score", type: "number", help: "Leave blank for upcoming fixtures." },
      { name: "opponent_score", label: "Opponent score", type: "number" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["scheduled", "completed"],
        required: true,
        help: '"scheduled" = fixture, "completed" = result.',
      },
    ],
  },
  {
    key: "ladder",
    label: "Ladder",
    singular: "Ladder row",
    table: "ladder",
    order: { col: "position", asc: true },
    bulkImport: true,
    listColumns: [
      { name: "position", label: "#" },
      { name: "team", label: "Team" },
      { name: "points", label: "Pts" },
      { name: "grade", label: "Grade" },
    ],
    defaults: { is_own: "false", grade: "Seniors", played: 0, won: 0, lost: 0, drawn: 0, points: 0, percentage: 0 },
    fields: [
      { name: "grade", label: "Grade / team", type: "text", required: true },
      { name: "position", label: "Position", type: "number" },
      { name: "team", label: "Team", type: "text", required: true },
      { name: "logo", label: "Team logo URL", type: "url" },
      { name: "played", label: "Played", type: "number" },
      { name: "won", label: "Won", type: "number" },
      { name: "lost", label: "Lost", type: "number" },
      { name: "drawn", label: "Drawn", type: "number" },
      { name: "points", label: "Points", type: "number" },
      { name: "percentage", label: "Percentage", type: "number", help: "% or for/against ratio." },
      { name: "is_own", label: "This is our club", type: "boolean", help: "Highlights the row." },
    ],
  },
];

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
