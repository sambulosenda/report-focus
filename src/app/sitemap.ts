import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { allCategories, isLive } from "@/lib/queries";
import { absoluteUrl, isDeskByline } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

// One sitemap file holds up to 50,000 addresses; leave room for sections and authors.
const MAX_STORIES = 45_000;

/**
 * Every public story, section and writer, so search engines can find the whole archive.
 * Each list page is dated by its newest story. Google ignores change frequency and priority, so they are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, stories] = await Promise.all([
    allCategories(),
    db
      .select({
        slug: articles.slug,
        section: categories.slug,
        heroImage: articles.heroImage,
        updatedAt: articles.updatedAt,
        author: { slug: users.slug, name: users.name },
      })
      .from(articles)
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .innerJoin(users, eq(users.id, articles.authorId))
      .where(isLive())
      .orderBy(desc(articles.publishedAt))
      .limit(MAX_STORIES),
  ]);

  // Newest change per section and per writer.
  const newest = (map: Map<string, Date>, key: string, d: Date) => {
    const was = map.get(key);
    if (!was || d > was) map.set(key, d);
  };
  const bySection = new Map<string, Date>();
  const byWriter = new Map<string, Date>();
  let latest: Date | undefined;
  for (const s of stories) {
    if (!latest || s.updatedAt > latest) latest = s.updatedAt;
    if (s.section) newest(bySection, s.section, s.updatedAt);
    // Desk and wire bylines have no profile worth listing (their pages are noindex).
    if (!isDeskByline(s.author.name)) newest(byWriter, s.author.slug, s.updatedAt);
  }

  return [
    // The same address as the homepage's canonical link.
    { url: siteUrl(), lastModified: latest },
    { url: siteUrl("/latest"), lastModified: latest },
    ...cats.filter((c) => bySection.has(c.slug)).map((c) => ({ url: siteUrl(`/${c.slug}`), lastModified: bySection.get(c.slug) })),
    ...stories.map((s) => ({
      url: siteUrl(`/${s.section ?? "news"}/${s.slug}`),
      lastModified: s.updatedAt,
      images: s.heroImage ? [absoluteUrl(s.heroImage)] : undefined,
    })),
    ...[...byWriter].map(([slug, d]) => ({ url: siteUrl(`/author/${slug}`), lastModified: d })),
  ];
}
