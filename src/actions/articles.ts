"use server";

import { and, eq, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { HOME_PIN_HOURS, HOME_SLOTS, HOME_SLOT_LABEL, KINDS, articles, homePins, liveUpdates, media } from "@/db/schema";
import type { FormState } from "@/actions/auth";
import { requireUser } from "@/lib/auth";
import { canDeleteArticle, canEditArticle, canPublish } from "@/lib/permissions";
import { saveImage } from "@/lib/storage";
import { formatDateTime, slugify } from "@/lib/utils";

export type ArticleFormState = { error?: string; ok?: string; savedAt?: number } | undefined;

const INTENTS = ["save", "submit", "publish", "return", "unpublish", "archive"] as const;

const ArticleInput = z.object({
  id: z.coerce.number().int().positive().optional(),
  title: z.string().trim().min(1, "Add a headline.").max(200),
  slug: z.string().trim().max(100).optional(),
  summary: z.string().trim().max(400).default(""),
  body: z.string().max(200_000).default(""),
  heroImage: z.string().trim().max(500).optional(),
  heroCaption: z.string().trim().max(300).optional(),
  heroCredit: z.string().trim().max(200).optional(),
  heroAlt: z.string().trim().max(300).optional(),
  kind: z.enum(KINDS).default("news"),
  videoUrl: z.string().trim().max(500).optional(),
  videoDuration: z.string().trim().regex(/^(?:\d{1,2}:[0-5]\d|[0-5]?\d):[0-5]\d$/, "Write the video length like 1:38.").optional(),
  tags: z.string().trim().max(300).default(""),
  categoryId: z.coerce.number().int().positive().optional(),
  isBreaking: z.boolean(),
  isFeatured: z.boolean(),
  publishAt: z.string().trim().optional(),
  editorNote: z.string().trim().max(1000).optional(),
  intent: z.enum(INTENTS),
});

const blankToUndefined = (v: FormDataEntryValue | null) => (v === null || v === "" ? undefined : String(v));

async function uniqueSlug(base: string, excludeId?: number) {
  let slug = slugify(base);
  for (let i = 2; ; i++) {
    const clash = await db
      .select({ id: articles.id })
      .from(articles)
      .where(excludeId ? and(eq(articles.slug, slug), ne(articles.id, excludeId)) : eq(articles.slug, slug))
      .get();
    if (!clash) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

export async function saveArticle(_prev: ArticleFormState, formData: FormData): Promise<ArticleFormState> {
  const user = await requireUser();
  const parsed = ArticleInput.safeParse({
    id: blankToUndefined(formData.get("id")),
    title: formData.get("title"),
    slug: blankToUndefined(formData.get("slug")),
    summary: formData.get("summary") ?? "",
    body: formData.get("body") ?? "",
    heroImage: blankToUndefined(formData.get("heroImage")),
    heroCaption: blankToUndefined(formData.get("heroCaption")),
    heroCredit: blankToUndefined(formData.get("heroCredit")),
    heroAlt: blankToUndefined(formData.get("heroAlt")),
    kind: formData.get("kind") || "news",
    videoUrl: blankToUndefined(formData.get("videoUrl")),
    videoDuration: blankToUndefined(formData.get("videoDuration")),
    tags: formData.get("tags") ?? "",
    categoryId: blankToUndefined(formData.get("categoryId")),
    isBreaking: formData.get("isBreaking") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    publishAt: blankToUndefined(formData.get("publishAt")),
    editorNote: blankToUndefined(formData.get("editorNote")),
    intent: formData.get("intent") ?? "save",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const input = parsed.data;

  const existing = input.id ? await db.select().from(articles).where(eq(articles.id, input.id)).get() : undefined;
  if (input.id && !existing) return { error: "This story no longer exists." };
  if (existing && !canEditArticle(user, existing)) return { error: "You can’t edit this story any more. Ask an editor." };

  const editor = canPublish(user);
  if (["publish", "return", "unpublish", "archive"].includes(input.intent) && !editor) {
    return { error: "Only editors can publish, return or unpublish stories." };
  }
  if (input.intent === "submit" || input.intent === "publish") {
    if (!input.summary) return { error: "Add a summary before sending this story on." };
    if (!input.body.trim()) return { error: "The story body is empty." };
    if (!input.categoryId) return { error: "Choose a section for this story." };
    if (input.heroImage && !input.heroCredit) return { error: "Add a photo credit for the lead image." };
    if (input.heroImage && !input.heroAlt) return { error: "Add alt text describing the lead image." };
    if (input.videoUrl && !/^(https?:\/\/|\/)/i.test(input.videoUrl)) return { error: "The video link must start with https:// or /." };
  }

  let status = existing?.status ?? "draft";
  let publishedAt = existing?.publishedAt ?? null;
  switch (input.intent) {
    case "submit":
      status = "review";
      break;
    case "publish": {
      status = "published";
      const when = input.publishAt ? new Date(input.publishAt) : null;
      if (when && Number.isNaN(when.getTime())) return { error: "That publish time isn’t valid." };
      publishedAt = when ?? (existing?.status === "published" && publishedAt ? publishedAt : new Date());
      break;
    }
    case "return":
      status = "draft";
      break;
    case "unpublish":
      status = "draft";
      break;
    case "archive":
      status = "archived";
      break;
  }

  const values = {
    title: input.title,
    summary: input.summary,
    body: input.body,
    heroImage: input.heroImage ?? null,
    heroCaption: input.heroCaption ?? null,
    heroCredit: input.heroCredit ?? null,
    heroAlt: input.heroAlt ?? null,
    kind: input.kind,
    videoUrl: input.videoUrl ?? null,
    videoDuration: input.videoDuration ?? null,
    tags: input.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", "),
    categoryId: input.categoryId ?? null,
    status,
    publishedAt,
    updatedAt: new Date(),
    // Only editors control placement flags and editor notes.
    ...(editor
      ? { isBreaking: input.isBreaking, isFeatured: input.isFeatured, editorNote: input.editorNote ?? null }
      : {}),
  };

  let id = existing?.id;
  if (existing) {
    const slug = editor && input.slug && input.slug !== existing.slug ? await uniqueSlug(input.slug, existing.id) : existing.slug;
    await db.update(articles).set({ ...values, slug }).where(eq(articles.id, existing.id));
  } else {
    const slug = await uniqueSlug(input.slug || input.title);
    const row = await db
      .insert(articles)
      .values({ ...values, slug, authorId: user.id })
      .returning({ id: articles.id })
      .get();
    id = row.id;
  }

  // A story that leaves the site gives up its home page spot.
  // Rescheduling a live story into the future takes it off the site too.
  if (existing && (status !== "published" || (publishedAt && publishedAt > new Date()))) await db.delete(homePins).where(eq(homePins.articleId, existing.id));

  revalidatePath("/", "layout");
  if (!existing) redirect(`/newsroom/articles/${id}?created=1`);

  const messages: Record<(typeof INTENTS)[number], string> = {
    save: "Saved.",
    submit: "Sent to editors for review.",
    publish: publishedAt && publishedAt > new Date() ? "Scheduled." : "Published. It’s live on the site.",
    return: "Returned to the writer as a draft.",
    unpublish: "Unpublished. The story is now a draft.",
    archive: "Archived.",
  };
  return { ok: messages[input.intent], savedAt: Date.now() };
}

export async function deleteArticle(formData: FormData) {
  const user = await requireUser();
  const id = Number(formData.get("id"));
  const existing = await db.select().from(articles).where(eq(articles.id, id)).get();
  if (!existing || !canDeleteArticle(user, existing)) redirect("/newsroom/articles?error=delete");
  // Remove the timeline explicitly: SQLite only cascades when foreign keys are switched on.
  await db.batch([
    db.delete(liveUpdates).where(eq(liveUpdates.articleId, id)),
    db.delete(homePins).where(eq(homePins.articleId, id)),
    db.delete(articles).where(eq(articles.id, id)),
  ]);
  revalidatePath("/", "layout");
  redirect("/newsroom/articles?deleted=1");
}

export type UploadResult = { url?: string; error?: string };

export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  try {
    const url = await saveImage(file);
    await db.insert(media).values({ url, alt: String(formData.get("alt") ?? ""), uploadedBy: user.id });
    revalidatePath("/newsroom/media");
    return { url };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed." };
  }
}

/** Editors switch the red breaking banner on or off for a published story from the dashboard. */
export async function setBreaking(formData: FormData) {
  const user = await requireUser();
  if (!canPublish(user)) return;
  const id = Number(formData.get("id"));
  const on = formData.get("on") === "1";
  if (!Number.isInteger(id)) return;
  await db.update(articles).set({ isBreaking: on }).where(eq(articles.id, id));
  revalidatePath("/", "layout");
}

/** The dashboard's banner switch: takes every story off breaking, so an older one doesn't take its place. */
export async function clearBreakingBanner() {
  const user = await requireUser();
  if (!canPublish(user)) return;
  await db.update(articles).set({ isBreaking: false }).where(eq(articles.isBreaking, true));
  revalidatePath("/", "layout");
}

const PinInput = z.object({
  id: z.coerce.number().int().positive("Choose a story to pin."),
  slot: z.coerce.number().refine((n) => (HOME_SLOTS as readonly number[]).includes(n), "Choose a spot on the home page."),
  hours: z.enum(HOME_PIN_HOURS),
});

/** Editors fix a published story to a home page slot. It replaces whatever was pinned there, and leaves any other slot it held. */
export async function pinStory(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canPublish(user)) return { error: "Only editors can arrange the home page." };
  const parsed = PinInput.safeParse({ id: formData.get("id"), slot: formData.get("slot"), hours: formData.get("hours") ?? "24" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const { id, slot, hours } = parsed.data;
  const story = await db
    .select({ title: articles.title })
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.status, "published"), lte(articles.publishedAt, new Date())))
    .get();
  if (!story) return { error: "Only stories that are live on the site can be pinned." };
  const expiresAt = hours === "0" ? null : new Date(Date.now() + Number(hours) * 3600e3);
  await db.batch([
    db.delete(homePins).where(eq(homePins.articleId, id)),
    db
      .insert(homePins)
      .values({ slot, articleId: id, expiresAt, pinnedBy: user.id })
      .onConflictDoUpdate({ target: homePins.slot, set: { articleId: id, expiresAt, pinnedBy: user.id, createdAt: new Date() } }),
  ]);
  revalidatePath("/", "layout");
  const place = slot === 1 ? "the lead story" : `${HOME_SLOT_LABEL[slot].toLowerCase()} on the home page`;
  return { ok: `“${story.title}” is now ${place}${expiresAt ? ` until ${formatDateTime(expiresAt)}` : ""}.` };
}

/** Lets a slot go back to filling itself. */
export async function unpinSlot(formData: FormData) {
  const user = await requireUser();
  if (!canPublish(user)) return;
  const slot = Number(formData.get("slot"));
  if (!Number.isInteger(slot)) return;
  await db.delete(homePins).where(eq(homePins.slot, slot));
  revalidatePath("/", "layout");
}
