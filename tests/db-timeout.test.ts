import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import { createClient } from "@libsql/client";
import { fetchWithTimeout } from "../src/db/fetch-timeout";

test("a database server that never answers fails the query instead of hanging", async () => {
  const server = createServer(() => {});
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  const client = createClient({ url: `http://127.0.0.1:${port}`, fetch: fetchWithTimeout(300) });
  const started = Date.now();
  try {
    await assert.rejects(client.execute("select 1"));
    assert.ok(Date.now() - started < 3000, `took ${Date.now() - started}ms`);
  } finally {
    client.close();
    server.closeAllConnections();
    server.close();
  }
});
