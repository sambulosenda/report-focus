import assert from "node:assert/strict";
import { test } from "node:test";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";
import { createRequire, Module } from "node:module";

// These tests execute on Node's server; Next's build-time marker needs no runtime guard here.
const require = createRequire(import.meta.url);
const markerPath = require.resolve("server-only");
const marker = new Module(markerPath);
marker.exports = {};
require.cache[markerPath] = marker;

// Never use the developer's database.
process.env.DATABASE_URL = "file::memory:";
delete process.env.DATABASE_AUTH_TOKEN;
process.env.SITE_URL = "https://reportfocusnews.com";
process.env.EMAIL_PROVIDER = "console";

test("a WhatsApp briefing is one post per edition, and a breaking story posts once", async () => {
  const { db } = await import("../src/db");
  const { articles, categories, users, whatsappPosts } = await import("../src/db/schema");
  const { briefingBody, breakingBody, currentBriefing, currentBreaking, markWhatsAppPost, whatsappChannelUrl, WHATSAPP_LIMIT } = await import("../src/lib/whatsapp");
  await migrate(db, { migrationsFolder: "drizzle" });

  assert.equal(whatsappChannelUrl(""), null);
  assert.equal(whatsappChannelUrl("https://wa.me/263771234567"), null);
  assert.equal(whatsappChannelUrl("http://whatsapp.com/channel/0029VaAbCdEfGhIj"), null);
  assert.equal(whatsappChannelUrl("https://whatsapp.com/channel/short"), null);
  assert.equal(
    whatsappChannelUrl("https://www.whatsapp.com/channel/0029VaAbCdEfGhIj/"),
    "https://www.whatsapp.com/channel/0029VaAbCdEfGhIj",
  );

  const story = {
    title: "Harare council meets",
    slug: "harare-council",
    summary: "The council sat late. A second sentence stays off the post.",
    category: { slug: "zimbabwe" },
  };
  assert.equal(briefingBody([], "2026-10-31"), null);
  const text = briefingBody([story], "2026-10-31");
  assert.ok(text);
  assert.match(text, /^Morning briefing · Saturday, October 31\n\n1\. Harare council meets\nThe council sat late\.\nhttps:\/\/reportfocusnews\.com\/zimbabwe\/harare-council$/);
  assert.equal(text.includes("A second sentence"), false);
  const huge = briefingBody([{ ...story, summary: `${"word ".repeat(2000)}end.` }], "2026-10-31");
  assert.ok(huge);
  assert.ok(huge.length <= WHATSAPP_LIMIT);
  assert.match(huge, /https:\/\/reportfocusnews\.com\/zimbabwe\/harare-council/);
  assert.match(breakingBody(story), /^BREAKING\n\nHarare council meets\nThe council sat late\.\nhttps:\/\/reportfocusnews\.com\/zimbabwe\/harare-council$/);

  const [editor] = await db
    .insert(users)
    .values({ name: "Editor", slug: "editor", email: "editor@example.com", passwordHash: "unused", role: "editor" })
    .returning();
  const [section] = await db.insert(categories).values({ name: "Zimbabwe", slug: "zimbabwe" }).returning();
  const old = new Date(Date.now() - 3 * 864e5);
  await db.insert(articles).values({
    authorId: editor.id,
    categoryId: section.id,
    title: "Old story",
    slug: "old-story",
    summary: "This ran days ago.",
    status: "published",
    publishedAt: old,
  });
  assert.equal((await currentBriefing()).body, null, "a quiet day has nothing to post");
  assert.equal((await markWhatsAppPost({ kind: "briefing", body: "Morning briefing", postedBy: editor.id })).ok, false);
  assert.equal((await db.select().from(whatsappPosts)).length, 0);

  const [live] = await db
    .insert(articles)
    .values({
      authorId: editor.id,
      categoryId: section.id,
      title: "Harare council meets",
      slug: "harare-council",
      summary: "The council sat late. A second sentence stays off the post.",
      status: "published",
      publishedAt: new Date(),
      isBreaking: true,
    })
    .returning();

  const briefing = await currentBriefing();
  assert.ok(briefing.body);
  assert.match(briefing.body, /Harare council meets/);
  assert.match(briefing.body, /The council sat late\./);
  assert.match(briefing.body, /https:\/\/reportfocusnews\.com\/zimbabwe\/harare-council/);
  const stale = briefing.body;
  await db.update(articles).set({ title: "Harare council meets again" }).where(eq(articles.id, live.id));
  const refused = await markWhatsAppPost({ kind: "briefing", body: stale, postedBy: editor.id });
  assert.equal(refused.ok, false);
  assert.match(refused.ok ? "" : refused.error, /changed/);
  assert.equal((await db.select().from(whatsappPosts)).length, 0, "a stale briefing stores nothing");

  const fresh = (await currentBriefing()).body!;
  assert.equal((await markWhatsAppPost({ kind: "briefing", body: fresh, postedBy: editor.id })).ok, true);
  assert.equal((await markWhatsAppPost({ kind: "briefing", body: fresh, postedBy: editor.id })).ok, false);
  assert.equal((await db.select().from(whatsappPosts).where(eq(whatsappPosts.kind, "briefing"))).length, 1);

  const alert = (await currentBreaking())!;
  assert.equal(alert.articleId, live.id);
  assert.match(alert.body, /BREAKING/);
  assert.match(alert.body, /Harare council meets again/);
  const oldAlert = alert.body.replace("again", "");
  assert.equal((await markWhatsAppPost({ kind: "breaking", body: oldAlert, postedBy: editor.id })).ok, false);
  assert.equal((await db.select().from(whatsappPosts).where(eq(whatsappPosts.kind, "breaking"))).length, 0);
  assert.equal((await markWhatsAppPost({ kind: "breaking", body: alert.body, postedBy: editor.id })).ok, true);
  assert.equal((await markWhatsAppPost({ kind: "breaking", body: alert.body, postedBy: editor.id })).ok, false);
  assert.equal((await db.select().from(whatsappPosts).where(eq(whatsappPosts.kind, "breaking"))).length, 1);
});
