import type { MetadataRoute } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { allCategories, isLive } from "@/lib/queries";
import { absoluteUrl, isDeskByline, isUnconfirmedAuthor, isWireByline } from "@/lib/seo";
import { INFO_PAGES } from "@/lib/site";
import { TAG_INDEX_MIN, tagSlug } from "@/lib/tags";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

// One sitemap file holds up to 50,000 addresses; leave room for sections and authors.
const MAX_STORIES = 45_000;

/**
 * Every public story, section, writer, topic hub and standing page search engines should index.
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
  ]);

  // Newest change per section and per writer.
  const newest = (map: Map<string, Date>, key: string, d: Date) => {
    const was = map.get(key);
    if (!was || d > was) map.set(key, d);
  };
  const bySection = new Map<string, Date>();
  const byWriter = new Map<string, Date>();
  const byTag = new Map<string, { at: Date; n: number }>();
  let latest: Date | undefined;
  // Agency stories are noindex (see isWireByline), so they are left out of the story list.
  // Their tags still count: a topic page indexes every live story that carries the tag.
  const listed = stories.filter((s) => !isWireByline(s.author.name));
  for (const s of stories) {
    for (const raw of s.tags.split(",")) {
      const slug = tagSlug(raw);
      if (!slug || slug === "sample") continue;
      const prev = byTag.get(slug);
      byTag.set(slug, { n: (prev?.n ?? 0) + 1, at: !prev || s.updatedAt > prev.at ? s.updatedAt : prev.at });
    }
  }
  for (const s of listed) {
    if (!latest || s.updatedAt > latest) latest = s.updatedAt;
    if (s.section) newest(bySection, s.section, s.updatedAt);
    // Desk bylines, wire copy and unconfirmed username accounts have no profile worth listing.
    if (!isDeskByline(s.author.name) && !isUnconfirmedAuthor(s.author.slug)) newest(byWriter, s.author.slug, s.updatedAt);
  }
  const sectionSlugs = new Set(cats.map((c) => c.slug));

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
    ...[...byTag]
      .filter(([, t]) => t.n >= TAG_INDEX_MIN)
      .map(([slug, t]) => ({ url: siteUrl(`/tag/${encodeURIComponent(slug)}`), lastModified: t.at })),
    ...Object.entries(INFO_PAGES)
      .filter(([slug, page]) => !page.noindex && !sectionSlugs.has(slug))
      .map(([slug]) => ({ url: siteUrl(`/${slug}`) })),
    { url: siteUrl("/newsletters") },
  ];
}
