import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
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

test("corrections require editors, retain history, and update public stories", async () => {
  const { db } = await import("../src/db");
  const { articles, users } = await import("../src/db/schema");
  const { recordCorrection, correctionsFor } = await import("../src/lib/corrections");
  await migrate(db, { migrationsFolder: "drizzle" });
  const [editor, writer] = await db.insert(users).values([
    { name: "Editor", slug: "editor", email: "editor@example.com", passwordHash: "unused", role: "editor" },
    { name: "Writer", slug: "writer", email: "writer@example.com", passwordHash: "unused", role: "journalist" },
  ]).returning();
  const old = new Date(Date.now() - 86400000);
  const [story, draft, scheduled] = await db.insert(articles).values([
    { title: "Live story", slug: "story", authorId: writer.id, status: "published", publishedAt: old, updatedAt: old },
    { title: "Draft", slug: "draft", authorId: writer.id },
    { title: "Scheduled", slug: "scheduled", authorId: writer.id, status: "published", publishedAt: new Date(Date.now() + 86400000) },
  ]).returning();
  const note = "An earlier version gave the wrong date. The meeting was held on Tuesday.";
  assert.ok((await recordCorrection(writer, { articleId: story.id, body: note })).error);
  for (const id of [draft.id, scheduled.id, 99999]) assert.ok((await recordCorrection(editor, { articleId: id, body: note })).error);
  for (const body of ["", "short", "x".repeat(2001)]) assert.ok((await recordCorrection(editor, { articleId: story.id, body })).error);
  assert.equal((await correctionsFor(story.id)).length, 0);
  assert.ok((await recordCorrection(editor, { articleId: story.id, body: note })).ok);
  assert.ok((await recordCorrection(editor, { articleId: story.id, body: "Further clarification: the meeting started at 10am." })).ok);
  const history = await correctionsFor(story.id);
  assert.equal(history.length, 2);
  assert.equal(history[1].body, note);
  assert.equal(history[0].editorId, editor.id);
  assert.ok(history[0].createdAt instanceof Date);
  const updated = await db.select().from(articles).where(eq(articles.id, story.id)).get();
  assert.ok(updated!.updatedAt > old);
  assert.equal(updated!.body, story.body, "publishing a note does not overwrite the article");
  assert.equal((await correctionsFor(draft.id)).length, 0);
  const { CorrectionHistory } = await import("../src/components/CorrectionHistory");
  await recordCorrection(editor, { articleId: story.id, body: 'Clarification: <script>alert("test")</script> is quoted text.' });
  const html = renderToStaticMarkup(await CorrectionHistory({ articleId: story.id }));
  assert.match(html, /Corrections and clarifications/);
  assert.match(html, /<time dateTime=/);
  assert.ok(html.includes(note));
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(await CorrectionHistory({ articleId: draft.id }), null);
});
