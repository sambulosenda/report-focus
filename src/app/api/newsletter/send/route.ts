import { and, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";
import { BREAKING, sendEdition } from "@/lib/newsletters";

/**
 * Sends today's newsletter editions. Point a scheduler (Railway cron, GitHub Actions, cron-job.org) at it each weekday morning:
 *   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/newsletter/send
 * With ?list=morning-focus it sends just that newsletter; without, every newsletter that has confirmed readers.
 * Each edition goes out at most once a day, so a retry is safe.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });

  const only = new URL(req.url).searchParams.get("list");
  const lists = only
    ? [only]
    : (
        await db
          .selectDistinct({ list: newsletterSignups.list })
          .from(newsletterSignups)
          .where(and(isNotNull(newsletterSignups.confirmedAt), isNull(newsletterSignups.unsubscribedAt), sql`${newsletterSignups.list} != ${BREAKING}`))
      ).map((r) => r.list);

  const results: Record<string, unknown> = {};
  for (const list of lists) results[list] = await sendEdition(list);
  return Response.json(results);
}
