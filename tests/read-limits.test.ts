import assert from "node:assert/strict";
import { test } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { sql } from "drizzle-orm";
import { createRequire, Module } from "node:module";

// These tests execute on Node's server; Next's build-time marker needs no runtime guard here.
const require = createRequire(import.meta.url);
const markerPath = require.resolve("server-only");
const marker = new Module(markerPath);
marker.exports = {};
require.cache[markerPath] = marker;

process.env.DATABASE_URL = "file::memory:";
delete process.env.DATABASE_AUTH_TOKEN;

test("related stories and tag pages stay correct without reading the whole table", async () => {
  const { db } = await import("../src/db");
  const { articles, users } = await import("../src/db/schema");
  const { relatedStories, storiesByTag } = await import("../src/lib/queries");
  await migrate(db, { migrationsFolder: "drizzle" });
  const [writer] = await db.insert(users).values({ name: "Writer", slug: "w", email: "w@example.com", passwordHash: "x" }).returning();
  const at = (minsAgo: number) => new Date(Math.floor(Date.now() / 1000) * 1000 - minsAgo * 60_000);
  const story = (slug: string, tags: string, minsAgo: number, status: "published" | "draft" = "published") =>
    ({ authorId: writer.id, title: slug, slug, tags, status, publishedAt: at(minsAgo) });
  const [source] = await db.insert(articles).values(story("source", "Zimbabwe, ZANU-PF", 1)).returning();
  await db.insert(articles).values([
    story("both-tags", "zimbabwe, zanu-pf", 5),
    story("one-tag", "Zimbabwe", 3),
    story("draft", "Zimbabwe, ZANU-PF", 2, "draft"),
    story("future", "Zimbabwe, ZANU-PF", -60),
    story("other", "Ukraine", 4),
  ]);

  const related = (await relatedStories(source.id, null, source.tags)).map((s) => s.slug);
  assert.deepEqual(related.slice(0, 2), ["both-tags", "one-tag"], "most shared tags first, then newest");
  assert.ok(!related.includes("draft") && !related.includes("future") && !related.includes("source"));

  // The live window still filters drafts and future stories out of the query plan's id list.
  const plan = await db.all<{ detail: string }>(sql`explain query plan select id from articles where id in (select id from articles where status = 'published' order by published_at desc limit 300)`);
  assert.ok(plan.some((r) => r.detail.includes("PRIMARY KEY")), "outer query looks stories up by id");

  assert.deepEqual((await storiesByTag("ZANU-PF")).map((s) => s.slug).sort(), ["both-tags", "source"]);
  assert.deepEqual(await storiesByTag("no-such-tag"), [], "unknown tags skip the table scan");
  assert.deepEqual(await storiesByTag("ai"), [], "a short tag doesn't match inside another word");
});
