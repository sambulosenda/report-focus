import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, users } from "@/db/schema";
import { isLive, navCategories } from "@/lib/queries";
import { CONTACT, INFO_PAGES, SITE_NAME } from "@/lib/site";
import { excerpt, siteUrl } from "@/lib/utils";

/**
 * /llms.txt and /llms-full.txt: a plain summary of the site for AI assistants and answer engines,
 * built from the same data as the pages so it never goes out of date. See llmstxt.org.
 */

const day = (d: Date | null) => d?.toISOString().slice(0, 10) ?? "";

async function newest(limit: number) {
  return db
    .select({ title: articles.title, slug: articles.slug, summary: articles.summary, body: articles.body, publishedAt: articles.publishedAt, section: categories.slug, sectionName: categories.name, author: users.name })
    .from(articles)
    .leftJoin(categories, eq(categories.id, articles.categoryId))
    .innerJoin(users, eq(users.id, articles.authorId))
    .where(isLive())
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

const storyUrl = (s: { section: string | null; slug: string }) => siteUrl(`/${s.section ?? "news"}/${s.slug}`);

/** The short file: who we are, where things are, and the newest stories. */
export async function llmsTxt() {
  const [cats, stories] = await Promise.all([navCategories(), newest(20)]);
  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} is an independent English-language news site covering Zimbabwe, South Africa and the rest of Africa, along with major world stories. It is owned by ${CONTACT.owner}, run from ${CONTACT.city} and founded in ${CONTACT.founded}. Editor-in-Chief: ${CONTACT.editorInChief}. Managing Editor: ${CONTACT.owner}.`,
    "",
    "## Sections",
    ...cats.map((c) => `- [${c.name}](${siteUrl(`/${c.slug}`)})`),
    `- [Latest news](${siteUrl("/latest")})`,
    "",
    "## About and standards",
    `- [About us and team](${siteUrl("/about")})`,
    `- [Editorial standards](${siteUrl("/standards")})`,
    `- [Corrections policy](${siteUrl("/corrections")})`,
    `- [Contact the newsroom](${siteUrl("/contact")}): ${CONTACT.editor}; corrections: ${CONTACT.corrections}; tips: ${CONTACT.tips}`,
    "",
    "## Feeds",
    `- [RSS](${siteUrl("/feed.xml")})`,
    `- [Sitemap](${siteUrl("/sitemap.xml")})`,
    `- [Full text for AI assistants](${siteUrl("/llms-full.txt")})`,
    "",
    "## Recent stories",
    ...stories.map((s) => `- [${s.title}](${storyUrl(s)}): ${excerpt(s.summary || s.body, 200)} (${day(s.publishedAt)})`),
    "",
  ].join("\n");
}

/** The long file: the short one, the standing pages in full, and the opening of the newest 50 stories. */
export async function llmsFullTxt() {
  const [short, stories] = await Promise.all([llmsTxt(), newest(50)]);
  const page = (slug: string) => `# ${INFO_PAGES[slug].title}\n\nSource: ${siteUrl(`/${slug}`)}\n\n${INFO_PAGES[slug].body}`;
  const opening = (body: string) =>
    body
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p && !p.startsWith("!["))
      .slice(0, 2)
      .join("\n\n");
  return [
    short,
    page("about"),
    page("standards"),
    page("corrections"),
    "# Newest stories",
    ...stories.map(
      (s) => `## ${s.title}\n\n${storyUrl(s)}\nPublished ${day(s.publishedAt)} in ${s.sectionName ?? "News"}, by ${s.author}\n\n${opening(s.body)}`,
    ),
    "",
  ].join("\n\n");
}
