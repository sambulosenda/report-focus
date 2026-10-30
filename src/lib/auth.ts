import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sessions, users, type Role, type User } from "@/db/schema";
import { hasRole } from "./auth-shared";

export const SESSION_COOKIE = "rf_session";
const SESSION_DAYS = 14;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 11);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** "Keep me signed in" lasts SESSION_DAYS; otherwise the cookie ends with the browser and the session after 12 hours. */
export async function createSession(userId: number, remember = true) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (remember ? SESSION_DAYS * 864e5 : 12 * 3600e3));
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(remember ? { expires: expiresAt } : {}),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, hashToken(token)))
    .get();
  if (!row || row.expiresAt < new Date() || !row.user.active) return null;
  return row.user;
});

export { hasRole };

/** Use in newsroom pages and server actions. Redirects to login when signed out. */
export async function requireUser(min: Role = "journalist") {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, min)) redirect("/newsroom?denied=1");
  return user;
}
