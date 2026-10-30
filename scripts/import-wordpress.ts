/**
 * Brings posts over from a WordPress site: stories, sections (from categories), authors, tags,
 * featured and inline images, dates and slugs. Old WordPress addresses keep working by redirecting
 * to the new story pages.
 *
 *   npm run import:wordpress -- export.xml              # a file from WordPress → Tools → Export
 *   npm run import:wordpress -- https://old-site.com    # a live site, through its public REST API
 *
 * Options:
 *   --dry-run                 Show what would be imported without changing anything
 *   --update                  Refresh stories already imported (otherwise they are skipped)
 *   --no-images               Leave images on the old site instead of copying them here
 *   --author=<email>          Credit every story to this existing staff account
 *   --section-map=a:b,c:d     Put WordPress category "a" into section "b" (by slug); unmapped ones become new sections
 *   --default-section=<slug>  Section for posts that are only "Uncategorized"
 *   --include-pages           Also import WordPress pages (About, Contact…) as stories
 *   --since=<YYYY-MM-DD>      Only import posts published on or after this date (older ones are left out)
 *   --limit=<n>               Only import the first n posts (handy for a trial run)
 *
 * Running it again is safe: posts are matched by their WordPress ID and never imported twice.
 */
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { eq, inArray, like, max } from "drizzle-orm";
import { legacyPathKey } from "../src/lib/legacy";
import { slugify } from "../src/lib/utils";
import { clip, htmlToMarkdown, htmlToText, leadText, markdownImages, withoutImage } from "./wordpress/convert";
import { readExportFile, readFromSite, type WpPost, type WpSite } from "./wordpress/source";

const PALETTE = ["#1d4ed8", "#0f766e", "#b91c1c", "#a16207", "#7c3aed", "#059669", "#15803d", "#c2410c", "#db2777"];
const IMAGE_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

function parseArgs(argv: string[]) {
  const flags: Record<string, string | true> = {};
  const rest: string[] = [];
  for (const a of argv) {
    const m = a.match(/^--([a-z-]+)(?:=(.*))?$/);
    if (m) flags[m[1]] = m[2] ?? true;
    else rest.push(a);
  }
  const str = (k: string) => (typeof flags[k] === "string" ? (flags[k] as string) : undefined);
  const known = ["dry-run", "update", "no-images", "author", "section-map", "default-section", "include-pages", "since", "limit"];
  const unknown = Object.keys(flags).filter((k) => !known.includes(k));
  if (unknown.length) throw new Error(`Unknown option --${unknown[0]}. See the top of scripts/import-wordpress.ts for the options.`);
  const sectionMap = new Map(
    (str("section-map") ?? "")
      .split(",")
      .map((pair) => pair.split(":").map((s) => s.trim().toLowerCase()))
      .filter((p): p is [string, string] => p.length === 2 && !!p[0] && !!p[1]),
  );
  return {
    source: rest[0],
    dryRun: flags["dry-run"] === true,
    update: flags.update === true,
    images: flags["no-images"] !== true,
    author: str("author")?.toLowerCase(),
    sectionMap,
    defaultSection: str("default-section")?.toLowerCase(),
    includePages: flags["include-pages"] === true,
    since: parseSince(str("since")),
    limit: str("limit") ? Number(str("limit")) : undefined,
  };
}

function parseSince(value?: string) {
  if (!value) return undefined;
  const d = new Date(/^\d{4}$/.test(value) ? `${value}-01-01T00:00:00Z` : /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : "invalid");
  if (Number.isNaN(d.getTime())) throw new Error(`--since needs a date like 2025-01-01 (got "${value}").`);
  return d;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.source) {
    console.log("Usage: npm run import:wordpress -- <export.xml | https://old-site.com> [--dry-run]");
    process.exit(1);
  }

  const fromSite = /^https?:\/\//i.test(opts.source);
  console.log(fromSite ? `Reading posts from ${opts.source}…` : `Reading ${opts.source}…`);
  const site: WpSite = fromSite
    ? await readFromSite(opts.source, { includePages: opts.includePages })
    : await readExportFile(opts.source, { includePages: opts.includePages });

  const since = opts.since;
  const tooOld = since ? site.posts.filter((p) => p.status !== "private" && !(p.date && p.date >= since)).length : 0;
  if (tooOld) site.skipped[`posts from before ${since!.toISOString().slice(0, 10)}`] = tooOld;
  const posts = site.posts.filter((p) => p.status !== "private" && (!since || (p.date && p.date >= since))).slice(0, opts.limit);
  const privateCount = site.posts.filter((p) => p.status === "private").length;
  if (privateCount) site.skipped["private posts"] = privateCount;
  console.log(`Found ${site.posts.length} ${site.posts.length === 1 ? "post" : "posts"}${site.url ? ` from ${site.url}` : ""}.`);

  const oldHosts = new Set<string>();
  if (site.url) oldHosts.add(new URL(site.url).hostname.replace(/^www\./, ""));
  for (const p of site.posts) if (p.link) try { oldHosts.add(new URL(p.link).hostname.replace(/^www\./, "")); } catch {}

  mkdirSync("data", { recursive: true });
  const { db, schema } = await import("../src/db");
  const { articles, categories, legacyRedirects, media, users } = schema;

  // --- What's already here -------------------------------------------------
  const existingCats = await db.select().from(categories);
  const catBySlug = new Map(existingCats.map((c) => [c.slug, c]));
  const allUsers = await db.select().from(users);
  const usedSlugs = new Set((await db.select({ slug: articles.slug }).from(articles)).map((r) => r.slug));
  const imported = new Map(
    (await db.select({ path: legacyRedirects.path, articleId: legacyRedirects.articleId }).from(legacyRedirects).where(like(legacyRedirects.path, "/?p=%"))).map(
      (r) => [r.path, r.articleId],
    ),
  );

  const fixedAuthor = opts.author ? allUsers.find((u) => u.email.toLowerCase() === opts.author) : undefined;
  if (opts.author && !fixedAuthor) throw new Error(`No staff account has the email ${opts.author}.`);
  if (opts.defaultSection && !catBySlug.has(opts.defaultSection)) throw new Error(`There's no section with the slug "${opts.defaultSection}".`);
  for (const target of opts.sectionMap.values()) if (!catBySlug.has(target)) throw new Error(`There's no section with the slug "${target}" to map into.`);

  const report = { created: 0, updated: 0, skipped: 0, sections: [] as string[], authors: [] as string[], images: 0, imageFailures: [] as string[], redirects: 0 };

  // --- Sections ----------------------------------------------------------
  let nextSort = ((await db.select({ m: max(categories.sortOrder) }).from(categories).get())?.m ?? 0) + 1;
  async function sectionFor(post: WpPost) {
    const cats = post.categories.filter((c) => c.slug !== "uncategorized");
    const first = cats[0];
    if (!first) return opts.defaultSection ? catBySlug.get(opts.defaultSection)! : null;
    const slug = opts.sectionMap.get(first.slug.toLowerCase()) ?? slugify(first.slug || first.name);
    const found = catBySlug.get(slug);
    if (found) return found;
    const row = { name: first.name, slug, color: PALETTE[nextSort % PALETTE.length], sortOrder: nextSort++, inNav: false, description: null };
    report.sections.push(`${first.name} (/${slug})`);
    if (opts.dryRun) {
      const fake = { ...row, id: -nextSort };
      catBySlug.set(slug, fake);
      return fake;
    }
    const created = await db.insert(categories).values(row).returning().get();
    catBySlug.set(slug, created);
    return created;
  }

  // --- Authors -----------------------------------------------------------
  const authorCache = new Map<string, number>();
  let placeholderHash: string | undefined;
  async function authorFor(post: WpPost) {
    if (fixedAuthor) return fixedAuthor.id;
    const a = post.author ?? { login: "wordpress", name: "Staff", email: null, slug: "staff" };
    const cached = authorCache.get(a.login);
    if (cached) return cached;
    const slug = slugify(a.slug || a.name);
    const match =
      (a.email && allUsers.find((u) => u.email.toLowerCase() === a.email!.toLowerCase())) ||
      allUsers.find((u) => u.slug === slug) ||
      allUsers.find((u) => u.name.toLowerCase() === a.name.toLowerCase());
    if (match) {
      authorCache.set(a.login, match.id);
      return match.id;
    }
    report.authors.push(a.name);
    if (opts.dryRun) {
      authorCache.set(a.login, -1);
      return -1;
    }
    // Imported writers can't sign in until an admin turns their account on and sets a password.
    placeholderHash ??= await bcrypt.hash(randomBytes(24).toString("hex"), 10);
    const email = a.email?.toLowerCase() || `${slug}@wordpress-import.invalid`;
    const created = await db
      .insert(users)
      .values({ name: a.name, slug: uniqueUserSlug(slug), email, passwordHash: placeholderHash, role: "journalist", active: false })
      .returning()
      .get();
    allUsers.push(created);
    authorCache.set(a.login, created.id);
    return created.id;
  }
  function uniqueUserSlug(slug: string) {
    let s = slug;
    for (let i = 2; allUsers.some((u) => u.slug === s); i++) s = `${slug}-${i}`;
    return s;
  }

  // --- Images ------------------------------------------------------------
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const imageCache = new Map<string, string>();
  async function copyImage(url: string, alt: string, when: Date | null) {
    if (!opts.images || opts.dryRun) return url;
    const abs = url.startsWith("//") ? `https:${url}` : url.startsWith("/") && site.url ? new URL(url, site.url).href : url;
    if (!/^https?:/i.test(abs)) return url;
    const cached = imageCache.get(abs);
    if (cached) return cached;
    const d = when ?? new Date();
    const dir = path.posix.join("wordpress", String(d.getUTCFullYear()), String(d.getUTCMonth() + 1).padStart(2, "0"));
    const base = path.posix.basename(new URL(abs).pathname).replace(/\.[a-z0-9]+$/i, "").replace(/[^a-z0-9_-]+/gi, "-").slice(0, 60) || "image";
    const hash = createHash("sha1").update(abs).digest("hex").slice(0, 8);
    try {
      // Same address, same file name: a second run finds the file and doesn't fetch it again.
      for (const ext of Object.values(IMAGE_EXT)) {
        const rel = path.posix.join(dir, `${base}-${hash}.${ext}`);
        if (existsSync(path.join(uploadDir, rel))) {
          imageCache.set(abs, `/media/${rel}`);
          return `/media/${rel}`;
        }
      }
      const res = await fetch(abs, { headers: { "User-Agent": "ReportFocusImporter/1.0" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      const fileExt = path.extname(new URL(abs).pathname).slice(1).toLowerCase().replace(/^jpg$/, "jpeg");
      const ext = IMAGE_EXT[type] ?? (type.startsWith("image/") ? undefined : IMAGE_EXT[`image/${fileExt}`]);
      if (!ext) throw new Error(`not a supported image (${type || "unknown type"})`);
      const data = Buffer.from(await res.arrayBuffer());
      if (data.length > MAX_IMAGE_BYTES) throw new Error("larger than 20 MB");
      const rel = path.posix.join(dir, `${base}-${hash}.${ext}`);
      mkdirSync(path.join(uploadDir, dir), { recursive: true });
      await writeFile(path.join(uploadDir, rel), data);
      const local = `/media/${rel}`;
      await db.insert(media).values({ url: local, alt: clip(alt, 300) });
      imageCache.set(abs, local);
      report.images++;
      return local;
    } catch (err) {
      report.imageFailures.push(`${abs} (${(err as Error).message})`);
      imageCache.set(abs, url);
      return url;
    }
  }

  function uniqueSlug(wanted: string) {
    const base = slugify(wanted);
    let s = base;
    for (let i = 2; usedSlugs.has(s); i++) s = `${base.slice(0, 85)}-${i}`;
    usedSlugs.add(s);
    return s;
  }

  // --- Posts -------------------------------------------------------------
  let preview: string | undefined;
  for (const [i, post] of posts.entries()) {
    const idKey = legacyPathKey("/", String(post.id));
    const existingId = imported.get(idKey);
    if (existingId && !opts.update) {
      report.skipped++;
      continue;
    }
    const label = `[${i + 1}/${posts.length}] ${post.title || "(no title)"}`;
    console.log(label);

    let body = htmlToMarkdown(post.html, { oldHosts: [...oldHosts] });
    const copied = new Set<string>();
    for (const { src, alt } of markdownImages(body)) {
      if (copied.has(src)) continue;
      copied.add(src);
      const local = await copyImage(src, alt, post.date);
      if (local !== src) body = body.split(`](${src}`).join(`](${local}`);
    }

    const summary = clip(htmlToText(post.excerpt) || leadText(post.html), 300);
    const section = await sectionFor(post);
    const authorId = await authorFor(post);
    const hero = post.featured;
    const heroImage = hero ? await copyImage(hero.url, hero.alt, post.date) : null;
    if (heroImage) body = withoutImage(body, heroImage);
    preview ??= body;
    const extraSections = post.categories.slice(1).filter((c) => c.slug !== "uncategorized").map((c) => c.name);
    const tags = clip([...new Set([...post.tags, ...extraSections])].join(", "), 300).replace(/,[^,]*…$/, "");
    const published = post.status === "publish" || post.status === "future";
    const values = {
      title: clip(post.title || "Untitled story", 200),
      summary,
      body,
      heroImage,
      heroCaption: hero?.caption ? clip(hero.caption, 300) : null,
      heroAlt: hero?.alt ? clip(hero.alt, 300) : null,
      tags,
      categoryId: section?.id ?? null,
      authorId,
      status: published ? ("published" as const) : post.status === "pending" ? ("review" as const) : ("draft" as const),
      publishedAt: published ? (post.date ?? new Date()) : null,
      updatedAt: post.modified ?? post.date ?? new Date(),
    };

    if (opts.dryRun) {
      if (existingId) report.updated++;
      else report.created++;
      continue;
    }

    let articleId: number;
    if (existingId) {
      // Keep the slug and status the newsroom may have changed since the first import.
      const content: Partial<typeof values> = { ...values };
      delete content.status;
      delete content.publishedAt;
      await db.update(articles).set(content).where(eq(articles.id, existingId));
      articleId = existingId;
      report.updated++;
    } else {
      const row = await db
        .insert(articles)
        .values({ ...values, slug: uniqueSlug(post.slug || post.title), createdAt: post.date ?? new Date() })
        .returning({ id: articles.id })
        .get();
      articleId = row.id;
      report.created++;
    }

    const keys = new Set([idKey]);
    if (post.link) {
      try {
        const u = new URL(post.link);
        keys.add(legacyPathKey(u.pathname, u.searchParams.get("p")));
      } catch {}
    }
    for (const key of keys) {
      const res = await db.insert(legacyRedirects).values({ path: key, articleId }).onConflictDoNothing().run();
      report.redirects += res.rowsAffected;
    }
  }

  // Old category pages (/category/politics/) go to their section.
  if (!opts.dryRun) {
    const seen = new Set<string>();
    for (const post of posts)
      for (const c of post.categories) {
        if (!c.slug || seen.has(c.slug)) continue;
        seen.add(c.slug);
        const slug = opts.sectionMap.get(c.slug.toLowerCase()) ?? slugify(c.slug);
        const cat = catBySlug.get(slug);
        if (!cat) continue;
        const res = await db.insert(legacyRedirects).values({ path: legacyPathKey(`/category/${c.slug}`), categoryId: cat.id }).onConflictDoNothing().run();
        report.redirects += res.rowsAffected;
      }
  }

  // --- Report ------------------------------------------------------------
  const verb = opts.dryRun ? "Would import" : "Imported";
  console.log(`\n${verb} ${report.created} new ${report.created === 1 ? "story" : "stories"}${report.updated ? `, ${opts.dryRun ? "would update" : "updated"} ${report.updated}` : ""}.`);
  if (report.skipped) console.log(`Skipped ${report.skipped} already imported (run with --update to refresh them).`);
  for (const [why, n] of Object.entries(site.skipped)) console.log(`Left out ${why}: ${n}`);
  if (report.sections.length) console.log(`New sections (hidden from the menu until you turn them on in Newsroom → Sections): ${report.sections.join(", ")}`);
  if (report.authors.length)
    console.log(`New writer accounts (switched off, so turn them on and set a password in Newsroom → Staff before they sign in): ${report.authors.join(", ")}`);
  if (!opts.dryRun) console.log(`Copied ${report.images} images. Added ${report.redirects} redirects from old WordPress addresses.`);
  if (report.imageFailures.length) {
    console.log(`\n${report.imageFailures.length} images couldn't be copied and still point at the old site:`);
    for (const f of report.imageFailures.slice(0, 20)) console.log(`  ${f}`);
  }
  if (opts.dryRun && preview) console.log(`\nFirst story body as it will appear in the editor:\n\n${clip(preview, 1500)}\n`);
  if (opts.dryRun && !fixedAuthor && authorCache.size) {
    const ids = [...authorCache.values()].filter((id) => id > 0);
    if (ids.length) {
      const names = await db.select({ name: users.name }).from(users).where(inArray(users.id, ids));
      console.log(`Existing staff who will get bylines: ${names.map((n) => n.name).join(", ")}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
