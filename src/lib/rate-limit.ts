import "server-only";
import { and, gt, inArray, lt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MS = 15 * 60e3;
// One person mistyping gets 5 tries per account. One address can try 20 times across all accounts.
const LIMITS = { email: 5, ip: 20 } as const;

/** The reader's IP address as told by Cloudflare or the host's proxy. */
export async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export function loginKeys(email: string, ip: string) {
  return { email: `email:${email}`, ip: `ip:${ip}` };
}

/** True when either the account or the address has used up its tries. */
export async function isLoginBlocked(keys: { email: string; ip: string }) {
  const rows = await db
    .select()
    .from(loginAttempts)
    .where(and(inArray(loginAttempts.key, [keys.email, keys.ip]), gt(loginAttempts.resetAt, new Date())));
  return rows.some((r) => r.count >= (r.key === keys.email ? LIMITS.email : LIMITS.ip));
}

export async function recordLoginFailure(keys: { email: string; ip: string }) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);
  const nowSec = Math.floor(now.getTime() / 1000);
  for (const key of [keys.email, keys.ip]) {
    await db
      .insert(loginAttempts)
      .values({ key, count: 1, resetAt })
      .onConflictDoUpdate({
        target: loginAttempts.key,
        // A count whose window has ended starts again from one.
        set: {
          count: sql`case when ${loginAttempts.resetAt} <= ${nowSec} then 1 else ${loginAttempts.count} + 1 end`,
          resetAt: sql`case when ${loginAttempts.resetAt} <= ${nowSec} then ${Math.floor(resetAt.getTime() / 1000)} else ${loginAttempts.resetAt} end`,
        },
      });
  }
  // Now and then, clear out counts that ended more than a day ago.
  if (Math.random() < 0.02) await db.delete(loginAttempts).where(lt(loginAttempts.resetAt, new Date(now.getTime() - 864e5)));
}

/** A good sign-in clears the account's count. The address keeps its count, so one known password can't reset the limit for others. */
export async function clearLoginFailures(keys: { email: string }) {
  await db.delete(loginAttempts).where(inArray(loginAttempts.key, [keys.email]));
}
