import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, whatsappPosts, type WhatsAppKind } from "@/db/schema";
import { editionDate } from "./newsletters";
import { breakingStory, editionStories } from "./queries";
import { siteUrl } from "./utils";

/** WhatsApp refuses a text post longer than this. */
export const WHATSAPP_LIMIT = 4096;

const CHANNEL_URL = /^https:\/\/(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9_-]{10,}\/?$/;

/** The channel invite, or null when it is missing or not a WhatsApp channel link. */
export function whatsappChannelUrl(value = process.env.WHATSAPP_CHANNEL_URL) {
  const raw = value?.trim() ?? "";
  if (!CHANNEL_URL.test(raw)) return null;
  return raw.replace(/\/$/, "");
}

export type BriefingStory = {
  title: string;
  slug: string;
  summary: string;
  category: { slug: string } | null;
};

/** The first sentence of a summary. A summary with no stop is used whole. */
export function firstSentence(summary: string) {
  const text = summary.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return (match?.[0] ?? text).trim();
}

/** "Thursday, October 31" for an edition date, without letting the server's zone shift the day. */
export function editionLabel(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

type Line = { title: string; sentence: string; url: string };

function storyLine(story: BriefingStory): Line {
  return {
    title: story.title.replace(/\s+/g, " ").trim(),
    sentence: firstSentence(story.summary),
    url: siteUrl(`/${story.category?.slug || "news"}/${story.slug}`),
  };
}

function render(header: string, lines: Line[], numbered: boolean) {
  const blocks = lines.map((line, i) => {
    const parts = [numbered ? `${i + 1}. ${line.title}` : line.title];
    if (line.sentence) parts.push(line.sentence);
    parts.push(line.url);
    return parts.join("\n");
  });
  return [header, ...blocks].join("\n\n");
}

/** Drop the last word and mark the cut, or "" when nothing is left to drop. */
function dropTailWord(value: string) {
  const trimmed = value.replace(/…$/, "").trimEnd();
  const cut = trimmed.replace(/\s+\S+$/, "").trimEnd();
  if (!cut || cut === trimmed) return "";
  return `${cut}…`;
}

/** Headline, one sentence, and the story link. Shortens from the last item until the post fits. */
export function composePost(header: string, lines: Line[], numbered: boolean, limit = WHATSAPP_LIMIT) {
  const copy = lines.map((line) => ({ ...line }));
  let guard = 0;
  while (render(header, copy, numbered).length > limit && guard++ < 20000) {
    const target = [...copy].reverse().find((line) => line.sentence) ?? [...copy].reverse().find((line) => line.title.includes(" "));
    if (!target) break;
    if (target.sentence) target.sentence = dropTailWord(target.sentence);
    else {
      const next = dropTailWord(target.title);
      if (!next) break;
      target.title = next;
    }
  }
  let text = render(header, copy, numbered);
  for (let i = copy.length - 1; i >= 0 && text.length > limit; i--) {
    const excess = text.length - limit;
    const room = copy[i].title.length - 1;
    if (room <= 0) continue;
    copy[i].title = `${copy[i].title.slice(0, copy[i].title.length - Math.min(room, excess + 1)).trimEnd()}…`;
    text = render(header, copy, numbered);
  }
  return text;
}

export function briefingBody(stories: BriefingStory[], date: string) {
  if (stories.length === 0) return null;
  return composePost(`Morning briefing · ${editionLabel(date)}`, stories.map(storyLine), true);
}

export function breakingBody(story: BriefingStory) {
  return composePost("BREAKING", [storyLine(story)], false);
}

export async function currentBriefing() {
  const date = editionDate();
  const stories = await editionStories();
  return { date, body: briefingBody(stories, date) };
}

export async function currentBreaking() {
  const story = await breakingStory();
  if (!story) return null;
  return { articleId: story.id, body: breakingBody(story) };
}

export type MarkResult = { ok: true } | { ok: false; error: string };

const ALREADY = {
  briefing: "Today’s briefing is already marked as posted.",
  breaking: "This breaking story is already marked as posted.",
} as const;

const STALE = {
  briefing: "The briefing has changed. Copy the updated post and try again.",
  breaking: "The breaking story has changed. Copy the updated post and try again.",
} as const;

/** Records the post the editor already put on the channel. The same edition, and the same breaking story, record once. */
export async function markWhatsAppPost(input: { kind: WhatsAppKind; body: string; postedBy: number }): Promise<MarkResult> {
  if (input.kind === "briefing") {
    const { date, body } = await currentBriefing();
    if (!body) return { ok: false, error: "No stories were published in the past 24 hours, so there is nothing to post." };
    if (input.body !== body) return { ok: false, error: STALE.briefing };
    const [row] = await db
      .insert(whatsappPosts)
      .values({ kind: "briefing", edition: date, body, postedBy: input.postedBy })
      .onConflictDoNothing()
      .returning({ id: whatsappPosts.id });
    if (!row) return { ok: false, error: ALREADY.briefing };
    return { ok: true };
  }

  const current = await currentBreaking();
  if (!current) return { ok: false, error: "There is no story on the breaking banner." };
  if (input.body !== current.body) return { ok: false, error: STALE.breaking };
  const [row] = await db
    .insert(whatsappPosts)
    .values({ kind: "breaking", articleId: current.articleId, body: current.body, postedBy: input.postedBy })
    .onConflictDoNothing()
    .returning({ id: whatsappPosts.id });
  if (!row) return { ok: false, error: ALREADY.breaking };
  return { ok: true };
}

export async function recentWhatsAppPosts(limit = 20) {
  return db
    .select({ post: whatsappPosts, by: users.name })
    .from(whatsappPosts)
    .leftJoin(users, eq(users.id, whatsappPosts.postedBy))
    .orderBy(desc(whatsappPosts.createdAt), desc(whatsappPosts.id))
    .limit(limit);
}

export async function postedBriefing(date: string) {
  return db
    .select({ post: whatsappPosts, by: users.name })
    .from(whatsappPosts)
    .leftJoin(users, eq(users.id, whatsappPosts.postedBy))
    .where(and(eq(whatsappPosts.kind, "briefing"), eq(whatsappPosts.edition, date)))
    .get();
}

export async function postedBreaking(articleId: number) {
  return db
    .select({ post: whatsappPosts, by: users.name })
    .from(whatsappPosts)
    .leftJoin(users, eq(users.id, whatsappPosts.postedBy))
    .where(and(eq(whatsappPosts.kind, "breaking"), eq(whatsappPosts.articleId, articleId)))
    .get();
}
