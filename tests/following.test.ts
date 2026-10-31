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

// Never use the developer's database or send a real email.
process.env.DATABASE_URL = "file::memory:";
delete process.env.DATABASE_AUTH_TOKEN;
process.env.EMAIL_PROVIDER = "console";

test("follow subscriptions only deliver confirmed, new, public coverage", async () => {
  const { db } = await import("../src/db");
  const { articles, users, newsletterSignups, emailSends, liveUpdates } = await import("../src/db/schema");
  const { followTarget, topicFollowList, storyFollowList } = await import("../src/lib/following");
  const { followedStories } = await import("../src/lib/queries");
  const { listInfo, sendEdition } = await import("../src/lib/newsletters");
  const { signUp } = await import("../src/actions/newsletter");
  await migrate(db, { migrationsFolder: "drizzle" });
  const secondsAgo = (n: number) => new Date(Math.floor(Date.now() / 1000) * 1000 - n * 1000);
  const [writer] = await db.insert(users).values({ name: "Test writer", slug: "test", email: "writer@example.com", passwordHash: "unused" }).returning();
  const base = { authorId: writer.id, title: "Election coverage", tags: "Zimbabwe, election results", publishedAt: secondsAgo(400), updatedAt: secondsAgo(300), status: "published" as const };
  const [story] = await db.insert(articles).values({ ...base, slug: "election" }).returning();
  await db.insert(articles).values([
    { ...base, slug: "draft", title: "Private draft", status: "draft" },
    { ...base, slug: "future", title: "Scheduled", publishedAt: new Date(Date.now() + 864e5) },
    { ...base, slug: "unrelated", tags: "Zimbabwean", title: "Unrelated" },
  ]);
  const list = topicFollowList("Zimbabwe");
  assert.deepEqual(followTarget(topicFollowList("Café & Politics")), { topic: "café-&-politics" });
  assert.equal(followTarget("topic-%ZZ"), null);
  assert.equal(followTarget("story-0"), null);
  assert.equal(await listInfo("story-999999"), null);
  assert.equal(await listInfo("topic-nonexistent"), null);
  const rows = await followedStories({ topic: "zimbabwe" }, secondsAgo(600), new Date());
  assert.deepEqual(rows.map((s) => s.id), [story.id]);
  assert.equal((await followedStories({ topic: "election-results" }, secondsAgo(600), new Date())).length, 1);

  const messages: string[] = [];
  const originalLog = console.info;
  console.info = (...args: unknown[]) => { messages.push(args.join(" ")); };
  try {
    const form = new FormData();
    form.set("email", "reader@example.com"); form.set("list", list);
    assert.match((await signUp(undefined, form))?.ok ?? "", /Check your inbox/);
    assert.match(messages[0], /Confirm your sign-up/);
    await signUp(undefined, form);
    assert.equal(messages.length, 1, "confirmation requests are throttled");
    assert.equal((await sendEdition(list)).ok, false, "unconfirmed readers receive no digest");
    await db.update(newsletterSignups).set({ confirmedAt: secondsAgo(500) }).where(eq(newsletterSignups.list, list));
    await db.insert(newsletterSignups).values([
      { email: "left@example.com", list, confirmedAt: secondsAgo(500), unsubscribedAt: secondsAgo(100) },
      { email: "new@example.com", list, confirmedAt: secondsAgo(100) },
    ]);
    const result = await sendEdition(list);
    assert.ok(result.ok); assert.equal(result.sent, 1);
    assert.match(messages[1], /Election coverage/);
    assert.match(messages[1], /Unsubscribe:/);
    assert.doesNotMatch(messages[1], /Private draft|Scheduled|Unrelated/);
    const [log] = await db.select().from(emailSends).where(eq(emailSends.list, list));
    assert.equal(log.recipients, 1);
    await sendEdition(list);
    assert.equal(messages.length, 2, "unchanged stories do not send again");
    // A same-day retry with a newer edit still cannot send a second daily digest.
    await db.update(emailSends).set({ createdAt: secondsAgo(200) }).where(eq(emailSends.id, log.id));
    await db.update(articles).set({ updatedAt: secondsAgo(50) }).where(eq(articles.id, story.id));
    assert.equal((await sendEdition(list)).ok, false);
    assert.equal(messages.length, 2);

    const storyList = storyFollowList(story.id);
    await db.insert(newsletterSignups).values({ email: "live@example.com", list: storyList, confirmedAt: secondsAgo(40) });
    assert.equal((await sendEdition(storyList)).ok, true);
    assert.equal(messages.length, 2, "no old coverage sent on following");
    await db.insert(liveUpdates).values({ articleId: story.id, body: "A new result", createdAt: secondsAgo(10) });
    const live = await sendEdition(storyList);
    assert.ok(live.ok); assert.equal(live.sent, 1, "live posts trigger a story digest");
  } finally { console.info = originalLog; }
});
