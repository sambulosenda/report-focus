/**
 * Runs sendEdition and sendBreakingAlert against the migrated database in DATABASE_URL.
 * Prints one JSON object. Exits 0 when each claim is emailed once.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { articles, categories, emailSends, newsletterSignups, users } from "@/db/schema";
import { sendBreakingAlert, sendEdition, type SendResult } from "@/lib/newsletters";
import type { StoryCard } from "@/lib/queries";

let emails = 0;
const write = console.info.bind(console);
console.info = (...args: unknown[]) => {
  if (args.join(" ").includes("[email]")) emails += 1;
  write(...args);
};

function once(label: string, results: SendResult[], emailCount: number) {
  const sent = results.filter((result) => result.ok);
  if (emailCount !== 1 || sent.length !== 1) {
    throw new Error(`${label}: ${emailCount} emails and ${sent.length} successes. Results: ${JSON.stringify(results)}`);
  }
}

async function main() {
const [category] = await db.insert(categories).values({ name: "US", slug: "us" }).returning();
const [author] = await db
  .insert(users)
  .values({ name: "Verifier", slug: "verifier", email: "verifier@example.com", passwordHash: "not-a-login", role: "editor" })
  .returning();
const [article] = await db
  .insert(articles)
  .values({
    title: "Verify edition story",
    slug: "verify-edition-story",
    summary: "Used by the newsletter once check.",
    body: "Body of the verify edition story.",
    categoryId: category.id,
    authorId: author.id,
    status: "published",
    publishedAt: new Date(),
  })
  .returning();

async function subscribe(list: string) {
  await db.insert(newsletterSignups).values({
    email: "reader@example.com",
    list,
    token: `verify-${list}`,
    confirmedAt: new Date(),
  });
}

await subscribe("morning-focus");
await subscribe("breaking");
await subscribe("section-us");

emails = 0;
const overlap = await Promise.allSettled([sendEdition("morning-focus"), sendEdition("morning-focus")]);
if (overlap.some((item) => item.status === "rejected")) {
  throw new Error(`morning-focus overlap rejected: ${JSON.stringify(overlap)}`);
}
once(
  "morning-focus overlap",
  overlap.map((item) => (item as PromiseFulfilledResult<SendResult>).value),
  emails,
);

const story = {
  id: article.id,
  title: article.title,
  slug: article.slug,
  summary: article.summary,
  heroImage: null,
  heroAlt: null,
  category: { slug: "us", name: "US", color: "#1d4ed8" },
} as StoryCard;

emails = 0;
const alerts = await Promise.allSettled([sendBreakingAlert(story), sendBreakingAlert(story)]);
if (alerts.some((item) => item.status === "rejected")) {
  throw new Error(`breaking overlap rejected: ${JSON.stringify(alerts)}`);
}
once(
  "breaking overlap",
  alerts.map((item) => (item as PromiseFulfilledResult<SendResult>).value),
  emails,
);

process.env.EMAIL_PROVIDER = "resend";
delete process.env.RESEND_API_KEY;
const refused = await sendEdition("section-us");
if (refused.ok || !refused.error.includes("refused")) {
  throw new Error(`section-us failure did not release cleanly: ${JSON.stringify(refused)}`);
}
const claimed = await db.select().from(emailSends).where(eq(emailSends.list, "section-us"));
if (claimed.length !== 0) throw new Error(`failed section-us send left ${claimed.length} claim row(s)`);

process.env.EMAIL_PROVIDER = "console";
emails = 0;
const retried = await sendEdition("section-us");
const duplicate = await sendEdition("section-us");
if (!retried.ok) throw new Error(`retry after a refused send did not send: ${JSON.stringify(retried)}`);
if (duplicate.ok || !duplicate.error.includes("already gone out")) {
  throw new Error(`second section-us send was not blocked: ${JSON.stringify(duplicate)}`);
}
if (emails !== 1) throw new Error(`retry emailed ${emails} times`);

console.log(JSON.stringify({ ok: true, morningFocus: "one send", breaking: "one send", retryAfterRefusal: "one send" }));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
