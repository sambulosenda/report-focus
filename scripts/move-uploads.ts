/**
 * Copies every image in UPLOAD_DIR to the S3/R2 bucket, then points stories, live updates,
 * the media library and staff photos at the bucket copies. Safe to run more than once.
 *
 *   npm run uploads:move
 *
 * Needs the same S3_* settings as the site (see .env.example).
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";

const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", avif: "image/avif" };

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const bucket = process.env.S3_BUCKET;
  const publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
  if (!bucket || !publicUrl) throw new Error("Set S3_BUCKET and S3_PUBLIC_URL first.");
  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
        : undefined,
  });

  let copied = 0;
  for await (const file of walk(uploadDir)) {
    const type = MIME[path.extname(file).slice(1).toLowerCase()];
    if (!type) continue;
    const key = path.relative(uploadDir, file).split(path.sep).join("/");
    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: await readFile(file), ContentType: type, CacheControl: "public, max-age=31536000, immutable" }),
    );
    copied++;
    if (copied % 50 === 0) console.log(`Copied ${copied} images…`);
  }
  console.log(`Copied ${copied} images to ${bucket}.`);

  const { db } = await import("../src/db");
  const to = `${publicUrl}/`;
  // Lead images and photos hold the path itself; story text holds it inside Markdown image links.
  await db.run(sql`update articles set hero_image = replace(hero_image, '/media/', ${to}) where hero_image like '/media/%'`);
  await db.run(sql`update articles set body = replace(body, '](/media/', ${`](${to}`}) where body like '%](/media/%'`);
  await db.run(sql`update live_updates set body = replace(body, '](/media/', ${`](${to}`}) where body like '%](/media/%'`);
  await db.run(sql`update media set url = replace(url, '/media/', ${to}) where url like '/media/%'`);
  await db.run(sql`update users set avatar_url = replace(avatar_url, '/media/', ${to}) where avatar_url like '/media/%'`);
  console.log("Stories, live updates, the media library and staff photos now use the bucket.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
