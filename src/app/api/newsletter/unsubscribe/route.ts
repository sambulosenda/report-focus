import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";

/** One-click unsubscribe (RFC 8058): mail apps POST here from the List-Unsubscribe header. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!/^[a-f0-9]{32}$/.test(token)) return new Response("Bad token", { status: 400 });
  await db
    .update(newsletterSignups)
    .set({ unsubscribedAt: new Date() })
    .where(and(eq(newsletterSignups.token, token), isNull(newsletterSignups.unsubscribedAt)));
  return new Response("Unsubscribed");
}
