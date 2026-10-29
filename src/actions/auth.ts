"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;

// Simple per-process throttle against password guessing.
const attempts = new Map<string, { count: number; until: number }>();

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rec = attempts.get(email);
  if (rec && rec.count >= 5 && rec.until > Date.now()) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  const user = await db.select().from(users).where(eq(users.email, email)).get();
  const ok = user && user.active && (await verifyPassword(password, user.passwordHash));
  if (!ok) {
    const next = { count: (rec && rec.until > Date.now() ? rec.count : 0) + 1, until: Date.now() + 10 * 60e3 };
    attempts.set(email, next);
    return { error: "That email and password don’t match an active newsroom account." };
  }
  attempts.delete(email);
  await createSession(user.id);
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
