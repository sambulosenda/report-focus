import { createClient } from "@libsql/client";
import { checkHealth } from "@/lib/health";
export const dynamic = "force-dynamic";

/** Checks the database and core newsroom schema, with bounded network and overall probe time. */
export async function GET() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/report-focus.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, {
      ...init, cache: "no-store",
      signal: AbortSignal.any([AbortSignal.timeout(2500), ...(init?.signal ? [init.signal] : [])]),
    }),
  });
  let ok = false;
  try {
    ok = await checkHealth(() => client.execute("select (select id from articles limit 1), (select name from users limit 1), (select user_id from sessions limit 1)"));
  } finally { client.close(); }
  return Response.json({ ok }, { status: ok ? 200 : 503, headers: {
    "Cache-Control": "no-store, max-age=0", "CDN-Cache-Control": "no-store", "X-Robots-Tag": "noindex",
  } });
}
