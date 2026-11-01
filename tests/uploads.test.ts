import assert from "node:assert/strict";
import { test } from "node:test";
import { readUploadBody, MAX_UPLOAD_REQUEST_BYTES } from "../src/lib/upload-request";
import { uploadImage } from "../src/lib/upload-client";

test("multipart uploads larger than the old 1 MB limit remain intact", async () => {
  const form = new FormData();
  form.set("file", new File([new Uint8Array(2 * 1024 * 1024)], "photo.jpg", { type: "image/jpeg" }));
  const request = new Request("http://localhost/upload", { method: "POST", body: form });
  const body = await readUploadBody(request);
  assert.ok(body);
  const restored = await new Response(Buffer.from(body), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
  assert.equal((restored.get("file") as File).size, 2 * 1024 * 1024);
});

test("oversized chunked bodies are rejected without trusting Content-Length", async () => {
  const request = new Request("http://localhost/upload", { method: "POST", body: new Uint8Array(MAX_UPLOAD_REQUEST_BYTES + 1) });
  assert.equal(await readUploadBody(request), null);
});

test("upload client uses stable endpoint and handles expired sessions and proxy errors", async (t) => {
  let status = 201;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    assert.equal(url, "/api/newsroom/upload");
    assert.equal(options.method, "POST");
    assert.ok(options.body instanceof FormData);
    return status === 201 ? Response.json({ url: "/media/photo.jpg" }, { status }) : new Response("upstream failed", { status });
  });
  assert.deepEqual(await uploadImage(new FormData()), { url: "/media/photo.jpg" });
  status = 401;
  assert.match((await uploadImage(new FormData())).error!, /session expired/);
  status = 502;
  assert.match((await uploadImage(new FormData())).error!, /didn’t finish/);
  status = 413;
  assert.match((await uploadImage(new FormData())).error!, /8 MB/);
});
