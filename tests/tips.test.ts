import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { createRequire, Module } from "node:module";
import { migrate } from "drizzle-orm/libsql/migrator";
import { eq } from "drizzle-orm";

// These tests execute on Node's server; Next's build-time marker needs no runtime guard here.
const require = createRequire(import.meta.url);
const markerPath = require.resolve("server-only");
const marker = new Module(markerPath);
marker.exports = {};
require.cache[markerPath] = marker;

// Never use the developer's database.
process.env.DATABASE_URL = "file::memory:";
delete process.env.DATABASE_AUTH_TOKEN;
process.env.EMAIL_PROVIDER = "console";
process.env.TIPS_ENCRYPTION_KEY = randomBytes(32).toString("base64");

test("tips are encrypted, anonymous details are dropped, and only editors can read them", async () => {
  const { db } = await import("../src/db");
  const { tips, users } = await import("../src/db/schema");
  const { closeTip, decryptTip, deleteTip, encryptTip, listTips, saveTip, tipForEditor, tipWaitingEmail, TIP_UNAVAILABLE } = await import("../src/lib/tips");
  const { CONTACT } = await import("../src/lib/site");
  await migrate(db, { migrationsFolder: "drizzle" });

  const phrase = "The meeting was moved and nobody was told about the change.";
  const round = encryptTip({ body: phrase, name: "Ada", contact: "ada@example.com" });
  assert.ok(round);
  assert.equal(round.includes(phrase), false);
  assert.deepEqual(decryptTip(round), { body: phrase, name: "Ada", contact: "ada@example.com" });

  const [editor, writer] = await db
    .insert(users)
    .values([
      { name: "Editor", slug: "editor", email: "editor@example.com", passwordHash: "unused", role: "editor" },
      { name: "Writer", slug: "writer", email: "writer@example.com", passwordHash: "unused", role: "journalist" },
    ])
    .returning();

  const rejected = await saveTip({ body: "too short", name: "", contact: "", anonymous: false });
  assert.ok("error" in rejected);
  assert.equal((await db.select().from(tips)).length, 0);

  const anon = await saveTip({ body: phrase, name: "Ada Lovelace", contact: "ada@example.com", anonymous: true });
  assert.ok("id" in anon);
  const stored = await db.select().from(tips).where(eq(tips.id, anon.id)).get();
  assert.ok(stored);
  assert.equal(stored.anonymous, true);
  assert.equal(stored.payload.includes(phrase), false);
  assert.equal(stored.payload.includes("Ada Lovelace"), false);
  assert.equal(stored.payload.includes("ada@example.com"), false);
  assert.deepEqual(decryptTip(stored.payload), { body: phrase, name: "", contact: "" });

  assert.ok("error" in (await listTips(writer)));
  assert.ok("error" in (await tipForEditor(writer, anon.id)));
  assert.ok((await closeTip(writer, anon.id)).error);
  assert.ok((await deleteTip(writer, anon.id)).error);
  assert.equal((await db.select().from(tips).where(eq(tips.id, anon.id)).get())?.status, "new");

  const opened = await tipForEditor(editor, anon.id);
  assert.ok("tip" in opened);
  assert.equal(opened.tip.status, "read");
  assert.equal(opened.tip.readBy, editor.id);
  assert.deepEqual(opened.contents, { body: phrase, name: "", contact: "" });

  const namedPhrase = "A named source described the contract and when it was signed.";
  const named = await saveTip({ body: namedPhrase, name: "Ada", contact: "signal:ada", anonymous: false });
  assert.ok("id" in named);
  const namedOpen = await tipForEditor(editor, named.id);
  assert.ok("contents" in namedOpen && namedOpen.contents);
  assert.deepEqual(namedOpen.contents, { body: namedPhrase, name: "Ada", contact: "signal:ada" });
  assert.ok((await closeTip(editor, named.id)).ok);
  assert.equal((await db.select().from(tips).where(eq(tips.id, named.id)).get())?.status, "closed");

  const notice = tipWaitingEmail(anon.id, true);
  assert.equal(notice.to, CONTACT.tips);
  assert.equal(notice.subject, "New tip in the newsroom");
  assert.match(notice.text, /anonymous/i);
  assert.match(notice.text, /does not include the message/);
  assert.equal(`${notice.text}\n${notice.html}`.includes(phrase), false);

  assert.ok((await deleteTip(editor, anon.id)).ok);
  assert.equal(await db.select().from(tips).where(eq(tips.id, anon.id)).get(), undefined);

  const secret = "This plaintext must not be stored in the database at all.";
  delete process.env.TIPS_ENCRYPTION_KEY;
  const before = await db.select().from(tips);
  const refused = await saveTip({ body: secret, name: "Secret Name", contact: "secret@example.com", anonymous: false });
  assert.equal("error" in refused ? refused.error : "", TIP_UNAVAILABLE);
  const after = await db.select().from(tips);
  assert.equal(after.length, before.length);
  assert.equal(JSON.stringify(after).includes(secret), false);
  assert.equal(JSON.stringify(after).includes("Secret Name"), false);
});
