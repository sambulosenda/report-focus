import { readFile } from "node:fs/promises";
import path from "node:path";
import { toSocialJpeg } from "@/lib/social-jpeg";
import { socialImageSrc } from "@/lib/social-image";
import { UPLOAD_DIR } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 12 * 1024 * 1024;

function inside(root: string, file: string) {
  const base = path.resolve(root);
  const resolved = path.resolve(file);
  return resolved === base || resolved.startsWith(base + path.sep);
}

async function readLocal(src: string) {
  if (src.startsWith("/media/")) {
    const root = path.resolve(UPLOAD_DIR);
    const file = path.resolve(root, src.slice("/media/".length));
    if (!inside(root, file)) throw new Error("path");
    return readFile(file);
  }
  const root = path.resolve(process.cwd(), "public");
  const file = path.resolve(root, src.slice(1));
  if (!inside(root, file)) throw new Error("path");
  return readFile(file);
}

async function fetchRemote(src: string) {
  let current = src;
  for (let hop = 0; hop < 3; hop++) {
    const res = await fetch(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: "image/*", "User-Agent": "ReportFocusImage/1.0" },
    });
    if (res.status >= 300 && res.status < 400) {
      const next = res.headers.get("location");
      if (!next) throw new Error("redirect");
      const absolute = new URL(next, current).toString();
      if (!socialImageSrc(absolute)) throw new Error("redirect");
      current = absolute;
      continue;
    }
    if (!res.ok) throw new Error(String(res.status));
    const length = Number(res.headers.get("content-length") ?? 0);
    if (length > MAX_BYTES) throw new Error("size");
    const data = Buffer.from(await res.arrayBuffer());
    if (data.length > MAX_BYTES) throw new Error("size");
    return data;
  }
  throw new Error("redirect");
}

async function brandedCard() {
  const data = await readFile(path.join(process.cwd(), "public", "share-image.png"));
  return new Response(data, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=300" },
  });
}

/** 1200×630 JPEG of a story photo, for WhatsApp, Facebook and X. */
export async function GET(req: Request) {
  const src = new URL(req.url).searchParams.get("src") ?? "";
  const safe = socialImageSrc(src);
  if (!safe) return brandedCard();
  try {
    const input = safe.startsWith("/") ? await readLocal(safe) : await fetchRemote(safe);
    if (input.length > MAX_BYTES) return brandedCard();
    const jpeg = await toSocialJpeg(input);
    return new Response(jpeg, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400",
      },
    });
  } catch {
    return brandedCard();
  }
}
