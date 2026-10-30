import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const ROLES = ["admin", "editor", "journalist"] as const;
export type Role = (typeof ROLES)[number];
/** "journalist" stays the stored value; the newsroom calls them writers. */
export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", editor: "Editor", journalist: "Writer" };

export const STATUSES = ["draft", "review", "published", "archived"] as const;
export type Status = (typeof STATUSES)[number];

/** What kind of story this is. Live stories get a timeline; video stories get the player layout. */
export const KINDS = ["news", "analysis", "opinion", "explainer", "live", "video"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, string> = {
  news: "News",
  analysis: "Analysis",
  opinion: "Opinion",
  explainer: "Explainer",
  live: "Live updates",
  video: "Video",
};

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp" }).notNull().default(sql`(unixepoch())`);

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ROLES }).notNull().default("journalist"),
  title: text("title"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: timestamp("created_at"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#1d4ed8"),
  sortOrder: integer("sort_order").notNull().default(0),
  inNav: integer("in_nav", { mode: "boolean" }).notNull().default(true),
});

export const articles = sqliteTable(
  "articles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    heroImage: text("hero_image"),
    heroCaption: text("hero_caption"),
    heroCredit: text("hero_credit"),
    heroAlt: text("hero_alt"),
    kind: text("kind", { enum: KINDS }).notNull().default("news"),
    videoUrl: text("video_url"),
    videoDuration: text("video_duration"),
    tags: text("tags").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    authorId: integer("author_id")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: STATUSES }).notNull().default("draft"),
    isBreaking: integer("is_breaking", { mode: "boolean" }).notNull().default(false),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    editorNote: text("editor_note"),
    views: integer("views").notNull().default(0),
    publishedAt: integer("published_at", { mode: "timestamp" }),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (t) => [
    index("articles_status_published_idx").on(t.status, t.publishedAt),
    index("articles_category_idx").on(t.categoryId),
    index("articles_author_idx").on(t.authorId),
  ],
);

/** Timeline posts on a live story. */
export const liveUpdates = sqliteTable(
  "live_updates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    articleId: integer("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
    title: text("title").notNull().default(""),
    body: text("body").notNull(),
    isPinned: integer("is_pinned", { mode: "boolean" }).notNull().default(false),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("live_updates_article_idx").on(t.articleId, t.createdAt)],
);

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at"),
});

/**
 * Email sign-ups for newsletters such as The Morning Focus and breaking-news alerts.
 * A sign-up only gets email once the reader clicks the confirmation link; the token also signs the unsubscribe link.
 */
export const newsletterSignups = sqliteTable(
  "newsletter_signups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    email: text("email").notNull(),
    list: text("list").notNull().default("morning-focus"),
    token: text("token").notNull().default(sql`(lower(hex(randomblob(16))))`),
    confirmedAt: integer("confirmed_at", { mode: "timestamp" }),
    unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp" }),
    confirmSentAt: integer("confirm_sent_at", { mode: "timestamp" }),
    createdAt: timestamp("created_at"),
  },
  (t) => [uniqueIndex("newsletter_signups_email_list_idx").on(t.email, t.list), uniqueIndex("newsletter_signups_token_idx").on(t.token)],
);

/** One row per newsletter edition or breaking alert sent, so nothing goes out twice. */
export const emailSends = sqliteTable(
  "email_sends",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    list: text("list").notNull(),
    /** The breaking story an alert was about; empty for newsletter editions. */
    articleId: integer("article_id").references(() => articles.id, { onDelete: "set null" }),
    /** The edition date (YYYY-MM-DD in the site time zone) for newsletters. */
    edition: text("edition"),
    subject: text("subject").notNull(),
    recipients: integer("recipients").notNull().default(0),
    sentBy: integer("sent_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at"),
  },
  (t) => [index("email_sends_list_idx").on(t.list, t.createdAt), uniqueIndex("email_sends_alert_idx").on(t.list, t.articleId), uniqueIndex("email_sends_edition_idx").on(t.list, t.edition)],
);

/** Failed sign-ins per email and per IP address, kept in the database so the limit holds across restarts and servers. */
export const loginAttempts = sqliteTable("login_attempts", {
  /** "email:<address>" or "ip:<address>". */
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  /** When this count runs out and the key starts again from zero. */
  resetAt: integer("reset_at", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type Media = typeof media.$inferSelect;
export type LiveUpdate = typeof liveUpdates.$inferSelect;
export type NewsletterSignup = typeof newsletterSignups.$inferSelect;
