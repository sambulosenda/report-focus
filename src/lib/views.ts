import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";

// Views waiting to be written, by story id. One write per story every few seconds instead of one per reader.
const pending = new Map<number, number>();
const FLUSH_MS = 10_000;
const MAX_PENDING = 5_000;
let timer: ReturnType<typeof setTimeout> | null = null;

export function countView(id: number) {
  // Ids that aren't stories still land here; the cap stops junk requests from growing the map without limit.
  if (!pending.has(id) && pending.size >= MAX_PENDING) return;
  pending.set(id, (pending.get(id) ?? 0) + 1);
  timer ??= setTimeout(flushViews, FLUSH_MS);
}

export async function flushViews() {
  timer = null;
  const batch = [...pending];
  pending.clear();
  for (const [id, n] of batch) {
    try {
      await db.update(articles).set({ views: sql`${articles.views} + ${n}` }).where(eq(articles.id, id));
    } catch (err) {
      console.error("Could not save story views", err);
    }
  }
}
