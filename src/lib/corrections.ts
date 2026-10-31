import "server-only";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { articleCorrections, articles, type User } from "@/db/schema";
import { canPublish } from "./permissions";

export function correctionsFor(articleId: number) {
  return db.select().from(articleCorrections).where(eq(articleCorrections.articleId, articleId)).orderBy(desc(articleCorrections.createdAt), desc(articleCorrections.id));
}
const input = z.object({ articleId: z.coerce.number().int().positive(), body: z.string().trim().min(10, "Explain what changed and why (at least 10 characters).").max(2000) });
/** The server action supplies the authenticated editor, never an identity from the form. */
export async function recordCorrection(user: User, values: { articleId: unknown; body: unknown }): Promise<{ ok?: string; error?: string }> {
  if (!canPublish(user)) return { error: "Only editors can publish corrections." };
  const parsed = input.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return db.transaction(async (tx) => {
    const story = await tx.select().from(articles).where(eq(articles.id, parsed.data.articleId)).get();
    const now = new Date();
    if (!story || story.status !== "published" || !story.publishedAt || story.publishedAt > now) return { error: "Corrections can only be published on a story that is live." };
    await tx.insert(articleCorrections).values({ ...parsed.data, editorId: user.id, createdAt: now });
    await tx.update(articles).set({ updatedAt: now }).where(eq(articles.id, story.id));
    return { ok: "Correction published. Readers can now see it on the story." };
  });
}
