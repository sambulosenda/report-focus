/**
 * Writes the whole database to a single .sql file that rebuilds it from scratch.
 *
 *   npm run db:backup                     → backups/report-focus-2026-10-30T0200.sql
 *   BACKUP_S3_BUCKET=rf-backups npm run db:backup   → also uploads it to that bucket
 *
 * Restore into a new database with:  sqlite3 restored.db < backups/report-focus-….sql
 * (or `turso db shell <name> < file.sql` for Turso). Sign-in sessions are left out, so everyone signs in again.
 *
 * The backup holds staff password hashes and subscriber emails: keep the bucket private, never the public image bucket.
 */
import { createHash } from "node:crypto";
import { verifySqlBackup } from "./verify-backup.mjs";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const SKIP_ROWS = new Set(["sessions", "login_attempts"]);

function literal(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
    const bytes = v instanceof ArrayBuffer ? Buffer.from(v) : Buffer.from(v.buffer, v.byteOffset, v.byteLength);
    return `X'${bytes.toString("hex")}'`;
  }
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function main() {
  const { createClient } = await import("@libsql/client");
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./data/report-focus.db",
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  });

  const snapshot = await client.transaction("read");
  try {
    const schema = await snapshot.execute(
      "select type, name, tbl_name, sql from sqlite_master where sql is not null and name not like 'sqlite_%' and name not like '_litestream%' order by case type when 'table' then 0 else 1 end, name",
    );
    const out: string[] = [`-- Report Focus backup, ${new Date().toISOString()}`, "PRAGMA foreign_keys=OFF;", "BEGIN TRANSACTION;"];
    let rows = 0;
    const counts: Record<string, number> = {};
    for (const t of schema.rows.filter((r) => r.type === "table")) {
      const name = String(t.name);
      out.push(`${t.sql};`);
      counts[name] = 0;
      if (SKIP_ROWS.has(name)) continue;
      const identifier = `"${name.replaceAll('"', '""')}"`;
      const res = await snapshot.execute(`select * from ${identifier}`);
      counts[name] = res.rows.length;
      const cols = res.columns.map((c) => `"${c}"`).join(", ");
      for (const r of res.rows) {
        out.push(`INSERT INTO "${name}" (${cols}) VALUES (${res.columns.map((c) => literal(r[c])).join(", ")});`);
        rows++;
      }
    }
    for (const i of schema.rows.filter((r) => r.type !== "table")) out.push(`${i.sql};`);
    out.push("COMMIT;", `-- row-counts: ${JSON.stringify(counts)}`, "");
    await snapshot.commit();

    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");
    const file = path.resolve("backups", `report-focus-${stamp}.sql`);
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    await chmod(path.dirname(file), 0o700);
    const body = out.join("\n");
    const sha256 = createHash("sha256").update(body).digest("hex");
    await verifySqlBackup(body, sha256);
    await writeFile(file, body, { mode: 0o600 });
    await chmod(file, 0o600);
    console.log(`Saved ${rows} rows to ${file}`);

    const bucket = process.env.BACKUP_S3_BUCKET;
    if (bucket) {
      if (bucket === process.env.S3_BUCKET) throw new Error("Backups require a separate private bucket");
      const s3 = new S3Client({
        region: process.env.S3_REGION || "auto",
        endpoint: process.env.S3_ENDPOINT || undefined,
        credentials:
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
            : undefined,
      });
      const key = `db/${path.basename(file)}`;
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: "application/sql", Metadata: { sha256 } }));
      const stored = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const storedBody = await stored.Body!.transformToString();
      if (createHash("sha256").update(storedBody).digest("hex") !== sha256) throw new Error("Stored backup checksum mismatch");
      s3.destroy();
      console.log(`Uploaded and verified ${key}`);
    }
  } finally {
    snapshot.close();
    client.close();
  }
}

main().catch((err) => {
  console.error("Backup failed", { errorType: err?.name || "Error" });
  process.exit(1);
});
