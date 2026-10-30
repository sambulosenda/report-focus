"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { articles, liveUpdates } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { canPublish } from "@/lib/permissions";
import type { FormState } from "./auth";

/** Editors, and the reporter who owns the story, can post to its live timeline. */
async function liveStoryFor(articleId: number) {
  const user = await requireUser();
  const story = await db.select({ id: articles.id, slug: articles.slug, authorId: articles.authorId, kind: articles.kind }).from(articles).where(eq(articles.id, articleId)).get();
  if (!story || story.kind !== "live") return null;
  if (!canPublish(user) && story.authorId !== user.id) return null;
  return { user, story };
}

const Update = z.object({
  articleId: z.coerce.number().int().positive(),
  title: z.string().trim().max(200).default(""),
  body: z.string().trim().min(1, "Write the update first.").max(10_000),
  isPinned: z.boolean(),
});

function refresh(slug: string) {
  revalidatePath(`/live/${slug}`);
  revalidatePath("/", "layout");
}

export async function addLiveUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = Update.safeParse({
    articleId: formData.get("articleId"),
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    isPinned: formData.get("isPinned") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the update and try again." };
  const ctx = await liveStoryFor(parsed.data.articleId);
  if (!ctx) return { error: "You can’t post updates to this story." };
  await db.transaction(async (tx) => {
    // Only one update is pinned at a time.
    if (parsed.data.isPinned) await tx.update(liveUpdates).set({ isPinned: false }).where(eq(liveUpdates.articleId, ctx.story.id));
    await tx.insert(liveUpdates).values({ ...parsed.data, authorId: ctx.user.id });
    // Touch the story so its "Updated" time moves with the timeline.
    await tx.update(articles).set({ updatedAt: new Date() }).where(eq(articles.id, ctx.story.id));
  });
  refresh(ctx.story.slug);
  return { ok: "Update posted." };
}

export async function deleteLiveUpdate(formData: FormData) {
  const id = Number(formData.get("id"));
  const articleId = Number(formData.get("articleId"));
  const ctx = await liveStoryFor(articleId);
  if (!ctx) return;
  await db.transaction(async (tx) => {
    await tx.delete(liveUpdates).where(and(eq(liveUpdates.id, id), eq(liveUpdates.articleId, articleId)));
    await tx.update(articles).set({ updatedAt: new Date() }).where(eq(articles.id, articleId));
  });
  refresh(ctx.story.slug);
}

export async function pinLiveUpdate(formData: FormData) {
  const id = Number(formData.get("id"));
  const articleId = Number(formData.get("articleId"));
  const pin = formData.get("pin") === "1";
  const ctx = await liveStoryFor(articleId);
  if (!ctx) return;
  await db.transaction(async (tx) => {
    await tx.update(liveUpdates).set({ isPinned: false }).where(eq(liveUpdates.articleId, articleId));
    if (pin) await tx.update(liveUpdates).set({ isPinned: true }).where(and(eq(liveUpdates.id, id), eq(liveUpdates.articleId, articleId)));
  });
  refresh(ctx.story.slug);
}
