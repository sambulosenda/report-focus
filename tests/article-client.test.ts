import assert from "node:assert/strict";
import { test } from "node:test";
import { saveArticle } from "../src/lib/article-client";

test("publishing uses a stable endpoint, retains intent and returns save confirmation", async (t) => {
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "/api/newsroom/articles");
    assert.equal((options.body as FormData).get("intent"), "publish");
    return Response.json({ ok: "Published.", savedAt: 123, redirectTo: "/newsroom/articles/1?created=1" });
  });
  const form = new FormData(); form.set("intent", "publish");
  assert.equal((await saveArticle(undefined, form))?.savedAt, 123);
});

test("validation, expired sessions, proxy errors and network errors do not throw or retry", async (t) => {
  let calls = 0;
  let mode = 0;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    if (mode === 0) return Response.json({ error: "Add a summary." }, { status: 400 });
    if (mode === 1) return Response.json({ error: "Your session expired." }, { status: 401 });
    if (mode === 2) return new Response("Bad Gateway", { status: 502 });
    throw new TypeError("fetch failed");
  });
  assert.equal((await saveArticle(undefined, new FormData()))?.error, "Add a summary.");
  mode = 1; assert.match((await saveArticle(undefined, new FormData()))!.error!, /session expired/);
  mode = 2; assert.match((await saveArticle(undefined, new FormData()))!.error!, /check the article list/);
  mode = 3; assert.match((await saveArticle(undefined, new FormData()))!.error!, /Keep this editor open/);
  assert.equal(calls, 4);
});
