"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { categories, media, ROLES, sessions, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { isPendingHash, pendingHash, signInLink } from "@/lib/invites";
import { INFO_PAGES } from "@/lib/site";
import { slugify } from "@/lib/utils";
import type { FormState } from "./auth";

const CategoryInput = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Give the section a name.").max(60),
  slug: z.string().trim().max(60).optional(),
  description: z.string().trim().max(300).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
  sortOrder: z.coerce.number().int().default(0),
  inNav: z.boolean(),
});

const RESERVED = new Set([
  "newsroom", "login", "search", "latest", "author", "tag", "media", "live", "video", "demo", "feed.xml", "sitemap.xml", "robots.txt", "api", "newsletters",
  // Standing pages share the top-level URL space with sections.
  ...Object.keys(INFO_PAGES),
]);

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("editor");
  const parsed = CategoryInput.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    slug: formData.get("slug") || undefined,
    description: formData.get("description") || undefined,
    color: formData.get("color"),
    sortOrder: formData.get("sortOrder") || 0,
    inNav: formData.get("inNav") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const { id, ...data } = parsed.data;
  const slug = slugify(data.slug || data.name);
  if (RESERVED.has(slug)) return { error: `“${slug}” is reserved. Choose another URL.` };
  const values = { ...data, slug, description: data.description ?? null };
  try {
    if (id) await db.update(categories).set(values).where(eq(categories.id, id));
    else await db.insert(categories).values(values);
  } catch {
    return { error: "Another section already uses that URL." };
  }
  revalidatePath("/", "layout");
  return { ok: id ? "Section updated." : "Section added." };
}

export async function deleteCategory(formData: FormData) {
  await requireUser("editor");
  await db.delete(categories).where(eq(categories.id, Number(formData.get("id"))));
  revalidatePath("/", "layout");
}

const UserInput = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(80),
  email: z.email("Enter a valid email.").transform((e) => e.toLowerCase()),
  role: z.enum(ROLES),
  title: z.string().trim().max(80).optional(),
});

/** Adds a staff account with no password yet. The admin sends them the link so they choose their own. */
export async function createUser(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("admin");
  const parsed = UserInput.safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim(),
    role: formData.get("role"),
    title: formData.get("title") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const data = parsed.data;
  let slug = slugify(data.name);
  for (let i = 2; await db.select({ id: users.id }).from(users).where(eq(users.slug, slug)).get(); i++) slug = `${slugify(data.name)}-${i}`;
  let row;
  try {
    row = await db
      .insert(users)
      .values({ ...data, slug, title: data.title ?? null, passwordHash: pendingHash() })
      .returning({ id: users.id, passwordHash: users.passwordHash })
      .get();
  } catch {
    return { error: "Someone already has that email address." };
  }
  revalidatePath("/newsroom/users");
  return {
    ok: `${data.name} is added. Send them this link to choose a password and sign in. It works once and lasts 7 days.`,
    link: await signInLink(row),
  };
}

export async function updateUser(formData: FormData) {
  const admin = await requireUser("admin");
  const id = Number(formData.get("id"));
  const role = z.enum(ROLES).parse(formData.get("role"));
  const active = formData.get("active") === "on";
  // Admins can't lock themselves out.
  if (id === admin.id && (role !== "admin" || !active)) return;
  await db.update(users).set({ role, active }).where(eq(users.id, id));
  if (!active) await db.delete(sessions).where(eq(sessions.userId, id));
  revalidatePath("/newsroom/users");
}

/**
 * A fresh link for someone who lost their invite or forgot their password.
 * Their current password keeps working until they use the link.
 */
export async function makeSignInLink(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("admin");
  const id = Number(formData.get("id"));
  let user = await db.select().from(users).where(eq(users.id, id)).get();
  if (!user) return { error: "That account no longer exists." };
  if (!user.active) return { error: "Switch this account back on first." };
  if (isPendingHash(user.passwordHash)) {
    // Cancel any invite link sent earlier, so only the newest one works.
    user = { ...user, passwordHash: pendingHash() };
    await db.update(users).set({ passwordHash: user.passwordHash }).where(eq(users.id, id));
    revalidatePath("/newsroom/users");
  }
  return { ok: `Send this to ${user.name}. It works once and lasts 7 days.`, link: await signInLink(user) };
}

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(80),
      title: z.string().trim().max(80),
      bio: z.string().trim().max(600),
      avatarUrl: z.string().trim().max(500),
    })
    .safeParse(Object.fromEntries(["name", "title", "bio", "avatarUrl"].map((k) => [k, String(formData.get(k) ?? "")])));
  if (!parsed.success) return { error: "Check your details and try again." };
  const d = parsed.data;
  await db
    .update(users)
    .set({ name: d.name, title: d.title || null, bio: d.bio || null, avatarUrl: d.avatarUrl || null })
    .where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: "Profile saved." };
}

export async function deleteMedia(formData: FormData) {
  await requireUser("editor");
  await db.delete(media).where(eq(media.id, Number(formData.get("id"))));
  revalidatePath("/newsroom/media");
}
