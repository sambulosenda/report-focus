/**
 * Story bodies imported from WordPress still link to backend.reportfocusnews.com, which no longer exists.
 * Points each link at the story's current address, or unlinks it (keeping the words) when the story was retired.
 * Dry-run by default: writes reports/backend-links.csv. Pass --apply to change the stories and write an undo file.
 *
 *   npx tsx --env-file-if-exists=.env scripts/rewrite-backend-links.ts
 *   npx tsx --env-file-if-exists=.env scripts/rewrite-backend-links.ts --apply
 */
import { writeFile } from "node:fs/promises";
import { and, eq, like, lte, sql } from "drizzle-orm";
import { db } from "../src/db";
import { articles, categories, legacyRedirects } from "../src/db/schema";
import { legacyPathKey } from "../src/lib/legacy";

const LINK = /\[([^\]]*)\]\((https?:\/\/backend\.reportfocusnews\.com)(\/[^)\s]*)?\)/g;

async function redirectTarget(key: string) {
  const row = await db
    .select({ slug: articles.slug, status: articles.status, publishedAt: articles.publishedAt, section: categories.slug, categoryId: legacyRedirects.categoryId })
    .from(legacyRedirects)
    .leftJoin(articles, eq(articles.id, legacyRedirects.articleId))
    .leftJoin(categories, eq(categories.id, sql`coalesce(${legacyRedirects.categoryId}, ${articles.categoryId})`))
    .where(eq(legacyRedirects.path, key))
    .get();
  if (!row) return null;
  if (row.categoryId) return row.section ? `/${row.section}` : null;
  const live = row.status === "published" && row.publishedAt && row.publishedAt <= new Date();
  return row.slug && live ? `/${row.section ?? "news"}/${row.slug}` : null;
}

async function slugTarget(slug: string) {
  const row = await db
    .select({ slug: articles.slug, section: categories.slug })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .where(and(eq(articles.slug, slug), eq(articles.status, "published"), lte(articles.publishedAt, new Date())))
    .get();
  return row ? `/${row.section ?? "news"}/${row.slug}` : null;
}

async function resolve(rawPath: string): Promise<{ href: string | null; how: string }> {
  const path = rawPath.split(/[?#]/, 1)[0] || "/";
  const key = legacyPathKey(path);
  const direct = await redirectTarget(key);
  if (direct) return { href: direct, how: "redirect" };
  const parent = /^(\/\d{4}\/\d{2}\/\d{2}\/[^/]+)\/[^/]+$/.exec(key)?.[1];
  const viaParent = parent ? await redirectTarget(parent) : null;
  if (viaParent) return { href: viaParent, how: "redirect-parent" };
  const slug = /^\/\d{4}\/\d{2}\/\d{2}\/([^/]+)/.exec(key)?.[1];
  const bySlug = slug ? await slugTarget(slug) : null;
  if (bySlug) return { href: bySlug, how: "slug" };
  return { href: null, how: "unlinked" };
}

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await db.select({ id: articles.id, body: articles.body }).from(articles).where(like(articles.body, "%backend.reportfocusnews.com%"));

  const report: string[] = ["article_id,old_url,new_href,how"];
  const undo: { id: number; body: string }[] = [];
  const counts: Record<string, number> = {};
  const cache = new Map<string, { href: string | null; how: string }>();

  for (const { id, body } of rows) {
    let next = body;
    for (const [match, text, host, rawPath = "/"] of body.matchAll(LINK)) {
      const result = cache.get(rawPath) ?? (await resolve(rawPath));
      cache.set(rawPath, result);
      counts[result.how] = (counts[result.how] ?? 0) + 1;
      report.push([id, host + rawPath, result.href ?? "", result.how].map(csvCell).join(","));
      next = next.replace(match, result.href ? `[${text}](${result.href})` : text);
    }
    if (next.includes("backend.reportfocusnews.com")) counts["left-over"] = (counts["left-over"] ?? 0) + 1;
    if (next !== body) {
      undo.push({ id, body });
      if (apply) await db.update(articles).set({ body: next }).where(eq(articles.id, id));
    }
  }

  await writeFile("reports/backend-links.csv", report.join("\n") + "\n");
  if (apply) await writeFile(`reports/backend-links-undo-${Date.now()}.json`, JSON.stringify(undo));
  console.log({ mode: apply ? "applied" : "dry-run", stories: rows.length, changed: undo.length, links: counts });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
