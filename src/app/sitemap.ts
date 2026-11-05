import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { allCategories, isLive } from "@/lib/queries";
import { absoluteUrl, isDeskByline, isUnconfirmedAuthor, isWireByline } from "@/lib/seo";
import { INFO_PAGES } from "@/lib/site";
import { indexedTopics } from "@/lib/topic-queries";
import { siteUrl } from "@/lib/utils";
import { whatsappChannelUrl } from "@/lib/whatsapp";
import { memo } from "@/lib/memo";
import { emailIsLive } from "@/lib/email";

export const dynamic = "force-dynamic";

// One sitemap file holds up to 50,000 addresses; leave room for sections and authors.
const MAX_STORIES = 45_000;

// Crawlers fetch the sitemap often and it reads every story, so the list is kept for ten minutes.
const sitemapStories = memo(10 * 60_000, async () =>
  db
      .select({
        slug: articles.slug,
        section: categories.slug,
        heroImage: articles.heroImage,
        tags: articles.tags,
        updatedAt: articles.updatedAt,
        author: { slug: users.slug, name: users.name },
      })
      .from(articles)
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(isLive())
      .orderBy(desc(articles.publishedAt))
      .limit(MAX_STORIES),
);

/**
 * Every public story, section, writer, topic hub and standing page search engines should index.
 * Each list page is dated by its newest story. Google ignores change frequency and priority, so they are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, stories] = await Promise.all([allCategories(), sitemapStories()]);

  // Newest change per section and per writer.
  const newest = (map: Map<string, Date>, key: string, d: Date) => {
    const was = map.get(key);
    if (!was || d > was) map.set(key, d);
  };
  const bySection = new Map<string, Date>();
  const byWriter = new Map<string, Date>();
  const byTag = await indexedTopics();
  const sectionSlugs = new Set(cats.map((c) => c.slug));
  let latest: Date | undefined;
  const listed = stories.filter((s) => !isWireByline(s.author.name));
  for (const s of listed) {
    if (!latest || s.updatedAt > latest) latest = s.updatedAt;
    if (s.section) newest(bySection, s.section, s.updatedAt);
    // Desk bylines, wire copy and unconfirmed username accounts have no profile worth listing.
    if (!isDeskByline(s.author.name) && !isUnconfirmedAuthor(s.author.slug)) newest(byWriter, s.author.slug, s.updatedAt);
  }

  return [
    // The same address as the homepage's canonical link, including the trailing slash.
    { url: siteUrl("/"), lastModified: latest },
    { url: siteUrl("/latest"), lastModified: latest },
    ...cats.map((c) => ({ url: siteUrl(`/${c.slug}`), lastModified: bySection.get(c.slug) })),
    ...listed.map((s) => ({
      url: siteUrl(`/${s.section ?? "news"}/${s.slug}`),
      lastModified: s.updatedAt,
      images: s.heroImage ? [absoluteUrl(s.heroImage)] : undefined,
    })),
    ...[...byWriter].map(([slug, d]) => ({ url: siteUrl(`/author/${slug}`), lastModified: d })),
    ...[...byTag].filter(([slug]) => !sectionSlugs.has(slug))
      .map(([slug, t]) => ({ url: siteUrl(`/tag/${encodeURIComponent(slug)}`), lastModified: t.at })),
    ...Object.entries(INFO_PAGES)
      .filter(([slug, page]) => !page.noindex && !sectionSlugs.has(slug))
      .map(([slug]) => ({ url: siteUrl(`/${slug}`) })),
    ...(emailIsLive() ? [{ url: siteUrl("/newsletters") }] : []),
    ...(whatsappChannelUrl() ? [{ url: siteUrl("/whatsapp") }] : []),
    { url: siteUrl("/elections/south-africa-2026") },
  ];
}
