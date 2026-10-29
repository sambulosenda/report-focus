import "server-only";
import { and, desc, eq, inArray, like, lte, ne, or, sql } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";

/** A story is public once it is published and its publish time has arrived (future times act as a schedule). */
export const isLive = () => and(eq(articles.status, "published"), lte(articles.publishedAt, new Date()));

const storySelect = {
  id: articles.id,
  title: articles.title,
  slug: articles.slug,
  summary: articles.summary,
  heroImage: articles.heroImage,
  isBreaking: articles.isBreaking,
  isFeatured: articles.isFeatured,
  publishedAt: articles.publishedAt,
  views: articles.views,
  category: { name: categories.name, slug: categories.slug, color: categories.color },
  author: { name: users.name, slug: users.slug },
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

export async function latestStories(limit = 20, offset = 0) {
  return storyQuery().where(isLive()).orderBy(desc(articles.publishedAt)).limit(limit).offset(offset);
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

export async function mostRead(limit = 6) {
  const since = Math.floor((Date.now() - 7 * 864e5) / 1000);
  return storyQuery()
    .where(and(isLive(), sql`${articles.publishedAt} >= ${since}`))
    .orderBy(desc(articles.views))
    .limit(limit);
}

export async function storiesInCategory(categoryId: number, limit = 12, offset = 0) {
  return storyQuery()
    .where(and(isLive(), eq(articles.categoryId, categoryId)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function storiesByAuthor(authorId: number, limit = 30) {
  return storyQuery()
    .where(and(isLive(), eq(articles.authorId, authorId)))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function relatedStories(articleId: number, categoryId: number | null, limit = 4) {
  return storyQuery()
    .where(and(isLive(), ne(articles.id, articleId), categoryId ? eq(articles.categoryId, categoryId) : undefined))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function searchStories(q: string, limit = 30) {
  const term = `%${q.replace(/[%_]/g, "")}%`;
  return storyQuery()
    .where(and(isLive(), or(like(articles.title, term), like(articles.summary, term), like(articles.tags, term), like(articles.body, term))))
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
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
    .select({ ...storySelect, categoryId: articles.categoryId })
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
