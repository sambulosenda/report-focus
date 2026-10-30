import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { allCategories, isLive } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

// One sitemap file holds up to 50,000 addresses; leave room for sections and authors.
const MAX_STORIES = 45_000;

/** Every public story, section and writer, so search engines can find the whole archive. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, stories, writers] = await Promise.all([
    allCategories(),
    db
      .select({ slug: articles.slug, section: categories.slug, heroImage: articles.heroImage, updatedAt: articles.updatedAt })
      .from(articles)
      .leftJoin(categories, eq(categories.id, articles.categoryId))
      .where(isLive())
      .orderBy(desc(articles.publishedAt))
      .limit(MAX_STORIES),
    db
      .selectDistinct({ slug: users.slug })
      .from(users)
      .innerJoin(articles, eq(articles.authorId, users.id))
      .where(isLive()),
  ]);
  return [
    { url: siteUrl("/"), changeFrequency: "always", priority: 1 },
    { url: siteUrl("/latest"), changeFrequency: "always", priority: 0.9 },
    ...cats.map((c) => ({ url: siteUrl(`/${c.slug}`), changeFrequency: "hourly" as const, priority: 0.8 })),
    ...stories.map((s) => ({
      url: siteUrl(`/${s.section ?? "news"}/${s.slug}`),
      lastModified: s.updatedAt,
      priority: 0.6,
      images: s.heroImage ? [absoluteUrl(s.heroImage)] : undefined,
    })),
    ...writers.map((w) => ({ url: siteUrl(`/author/${w.slug}`), changeFrequency: "daily" as const, priority: 0.4 })),
  ];
}
