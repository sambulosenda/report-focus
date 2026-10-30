"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { sendEmails } from "@/lib/email";
import { confirmationEmail, listInfo, sendBreakingAlert, sendEdition } from "@/lib/newsletters";
import { canPublish } from "@/lib/permissions";
import { breakingStory } from "@/lib/queries";

export type SignupState = { ok?: string; error?: string } | undefined;

const Signup = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  list: z.string().regex(/^[a-z0-9-]{1,60}$/).default("morning-focus"),
});

// Asking again within this window doesn't send another confirmation, so the form can't be used to flood an inbox.
const RESEND_AFTER_MS = 10 * 60e3;

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = Signup.safeParse({ email: formData.get("email"), list: formData.get("list") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  const checkInbox = { ok: "Almost done. Check your inbox and tap the link to confirm." };
  // A hidden field people never see; bots that fill in every field are told they succeeded.
  if (formData.get("website")) return checkInbox;
  const info = await listInfo(parsed.data.list);
  if (!info) return { error: "That newsletter doesn’t exist." };

  const where = and(eq(newsletterSignups.email, parsed.data.email), eq(newsletterSignups.list, parsed.data.list));
  await db.insert(newsletterSignups).values(parsed.data).onConflictDoNothing();
  const signup = (await db.select().from(newsletterSignups).where(where).get())!;
  if (signup.confirmedAt && !signup.unsubscribedAt) return { ok: "You’re already signed up." };
  if (signup.confirmSentAt && Date.now() - signup.confirmSentAt.getTime() < RESEND_AFTER_MS) return checkInbox;

  // Someone coming back after unsubscribing confirms again, like a new reader.
  await db.update(newsletterSignups).set({ confirmedAt: null, unsubscribedAt: null, confirmSentAt: new Date() }).where(where);
  try {
    await sendEmails([confirmationEmail(info, signup)]);
  } catch (err) {
    console.error(err);
    await db.update(newsletterSignups).set({ confirmSentAt: null }).where(where);
    return { error: "We couldn’t send the confirmation email. Please try again in a few minutes." };
  }
  return checkInbox;
}

export async function unsubscribe(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!/^[a-f0-9]{32}$/.test(token)) return;
  await db.update(newsletterSignups).set({ unsubscribedAt: new Date() }).where(eq(newsletterSignups.token, token));
  revalidatePath("/newsletters/unsubscribe");
}

export type SendState = { ok?: string; error?: string } | undefined;

/** The dashboard's "Email this alert" button: sends the story on the breaking banner to the breaking-news list, once. */
export async function emailBreakingAlert(_prev: SendState, formData: FormData): Promise<SendState> {
  const user = await requireUser();
  if (!canPublish(user)) return { error: "Only editors can send alerts." };
  const story = await breakingStory();
  if (!story) return { error: "There is no story on the breaking banner." };
  // The editor confirmed the headline they saw; don't send a different one if the banner changed meanwhile.
  if (story.id !== Number(formData.get("id"))) return { error: "The breaking banner has changed. Reload the page and try again." };
  const res = await sendBreakingAlert(story, user.id);
  revalidatePath("/newsroom", "layout");
  return res.ok ? { ok: `Alert emailed to ${res.sent.toLocaleString()} reader${res.sent === 1 ? "" : "s"}.` } : { error: res.error };
}

export async function emailEditionNow(_prev: SendState, formData: FormData): Promise<SendState> {
  const user = await requireUser("editor");
  const res = await sendEdition(String(formData.get("list") ?? ""), user.id);
  revalidatePath("/newsroom/newsletters");
  return res.ok ? { ok: `Sent to ${res.sent.toLocaleString()} reader${res.sent === 1 ? "" : "s"}.` } : { error: res.error };
}
