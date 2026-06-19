// SportsWeb One — import-club Edge Function
// Fetches a club's existing public website and extracts headline content so a
// SportsWeb admin can pre-fill the website editor. Stateless: it only fetches
// and parses, it never writes to the database. The admin reviews the result and
// applies the bits they want from the browser (which writes club_content through
// the normal RLS-checked path).
//
// Deploy:   supabase functions deploy import-club
// (no secrets required)

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/** Decode the handful of HTML entities that show up in titles/descriptions. */
function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function meta(html: string, attr: "name" | "property", key: string): string {
  // Match <meta name|property="key" content="…"> in either attribute order.
  const re1 = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, "i");
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, "i");
  const m = html.match(re1) || html.match(re2);
  return m ? decode(m[1]) : "";
}

function firstTag(html: string, tag: string): string {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")) : "";
}

function absolutise(url: string, base: string): string {
  if (!url) return "";
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function firstHref(html: string, pattern: RegExp): string {
  const links = html.match(/href=["']([^"']+)["']/gi) ?? [];
  for (const l of links) {
    const href = l.replace(/^href=["']/i, "").replace(/["']$/, "");
    if (pattern.test(href)) return href;
  }
  return "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let url = "";
  try {
    const body = await req.json();
    url = String(body?.url ?? "").trim();
  } catch {
    return json({ error: "Bad request body" }, 400);
  }
  if (!url) return json({ error: "Please provide a website URL." }, 400);
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  let html = "";
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SportsWebOne-Import/1.0 (+https://sportsweb.com.au)" },
      redirect: "follow",
    });
    if (!res.ok) return json({ error: `The site returned ${res.status}. Check the URL and try again.` }, 200);
    html = await res.text();
  } catch (_e) {
    return json({ error: "Couldn't reach that site. Check the URL (or it may block automated requests)." }, 200);
  }

  // Strip scripts/styles so heading/paragraph extraction isn't polluted.
  const clean = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");

  const ogTitle = meta(html, "property", "og:title");
  const ogDesc = meta(html, "property", "og:description");
  const metaDesc = meta(html, "name", "description");
  const ogImage = meta(html, "property", "og:image");
  const themeColor = meta(html, "name", "theme-color");
  const titleTag = firstTag(html, "title");
  const h1 = firstTag(clean, "h1");

  const email = decode(firstHref(html, /^mailto:/i).replace(/^mailto:/i, "").split("?")[0]);
  const phone = decode(firstHref(html, /^tel:/i).replace(/^tel:/i, ""));
  const instagram = absolutise(firstHref(html, /instagram\.com/i), url);
  const facebook = absolutise(firstHref(html, /facebook\.com/i), url);

  const name = ogTitle || titleTag || h1;
  const result = {
    sourceUrl: url,
    name,
    heroTitle: h1 || name,
    heroSubtitle: ogDesc || metaDesc || "",
    description: ogDesc || metaDesc || "",
    logo: absolutise(ogImage, url),
    accent: /^#?[0-9a-f]{3,8}$/i.test(themeColor) ? (themeColor.startsWith("#") ? themeColor : "#" + themeColor) : "",
    email,
    phone,
    instagram,
    facebook,
  };

  return json({ ok: true, result });
});
