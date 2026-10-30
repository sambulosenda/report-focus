import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Uploads go to an S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze B2) when S3_BUCKET is set,
 * otherwise to UPLOAD_DIR on this server. Hosts like Railway wipe local disk on each deploy, so use a bucket in production.
 */
export function bucketConfig() {
  const bucket = process.env.S3_BUCKET;
  const publicUrl = process.env.S3_PUBLIC_URL?.replace(/\/+$/, "");
  if (!bucket) return null;
  if (!publicUrl) throw new Error("S3_PUBLIC_URL must be set with S3_BUCKET: it is the address readers load images from.");
  return { bucket, publicUrl };
}

let client: S3Client | undefined;
function s3() {
  client ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
        : undefined,
  });
  return client;
}

/** Stores a file under `key` (e.g. "2026/10/abc.jpg") and returns its public URL. */
export async function putFile(key: string, data: Buffer, contentType: string) {
  const bucket = bucketConfig();
  if (bucket) {
    await s3().send(
      new PutObjectCommand({
        Bucket: bucket.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        // File names are random and never reused, so browsers and CDNs can keep them for a year.
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return `${bucket.publicUrl}/${key}`;
  }
  const file = path.join(UPLOAD_DIR, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
  return `/media/${key}`;
}

/** Saves an uploaded image and returns its public URL. */
export async function saveImage(file: File) {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Only JPEG, PNG, WebP, GIF or AVIF images can be uploaded.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");
  const now = new Date();
  const key = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${randomBytes(10).toString("hex")}.${ext}`;
  return putFile(key, Buffer.from(await file.arrayBuffer()), file.type);
}
