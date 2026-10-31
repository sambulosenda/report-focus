import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tips, type Tip, type User } from "@/db/schema";
import type { EmailMessage } from "./email";
import { hasRole } from "./auth-shared";
import { CONTACT } from "./site";
import { siteUrl } from "./utils";

const ALGO = "aes-256-gcm";

export const TIP_RECEIVED = "The newsroom has your tip. We will only get back to you if you gave us a way to reach you.";
export const TIP_UNAVAILABLE = "We can’t take tips through the form right now. Please try again later.";
export const TIP_SLOW_DOWN = "Please wait a while before sending another tip.";
export const TIP_UNREADABLE = "This tip can’t be read with the current key.";
const EDITORS_ONLY = "Only editors can handle tips.";

export type TipContents = { body: string; name: string; contact: string };

const TipInput = z.object({
  body: z
    .string()
    .trim()
    .min(20, "Tell us what happened, when and where (at least 20 characters).")
    .max(8000, "That tip is too long to send in one go. Shorten it and try again."),
  name: z.string().trim().max(120, "Name is too long.").default(""),
  contact: z.string().trim().max(200, "That contact detail is too long.").default(""),
  anonymous: z.boolean(),
});

function encryptionKey(): Buffer | null {
  const raw = process.env.TIPS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    console.error("TIPS_ENCRYPTION_KEY must be 32 bytes of base64.");
    return null;
  }
  return key;
}

/** Ciphertext is iv (12) + auth tag (16) + the encrypted JSON, as base64. */
export function encryptTip(contents: TipContents): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(contents), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function decryptTip(payload: string): TipContents | null {
  const key = encryptionKey();
  if (!key) return null;
  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length < 29) return null;
    const decipher = createDecipheriv(ALGO, key, buf.subarray(0, 12));
    decipher.setAuthTag(buf.subarray(12, 28));
    const json = Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString("utf8");
    const parsed = JSON.parse(json) as Partial<TipContents>;
    if (typeof parsed.body !== "string") return null;
    return {
      body: parsed.body,
      name: typeof parsed.name === "string" ? parsed.name : "",
      contact: typeof parsed.contact === "string" ? parsed.contact : "",
    };
  } catch {
    return null;
  }
}

export function tipPreview(body: string, length = 140) {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length <= length ? flat : `${flat.slice(0, length - 1)}…`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/** Notice to the tips inbox. The message itself stays in the newsroom. */
export function tipWaitingEmail(id: number, anonymous: boolean): EmailMessage {
  const url = siteUrl(`/newsroom/tips/${id}`);
  const who = anonymous ? "Someone who asked to stay anonymous sent a tip." : "A new tip is waiting.";
  const text = `${who}\n\nRead it in the newsroom: ${url}\n\nThis email does not include the message.`;
  const html = `<p>${escapeHtml(who)}</p><p><a href="${escapeHtml(url)}">Read it in the newsroom</a></p><p>This email does not include the message.</p>`;
  return { to: CONTACT.tips, subject: "New tip in the newsroom", text, html };
}

export async function saveTip(values: {
  body: unknown;
  name: unknown;
  contact: unknown;
  anonymous: unknown;
}): Promise<{ ok: string; id: number; anonymous: boolean } | { error: string }> {
  const parsed = TipInput.safeParse({
    body: typeof values.body === "string" ? values.body : "",
    name: typeof values.name === "string" ? values.name : "",
    contact: typeof values.contact === "string" ? values.contact : "",
    anonymous: values.anonymous === true,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const anonymous = parsed.data.anonymous;
  const contents: TipContents = {
    body: parsed.data.body,
    name: anonymous ? "" : parsed.data.name,
    contact: anonymous ? "" : parsed.data.contact,
  };
  const payload = encryptTip(contents);
  if (!payload) {
    console.error("Refusing a tip because TIPS_ENCRYPTION_KEY is missing or invalid.");
    return { error: TIP_UNAVAILABLE };
  }
  const [row] = await db.insert(tips).values({ payload, anonymous, status: "new" }).returning({ id: tips.id });
  return { ok: TIP_RECEIVED, id: row.id, anonymous };
}

export async function newTipCount() {
  const row = await db.select({ n: sql<number>`count(*)` }).from(tips).where(eq(tips.status, "new")).get();
  return Number(row?.n ?? 0);
}

export async function listTips(user: User) {
  if (!hasRole(user, "editor")) return { error: EDITORS_ONLY };
  const rows = await db.select().from(tips).orderBy(desc(tips.createdAt), desc(tips.id));
  return {
    tips: rows.map((row) => {
      const contents = decryptTip(row.payload);
      return {
        id: row.id,
        anonymous: row.anonymous,
        status: row.status,
        createdAt: row.createdAt,
        preview: contents ? tipPreview(contents.body) : TIP_UNREADABLE,
      };
    }),
  };
}

/** Editors opening a new tip mark it read. A closed tip stays closed. */
export async function tipForEditor(user: User, id: number): Promise<{ error: string } | { tip: Tip; contents: TipContents | null }> {
  if (!hasRole(user, "editor")) return { error: EDITORS_ONLY };
  const row = await db.select().from(tips).where(eq(tips.id, id)).get();
  if (!row) return { error: "That tip is no longer here." };
  if (row.status === "new") {
    const now = new Date();
    const updated = await db
      .update(tips)
      .set({ status: "read", readAt: now, readBy: user.id })
      .where(and(eq(tips.id, id), eq(tips.status, "new")))
      .returning({ readAt: tips.readAt });
    if (updated.length > 0) {
      row.status = "read";
      row.readAt = updated[0].readAt;
      row.readBy = user.id;
    }
  }
  return { tip: row, contents: decryptTip(row.payload) };
}

export async function closeTip(user: User, id: number): Promise<{ ok?: string; error?: string }> {
  if (!hasRole(user, "editor")) return { error: EDITORS_ONLY };
  const updated = await db.update(tips).set({ status: "closed" }).where(eq(tips.id, id)).returning({ id: tips.id });
  if (updated.length === 0) return { error: "That tip is no longer here." };
  return { ok: "Tip closed." };
}

export async function deleteTip(user: User, id: number): Promise<{ ok?: string; error?: string }> {
  if (!hasRole(user, "editor")) return { error: EDITORS_ONLY };
  const removed = await db.delete(tips).where(eq(tips.id, id)).returning({ id: tips.id });
  if (removed.length === 0) return { error: "That tip is no longer here." };
  return { ok: "Tip deleted." };
}
