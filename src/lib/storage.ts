import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** Saves an uploaded image to local disk and returns its public URL. Swap this for S3/R2/Vercel Blob in production. */
export async function saveImage(file: File) {
  const ext = IMAGE_TYPES[file.type];
  if (!ext) throw new Error("Only JPEG, PNG, WebP, GIF or AVIF images can be uploaded.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 8 MB or smaller.");
  const now = new Date();
  const dir = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const name = `${randomBytes(10).toString("hex")}.${ext}`;
  await mkdir(path.join(UPLOAD_DIR, dir), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, dir, name), Buffer.from(await file.arrayBuffer()));
  return `/media/${dir}/${name}`;
}
