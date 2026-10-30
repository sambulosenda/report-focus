import "server-only";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailSends, newsletterSignups, type NewsletterSignup } from "@/db/schema";
import { sendEmails, type EmailMessage } from "./email";
import { categoryBySlug, editionStories, type StoryCard } from "./queries";
import { SITE_NAME } from "./site";
import { SITE_TIMEZONE, siteUrl } from "./utils";

export const MORNING = "morning-focus";
export const BREAKING = "breaking";

export type ListInfo = { list: string; name: string; description: string; categoryId?: number };

/** The newsletters readers can pick on /newsletters. Section lists ("section-<slug>") are added from the sections. */
export const STANDING_LISTS: ListInfo[] = [
  { list: MORNING, name: "The Morning Focus", description: "The five stories you need before 8 a.m., every weekday." },
  { list: BREAKING, name: "Breaking news alerts", description: "One short email when a major story breaks. Only when it matters." },
];

export async function listInfo(list: string): Promise<ListInfo | null> {
  const standing = STANDING_LISTS.find((l) => l.list === list);
  if (standing) return standing;
  if (!list.startsWith("section-")) return null;
  const cat = await categoryBySlug(list.slice("section-".length));
  if (!cat) return null;
  return { list, name: `${cat.name} Focus`, description: sectionDescription(cat.name), categoryId: cat.id };
}

// Abbreviations such as "US" keep their capitals.
export const sectionDescription = (name: string) =>
  `The day’s most important ${name === name.toUpperCase() ? name : name.toLowerCase()} stories, in five minutes. Weekdays.`;

/** Today's date in the newsroom's time zone, used to name an edition so it is only sent once a day. */
export function editionDate(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(d);
}

const active = () => and(isNotNull(newsletterSignups.confirmedAt), isNull(newsletterSignups.unsubscribedAt));

export async function subscriberCount(list: string) {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(newsletterSignups)
    .where(and(eq(newsletterSignups.list, list), active()));
  return Number(n);
}

/* ---------- Email templates ---------- */

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const abs = (url: string) => (/^https?:\/\//.test(url) ? url : siteUrl(url));
const storyUrl = (s: StoryCard) => siteUrl(`/${s.category?.slug ?? "news"}/${s.slug}`);

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Arial, Helvetica, sans-serif";

/** The frame every email shares: masthead, content, and a footer with the unsubscribe link. */
function layout({ preheader, content, footer }: { preheader: string; content: string; footer: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;background:#f4f5f6;">
<span style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f6;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
<tr><td style="padding:22px 28px;border-bottom:3px solid #111827;text-align:center;font-family:${SERIF};font-size:26px;font-weight:bold;color:#111827;">
<a href="${siteUrl("/")}" style="color:#111827;text-decoration:none;">${SITE_NAME}</a></td></tr>
<tr><td style="padding:24px 28px;font-family:${SANS};color:#1f2937;">${content}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e5e7eb;font-family:${SANS};font-size:12px;line-height:1.5;color:#6b7280;">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function unsubscribeFooter(info: ListInfo, signup: NewsletterSignup) {
  return `You get ${esc(info.name)} because you signed up at ${esc(siteUrl("").replace(/^https?:\/\//, ""))}. <a href="${unsubscribeUrl(signup)}" style="color:#004666;">Unsubscribe</a>.`;
}

export const unsubscribeUrl = (s: Pick<NewsletterSignup, "token">) => siteUrl(`/newsletters/unsubscribe?token=${s.token}`);

/** Headers that let Gmail and Apple Mail show their own one-click unsubscribe button. */
function unsubscribeHeaders(s: NewsletterSignup) {
  return {
    "List-Unsubscribe": `<${siteUrl(`/api/newsletter/unsubscribe?token=${s.token}`)}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

function storyBlock(s: StoryCard, lead: boolean) {
  const kicker = s.category?.name ? `<p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:#c8102e;">${esc(s.category.name)}</p>` : "";
  const image =
    lead && s.heroImage
      ? `<a href="${storyUrl(s)}"><img src="${esc(abs(s.heroImage))}" alt="${esc(s.heroAlt ?? "")}" width="544" style="display:block;width:100%;height:auto;margin:0 0 12px;border:0;"></a>`
      : "";
  return `<div style="padding:0 0 20px;margin:0 0 20px;border-bottom:1px solid #e5e7eb;">${image}${kicker}
<a href="${storyUrl(s)}" style="font-family:${SERIF};font-size:${lead ? 26 : 20}px;line-height:1.2;font-weight:bold;color:#111827;text-decoration:none;">${esc(s.title)}</a>
${s.summary ? `<p style="margin:8px 0 0;font-size:15px;line-height:1.5;color:#374151;">${esc(s.summary)}</p>` : ""}</div>`;
}

function editionEmail(info: ListInfo, stories: StoryCard[], signup: NewsletterSignup, date: string): EmailMessage {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const subject = `${info.name}: ${stories[0].title}`;
  const content = `<p style="margin:0 0 4px;font-size:13px;font-weight:bold;color:#6b7280;">${esc(day)}</p>
<h1 style="margin:0 0 22px;font-family:${SERIF};font-size:30px;color:#111827;">${esc(info.name)}</h1>
${stories.map((s, i) => storyBlock(s, i === 0)).join("")}
<a href="${siteUrl("/latest")}" style="font-size:15px;font-weight:bold;color:#004666;">More news on ${SITE_NAME}</a>`;
  const text = `${info.name}, ${day}\n\n${stories.map((s) => `${s.title}\n${s.summary ? `${s.summary}\n` : ""}${storyUrl(s)}`).join("\n\n")}\n\nUnsubscribe: ${unsubscribeUrl(signup)}`;
  return { to: signup.email, subject, html: layout({ preheader: stories.map((s) => s.title).slice(1, 3).join(" · "), content, footer: unsubscribeFooter(info, signup) }), text, headers: unsubscribeHeaders(signup) };
}

function alertEmail(info: ListInfo, story: StoryCard, signup: NewsletterSignup): EmailMessage {
  const content = `<p style="margin:0 0 10px;font-size:12px;font-weight:bold;letter-spacing:0.1em;text-transform:uppercase;color:#c8102e;">Breaking news</p>
${storyBlock(story, true)}
<a href="${storyUrl(story)}" style="display:inline-block;background:#004666;color:#ffffff;font-size:15px;font-weight:bold;padding:12px 20px;text-decoration:none;">Read the latest</a>`;
  const text = `BREAKING: ${story.title}\n\n${story.summary ? `${story.summary}\n\n` : ""}${storyUrl(story)}\n\nUnsubscribe: ${unsubscribeUrl(signup)}`;
  return { to: signup.email, subject: `Breaking: ${story.title}`, html: layout({ preheader: story.summary || story.title, content, footer: unsubscribeFooter(info, signup) }), text, headers: unsubscribeHeaders(signup) };
}

export function confirmationEmail(info: ListInfo, signup: NewsletterSignup): EmailMessage {
  const url = siteUrl(`/newsletters/confirm?token=${signup.token}`);
  const content = `<h1 style="margin:0 0 12px;font-family:${SERIF};font-size:26px;color:#111827;">Confirm your sign-up</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.5;">Tap the button to start getting ${esc(info.name)}. ${esc(info.description)}</p>
<a href="${url}" style="display:inline-block;background:#004666;color:#ffffff;font-size:15px;font-weight:bold;padding:12px 20px;text-decoration:none;">Confirm my email</a>`;
  return {
    to: signup.email,
    subject: `Confirm your sign-up to ${info.name}`,
    html: layout({ preheader: `One tap to start getting ${info.name}.`, content, footer: "If you didn’t sign up, ignore this email and you won’t hear from us again." }),
    text: `Confirm your sign-up to ${info.name}:\n${url}\n\nIf you didn’t sign up, ignore this email.`,
  };
}

/* ---------- Sending ---------- */

export type SendResult = { ok: true; sent: number; subject: string } | { ok: false; error: string };

/**
 * Claims the send by inserting its log row first: the unique index makes a second click, or a cron run
 * overlapping a manual send, fail here instead of emailing everyone twice. A failed send removes the claim so it can be retried.
 */
async function claimAndSend(
  claim: { list: string; articleId?: number; edition?: string; subject: string; sentBy?: number },
  build: (signup: NewsletterSignup) => EmailMessage,
): Promise<SendResult> {
  const recipients = await db.select().from(newsletterSignups).where(and(eq(newsletterSignups.list, claim.list), active()));
  if (recipients.length === 0) return { ok: false, error: "Nobody has confirmed a sign-up to this list yet." };
  const [row] = await db
    .insert(emailSends)
    .values({ ...claim, recipients: recipients.length })
    .onConflictDoNothing()
    .returning({ id: emailSends.id });
  if (!row) return { ok: false, error: claim.articleId ? "An alert for this story has already gone out." : "Today’s edition has already gone out." };
  try {
    await sendEmails(recipients.map(build));
  } catch (err) {
    await db.delete(emailSends).where(eq(emailSends.id, row.id));
    console.error(err);
    return { ok: false, error: "The email service refused the send. Check the email settings and try again." };
  }
  return { ok: true, sent: recipients.length, subject: claim.subject };
}

export async function sendBreakingAlert(story: StoryCard, sentBy?: number) {
  const info = STANDING_LISTS.find((l) => l.list === BREAKING)!;
  return claimAndSend({ list: BREAKING, articleId: story.id, subject: `Breaking: ${story.title}`, sentBy }, (s) => alertEmail(info, story, s));
}

/** Sends today's edition of a newsletter: the top stories of the past 24 hours, once per day. */
export async function sendEdition(list: string, sentBy?: number): Promise<SendResult> {
  const info = await listInfo(list);
  if (!info || list === BREAKING) return { ok: false, error: "That newsletter doesn’t exist." };
  const stories = await editionStories(info.categoryId);
  if (stories.length === 0) return { ok: false, error: "No stories were published in the past 24 hours, so there is nothing to send." };
  const date = editionDate();
  return claimAndSend({ list, edition: date, subject: `${info.name}: ${stories[0].title}`, sentBy }, (s) => editionEmail(info, stories, s, date));
}
