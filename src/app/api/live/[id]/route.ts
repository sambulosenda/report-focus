import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, liveUpdates } from "@/db/schema";
import { isLive } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** How many updates a live story has had since a given update id. Polled by the live page. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const since = Number(new URL(req.url).searchParams.get("since")) || 0;
  if (!Number.isInteger(id)) return Response.json({ error: "Not found" }, { status: 404 });
  const story = await db.select({ id: articles.id }).from(articles).where(and(eq(articles.id, id), isLive())).get();
  if (!story) return Response.json({ error: "Not found" }, { status: 404 });
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(liveUpdates)
    .where(and(eq(liveUpdates.articleId, id), gt(liveUpdates.id, since)));
  return Response.json({ newCount: Number(n) }, { headers: { "Cache-Control": "no-store" } });
}
