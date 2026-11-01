/** One-time, idempotent profile URL change. Run with the intended DATABASE_URL and token. */
import { createClient } from "@libsql/client";

const client = createClient({ url: process.env.DATABASE_URL, authToken: process.env.DATABASE_AUTH_TOKEN || undefined });
const tx = await client.transaction("write");
try {
  const { rows } = await tx.execute("SELECT id, name, slug FROM users WHERE slug IN ('sambulo-senda', 'mickal-dube')");
  if (rows.length !== 1 || rows[0].name !== "Mickal Dube") throw new Error("Unexpected author records; no changes made.");
  const author = rows[0];
  const before = await tx.execute({ sql: "SELECT count(*) AS n FROM articles WHERE author_id = ?", args: [author.id] });
  await tx.execute({ sql: "UPDATE users SET slug = 'mickal-dube' WHERE id = ? AND name = 'Mickal Dube'", args: [author.id] });
  await tx.commit();
  console.log(JSON.stringify({ id: author.id, slug: "mickal-dube", articlesPreserved: before.rows[0].n, changed: author.slug !== "mickal-dube" }));
} finally {
  tx.close();
  client.close();
}
