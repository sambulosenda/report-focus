import "server-only";
import { and, desc, eq, inArray, like, lte, ne, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { articles, categories, legacyRedirects, liveUpdates, users, type Kind } from "@/db/schema";

/** A story is public once it is published and its publish time has arrived (future times act as a schedule). */
export const isLive = () => and(eq(articles.status, "published"), lte(articles.publishedAt, new Date()));

const storySelect = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  summary: articles.summary,
  heroImage: articles.heroImage,
  heroAlt: articles.heroAlt,
  kind: articles.kind,
  videoDuration: articles.videoDuration,
  isBreaking: articles.isBreaking,
  isFeatured: articles.isFeatured,
  publishedAt: articles.publishedAt,
  views: articles.views,
  categoryId: articles.categoryId,
  category: { name: categories.name, slug: categories.slug, color: categories.color },
  author: { name: users.name, slug: users.slug, title: users.title, avatarUrl: users.avatarUrl },
};

export type StoryCard = Awaited<ReturnType<typeof latestStories>>[number];

function storyQuery() {
  return db
    .select(storySelect)
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .$dynamic();
}

// Stories published in the same second keep a stable order, so paging never repeats or skips one.
const newestFirst = [desc(articles.publishedAt), desc(articles.id)] as const;

export async function latestStories(limit = 20, offset = 0) {
  return storyQuery().where(isLive()).orderBy(...newestFirst).limit(limit).offset(offset);
}

export async function storiesOfKind(kinds: Kind[], limit = 10, offset = 0) {
  return storyQuery()
    .where(and(isLive(), inArray(articles.kind, kinds)))
    .orderBy(...newestFirst)
    .limit(limit)
    .offset(offset);
}

/** The live story readers are sent to from "Live": the newest live story from the last three days. */
export const currentLiveStory = cache(async () => {
  const since = Math.floor((Date.now() - 3 * 864e5) / 1000);
  const rows = await storyQuery()
    .where(and(isLive(), eq(articles.kind, "live"), sql`${articles.publishedAt} >= ${since}`))
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  return rows[0] ?? null;
});

/** Most-used tags across recent stories, for the "Full coverage" chips. Optionally limited to one section. */
export async function trendingTags(limit = 6, categoryId?: number) {
  const rows = await db
    .select({ tags: articles.tags })
    .from(articles)
    .where(and(isLive(), categoryId ? eq(articles.categoryId, categoryId) : undefined))
    .orderBy(desc(articles.publishedAt))
    .limit(60);
  const counts = new Map<string, { label: string; n: number }>();
  for (const r of rows) {
    const seen = new Set<string>();
    for (const raw of r.tags.split(",")) {
      const label = raw.trim();
      const key = label.toLowerCase();
      // "sample" marks the demo stories; it is not a topic. A tag typed twice on one story counts once.
      if (!label || key === "sample" || seen.has(key)) continue;
      seen.add(key);
      const hit = counts.get(key);
      counts.set(key, { label: hit?.label ?? label, n: (hit?.n ?? 0) + 1 });
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, limit)
    .map(([key, v]) => ({ slug: key, label: v.label }));
}

export async function countInCategory(categoryId: number) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(articles)
    .where(and(isLive(), eq(articles.categoryId, categoryId)));
  return Number(n);
}

/** Timeline for a live story: pinned posts first, then newest first. Pass a limit to fetch only the top of it. */
export async function liveUpdatesFor(articleId: number, limit?: number) {
  const q = db
    .select({
      id: liveUpdates.id,
      title: liveUpdates.title,
      body: liveUpdates.body,
      isPinned: liveUpdates.isPinned,
      createdAt: liveUpdates.createdAt,
      author: users.name,
    })
    .from(liveUpdates)
    .leftJoin(users, eq(users.id, liveUpdates.authorId))
    .where(eq(liveUpdates.articleId, articleId))
    .orderBy(desc(liveUpdates.isPinned), desc(liveUpdates.createdAt), desc(liveUpdates.id))
    .$dynamic();
  return limit ? q.limit(limit) : q;
}

/** How many updates a live story has, its newest update id and when the last one was posted. */
export async function liveUpdateStats(articleId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)`, latestId: sql<number | null>`max(${liveUpdates.id})`, lastAt: sql<number | null>`max(${liveUpdates.createdAt})` })
    .from(liveUpdates)
    .where(eq(liveUpdates.articleId, articleId));
  return {
    count: Number(row?.count ?? 0),
    latestId: Number(row?.latestId ?? 0),
    lastAt: row?.lastAt ? new Date(Number(row.lastAt) * 1000) : null,
  };
}

export async function featuredStories(limit = 5) {
  return storyQuery()
    .where(and(isLive(), eq(articles.isFeatured, true)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function breakingStory() {
  const since = new Date(Date.now() - 24 * 3600e3);
  const rows = await storyQuery()
    .where(and(isLive(), eq(articles.isBreaking, true), sql`${articles.publishedAt} >= ${Math.floor(since.getTime() / 1000)}`))
    .orderBy(desc(articles.publishedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function mostRead(limit = 6, categoryId?: number) {
  const since = Math.floor((Date.now() - 7 * 864e5) / 1000);
  return storyQuery()
    .where(and(isLive(), sql`${articles.publishedAt} >= ${since}`, categoryId ? eq(articles.categoryId, categoryId) : undefined))
    .orderBy(desc(articles.views), desc(articles.id))
    .limit(limit);
}

export async function storiesInCategory(categoryId: number, limit = 12, offset = 0) {
  return storyQuery()
    .where(and(isLive(), eq(articles.categoryId, categoryId)))
    .orderBy(...newestFirst)
    .limit(limit)
    .offset(offset);
}

export async function storiesByAuthor(authorId: number, limit = 30, offset = 0) {
  return storyQuery()
    .where(and(isLive(), eq(articles.authorId, authorId)))
    .orderBy(...newestFirst)
    .limit(limit)
    .offset(offset);
}

export async function relatedStories(articleId: number, categoryId: number | null, limit = 4, excludeKind?: Kind) {
  return storyQuery()
    .where(
      and(
        isLive(),
        ne(articles.id, articleId),
        categoryId ? eq(articles.categoryId, categoryId) : undefined,
        excludeKind ? ne(articles.kind, excludeKind) : undefined,
      ),
    )
    .orderBy(...newestFirst)
    .limit(limit);
}

export type SearchType = "all" | "stories" | "video" | "live";
export type SearchSort = "relevance" | "newest";

export async function searchStories(q: string, { type = "all", sort = "relevance", limit = 20, offset = 0 }: { type?: SearchType; sort?: SearchSort; limit?: number; offset?: number } = {}) {
  const term = `%${q.replace(/[%_]/g, "")}%`;
  const kindFilter =
    type === "video" ? eq(articles.kind, "video") : type === "live" ? eq(articles.kind, "live") : type === "stories" ? sql`${articles.kind} not in ('video','live')` : undefined;
  const where = and(isLive(), kindFilter, or(like(articles.title, term), like(articles.summary, term), like(articles.tags, term), like(articles.body, term)));
  // Relevance: headline matches first, then summary or tag matches, then body-only matches.
  const rank = sql`case when ${articles.title} like ${term} then 0 when ${articles.summary} like ${term} or ${articles.tags} like ${term} then 1 else 2 end`;
  const [rows, [{ n }]] = await Promise.all([
    storyQuery()
      .where(where)
      .orderBy(...(sort === "newest" ? newestFirst : [rank, ...newestFirst]))
      .limit(limit)
      .offset(offset),
    db.select({ n: sql<number>`count(*)` }).from(articles).where(where),
  ]);
  return { rows, total: Number(n) };
}

export async function storiesByTag(tag: string, limit = 30) {
  return storyQuery()
    .where(and(isLive(), like(articles.tags, `%${tag.replace(/[%_]/g, "")}%`)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export const navCategories = cache(async () =>
  db.select().from(categories).where(eq(categories.inNav, true)).orderBy(categories.sortOrder, categories.name),
);

export const allCategories = cache(async () => db.select().from(categories).orderBy(categories.sortOrder, categories.name));

export const categoryBySlug = cache(async (slug: string) =>
  db.select().from(categories).where(eq(categories.slug, slug.toLowerCase())).get(),
);

export const publicArticle = cache(async (slug: string) => {
  const row = await db
    .select({ article: articles, category: categories, author: users })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(and(eq(articles.slug, slug), isLive()))
    .get();
  return row ?? null;
});

/** Top stories for each section, fetched in one pass for the homepage rails. */
export async function sectionRails(cats: { id: number }[], perSection = 4) {
  if (cats.length === 0) return new Map<number, StoryCard[]>();
  const rows = await db
    .select(storySelect)
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(and(isLive(), inArray(articles.categoryId, cats.map((c) => c.id))))
    .orderBy(desc(articles.publishedAt))
    .limit(cats.length * 25);
  const map = new Map<number, StoryCard[]>();
  for (const r of rows) {
    const list = map.get(r.categoryId!) ?? [];
    if (list.length < perSection) list.push(r);
    map.set(r.categoryId!, list);
  }
  return map;
}

export async function incrementViews(id: number) {
  await db.update(articles).set({ views: sql`${articles.views} + 1` }).where(eq(articles.id, id));
}

/** Where an old WordPress address should go now, or null if it isn't one we know. */
export async function legacyTarget(key: string) {
  const row = await db
    .select({
      articleSlug: articles.slug,
      status: articles.status,
      publishedAt: articles.publishedAt,
      section: categories.slug,
      categoryId: legacyRedirects.categoryId,
    })
    .from(legacyRedirects)
    .leftJoin(articles, eq(articles.id, legacyRedirects.articleId))
    .leftJoin(categories, eq(categories.id, sql`coalesce(${legacyRedirects.categoryId}, ${articles.categoryId})`))
    .where(eq(legacyRedirects.path, key))
    .get();
  if (!row) return null;
  if (row.categoryId) return row.section ? `/${row.section}` : null;
  const live = row.status === "published" && row.publishedAt && row.publishedAt <= new Date();
  if (!row.articleSlug || !live) return null;
  return `/${row.section ?? "news"}/${row.articleSlug}`;
}
