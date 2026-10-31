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

test("election publishing validates totals, permissions, dates, revisions and withdrawals", async () => {
  const { db } = await import("../src/db");
  const { users, electionResults, electionResultHistory } = await import("../src/db/schema");
  const { electionResultInput, validVotes, voteShare, DEMO_RESULTS } = await import("../src/lib/elections");
  const { storeElectionResult, publicElectionResults } = await import("../src/lib/election-results");
  await migrate(db, { migrationsFolder: "drizzle" });
  const [editor, writer] = await db.insert(users).values([
    { name: "Editor", slug: "editor", email: "editor@example.com", passwordHash: "unused", role: "editor" },
    { name: "Writer", slug: "writer", email: "writer@example.com", passwordHash: "unused", role: "journalist" },
  ]).returning();
  const now = new Date("2026-11-06T12:00:00Z");
  const data = { ...DEMO_RESULTS[0].data, municipalityCode: "JHB", sourceName: "Test source", sourceUrl: "https://www.elections.org.za/pw/", sourceAsOf: "2026-11-05T10:00:00+02:00" };
  assert.equal(validVotes(data), 49000);
  assert.equal(voteShare(10, 0), 0);
  assert.equal(voteShare(25,100),25);
  for (const change of [
    { ballotsCast: 49999 }, { registeredVoters: 10 }, { spoiledVotes: -1 },
    { parties: [{ name: "A", votes: 24000 }, { name: "a", votes: 25000 }] },
    { status: "final" }, { stationsTotal: null }, { stationsCounted: 101 },
    { sourceUrl: "javascript:alert(1)" }, { sourceUrl: "not-a-url" }, { sourceUrl: "https://user:secret@example.com" },
  ]) assert.equal(electionResultInput.safeParse({ ...data, ...change }).success, false);
  const input = { revision: 0, data, published: true, verified: true };
  assert.ok((await storeElectionResult(writer, input, now)).error);
  assert.ok((await storeElectionResult(editor, { ...input, verified: false }, now)).error);
  assert.ok((await storeElectionResult(editor, input, new Date("2026-10-31"))).error);
  assert.ok((await storeElectionResult(editor, { ...input, data: { ...data, sourceAsOf: "2026-11-07T10:00:00Z" } }, now)).error);
  assert.ok((await storeElectionResult(editor, { ...input, data: { ...data, sourceAsOf: "2021-11-04T10:00:00Z" } }, now)).error);
  assert.ok((await storeElectionResult(editor, { ...input, published: false }, now)).ok);
  assert.deepEqual(await publicElectionResults(now), []);
  const [row] = await db.select().from(electionResults);
  assert.ok((await storeElectionResult(editor, input, now)).error, "duplicate municipalities cannot double-count ballots");
  assert.ok((await storeElectionResult(editor, { ...input, id: row.id, revision: 1 }, now)).ok);
  assert.equal((await publicElectionResults(now)).length, 1);
  assert.deepEqual(await publicElectionResults(new Date("2026-10-31")), []);
  assert.ok((await storeElectionResult(editor, { ...input, id: row.id, revision: 1 }, now)).error, "stale saves are rejected");
  assert.ok((await storeElectionResult(editor, { ...input, id: row.id, revision: 2, data: { ...data, municipalityCode: "OTHER" } }, now)).error);
  const finalData = { ...data, status: "final", stationsCounted: 100 };
  assert.ok((await storeElectionResult(editor, { ...input, id: row.id, revision: 2, data: finalData }, now)).ok);
  assert.equal((await publicElectionResults(now))[0].data.status, "final");
  assert.ok((await storeElectionResult(editor, { ...input, id: row.id, revision: 3, data: finalData, published: false, verified: false }, now)).ok);
  assert.deepEqual(await publicElectionResults(now), []);
  const history = await db.select().from(electionResultHistory).where(eq(electionResultHistory.resultId, row.id));
  assert.equal(history.length, 4);
  assert.deepEqual(history.map((h) => h.revision), [1,2,3,4]);
  assert.equal(history[1].published, true);
  assert.equal(history[1].editorId, editor.id);
});
