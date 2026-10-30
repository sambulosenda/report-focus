import { and, desc, eq, gte, ne } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { isLive } from "@/lib/queries";
import { absoluteUrl, isWireByline } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/**
 * Google News sitemap: stories from the last two days, which is all Google News reads.
 * Submit /news-sitemap.xml in Search Console alongside /sitemap.xml.
 */
export async function GET() {
  const since = new Date(Date.now() - 2 * 864e5);
  const stories = await db
    .select({ title: articles.title, slug: articles.slug, section: categories.slug, heroImage: articles.heroImage, tags: articles.tags, publishedAt: articles.publishedAt, author: users.name })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(and(isLive(), gte(articles.publishedAt, since), ne(articles.kind, "video")))
    .orderBy(desc(articles.publishedAt))
    .limit(1000);

  const urls = stories
    // Agency stories are noindex (see isWireByline), so Google News doesn't get them either.
    .filter((s) => !isWireByline(s.author))
    .map((s) => {
      const keywords = s.tags.split(",").map((t) => t.trim()).filter((t) => t && t.toLowerCase() !== "sample");
      return `<url><loc>${esc(siteUrl(`/${s.section ?? "news"}/${s.slug}`))}</loc><news:news><news:publication><news:name>${esc(SITE_NAME)}</news:name><news:language>en</news:language></news:publication><news:publication_date>${s.publishedAt?.toISOString()}</news:publication_date><news:title>${esc(s.title)}</news:title>${
        keywords.length ? `<news:keywords>${esc(keywords.join(", "))}</news:keywords>` : ""
      }</news:news>${s.heroImage ? `<image:image><image:loc>${esc(absoluteUrl(s.heroImage))}</image:loc></image:image>` : ""}</url>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } });
}
