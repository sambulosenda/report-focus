/** Restore a SQL backup into a private, disposable SQLite database; never touches the live database. */
import { mkdtemp, chmod, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { createClient } from "@libsql/client";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

/** @param {string} sql @param {string=} expectedSha256 */
export async function verifySqlBackup(sql, expectedSha256 = undefined) {
  const sha256 = createHash("sha256").update(sql).digest("hex");
  if (expectedSha256 && sha256 !== expectedSha256) throw new Error("Backup checksum mismatch");
  const folder = await mkdtemp(join(tmpdir(), "report-focus-restore-"));
  await chmod(folder, 0o700);
  const client = createClient({ url: pathToFileURL(join(folder, "restored.db")).href });
  try {
    await client.executeMultiple(sql);
    const integrity = await client.execute("PRAGMA integrity_check");
    if (integrity.rows.length !== 1 || integrity.rows[0][0] !== "ok") throw new Error("Restored database failed integrity check");
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    if (foreignKeys.rows.length) throw new Error("Restored database has broken foreign keys");
    const tables = await client.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'");
    /** @type {Record<string, number>} */
    const counts = {};
    for (const { name } of tables.rows) {
      const identifier = '"' + String(name).replaceAll('"', '""') + '"';
      const r = await client.execute(`select count(*) as n from ${identifier}`);
      counts[String(name)] = Number(r.rows[0].n);
    }
    for (const name of ["articles", "users", "categories"]) {
      if (!(counts[name] > 0)) throw new Error("Restored database is missing required content");
    }
    for (const name of ["sessions", "login_attempts"]) {
      if (counts[name] !== 0) throw new Error("Backup must not restore active sign-in state");
    }
    const manifest = sql.match(/^-- row-counts: (.+)$/m)?.[1];
    if (manifest) {
      for (const [name, n] of Object.entries(JSON.parse(manifest))) {
        if (counts[name] !== n) throw new Error("Restored row count differs from backup manifest");
      }
    }
    return { ok: true, integrity: "ok", foreignKeyViolations: 0, counts, sha256, manifestChecked: !!manifest };
  } finally {
    client.close();
    await rm(folder, { recursive: true, force: true });
  }
}

async function main() {
  const args = process.argv.slice(2);
  let sql, expectedSha256, source;
  if (args.length === 2 && args[0] === "--file") {
    sql = await readFile(args[1], "utf8");
    source = { kind: "local", file: resolve(args[1]) };
  } else if (args.length === 1 && args[0] === "--latest-s3") {
    const bucket = process.env.BACKUP_S3_BUCKET;
    if (!bucket || bucket === process.env.S3_BUCKET) throw new Error("A separate backup bucket is required");
    const s3 = new S3Client({ region: process.env.S3_REGION || "auto", endpoint: process.env.S3_ENDPOINT || undefined,
      credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined });
    let newest, cursor;
    do {
      const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: "db/", ContinuationToken: cursor }));
      for (const item of page.Contents || []) if (item.Key?.endsWith(".sql") && (!newest || item.LastModified > newest.LastModified)) newest = item;
      cursor = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (cursor);
    if (!newest) throw new Error("No stored SQL backup exists");
    const ageHours = (Date.now() - newest.LastModified.getTime()) / 3600000;
    if (ageHours > 36) throw new Error("Latest stored backup is older than 36 hours");
    const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: newest.Key }));
    sql = await object.Body.transformToString();
    expectedSha256 = object.Metadata?.sha256;
    source = { kind: "s3", key: newest.Key, modified: newest.LastModified, bytes: newest.Size, ageHours: Math.round(ageHours * 10) / 10 };
    s3.destroy();
  } else throw new Error("Use --file PATH or --latest-s3");
  console.log(JSON.stringify({ ...await verifySqlBackup(sql, expectedSha256), source }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    // SQL driver errors may embed private rows. Never print their message or stack.
    console.error(JSON.stringify({ ok: false, error: "Backup restore verification failed", errorType: error?.name || "Error" }));
    process.exitCode = 1;
  });
}
export { main as verifyBackupMain };
