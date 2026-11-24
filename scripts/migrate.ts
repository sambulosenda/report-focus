import { mkdirSync } from "node:fs";
import { migrate } from "drizzle-orm/libsql/migrator";

async function main() {
  mkdirSync("data", { recursive: true });
  const { db } = await import("../src/db");
  await migrate(db, { migrationsFolder: "drizzle" });
  // A file database: let the nightly backup read while the site writes. The setting is stored in the file.
  if ((process.env.DATABASE_URL ?? "file:").startsWith("file:")) await db.run("PRAGMA journal_mode = WAL");
  console.log("Database is up to date.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
