/**
 * Creates your own admin account, or makes an existing account an admin, and asks for its password
 * so no password is ever written into code or a file.
 *
 *   npm run admin:create -- --name "Your Name" --email you@example.com
 *   npm run admin:create -- --name "Your Name" --email you@example.com --replace-demo
 *
 * --replace-demo moves the demo admin's stories, live updates and uploads (admin@reportfocus.news)
 * to your account, then deletes the demo account.
 */
import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

const DEMO_ADMIN = "admin@reportfocus.news";

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]?.trim() : undefined;
}

/** Asks questions without echoing the answers to the terminal. Works when answers are piped in, too. */
function hiddenPrompt() {
  // Readline echoes what is typed to its output, so give it one that discards everything.
  const silent = new Writable({ write: (_chunk, _enc, done) => done() });
  const rl = createInterface({ input: process.stdin, output: silent, terminal: process.stdin.isTTY });
  const lines: string[] = [];
  const waiting: ((line: string | undefined) => void)[] = [];
  rl.on("line", (line) => (waiting.length ? waiting.shift()!(line) : lines.push(line)));
  rl.on("close", () => waiting.splice(0).forEach((resolve) => resolve(undefined)));
  const ask = async (question: string) => {
    process.stdout.write(question);
    const answer = lines.length ? lines.shift() : await new Promise<string | undefined>((resolve) => waiting.push(resolve));
    process.stdout.write("\n");
    return answer ?? "";
  };
  return { ask, close: () => rl.close() };
}

async function main() {
  const name = arg("name");
  const email = arg("email")?.toLowerCase();
  const replaceDemo = process.argv.includes("--replace-demo");
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Usage: npm run admin:create -- --name "Your Name" --email you@example.com [--replace-demo]');
    process.exit(1);
  }
  if (replaceDemo && email === DEMO_ADMIN) {
    console.error("Use your own email address, not the demo admin's.");
    process.exit(1);
  }

  const prompt = hiddenPrompt();
  const password = await prompt.ask(`Choose a password for ${email} (10+ characters): `);
  if (password.length < 10) {
    console.error("That password is too short. Nothing was changed.");
    process.exit(1);
  }
  const again = await prompt.ask("Type it again: ");
  prompt.close();
  if (again !== password) {
    console.error("The passwords didn't match. Nothing was changed.");
    process.exit(1);
  }

  const { db } = await import("../src/db");
  const { articles, liveUpdates, media, sessions, users } = await import("../src/db/schema");
  const { slugify } = await import("../src/lib/utils");
  const passwordHash = await bcrypt.hash(password, 11);

  let admin = await db.select().from(users).where(eq(users.email, email)).get();
  if (admin) {
    await db.update(users).set({ name, role: "admin", active: true, passwordHash }).where(eq(users.id, admin.id));
    await db.delete(sessions).where(eq(sessions.userId, admin.id));
    console.log(`Updated ${email}: now an admin with the new password.`);
  } else {
    let slug = slugify(name);
    for (let i = 2; await db.select({ id: users.id }).from(users).where(eq(users.slug, slug)).get(); i++) slug = `${slugify(name)}-${i}`;
    admin = await db.insert(users).values({ name, email, slug, role: "admin", title: "Publisher", passwordHash }).returning().get();
    console.log(`Created admin account ${email}.`);
  }

  if (replaceDemo) {
    const demo = await db.select().from(users).where(eq(users.email, DEMO_ADMIN)).get();
    if (!demo) {
      console.log(`No demo admin (${DEMO_ADMIN}) found, so there was nothing to remove.`);
    } else {
      const moved = await db.select({ id: articles.id }).from(articles).where(eq(articles.authorId, demo.id)).all();
      await db.batch([
        db.update(articles).set({ authorId: admin.id }).where(eq(articles.authorId, demo.id)),
        db.update(liveUpdates).set({ authorId: admin.id }).where(eq(liveUpdates.authorId, demo.id)),
        db.update(media).set({ uploadedBy: admin.id }).where(eq(media.uploadedBy, demo.id)),
        db.delete(sessions).where(eq(sessions.userId, demo.id)),
        db.delete(users).where(eq(users.id, demo.id)),
      ]);
      console.log(`Removed the demo admin (${demo.name}). ${moved.length} of their stories now carry your byline.`);
    }
  }

  console.log("\nSign in at /login with your email and the password you just chose.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
