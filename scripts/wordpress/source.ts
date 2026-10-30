/**
 * Reads posts from a WordPress export file (Tools → Export) or from a live site's REST API,
 * and turns both into the same plain shape for the importer.
 */
import { readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";
import { decodeEntities, htmlToText } from "./convert";

export type WpAuthor = { login: string; name: string; email: string | null; slug: string };
export type WpTerm = { name: string; slug: string };
export type WpImage = { url: string; alt: string; caption: string };

export type WpPost = {
  id: number;
  type: "post" | "page";
  title: string;
  slug: string;
  status: "publish" | "future" | "draft" | "pending" | "private";
  /** When it was (or will be) published. Null for drafts that never had a date. */
  date: Date | null;
  modified: Date | null;
  /** The post's public address on the old site. */
  link: string | null;
  html: string;
  excerpt: string;
  author: WpAuthor | null;
  categories: WpTerm[];
  tags: string[];
  featured: WpImage | null;
  sticky: boolean;
};

export type WpSite = { url: string | null; posts: WpPost[]; skipped: Record<string, number> };

const STATUSES = new Set(["publish", "future", "draft", "pending", "private"]);

function count(skipped: Record<string, number>, why: string) {
  skipped[why] = (skipped[why] ?? 0) + 1;
}

/** WordPress writes "0000-00-00 00:00:00" for dates it doesn't have. GMT values have no zone marker. */
function wpDate(value: unknown, gmt: boolean) {
  const s = String(value ?? "").trim();
  if (!s || s.startsWith("0000")) return null;
  const iso = s.replace(" ", "T") + (gmt && !/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? "Z" : "");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

const text = (v: unknown) => (v == null ? "" : typeof v === "object" ? String((v as Record<string, unknown>)["#text"] ?? "") : String(v));

// ---------------------------------------------------------------------------
// WXR export file
// ---------------------------------------------------------------------------

export async function readExportFile(file: string, { includePages = false } = {}): Promise<WpSite> {
  const xml = await readFile(file, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@",
    parseTagValue: false,
    trimValues: false,
    processEntities: true,
    htmlEntities: true,
    isArray: (name) => ["item", "category", "wp:postmeta", "wp:author", "wp:category"].includes(name),
  });
  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  if (!channel) throw new Error(`${file} doesn't look like a WordPress export file (no <rss><channel>).`);

  const authors = new Map<string, WpAuthor>();
  for (const a of channel["wp:author"] ?? []) {
    const login = text(a["wp:author_login"]).trim();
    if (!login) continue;
    authors.set(login, {
      login,
      name: text(a["wp:author_display_name"]).trim() || login,
      email: text(a["wp:author_email"]).trim() || null,
      slug: login,
    });
  }

  const items: Record<string, unknown>[] = channel.item ?? [];
  const meta = (item: Record<string, unknown>) => {
    const out: Record<string, string> = {};
    for (const m of (item["wp:postmeta"] as Record<string, unknown>[] | undefined) ?? []) out[text(m["wp:meta_key"])] = text(m["wp:meta_value"]);
    return out;
  };

  // Attachments carry the image address, alt text and caption that a post's featured image points to.
  const attachments = new Map<string, WpImage>();
  for (const item of items) {
    if (text(item["wp:post_type"]) !== "attachment") continue;
    const url = text(item["wp:attachment_url"]).trim() || text(item.guid).trim();
    if (!url) continue;
    attachments.set(text(item["wp:post_id"]).trim(), {
      url,
      alt: meta(item)._wp_attachment_image_alt ?? "",
      caption: htmlToText(text(item["excerpt:encoded"])),
    });
  }

  const skipped: Record<string, number> = {};
  const posts: WpPost[] = [];
  for (const item of items) {
    const type = text(item["wp:post_type"]);
    if (type === "attachment") continue;
    if (type !== "post" && !(type === "page" && includePages)) {
      count(skipped, type === "page" ? "pages (use --include-pages to bring them over)" : `${type || "unknown"} items`);
      continue;
    }
    const status = text(item["wp:status"]);
    if (!STATUSES.has(status)) {
      count(skipped, `${status || "unknown"} posts`);
      continue;
    }
    const terms = (item.category as Record<string, unknown>[] | undefined) ?? [];
    const termsOf = (domain: string) =>
      terms
        .filter((c) => c["@domain"] === domain)
        .map((c) => ({ name: decodeEntities(text(c)).trim(), slug: String(c["@nicename"] ?? "").trim() }))
        .filter((t) => t.name);
    const m = meta(item);
    const login = text(item["dc:creator"]).trim();
    posts.push({
      id: Number(text(item["wp:post_id"])),
      type: type as "post" | "page",
      title: decodeEntities(text(item.title)).trim(),
      slug: decodeURIComponent(text(item["wp:post_name"]).trim()),
      status: status as WpPost["status"],
      date: wpDate(item["wp:post_date_gmt"], true) ?? wpDate(item["wp:post_date"], false),
      modified: wpDate(item["wp:post_modified_gmt"], true),
      link: text(item.link).trim() || null,
      html: text(item["content:encoded"]),
      excerpt: text(item["excerpt:encoded"]),
      author: authors.get(login) ?? (login ? { login, name: login, email: null, slug: login } : null),
      categories: termsOf("category"),
      tags: termsOf("post_tag").map((t) => t.name),
      featured: (m._thumbnail_id && attachments.get(m._thumbnail_id)) || null,
      sticky: text(item["wp:is_sticky"]) === "1",
    });
  }

  const url = text(channel["wp:base_blog_url"]).trim() || text(channel.link).trim() || null;
  return { url, posts, skipped };
}

// ---------------------------------------------------------------------------
// REST API on a live site (only published posts are public)
// ---------------------------------------------------------------------------

type RestPost = {
  id: number;
  type: string;
  date_gmt: string;
  modified_gmt: string;
  slug: string;
  status: string;
  link: string;
  sticky?: boolean;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt: { rendered: string };
  _embedded?: {
    author?: { name?: string; slug?: string }[];
    "wp:featuredmedia"?: { source_url?: string; alt_text?: string; caption?: { rendered: string } }[];
    "wp:term"?: { taxonomy: string; name: string; slug: string }[][];
  };
};

async function getJson(url: string) {
  const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "ReportFocusImporter/1.0" } });
  return res;
}

/** Finds a working REST endpoint. Sites without pretty permalinks only answer on ?rest_route=. */
async function restBase(site: string) {
  const candidates = [`${site}/wp-json/wp/v2`, `${site}/?rest_route=/wp/v2`];
  for (const base of candidates) {
    try {
      const res = await getJson(`${base.includes("?") ? base + "/posts&" : base + "/posts?"}per_page=1`);
      if (res.ok && (res.headers.get("content-type") ?? "").includes("json")) return base;
    } catch {}
  }
  throw new Error(
    `Couldn't reach the WordPress REST API at ${site}. Check the address, or export the posts from the WordPress dashboard (Tools → Export) and import the file instead.`,
  );
}

export async function readFromSite(siteUrl: string, { includePages = false, log = console.log } = {}): Promise<WpSite> {
  const site = siteUrl.replace(/\/+$/, "");
  const base = await restBase(site);
  const posts: WpPost[] = [];
  const skipped: Record<string, number> = {};

  for (const kind of includePages ? ["posts", "pages"] : ["posts"]) {
    for (let page = 1, pages = 1; page <= pages; page++) {
      const q = `per_page=100&page=${page}&_embed=author,wp:featuredmedia,wp:term`;
      const url = base.includes("?") ? `${base}/${kind}&${q}` : `${base}/${kind}?${q}`;
      const res = await getJson(url);
      if (!res.ok) throw new Error(`The old site answered ${res.status} for ${url}`);
      pages = Number(res.headers.get("x-wp-totalpages") ?? 1);
      log(`  fetched ${kind} page ${page} of ${pages}`);
      for (const p of (await res.json()) as RestPost[]) {
        if (p.content?.protected) {
          count(skipped, "password-protected posts");
          continue;
        }
        const terms = (p._embedded?.["wp:term"] ?? []).flat();
        const author = p._embedded?.author?.[0];
        const media = p._embedded?.["wp:featuredmedia"]?.[0];
        posts.push({
          id: p.id,
          type: kind === "pages" ? "page" : "post",
          title: htmlToText(p.title.rendered),
          slug: decodeURIComponent(p.slug),
          status: (STATUSES.has(p.status) ? p.status : "publish") as WpPost["status"],
          date: wpDate(p.date_gmt, true),
          modified: wpDate(p.modified_gmt, true),
          link: p.link,
          html: p.content.rendered,
          excerpt: p.excerpt.rendered,
          author: author?.slug ? { login: author.slug, name: author.name || author.slug, email: null, slug: author.slug } : null,
          categories: terms.filter((t) => t.taxonomy === "category").map((t) => ({ name: decodeEntities(t.name), slug: t.slug })),
          tags: terms.filter((t) => t.taxonomy === "post_tag").map((t) => decodeEntities(t.name)),
          featured: media?.source_url ? { url: media.source_url, alt: media.alt_text ?? "", caption: htmlToText(media.caption?.rendered ?? "") } : null,
          sticky: Boolean(p.sticky),
        });
      }
    }
  }
  return { url: site, posts, skipped };
}
