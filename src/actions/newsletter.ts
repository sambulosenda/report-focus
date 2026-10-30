"use server";

import { z } from "zod";
import { db } from "@/db";
import { newsletterSignups } from "@/db/schema";

export type SignupState = { ok?: string; error?: string } | undefined;

const Signup = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(200),
  list: z.string().regex(/^[a-z0-9-]{1,60}$/).default("morning-focus"),
});

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const parsed = Signup.safeParse({ email: formData.get("email"), list: formData.get("list") || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter a valid email address." };
  await db.insert(newsletterSignups).values(parsed.data).onConflictDoNothing();
  return { ok: "You’re signed up. Look for the first issue in your inbox." };
}
