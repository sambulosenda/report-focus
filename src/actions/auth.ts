"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { userForLink } from "@/lib/invites";
import { clearLoginFailures, clientIp, isLoginBlocked, loginKeys, recordLoginFailure } from "@/lib/rate-limit";

/** `link` carries a sign-in link for an admin to copy and send. */
export type FormState = { error?: string; ok?: string; link?: string } | undefined;

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const keys = loginKeys(email, await clientIp());
  if (await isLoginBlocked(keys)) {
    return { error: "Too many attempts. Please wait 15 minutes and try again." };
  }
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    await recordLoginFailure(keys);
    return { error: "That email and password don’t match. Check them and try again." };
  }
  await clearLoginFailures(keys);
  await createSession(user.id, formData.get("remember") === "on");
  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/newsroom") ? next : "/newsroom");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 10) return { error: "New password must be at least 10 characters." };
  if (!(await verifyPassword(current, user.passwordHash))) return { error: "Current password is incorrect." };
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
  return { ok: "Password updated." };
}

/** Someone opening an invite or reset link chooses their password and is signed straight in. */
export async function acceptSignInLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await userForLink(String(formData.get("token") ?? ""));
  if (!user) return { error: "This link has expired or was already used. Ask a newsroom admin for a new one." };
  const password = String(formData.get("password") ?? "");
  if (password.length < 10) return { error: "Your password must be at least 10 characters." };
  if (password !== formData.get("confirm")) return { error: "The two passwords don’t match." };
  await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id));
  // Sign out anywhere else, in case the old password was known to someone.
  await db.delete(sessions).where(eq(sessions.userId, user.id));
  await createSession(user.id);
  redirect("/newsroom");
}
