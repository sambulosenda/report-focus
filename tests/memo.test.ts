import assert from "node:assert/strict";
import { test } from "node:test";
import { memo } from "../src/lib/memo";
import { tagTokens } from "../src/lib/tag-tokens";

test("memo runs once per window and again after it", async () => {
  let t = 0, calls = 0;
  const get = memo(1000, async () => ++calls, () => t);
  assert.equal(await get(), 1);
  assert.equal(await get(), 1);
  t = 1500;
  assert.equal(await get(), 2);
});

test("memo forgets a failed call", async () => {
  let calls = 0;
  const get = memo(1000, async () => { calls++; if (calls === 1) throw new Error("db down"); return calls; }, () => 0);
  await assert.rejects(get());
  assert.equal(await get(), 2);
});

test("tag tokens match the SQL tag lookup", () => {
  assert.deepEqual([...tagTokens("Zanu-PF, Cyril Ramaphosa,AI")], ["zanu-pf", "cyril ramaphosa", "ai"]);
});
