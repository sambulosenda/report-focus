import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { siteUrl } from "./utils";

/**
 * Sign-in links let staff choose their own password, so admins never handle one.
 *
 * A link is signed with the person's current password hash (or, before they have one, a random placeholder),
 * so it stops working the moment the password changes: each link works once, with no extra table to keep.
 */
const LINK_DAYS = 7;
const PENDING = "invite:";

export const isPendingHash = (hash: string) => hash.startsWith(PENDING);
/** Stored instead of a password hash until an invited person sets one. Changing it cancels their older links. */
export const pendingHash = () => PENDING + randomBytes(24).toString("base64url");

const sign = (user: Pick<User, "id" | "passwordHash">, expires: number) =>
  createHmac("sha256", user.passwordHash).update(`${user.id}.${expires}`).digest("base64url");

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return siteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signInLink(user: Pick<User, "id" | "passwordHash">) {
  const expires = Math.floor(Date.now() / 1000) + LINK_DAYS * 86400;
  return `${await origin()}/login/invite/${user.id}.${expires}.${sign(user, expires)}`;
}

/** The person a link belongs to, or null when it is malformed, expired, used, or their account is switched off. */
export async function userForLink(token: string) {
  const [id, expires, mac] = token.split(".");
  if (!/^\d+$/.test(id ?? "") || !/^\d+$/.test(expires ?? "") || !mac) return null;
  if (Number(expires) * 1000 < Date.now()) return null;
  const user = await db.select().from(users).where(eq(users.id, Number(id))).get();
  if (!user || !user.active) return null;
  const want = Buffer.from(sign(user, Number(expires)));
  const got = Buffer.from(mac);
  return want.length === got.length && timingSafeEqual(want, got) ? user : null;
}
